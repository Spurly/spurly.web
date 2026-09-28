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
  Sparkles,
  UserPlus,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Button, EmptyState, Skeleton } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useNotifications } from 'src/core/notifications/hooks/useNotifications.js';
import { AvatarStack } from './components/AvatarStack.jsx';
import { goToTarget, leadTarget, resolveNotificationTarget } from './notificationTargets.js';

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
  'sparkles': Sparkles, // hub.leads_enrichment_completed — was missing, fell back to the generic Bell
  'user-plus': UserPlus, // hub.connections_sent
  'send': Send, // hub.messages_sent
};

/** relativeTime() returns bare units ('3h'); this adds the suffix, without
 * doubling up on its own 'just now'. */
function ago(value) {
  const t = relativeTime(value);
  return t === 'just now' ? t : `${t} ago`;
}

// Same "which types point at one specific person" set NotificationBell's
// FeedRow uses — kept in sync there rather than shared, since it's a
// one-line literal, not logic.
const PERSON_LINKABLE_TYPES = new Set(['hub.connection_accepted', 'hub.leads_enrichment_completed']);

function Row({ notification, onOpen, onOpenLead }) {
  const Icon = ICONS[notification.icon] || Bell;
  const unread = !notification.readAt;
  const showAvatars = notification.type === 'hub.connections_sent'
    || notification.type === 'hub.messages_sent'
    || PERSON_LINKABLE_TYPES.has(notification.type);
  const personLinkable = PERSON_LINKABLE_TYPES.has(notification.type);

  return (
    // Not a Button: a compound feed row (icon, two lines of text, unread dot,
    // and for person-linkable/rollup types its own per-avatar buttons) — a
    // real <button> can't nest another <button>, so this is a div with the
    // same role/keyboard handling, same exemption NotificationBell's FeedRow
    // takes.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(notification);
        }
      }}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-[var(--ui-border-hairline)] last:border-b-0 transition-colors cursor-pointer hover:bg-[var(--ui-surface-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ${unread ? 'shadow-[inset_2px_0_0_var(--ui-accent)]' : ''}`}
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
        {showAvatars && (
          <AvatarStack
            people={notification.payload?.people}
            size={22}
            onSelect={personLinkable ? (person) => onOpenLead(notification, person) : undefined}
          />
        )}
      </span>
      {unread && (
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: 'var(--ui-accent)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications({ limit: 100 });

  const handleOpen = (notification) => {
    if (!notification.readAt) markRead(notification._id);
    goToTarget(navigate, resolveNotificationTarget(notification));
  };

  const handleOpenLead = (notification, person) => {
    if (!notification.readAt) markRead(notification._id);
    goToTarget(navigate, leadTarget(person));
  };

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
            <Row key={n._id} notification={n} onOpen={handleOpen} onOpenLead={handleOpenLead} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
