import {
  Bell,
  Unlink,
  AlertCircle,
  CheckCheck,
  UserCheck,
  MessageCircle,
  PlayCircle,
  CheckCircle,
  PauseCircle,
  BatteryLow,
} from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { Button, EmptyState } from 'src/ui/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useNotifications } from './useNotifications.js';
import { AvatarStack } from './AvatarStack.jsx';

/**
 * /dashboard/notifications — the full history behind the bell's 8-item
 * preview. Same data, same read/unread model, no cap. Per the plan: "a
 * dedicated /dashboard/notifications page for the full history."
 */
const ICONS = {
  'link-off': Unlink,
  'alert-circle': AlertCircle,
  'user-check': UserCheck,
  'message-circle': MessageCircle,
  'play-circle': PlayCircle,
  'check-circle': CheckCircle,
  'pause-circle': PauseCircle,
  'battery-low': BatteryLow,
};

/** relativeTime() returns bare units ('3h'); this adds the suffix, without
 * doubling up on its own 'just now'. */
function ago(value) {
  const t = relativeTime(value);
  return t === 'just now' ? t : `${t} ago`;
}

function Row({ notification, onOpen }) {
  const Icon = ICONS[notification.icon] || Bell;
  const unread = !notification.readAt;

  return (
    // Not a Button: a compound feed row, same exemption as NotificationBell's
    // FeedRow.
    // eslint-disable-next-line no-restricted-syntax
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[var(--ui-border-hairline)] last:border-b-0 hover:bg-[var(--ui-surface-rail-hover)] transition-colors focus:outline-none"
    >
      <span
        className="mt-0.5 grid place-items-center w-8 h-8 rounded-full shrink-0"
        style={{
          background: unread ? 'var(--ui-accent-tint)' : 'var(--ui-surface-sunken)',
          color: unread ? 'var(--ui-accent-fg)' : 'var(--ui-text-tertiary)',
        }}
      >
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] leading-snug ${unread ? 'text-[var(--ui-text-primary)] font-medium' : 'text-[var(--ui-text-secondary)]'}`}
        >
          {notification.text}
        </span>
        <span className="block text-[12px] text-[var(--ui-text-tertiary)] mt-1">
          {ago(notification.createdAt)}
        </span>
        {notification.type === 'hub.connections_sent' && (
          <AvatarStack people={notification.payload?.people} size={22} />
        )}
      </span>
      {unread && (
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: 'var(--ui-accent)' }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications({ limit: 100 });

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
      actions={
        unreadCount > 0 ? (
          <Button variant="secondary" size="sm" leadingIcon={<CheckCheck size={13} />} onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null
      }
    >
      {loading && items.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-[var(--ui-text-tertiary)]">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={18} />}
          title="No notifications yet"
          hint="Account and campaign alerts — like a LinkedIn account needing reconnecting — will show up here."
        />
      ) : (
        <div className="flex flex-col">
          {items.map((n) => (
            <Row key={n._id} notification={n} onOpen={(notif) => !notif.readAt && markRead(notif._id)} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
