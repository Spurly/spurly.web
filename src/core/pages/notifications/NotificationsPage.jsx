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
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, EmptyState, Skeleton } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useNotifications } from 'src/core/notifications/hooks/useNotifications.js';
import { AvatarStack } from './components/AvatarStack.jsx';

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
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-[var(--ui-border-hairline)] last:border-b-0 transition-colors hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ${unread ? 'shadow-[inset_2px_0_0_var(--ui-accent)]' : ''}`}
    >
      <span
        className="mt-0.5 grid place-items-center w-[30px] h-[30px] rounded-[var(--ui-radius-btn)] shrink-0"
        style={{
          background: unread ? 'var(--ui-accent-tint)' : 'var(--ui-surface-sunken)',
          color: unread ? 'var(--ui-accent-fg)' : 'var(--ui-text-tertiary)',
        }}
      >
        <Icon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[length:var(--ui-t-control)] leading-[1.45] ${unread ? 'text-[var(--ui-text-primary)] font-medium' : 'text-[var(--ui-text-body)]'}`}
        >
          {notification.text}
        </span>
        <span className="block font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-neutral-400)] mt-1">
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
      subtitle={
        unreadCount > 0
          ? `${unreadCount} unread. Everything Spurly did or needs from you, newest first.`
          : 'Everything Spurly did or needs from you, newest first.'
      }
      actions={
        unreadCount > 0 ? (
          <Button variant="secondary" leadingIcon={<CheckCheck size={13} />} onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null
      }
    >
      {loading && items.length === 0 ? (
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 border-b border-[var(--ui-border-hairline)] last:border-b-0"
            >
              <Skeleton width={32} height={32} radius="var(--ui-radius-pill)" />
              <div className="min-w-0 flex-1 flex flex-col gap-1.5 pt-0.5">
                <Skeleton width={`${60 + ((i * 7) % 30)}%`} height={11} />
                <Skeleton width={64} height={9} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={20} strokeWidth={1.6} />}
          title="No notifications yet"
          hint="Account and campaign alerts — like a LinkedIn account needing reconnecting — will show up here."
        />
      ) : (
        <div className="flex flex-col overflow-y-auto">
          {items.map((n) => (
            <Row key={n._id} notification={n} onOpen={(notif) => !notif.readAt && markRead(notif._id)} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
