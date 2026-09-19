import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  LeadsIcon,
  EnrichIcon,
  ImportIcon,
  CampaignIcon,
  SequenceIcon,
  InboxIcon,
  TemplateIcon,
  SettingsIcon,
  LinkedInLineIcon,
  ShieldIcon,
  SidebarIcon,
  SparkIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  ArrowLeftIcon,
} from "src/core/icons";
import { useAuth } from "src/core/auth/hooks/useAuth.js";
import { useExtension } from "src/core/extension/hooks/useExtension";
import { Avatar, Tooltip } from "src/core/primitives";
import { useTheme } from "src/core/theme";
import { NotificationBell } from "src/core/pages/notifications/components/NotificationBell.jsx";
import { SidebarBrand } from "./SidebarBrand";
import { AskSpurly } from "./AskSpurly";
import { useSidebarSummary } from "src/core/sidebarSummary/hooks/useSidebarSummary.js";
import { formatCompactNumber } from "src/shared/utils/formatCompactNumber.js";

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
      { label: "Home", icon: HomeIcon, href: "/hub/dashboard" },
      { label: "Leads", icon: LeadsIcon, href: "/hub/leads" },
      { label: "Enrichment", icon: EnrichIcon, href: "/hub/enrichment" },
      { label: "Import", icon: ImportIcon, href: "/dashboard/import" },
    ],
  },
  {
    label: "Engage",
    items: [
      { label: "Campaigns", icon: CampaignIcon, href: "/hub/campaigns" },
      { label: "Sequences", icon: SequenceIcon, href: "/hub/sequences" },
      { label: "Inbox", icon: InboxIcon, href: "/hub/inbox" },
      { label: "Templates", icon: TemplateIcon, href: "/dashboard/templates" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" },
      {
        label: "LinkedIn",
        icon: LinkedInLineIcon,
        href: "/dashboard/settings/linkedin",
      },
    ],
  },
];

const ADMIN_ITEM = { label: "Admin", icon: ShieldIcon, href: "/admin/users" };

const SIDEBAR_OPEN_KEY = "spurly.sidebarOpen";
const WIDTH_EXPANDED = 244;
const WIDTH_COLLAPSED = 56;

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

/** Mono micro-caps section label — "PROSPECT", "ENGAGE", "MANAGE". */
function SectionLabel({ label, expanded }) {
  if (!expanded) {
    return <span className="block mx-auto w-4 h-px bg-[var(--ui-border)] my-2" aria-hidden="true" />;
  }
  return <p className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)] mb-1 px-2.5">{label}</p>;
}

function NavRow({ item, active, expanded, onClick, badge = null }) {
  const Icon = item.icon;

  const row = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative w-full flex items-center gap-2.5 h-[var(--ui-nav-row)] rounded-[var(--ui-radius-sm)] text-[length:var(--ui-t-nav)]",
        "transition-colors duration-[var(--ui-dur-fast)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]",
        expanded ? "px-2.5" : "px-0 justify-center",
        /* Where you are is the one question the sidebar exists to answer:
           the accent tint, the accent text and the spine say it together. */
        active
          ? "bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium " +
            "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[var(--ui-spine)] " +
            "before:rounded-r-full before:bg-[var(--ui-accent)]"
          : "text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
      {expanded && <span className="truncate flex-1 text-left">{item.label}</span>}
      {expanded && badge}
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
 * A nav row's trailing signal. Three shapes only: a quiet mono count, a live
 * pulsing dot + count for something running, a bare status dot — plus the
 * one filled pill for the truly urgent count (unread inbox). Every value
 * comes from GET /hub/summary; nothing is fabricated.
 */
function NavBadge({ tone = "neutral", count, live = false, pill = false, title }) {
  const color =
    tone === "success"
      ? "var(--ui-success-dot)"
      : tone === "warning"
        ? "var(--ui-warning-dot)"
        : tone === "danger"
          ? "var(--ui-danger-dot)"
          : "var(--ui-neutral-400)";

  if (count == null) {
    return (
      <span
        title={title}
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
        aria-hidden={title ? undefined : "true"}
      />
    );
  }

  if (pill) {
    return (
      <span className="ui-num shrink-0 min-w-[18px] h-[18px] px-[5px] rounded-[var(--ui-radius-pill)] bg-[var(--ui-accent)] text-[var(--ui-accent-on)] text-[length:var(--ui-t-micro)] flex items-center justify-center">
        {count}
      </span>
    );
  }

  return (
    <span
      className="ui-num !font-normal text-[length:var(--ui-t-micro)] flex items-center gap-1 shrink-0"
      style={{ color: tone === "warning" ? "var(--ui-warning-fg)" : "var(--ui-neutral-400)" }}
    >
      {live && (
        <span className="w-[5px] h-[5px] rounded-full sp-pulse" style={{ background: color }} aria-hidden="true" />
      )}
      {count}
    </span>
  );
}

/**
 * Extension state, shown ONLY when something is wrong.
 *
 * When the extension is live, the green dot on the LinkedIn row says so and
 * this stays out of the way (the handoff's sidebar has no status row). When
 * it isn't installed or lost its session, nothing on the page works, so the
 * row appears above the meters with the reason one hover away.
 */
function useExtensionState() {
  const { installed, loggedIn, loginKnown, checking } = useExtension();
  if (checking) return { tone: null, label: "Checking…", hint: "Looking for the Spurly extension." };
  if (!installed)
    return {
      tone: "danger",
      label: "Extension not installed",
      hint: "Spurly can't reach LinkedIn without the extension. Install it to capture and send.",
    };
  if (!loginKnown)
    return {
      tone: null,
      label: "Extension idle",
      hint: "The extension is installed, but its background worker didn't answer. It wakes on the next action — reload this page if things keep failing.",
    };
  if (!loggedIn)
    return {
      tone: "warning",
      label: "Extension signed out",
      hint: "The extension is installed but couldn't take this browser's session. Reload the page; if it sticks, open the extension and sign in.",
    };
  return {
    tone: "success",
    label: "Extension live",
    hint: "The extension is installed, signed in, and ready to capture and send.",
  };
}

function ExtensionAlert({ state, expanded }) {
  if (state.tone !== "warning" && state.tone !== "danger") return null;
  const dot = state.tone === "danger" ? "var(--ui-danger-dot)" : "var(--ui-warning-dot)";
  return (
    <Tooltip content={state.hint} placement="right">
      <div className={`flex items-center gap-2 h-7 ${expanded ? "px-2.5" : "justify-center"} cursor-default`}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} aria-hidden="true" />
        {expanded && (
          <span className="text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] truncate">{state.label}</span>
        )}
      </div>
    </Tooltip>
  );
}

/**
 * Daily cap + credits — the two readings Spurly runs against, stacked in the
 * sidebar footer exactly as the handoff draws them: a micro-caps label with
 * its mono figure, the one meter under the cap, and the credit balance as a
 * standalone mono reading (no meter — there is no plan maximum to draw a
 * denominator from).
 */
function Readings({ expanded, dayUsed, dailyCap, balance, onTopUp }) {
  const hasCap = dayUsed != null && !!dailyCap;
  const pct = hasCap ? Math.min(100, Math.round((dayUsed / dailyCap) * 100)) : 0;
  const near = pct >= 80;
  const lowCredits = balance <= 20;

  if (!expanded) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        {hasCap && (
          <Tooltip content={`${dayUsed}/${dailyCap} sent today`} placement="right">
            <span className="ui-num text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)] cursor-default">{dayUsed}</span>
          </Tooltip>
        )}
        <Tooltip content={`${balance.toLocaleString()} credits remaining`} placement="right">
          <span
            className="ui-num text-[length:var(--ui-t-micro)] cursor-default"
            style={{ color: lowCredits ? "var(--ui-warning-fg)" : "var(--ui-text-secondary)" }}
          >
            {balance > 999 ? formatCompactNumber(balance) : balance}
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="px-2.5 pt-1 pb-2">
      {hasCap && (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)]">Daily cap</span>
            <span
              className="ui-num !font-normal text-[length:var(--ui-t-meta)]"
              style={{ color: near ? "var(--ui-warning-fg)" : "var(--ui-text-secondary)" }}
            >
              {dayUsed}/{dailyCap}
            </span>
          </div>
          <div className="ui-meter mt-1.5" data-tone={near ? "warning" : undefined}>
            <i style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      <div className={`flex items-baseline justify-between gap-2 ${hasCap ? "mt-3" : ""}`}>
        <span className="ui-micro !text-[length:var(--ui-t-micro)] !text-[var(--ui-text-secondary)]">Credits</span>
        <button
          type="button"
          onClick={onTopUp}
          className="text-[length:var(--ui-t-label)] font-medium text-[var(--ui-accent-fg)] hover:underline focus:outline-none focus-visible:underline"
        >
          Top up
        </button>
      </div>
      <div
        className="ui-num text-[length:var(--ui-t-figure)] tracking-[-0.02em] mt-0.5"
        style={{ color: lowCredits ? "var(--ui-warning-fg)" : "var(--ui-text-primary)" }}
      >
        {balance.toLocaleString()}
      </div>
    </div>
  );
}

/**
 * The account row. Name over a mono email, and a menu (opens upward) holding
 * what used to be permanent sidebar rows: the theme choice and sign-out.
 * Theme is a per-device display preference, so it lives with the person, not
 * in Settings.
 */
function AccountRow({ user, expanded, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuItem =
    "w-full flex items-center gap-2.5 h-8 px-2 rounded-[var(--ui-radius-xs)] text-[length:var(--ui-t-control)] text-left transition-colors duration-[140ms] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]";

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="menu"
          className={`absolute bottom-[calc(100%+6px)] z-[var(--ui-z-popover)] p-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop ${
            expanded ? "left-0 right-0" : "left-0 w-[220px]"
          }`}
        >
          <p className="ui-micro !text-[var(--ui-text-secondary)] mx-2 mt-1 mb-1.5">Theme</p>
          <div className="grid grid-cols-3 gap-1 px-1 pb-1.5">
            {["light", "dark", "system"].map((opt) => (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={theme === opt}
                onClick={() => setTheme(opt)}
                className={[
                  "h-7 rounded-[var(--ui-radius-xs)] text-[length:var(--ui-t-label)] capitalize transition-colors duration-[140ms]",
                  theme === opt
                    ? "bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] font-medium"
                    : "text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]",
                ].join(" ")}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="h-px bg-[var(--ui-border-hairline)] mx-1 my-1" />
          {/* Quiet by default, red only on hover — signing out is not a
              primary action. */}
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className={`${menuItem} text-[var(--ui-text-body)] hover:bg-[var(--ui-danger-tint)] hover:text-[var(--ui-danger-fg)]`}
          >
            <LogOutIcon size={14} />
            Log out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className={`w-full flex items-center gap-[9px] h-11 rounded-[var(--ui-radius-sm)] transition-colors duration-[var(--ui-dur-fast)] hover:bg-[var(--ui-surface-rail-hover)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)] ${
          expanded ? "px-2" : "justify-center"
        }`}
      >
        <Avatar src={user?.profilePicture} name={user?.name || user?.email} size={26} tone="accent" />
        {expanded && (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[length:var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] leading-[1.3] truncate">
                {user?.name || "User"}
              </span>
              <span className="block font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-neutral-400)] leading-[1.3] truncate">
                {user?.email}
              </span>
            </span>
            <ChevronsUpDownIcon size={14} strokeWidth={2} className="shrink-0 text-[var(--ui-neutral-400)]" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The shell                                                           */
/* ------------------------------------------------------------------ */

/**
 * DashboardLayout — the app shell (spurlyDESIGN.md: Rail · Canvas · Card).
 *
 * The page header lives ON the canvas, not in a band: a 26px title, one line
 * of description saying what the screen is for, and the actions on the
 * right beside the notification bell. Page tabs (optional) sit under it,
 * then the content.
 *
 * `layout` decides what the content sits in:
 *   "card" (default) — ONE card filling the remaining height. The table
 *                      screens: toolbar, bulk bar, rows and pagination all
 *                      live inside it, never as stacked cards.
 *   "page"           — no card; the whole column scrolls. Dashboards,
 *                      settings, card grids — screens made of several
 *                      regions, each of which brings its own card.
 *   "plain"          — padded, fixed height, no card: detail consoles
 *                      whose regions scroll independently.
 *   "bare"           — full-bleed under the header, no padding. Split
 *                      views (the inbox) that draw their own frames.
 */
export function DashboardLayout({
  children,
  title,
  subtitle,
  actions = null,
  tabs = null,
  layout = "card",
  header = true,
  backTo = null,
  backLabel = "Back",
  badge = null,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const summary = useSidebarSummary();
  const extension = useExtensionState();

  /* Cmd+K on mac, Ctrl+K elsewhere — available anywhere the shell is
     mounted, not just while focus sits in the sidebar. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Collapse is explicit and remembered. */
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(SIDEBAR_OPEN_KEY) !== "false";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_OPEN_KEY, String(expanded));
    } catch {
      /* private mode — the choice just isn't remembered */
    }
  }, [expanded]);

  const sections = useMemo(
    () =>
      NAV_SECTIONS.map((section) =>
        section.label === "Manage" && user?.isAdmin
          ? { ...section, items: [...section.items, ADMIN_ITEM] }
          : section,
      ),
    [user?.isAdmin],
  );

  /* Some routes nest under a sibling's href (Settings at /dashboard/settings,
     LinkedIn at /dashboard/settings/linkedin), so pick only the most
     specific (longest) matching href. */
  const allHrefs = useMemo(() => sections.flatMap((s) => s.items.map((i) => i.href)), [sections]);

  const activeHref = useMemo(() => {
    const pathname = location.pathname;
    let best = null;
    for (const href of allHrefs) {
      const matches = href.startsWith("/admin")
        ? pathname.startsWith("/admin")
        : pathname === href || pathname.startsWith(`${href}/`);
      if (matches && (!best || href.length > best.length)) best = href;
    }
    return best;
  }, [allHrefs, location.pathname]);

  const isActive = useCallback((href) => href === activeHref, [activeHref]);

  /* Flattened for the palette: every nav item, tagged with its section. */
  const paletteItems = useMemo(
    () => sections.flatMap((s) => s.items.map((i) => ({ ...i, section: s.label }))),
    [sections],
  );

  /* One place mapping a nav href to its trailing badge. Every count comes
     from useSidebarSummary (GET /hub/summary) — nothing fabricated. */
  const navBadgeFor = useCallback(
    (href) => {
      if (href === "/dashboard/settings/linkedin") {
        return extension.tone ? (
          <NavBadge tone={extension.tone === "danger" ? "danger" : extension.tone} title={extension.label} />
        ) : null;
      }
      if (href === "/hub/leads" && summary.leadsTotal != null) {
        return <NavBadge count={formatCompactNumber(summary.leadsTotal)} />;
      }
      if (href === "/hub/enrichment" && summary.leadsNeedingEnrichment) {
        return <NavBadge tone="warning" live count={summary.leadsNeedingEnrichment} />;
      }
      if (href === "/hub/campaigns" && summary.campaignsRunning) {
        return <NavBadge count={summary.campaignsRunning} />;
      }
      if (href === "/hub/inbox" && summary.inboxUnread) {
        return <NavBadge pill count={summary.inboxUnread > 99 ? "99+" : summary.inboxUnread} />;
      }
      return null;
    },
    [extension.tone, extension.label, summary.leadsTotal, summary.leadsNeedingEnrichment, summary.campaignsRunning, summary.inboxUnread],
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const hasHeader = header && (title || subtitle || actions);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[var(--ui-surface-page)] text-[var(--ui-text-primary)]"
      style={{ minHeight: 600 }}
    >
      <aside
        className="flex flex-col h-full shrink-0 bg-[var(--ui-surface-sunken)] border-r border-[var(--ui-border)] transition-[width] duration-[var(--ui-dur-base)] ease-[cubic-bezier(0.2,0,0.1,1)]"
        style={{ width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
      >
        <div
          className={`flex items-center h-[var(--ui-topbar-h)] shrink-0 ${expanded ? "px-4 gap-[9px]" : "justify-center"}`}
        >
          <SidebarBrand expanded={expanded} />
          {expanded && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse sidebar"
              className="grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-quaternary)] hover:bg-[var(--ui-surface-rail-active)] hover:text-[var(--ui-text-primary)] transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
            >
              <SidebarIcon size={15} />
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
                className="grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] text-[var(--ui-text-quaternary)] hover:bg-[var(--ui-surface-rail-active)] hover:text-[var(--ui-text-primary)] transition-colors"
              >
                <SidebarIcon size={15} />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Ask Spurly — the clearest "this is AI-native" signal in the shell.
            Jumps to pages today; natural-language answering is a follow-up. */}
        <div className={expanded ? "px-3 pb-3" : "flex justify-center pb-2"}>
          {expanded ? (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="w-full flex items-center gap-2 h-[34px] px-2.5 rounded-[var(--ui-radius-btn)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] text-left text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] transition-[border-color,box-shadow,color] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:text-[var(--ui-text-primary)] hover:shadow-[var(--ui-hover-ring)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
            >
              <SparkIcon size={14} strokeWidth={1.9} className="text-[var(--ui-accent)] shrink-0" />
              <span className="flex-1 truncate">Ask Spurly</span>
              <kbd className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] shrink-0 border border-[var(--ui-border-hairline)] rounded-[var(--ui-radius-2xs)] px-1 py-px text-[var(--ui-neutral-400)]">
                ⌘K
              </kbd>
            </button>
          ) : (
            <Tooltip content="Ask Spurly (⌘K)" placement="right">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                aria-label="Ask Spurly"
                className="grid place-items-center w-8 h-8 rounded-[var(--ui-radius-sm)] text-[var(--ui-accent)] hover:bg-[var(--ui-surface-rail-hover)] transition-colors focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
              >
                <SparkIcon size={15} />
              </button>
            </Tooltip>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto flex flex-col gap-3.5 ${expanded ? "px-3" : "px-2"}`}>
          {sections.map((section) => (
            <div key={section.label} className="flex flex-col gap-px">
              <SectionLabel label={section.label} expanded={expanded} />
              {section.items.map((item) => (
                <NavRow
                  key={item.label}
                  item={item}
                  active={isActive(item.href)}
                  expanded={expanded}
                  onClick={() => navigate(item.href)}
                  badge={navBadgeFor(item.href)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className={`shrink-0 pt-2.5 pb-3 border-t border-[var(--ui-border)] flex flex-col gap-0.5 ${expanded ? "px-3" : "px-2"}`}>
          <ExtensionAlert state={extension} expanded={expanded} />
          <Readings
            expanded={expanded}
            dayUsed={summary.pacing.dayUsed}
            dailyCap={summary.pacing.dailyCap}
            balance={user?.creditBalance ?? 0}
            onTopUp={() => navigate("/dashboard/settings")}
          />
          <AccountRow user={user} expanded={expanded} onLogout={handleLogout} />
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-w-0 ${layout === "page" ? "overflow-y-auto" : "overflow-hidden"}`}
      >
        {hasHeader && (
          <header className="shrink-0 flex items-start gap-4 px-[var(--ui-shell-x)] pt-5">
            {backTo && (
              <Tooltip content={backLabel} placement="bottom">
                <button
                  type="button"
                  onClick={() => navigate(backTo)}
                  aria-label={backLabel}
                  className="mt-0.5 grid place-items-center w-8 h-8 shrink-0 rounded-[var(--ui-radius-btn)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] text-[var(--ui-text-secondary)] transition-[border-color,color,box-shadow] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:text-[var(--ui-text-primary)] hover:shadow-[var(--ui-hover-ring)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
                >
                  <ArrowLeftIcon size={15} strokeWidth={2} />
                </button>
              </Tooltip>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <h1 className="m-0 text-[length:var(--ui-t-display)] font-semibold tracking-[var(--ui-track-display)] leading-[1.15] text-[var(--ui-text-primary)] truncate">
                    {title}
                  </h1>
                  {badge && <span className="shrink-0">{badge}</span>}
                </div>
              )}
              {subtitle && (
                <div className="mt-[5px] text-[length:var(--ui-t-nav)] leading-[1.45] text-[var(--ui-text-secondary)] max-w-[62ch]">
                  {subtitle}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <NotificationBell />
              {actions}
            </div>
          </header>
        )}

        {tabs && <div className="shrink-0 px-[var(--ui-shell-x)] pt-4">{tabs}</div>}

        {layout === "bare" ? (
          <main className={`flex-1 min-h-0 flex flex-col overflow-hidden ${hasHeader || tabs ? "mt-4 border-t border-[var(--ui-border)]" : ""}`}>
            {children}
          </main>
        ) : layout === "plain" ? (
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden px-[var(--ui-shell-x)] pt-4 pb-5">{children}</main>
        ) : layout === "page" ? (
          <main className="flex-1 px-[var(--ui-shell-x)] pt-4 pb-6">{children}</main>
        ) : (
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden px-[var(--ui-shell-x)] pt-4 pb-5">
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)]">
              {children}
            </div>
          </main>
        )}
      </div>

      <AskSpurly
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        onNavigate={navigate}
      />
    </div>
  );
}
