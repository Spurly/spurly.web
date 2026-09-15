import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Settings,
  Upload,
  Shield,
  Send,
  FileText,
  Radar,
  Inbox,
  Workflow,
  Sparkles,
} from "lucide-react";
import { useAuth } from "src/core/auth/hooks/useAuth.js";
import { useExtension } from "src/core/extension/hooks/useExtension";
import { Avatar, Tooltip } from "src/core/primitives";
import { ThemeToggle } from "src/core/theme";
import { NotificationBell } from "src/core/pages/notifications/components/NotificationBell.jsx";
import { SidebarBrand } from "./SidebarBrand";

/**
 * One sidebar, one product now.
 *
 * This used to be two nav trees (`LEADGEN_SECTIONS` / `HUB_SECTIONS`) swapped
 * whole by a workspace switcher, then later two groups shown together with a
 * lock on the entitlement-gated one. The leadgen product and the two-tier
 * entitlement split were both removed 2026-09-14 — there is one product and
 * one subscription tier, so there is one flat nav tree.
 *
 * In the order the work happens: source an audience, fill in what's missing
 * about it, then send.
 */
const NAV_SECTIONS = [
  {
    label: "Prospect",
    items: [
      { label: "Import", icon: Upload, href: "/dashboard/import" },
      { label: "Leads", icon: Radar, href: "/hub/leads" },
      { label: "Enrichment", icon: Sparkles, href: "/hub/enrichment" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Templates", icon: FileText, href: "/dashboard/templates" },
      { label: "Campaigns", icon: Send, href: "/hub/campaigns" },
      { label: "Sequences", icon: Workflow, href: "/hub/sequences" },
      { label: "Inbox", icon: Inbox, href: "/hub/inbox" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Settings", icon: Settings, href: "/dashboard/settings" },
      {
        label: "LinkedIn settings",
        icon: Settings,
        href: "/dashboard/settings/linkedin",
      },
    ],
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

const SIDEBAR_OPEN_KEY = "spurly.sidebarOpen";
const WIDTH_EXPANDED = 244;
const WIDTH_COLLAPSED = 56;

function GroupHeader({ label, expanded }) {
  if (!label) return null;
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
    </p>
  );
}

function NavRow({ item, active, expanded, onClick }) {
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
    </button>
  );

  return expanded ? (
    row
  ) : (
    <Tooltip content={item.label} placement="right">
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

  const groups = [
    { id: "main", sections: NAV_SECTIONS },
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
              <GroupHeader label={group.label} expanded={expanded} />
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
                        active={isActive(item.href)}
                        expanded={expanded}
                        onClick={() => navigate(item.href)}
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
