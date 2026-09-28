import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
import { BellIcon } from 'src/core/icons';
import { usePopperPosition } from 'src/core/primitives/Popper';
import { Button, IconButton } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useNotifications } from 'src/core/notifications/hooks/useNotifications.js';
import { AvatarStack } from './AvatarStack.jsx';
import { goToTarget, leadTarget, resolveNotificationTarget } from '../notificationTargets.js';

/**
 * The bell icon in the top nav + its feed dropdown.
 *
 * Per the Phase 7 plan: "in-app is the primary channel, not an afterthought
 * to email ... a bell icon in the top nav with an unread-count badge,
 * opening a feed (an Instagram-activity-style list: actor/event icon,
 * one-line description, relative time, read/unread state)". This is that
 * feed; `/dashboard/notifications` (NotificationsPage.jsx) is the same data,
 * full history, no 30-item cap.
 *
 * Positioned with the same portal + usePopperPosition approach as
 * AiWriteButton, for the same reason: the top bar has limited width and an
 * absolutely-positioned panel would get clipped or overflow off-screen.
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
  'sparkles': Sparkles, // hub.leads_enrichment_completed
  'user-plus': UserPlus, // hub.connections_sent — was missing, fell back to the generic Bell
  'send': Send, // hub.messages_sent
};

// Event types whose payload.people are individual leads a face should
// route STRAIGHT TO (the lead drawer) rather than to a rollup's own place
// (a campaign has no per-send drawer, so connections_sent/messages_sent
// avatars stay decorative — see AvatarStack's own comment).
const PERSON_LINKABLE_TYPES = new Set(['hub.connection_accepted', 'hub.leads_enrichment_completed']);

function FeedRow({ notification, onOpen, onOpenLead }) {
  const Icon = ICONS[notification.icon] || Bell;
  const unread = !notification.readAt;
  const showAvatars = notification.type === 'hub.connections_sent'
    || notification.type === 'hub.messages_sent'
    || PERSON_LINKABLE_TYPES.has(notification.type);
  const personLinkable = PERSON_LINKABLE_TYPES.has(notification.type);

  return (
    // Not a Button: a compound feed row (icon, two lines of text, unread dot,
    // and — for connection_accepted/leads_enrichment_completed/rollup types —
    // its own per-avatar buttons), the same exemption the nav rows in
    // DashboardLayout and the ProductSwitcher trigger take. A real <button>
    // can't contain another <button>, so this is a div with the same
    // role/keyboard handling instead of the plain <button> every other
    // (avatar-free) row still gets away with.
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
      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left rounded-[var(--ui-radius-sm)] hover:bg-[var(--ui-surface-rail-hover)] transition-colors cursor-pointer focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
    >
      <span
        className="mt-0.5 grid place-items-center w-6 h-6 rounded-full shrink-0"
        style={{
          background: unread ? 'var(--ui-accent-tint)' : 'var(--ui-surface-sunken)',
          color: unread ? 'var(--ui-accent-fg)' : 'var(--ui-text-tertiary)',
        }}
      >
        <Icon size={13} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[length:var(--ui-t-body)] leading-snug ${unread ? 'text-[var(--ui-text-primary)] font-medium' : 'text-[var(--ui-text-secondary)]'}`}
        >
          {notification.text}
        </span>
        <span className="block text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] mt-0.5">
          {relativeTime(notification.createdAt)}
        </span>
        {showAvatars && (
          <AvatarStack
            people={notification.payload?.people}
            size={18}
            onSelect={personLinkable ? (person) => onOpenLead(notification, person) : undefined}
          />
        )}
      </span>
      {unread && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ background: 'var(--ui-accent)' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const { items, unreadCount, markRead, markAllRead } = useNotifications({ limit: 8 });

  const position = usePopperPosition({
    anchorRef: triggerRef,
    floatingRef: panelRef,
    placement: 'bottom',
    offset: 8,
    open,
  });

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleOpen = (notification) => {
    if (!notification.readAt) markRead(notification._id);
    setOpen(false);
    goToTarget(navigate, resolveNotificationTarget(notification));
  };

  // A click on ONE avatar in a connection_accepted / leads_enrichment_completed
  // row goes straight to that person, bypassing whatever the row's own click
  // would resolve to (which, for a >1-count row, has no single person to
  // land on) — see FeedRow's PERSON_LINKABLE_TYPES.
  const handleOpenLead = (notification, person) => {
    if (!notification.readAt) markRead(notification._id);
    setOpen(false);
    goToTarget(navigate, leadTarget(person));
  };

  return (
    <>
      <span className="relative inline-flex" ref={triggerRef}>
        {/* 32px, bordered, on the canvas beside the page's primary action —
            the handoff's header bell. Unread is a small accent dot, not a
            red count: it is news, not an error. */}
        <IconButton
          icon={<BellIcon size={16} />}
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          size="md"
          variant="secondary"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="!text-[var(--ui-text-secondary)] hover:!text-[var(--ui-text-primary)]"
        />
        {unreadCount > 0 && (
          <span
            className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full pointer-events-none bg-[var(--ui-accent)] shadow-[0_0_0_2px_var(--ui-surface-card)]"
            aria-hidden="true"
          />
        )}
      </span>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="fixed z-50 w-[340px] max-w-[calc(100vw-1rem)] rounded-[var(--ui-radius-lg)] flex flex-col overflow-hidden"
            style={{
              left: position.x,
              top: position.y,
              visibility: position.ready ? 'visible' : 'hidden',
              background: 'var(--ui-surface-card)',
              border: '1px solid var(--ui-border)',
              boxShadow: 'var(--ui-shadow-popover)',
            }}
          >
            <div className="flex items-center justify-between px-3 h-10 shrink-0 border-b border-[var(--ui-border-hairline)]">
              <span className="text-[length:var(--ui-t-body)] font-medium text-[var(--ui-text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" leadingIcon={<CheckCheck size={12} />} onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {items.length === 0 ? (
                <div className="py-8 px-3 text-center text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">
                  You're all caught up.
                </div>
              ) : (
                items.map((n) => <FeedRow key={n._id} notification={n} onOpen={handleOpen} onOpenLead={handleOpenLead} />)
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--ui-border-hairline)] p-1.5">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => {
                  setOpen(false);
                  navigate('/dashboard/notifications');
                }}
              >
                View all
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
