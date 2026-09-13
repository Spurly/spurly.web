import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings,
  Users,
  Upload,
  Shield,
  Send,
  FileText,
  Network,
  Radar,
  Inbox,
  Workflow,
  Lock,
} from "lucide-react";
import { useAuth } from "src/platform/auth/useAuth.js";
import { SubscriptionContext } from "src/platform/billing/hooks/SubscriptionContext";
import { useExtension } from "src/platform/extension/hooks/useExtension";
import { Avatar, Tooltip } from "src/ui/primitives";
import { ThemeToggle } from "src/ui/theme";
import { NotificationBell } from "src/platform/notifications/components/NotificationBell.jsx";
import { SidebarBrand } from "./SidebarBrand";

/**
 * One sidebar, both products, always.
 *
 * This used to be two nav trees (`LEADGEN_SECTIONS` / `HUB_SECTIONS`) swapped
 * whole by a workspace switcher — see git history on this file, or
 * `ProductSwitcher.jsx` before it was deleted. That model treated Capture and
 * Hub as two apps sharing a shell. They are one app: a ₹5000 subscriber uses
 * both in the same session, and a ₹1500 subscriber should see what Hub is
 * without a context switch to find out.
 *
 * `NAV_GROUPS` below is the single nav tree. Each group is one product; each
 * group's own sections are unchanged from before (Prospect / Engage / Manage).
 * A locked group's rows stay visible and lead to the upgrade page instead of
 * disappearing — see `hubLocked` below for why a whole-workspace lock that
 * hid every row was worse than this.
 */
const LEADGEN_SECTIONS = [
  {
    label: "Prospect",
    items: [
      { label: "Contacts", icon: Users, href: "/dashboard/people" },
      // The user's own LinkedIn network — a roster, separate from the Contacts
      // outreach pipeline. See spurly.backend/src/features/connections.
      { label: "Connections", icon: Network, href: "/dashboard/connections" },
      { label: "Import", icon: Upload, href: "/dashboard/import" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Campaigns", icon: Send, href: "/dashboard/campaigns" },
      { label: "Templates", icon: FileText, href: "/dashboard/templates" },
    ],
  },
  {
    label: "Manage",
    items: [{ label: "Settings", icon: Settings, href: "/dashboard/settings" }],
  },
];

/**
 * Two items, in the order the work happens: source an audience, then send to
 * it. Campaigns arrived with the sending engine — before that the row would
 * have been a link to nothing, which teaches the user the product is broken
 * rather than that it is coming.
 */
const HUB_SECTIONS = [
  {
    label: "Prospect",
    items: [{ label: "Leads", icon: Radar, href: "/hub/leads" }],
  },
  {
    label: "Engage",
    items: [
      { label: "Campaigns", icon: Send, href: "/hub/campaigns" },
      { label: "Sequences", icon: Workflow, href: "/hub/sequences" },
      { label: "Inbox", icon: Inbox, href: "/hub/inbox" },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        label: "LinkedIn settings",
        icon: Settings,
        href: "/dashboard/settings/linkedin",
      },
    ],
  },
];

/**
 * The two product groups. Names are deliberately about what the user does,
 * not how it is done — and never about the vendor, which must not reach the
 * UI at all.
 */
const NAV_GROUPS = [
  {
    id: "leadgen",
    label: "Extension Driven",
    sections: LEADGEN_SECTIONS,
  },
  {
    id: "hub",
    label: "Automated",
    hint: "Source leads and send from our servers, on a schedule",
    sections: HUB_SECTIONS,
  },
];

const ADMIN_GROUP = {
  id: "admin",
  label: "Manage",
  sections: [
    {
      label: "Admin",
      items: [{ label: "Admin", icon: Shield, href: "/admin/users" }],
    },
  ],
};

const UPGRADE_HREF = "/hub/upgrade";

const SIDEBAR_OPEN_KEY = "spurly.sidebarOpen";
const WIDTH_EXPANDED = 244;
const WIDTH_COLLAPSED = 56;

function GroupHeader({ label, locked, expanded }) {
  if (!expanded) {
    return (
      <span
        className="block mx-auto w-4 h-px bg-[var(--ui-border)] my-2"
        aria-hidden="true"
      />
    );
  }
  return (
    <p className="ui-micro px-2 h-7 flex items-center gap-1.5 font-semibold text-[var(--ui-text-secondary)]">
      {label}
      {locked && (
        <Lock
          size={10}
          className="shrink-0 text-[var(--ui-text-tertiary)]"
          aria-hidden="true"
        />
      )}
    </p>
  );
}

function NavRow({ item, active, expanded, locked, onClick }) {
  const Icon = item.icon;

  const row = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative w-full flex items-center gap-3 h-[var(--ui-nav-row)] rounded-[var(--ui-radius-md)] text-[var(--ui-t-nav)]",
        "transition-colors duration-[var(--ui-dur-fast)] focus:outline-none",
        "focus-visible:shadow-[var(--ui-focus-ring)]",
        expanded ? "px-2" : "px-0 justify-center",
        /* Where you are is the one question the sidebar exists to answer, and
           grey-on-grey whispers it. The accent tint plus a left bar says it. */
        active
          ? "bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-semibold " +
            "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[var(--ui-spine)] " +
            "before:rounded-r-full before:bg-[var(--ui-accent)]"
          : "text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]",
      ].join(" ")}
    >
      <Icon size={17} className="shrink-0" aria-hidden="true" />
      {expanded && (
        <span className="truncate flex-1 text-left">{item.label}</span>
      )}
      {expanded && locked && (
        <Lock
          size={12}
          className="shrink-0 text-[var(--ui-text-tertiary)]"
          aria-hidden="true"
        />
      )}
    </button>
  );

  const tooltip = locked
    ? `${item.label} — not included in your plan`
    : item.label;
  return expanded ? (
    row
  ) : (
    <Tooltip content={tooltip} placement="right">
      {row}
    </Tooltip>
  );
}

/**
 * Extension connection status.
 *
 * The single most important piece of state in the product: if the extension
 * isn't connected, nothing works. It used to be shown only while the Capture
 * workspace was active; Capture is now always in the sidebar, so this is
 * always shown too — no workspace gate left to hide it behind.
 */
function ExtensionStatus({ expanded }) {
  const { installed, loggedIn, loginKnown, checking } = useExtension();

  const state = checking
    ? {
        dot: "var(--ui-text-tertiary)",
        label: "Checking…",
        hint: "Looking for the Spurly extension.",
      }
    : !installed
      ? {
          dot: "var(--ui-danger-dot)",
          label: "Not installed",
          hint: "Spurly can't reach LinkedIn without the extension. Install it to capture and send.",
        }
      : !loginKnown
        ? {
            dot: "var(--ui-text-tertiary)",
            label: "Extension idle",
            hint: "The extension is installed, but its background worker didn't answer. It wakes on the next action — reload this page if things keep failing.",
          }
        : !loggedIn
          ? {
              dot: "var(--ui-warning-dot)",
              label: "Signed out",
              hint: "The extension is installed but couldn't take this browser's session. Reload the page; if it sticks, open the extension and sign in.",
            }
          : {
              dot: "var(--ui-success-dot)",
              label: "Extension live",
              hint: "The extension is installed, signed in, and ready to capture and send.",
            };

  return (
    <Tooltip content={state.hint} placement="right">
      <div
        className={`flex items-center gap-2 h-7 ${expanded ? "px-2" : "justify-center"} cursor-default`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: state.dot }}
          aria-hidden="true"
        />
        {expanded && (
          <span className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">
            {state.label}
          </span>
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
            className="ui-num text-[var(--ui-t-meta)]"
            style={{
              color: low ? "var(--ui-warning-fg)" : "var(--ui-text-secondary)",
            }}
          >
            {balance > 99 ? "99+" : balance}
          </span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-baseline justify-between gap-2 px-2 py-1">
      <div className="min-w-0">
        <span className="ui-micro">Credits</span>
        <span
          className="ui-num block text-[var(--ui-t-section)] leading-tight mt-0.5 truncate"
          style={{
            color: low ? "var(--ui-warning-fg)" : "var(--ui-text-primary)",
          }}
        >
          {balance.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={onTopUp}
        className="text-[var(--ui-t-label)] font-semibold text-[var(--ui-accent-fg)] hover:underline shrink-0 focus:outline-none focus-visible:underline"
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
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(SIDEBAR_OPEN_KEY) !== "false";
  });

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(expanded));
  }, [expanded]);

  const isActive = useCallback(
    (href) =>
      href.startsWith("/admin")
        ? location.pathname.startsWith("/admin")
        : location.pathname === href ||
          location.pathname.startsWith(`${href}/`),
    [location.pathname],
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /**
   * Hub is locked for a subscriber whose plan does not include it. Every Hub
   * row still renders — see NAV_GROUPS — with a lock glyph, and routes to the
   * upgrade page instead of its normal destination.
   *
   * The sidebar is a courtesy, not the boundary: the API refuses hub requests
   * with 403 whatever is rendered here, and HubGate redirects anyone who types
   * the URL. So an entitlement we have not fetched yet locks nothing — a lock
   * flashed at a paying customer on every load would be worse than a second of
   * an unlocked entry that works.
   */
  const billing = useContext(SubscriptionContext);
  const hubLocked = billing?.status ? !billing.status.hasHub() : false;

  const groups = [
    ...NAV_GROUPS.map((g) =>
      g.id === "hub" ? { ...g, locked: hubLocked } : g,
    ),
    ...(user?.isAdmin ? [ADMIN_GROUP] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--ui-surface-page)]">
      <aside
        className="flex flex-col h-full shrink-0 bg-[var(--ui-surface-sunken)] border-r border-[var(--ui-border)] transition-[width] duration-[var(--ui-dur-base)] ease-[cubic-bezier(0.2,0,0.1,1)]"
        style={{ width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
      >
        <div
          className={`flex items-center h-11 shrink-0 ${expanded ? "px-2 gap-1" : "justify-center"}`}
        >
          <SidebarBrand expanded={expanded} />
          {expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse sidebar"
              className="grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)] transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
            >
              <PanelLeftClose size={15} />
            </button>
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
          {groups.map((group) => (
            <div key={group.id} className="mb-4">
              <GroupHeader
                label={group.label}
                locked={group.locked}
                expanded={expanded}
              />
              {group.sections.map((section) => (
                <div key={`${group.id}-${section.label}`} className="mb-3">
                  {expanded && (
                    <p className="text-[var(--ui-t-meta)] px-2 h-5 flex items-center text-[var(--ui-text-tertiary)]">
                      {section.label}
                    </p>
                  )}
                  <div className="flex flex-col gap-px">
                    {section.items.map((item) => (
                      <NavRow
                        key={item.label}
                        item={item}
                        active={!group.locked && isActive(item.href)}
                        expanded={expanded}
                        locked={group.locked}
                        onClick={() =>
                          navigate(group.locked ? UPGRADE_HREF : item.href)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 px-2 pb-2 pt-2 border-t border-[var(--ui-border)] flex flex-col gap-px">
          <ExtensionStatus expanded={expanded} />
          <CreditsMeter
            expanded={expanded}
            balance={user?.creditBalance ?? 0}
            onTopUp={() => navigate("/dashboard/settings")}
          />

          <div className="h-2" />

          {/* Theme lives in the account row rather than in Settings.
              It is a per-device display preference, not an account
              setting, and burying it two pages deep is how a toggle
              ships and nobody finds it. Collapsed, it gets its own
              centred row so it stays reachable at 56px wide. */}
          <div
            className={`flex items-center gap-2 h-9 mt-1 ${expanded ? "px-2" : "justify-center"}`}
          >
            <Avatar src={user?.profilePicture} name={user?.name} size={22} />
            {expanded && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate leading-tight">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] truncate leading-tight">
                    {user?.email}
                  </p>
                </div>
                <ThemeToggle expanded={false} className="shrink-0" />
              </>
            )}
          </div>

          {!expanded && (
            <div className="flex justify-center">
              <ThemeToggle expanded={false} />
            </div>
          )}

          {/* Quiet by default, red only on hover. A permanently red button in
              the nav treats signing out as a primary action. */}
          <button
            type="button"
            onClick={handleLogout}
            className={[
              "w-full flex items-center gap-2.5 h-8 rounded-[var(--ui-radius-sm)] text-[var(--ui-t-body)]",
              "text-[var(--ui-text-tertiary)] hover:bg-[var(--ui-danger-tint)] hover:text-[var(--ui-danger-fg)]",
              "transition-colors duration-[var(--ui-dur-fast)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]",
              expanded ? "px-2" : "justify-center",
            ].join(" ")}
          >
            <LogOut size={16} className="shrink-0" aria-hidden="true" />
            {expanded && <span>Log out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex items-center gap-3 shrink-0 bg-[var(--ui-surface-page)] border-b border-[var(--ui-border-hairline)]"
          style={{
            height: "var(--ui-band)",
            paddingInline: "var(--ui-content-x)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h1 className="text-[var(--ui-t-page)] font-semibold tracking-[var(--ui-track-display)] text-[var(--ui-text-primary)] truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate tabular-nums">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex-1" />
          <NotificationBell />
          {actions && (
            <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
          )}
        </header>

        <main
          className="flex-1 min-h-0 overflow-hidden"
          style={{
            padding: "var(--ui-shell-x)",
            paddingTop: "var(--ui-shell-x)",
          }}
        >
          <div className="h-full min-h-0 overflow-auto rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
