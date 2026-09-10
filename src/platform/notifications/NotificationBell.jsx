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
} from 'lucide-react';
import { usePopperPosition } from 'src/ui/primitives/Popper';
import { Button, IconButton } from 'src/ui/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useNotifications } from './useNotifications.js';

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
};

function FeedRow({ notification, onOpen }) {
  const Icon = ICONS[notification.icon] || Bell;
  const unread = !notification.readAt;

  return (
    // Not a Button: a compound feed row (icon, two lines of text, unread dot),
    // the same exemption the nav rows in DashboardLayout and the
    // ProductSwitcher trigger take.
    // eslint-disable-next-line no-restricted-syntax
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left rounded-[var(--ui-radius-sm)] hover:bg-[var(--ui-surface-rail-hover)] transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
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
          className={`block text-[13px] leading-snug ${unread ? 'text-[var(--ui-text-primary)] font-medium' : 'text-[var(--ui-text-secondary)]'}`}
        >
          {notification.text}
        </span>
        <span className="block text-[11px] text-[var(--ui-text-tertiary)] mt-0.5">
          {relativeTime(notification.createdAt)}
        </span>
      </span>
      {unread && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ background: 'var(--ui-accent)' }}
          aria-hidden="true"
        />
      )}
    </button>
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
    navigate('/dashboard/notifications');
  };

  return (
    <>
      <span className="relative inline-flex" ref={triggerRef}>
        <IconButton
          icon={<Bell size={16} />}
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 grid place-items-center min-w-[14px] h-[14px] px-[3px] rounded-full text-[10px] font-medium leading-none text-white pointer-events-none"
            style={{ background: 'var(--ui-danger)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
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
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div className="flex items-center justify-between px-3 h-10 shrink-0 border-b border-[var(--ui-border-hairline)]">
              <span className="text-[13px] font-medium text-[var(--ui-text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" leadingIcon={<CheckCheck size={12} />} onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {items.length === 0 ? (
                <div className="py-8 px-3 text-center text-[13px] text-[var(--ui-text-tertiary)]">
                  You're all caught up.
                </div>
              ) : (
                items.map((n) => <FeedRow key={n._id} notification={n} onOpen={handleOpen} />)
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
