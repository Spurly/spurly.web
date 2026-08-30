import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings,
  Users,
  Sparkles,
  Shield,
  Send,
  FileText,
  Network,
} from 'lucide-react';
import { useAuth } from 'src/hooks/useAuth.js';
import { useExtension } from 'src/hooks/useExtension';
import { Avatar, Tooltip } from 'src/ui/primitives';

/**
 * Nav grouped by where you are in the funnel, not as a flat list.
 *
 * The old version was five ungrouped rows. Section labels cost nothing at five
 * items and teach the product's shape through the navigation itself — capture
 * people, then engage them.
 */
const NAV_SECTIONS = [
  {
    label: 'Prospect',
    items: [
      { label: 'Contacts', icon: Users, href: '/dashboard/people' },
      // The user's own LinkedIn network — a roster, separate from the Contacts
      // outreach pipeline. See spurly.backend/src/features/connections.
      { label: 'Connections', icon: Network, href: '/dashboard/connections' },
      { label: 'Enrich', icon: Sparkles, href: '/dashboard/enrich' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { label: 'Campaigns', icon: Send, href: '/dashboard/campaigns' },
      { label: 'Templates', icon: FileText, href: '/dashboard/templates' },
    ],
  },
];

const ADMIN_ITEM = { label: 'Admin', icon: Shield, href: '/admin/users' };

const SIDEBAR_OPEN_KEY = 'spurly.sidebarOpen';
const WIDTH_EXPANDED = 232;
const WIDTH_COLLAPSED = 56;

function NavRow({ item, active, expanded, onClick }) {
  const Icon = item.icon;

  const row = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'group relative w-full flex items-center gap-2.5 h-8 rounded-[var(--ui-radius-sm)] text-[13px]',
        'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
        'focus-visible:shadow-[var(--ui-focus-ring)]',
        expanded ? 'px-2' : 'px-0 justify-center',
        /* Where you are is the one question the sidebar exists to answer, and
           grey-on-grey whispers it. The accent tint plus a left bar says it. */
        active
          ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium ' +
            'before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] ' +
            'before:rounded-r-full before:bg-[var(--ui-accent)]'
          : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      {expanded && <span className="truncate">{item.label}</span>}
    </button>
  );

  return expanded ? row : <Tooltip content={item.label} placement="right">{row}</Tooltip>;
}

/**
 * Extension connection status.
 *
 * The single most important piece of state in the product: if the extension
 * isn't connected, nothing works. Previously the app only mentioned it inside
 * a modal at the moment a send failed — by which point the user has already
 * hit the wall. It's persistent now.
 */
function ExtensionStatus({ expanded }) {
  const { installed, loggedIn, checking } = useExtension();

  const state = checking
    ? { dot: 'var(--ui-text-tertiary)', label: 'Checking…', hint: 'Looking for the Spurly extension.' }
    : !installed
      ? { dot: 'var(--ui-danger-dot)', label: 'Not installed', hint: 'Spurly can\'t reach LinkedIn without the extension. Install it to capture and send.' }
      : !loggedIn
        ? { dot: 'var(--ui-warning-dot)', label: 'Signed out', hint: 'The extension is installed but signed out. Open it and sign in.' }
        : { dot: 'var(--ui-success-dot)', label: 'Extension live', hint: 'The extension is installed, signed in, and ready to capture and send.' };

  return (
    <Tooltip content={state.hint} placement="right">
      <div
        className={`flex items-center gap-2 h-7 ${expanded ? 'px-2' : 'justify-center'} cursor-default`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: state.dot }}
          aria-hidden="true"
        />
        {expanded && (
          <span className="text-[12px] text-[var(--ui-text-secondary)] truncate">{state.label}</span>
        )}
      </div>
    </Tooltip>
  );
}

/**
 * Credits, persistent.
 *
 * Credit balance is the product's monetisation pressure signal and it used to
 * appear in exactly one place. Every tool that sells credits keeps the balance
 * and its top-up one click away, permanently.
 */
function CreditsMeter({ expanded, balance, onTopUp }) {
  const low = balance <= 20;

  if (!expanded) {
    return (
      <Tooltip content={`${balance} credits remaining`} placement="right">
        <div className="flex justify-center h-7 items-center cursor-default">
          <span
            className="text-[11px] font-medium tabular-nums"
            style={{ color: low ? 'var(--ui-warning-fg)' : 'var(--ui-text-secondary)' }}
          >
            {balance > 99 ? '99+' : balance}
          </span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 h-7 px-2">
      <span
        className="text-[12px] tabular-nums truncate"
        style={{ color: low ? 'var(--ui-warning-fg)' : 'var(--ui-text-secondary)' }}
      >
        {balance.toLocaleString()} credits
      </span>
      <button
        type="button"
        onClick={onTopUp}
        className="text-[12px] font-medium text-[var(--ui-accent-fg)] hover:underline shrink-0 focus:outline-none focus-visible:underline"
      >
        Top up
      </button>
    </div>
  );
}

export function DashboardLayout({ children, title, subtitle, actions = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Collapse is explicit and remembered.
   *
   * The previous shell expanded on hover after a 1000ms timer, which meant the
   * rail opened when you were only crossing it and felt broken when you
   * actually wanted it. A toggle that persists is what every tool with a
   * collapsible rail does.
   */
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false';
  });

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(expanded));
  }, [expanded]);

  const isActive = useCallback(
    (href) =>
      href.startsWith('/admin')
        ? location.pathname.startsWith('/admin')
        : location.pathname === href || location.pathname.startsWith(`${href}/`),
    [location.pathname],
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sections = user?.isAdmin
    ? [...NAV_SECTIONS, { label: 'Manage', items: [ADMIN_ITEM] }]
    : NAV_SECTIONS;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ui-surface-page)]">
      {/*
        Three planes, not one.

        The sidebar, the top bar and the canvas were all
        --ui-surface-page, separated by a single hairline. Three regions
        painted the same colour is no hierarchy at all: the app read as
        one flat grey field with a white box floating on it, which is
        most of what "the nav, the top bar and the heading have no
        hierarchy" was describing.

        Now the sidebar recedes (sunken), the canvas sits in the middle,
        and the content card advances (white). Still monochrome, still
        the same palette — the depth comes from ordering three greys
        that were already in the ramp.
      */}
      <aside
        className="flex flex-col h-full shrink-0 bg-[var(--ui-surface-sunken)] border-r border-[var(--ui-border)] transition-[width] duration-[var(--ui-dur-base)] ease-[cubic-bezier(0.2,0,0.1,1)]"
        style={{ width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
      >
        <div className={`flex items-center h-11 shrink-0 ${expanded ? 'px-3 gap-2' : 'justify-center'}`}>
          <img src="/spurly-mark.png" alt="" className="w-5 h-5 shrink-0 object-contain" />
          {expanded && (
            <>
              <span className="text-[13px] font-medium tracking-[-0.006em] text-[var(--ui-text-primary)] truncate">
                Spurly
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Collapse sidebar"
                className="grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)] transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
              >
                <PanelLeftClose size={15} />
              </button>
            </>
          )}
        </div>

        {!expanded && (
          <div className="flex justify-center pb-1">
            <Tooltip content="Expand sidebar" placement="right">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Expand sidebar"
                className="grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)] transition-colors"
              >
                <PanelLeft size={15} />
              </button>
            </Tooltip>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 pt-1">
          {sections.map((section) => (
            <div key={section.label} className="mb-3">
              {expanded ? (
                <p className="px-2 h-6 flex items-center text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)]">
                  {section.label}
                </p>
              ) : (
                <span className="block mx-auto w-4 h-px bg-[var(--ui-border)] my-2" aria-hidden="true" />
              )}
              <div className="flex flex-col gap-px">
                {section.items.map((item) => (
                  <NavRow
                    key={item.label}
                    item={item}
                    active={isActive(item.href)}
                    expanded={expanded}
                    onClick={() => navigate(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 px-2 pb-2 pt-2 border-t border-[var(--ui-border)] flex flex-col gap-px">
          <ExtensionStatus expanded={expanded} />
          <CreditsMeter
            expanded={expanded}
            balance={user?.creditBalance ?? 0}
            onTopUp={() => navigate('/dashboard/settings')}
          />

          <div className="h-2" />

          <NavRow
            item={{ label: 'Settings', icon: Settings, href: '/dashboard/settings' }}
            active={isActive('/dashboard/settings')}
            expanded={expanded}
            onClick={() => navigate('/dashboard/settings')}
          />

          <div className={`flex items-center gap-2 h-9 mt-1 ${expanded ? 'px-2' : 'justify-center'}`}>
            <Avatar src={user?.profilePicture} name={user?.name} size={22} />
            {expanded && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[var(--ui-text-primary)] truncate leading-tight">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-[var(--ui-text-tertiary)] truncate leading-tight">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Quiet by default, red only on hover. A permanently red button in
              the nav treats signing out as a primary action. */}
          <button
            type="button"
            onClick={handleLogout}
            className={[
              'w-full flex items-center gap-2.5 h-8 rounded-[var(--ui-radius-sm)] text-[13px]',
              'text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-danger-tint)] hover:text-[var(--ui-danger-fg)]',
              'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
              expanded ? 'px-2' : 'justify-center',
            ].join(' ')}
          >
            <LogOut size={16} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/*
          The top bar.

          Two fixes here, both of which you can see immediately.

          ALIGNMENT. The title used to sit at 16px — the shell's own
          padding — which put it on the content card's BORDER, the one
          thing it should never align to. Meanwhile the tab label
          underneath landed at 39px, the search box at 29px and the
          first column header at 69px. Five different left edges in one
          viewport. The header now pads to --ui-content-x (29px), which
          is shell padding + card border + card padding, so the title,
          the first tab, the search field and the select-all checkbox
          all sit on one vertical line.

          ANCHORING. The bar had no border and the same background as
          the canvas, so it didn't read as a bar — the title just
          floated. A hairline underneath attaches it to the page.

          The title is 17px (--ui-t-page) rather than 15px. It was
          previously smaller and lighter than the section headings
          inside the cards below it, which inverted the hierarchy: the
          most important label on screen was the least prominent.
        */}
        <header
          className="flex items-center gap-3 shrink-0 bg-[var(--ui-surface-page)] border-b border-[var(--ui-border-hairline)]"
          style={{ height: 'var(--ui-band)', paddingInline: 'var(--ui-content-x)' }}
        >
          <div className="flex items-baseline gap-2.5 min-w-0">
            {title && (
              <h1 className="text-[17px] font-medium tracking-[-0.012em] text-[var(--ui-text-primary)] truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[12px] text-[var(--ui-text-secondary)] truncate tabular-nums">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex-1" />
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </header>

        <main
          className="flex-1 min-h-0 overflow-hidden"
          style={{ padding: 'var(--ui-shell-x)', paddingTop: 'var(--ui-shell-x)' }}
        >
          <div className="h-full min-h-0 overflow-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
