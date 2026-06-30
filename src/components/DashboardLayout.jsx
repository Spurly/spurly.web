import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "src/hooks/useAuth.js";
import { Menu, LogOut, Home, Radio, Settings, Users } from "lucide-react";
import { useState, useRef } from "react";

const navItems = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "People", icon: Users, href: "/dashboard/leads" },
  // { label: "Signals", icon: Radio, href: "/dashboard/signals" },
];

export function DashboardLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimerRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isExpanded = sidebarOpen || hoverExpanded;

  const handleSidebarMouseEnter = () => {
    if (sidebarOpen) return;
    hoverTimerRef.current = setTimeout(() => setHoverExpanded(true), 1000);
  };

  const handleSidebarMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setHoverExpanded(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex h-screen overflow-hidden canvas-mesh">
      {/* Sidebar — frosted glass chrome */}
      <aside
        className="flex flex-col h-full shrink-0 glass-chrome border-r border-[var(--separator)] transition-all duration-300 z-[var(--z-sticky)]"
        style={{ width: isExpanded ? 264 : 76 }}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* Logo */}
        <div className="flex items-center gap-0 h-[60px] px-5 shrink-0 border-b border-[var(--separator)]">
          <img
            src="/Spurly icon copy.png"
            alt="Spurly"
            className="flex-shrink-0"
            style={{ height: 52, width: "auto", marginRight: -16 }}
          />
          {isExpanded && (
            <span className="text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)] truncate">
              Spurly
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-[10px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Menu size={17} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 mt-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className={`group flex items-center gap-3 h-10 px-3 rounded-[12px] text-[14px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-[var(--accent-tint)] text-[var(--brand-purple)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span
                  className="shrink-0 grid place-items-center"
                  style={{ width: 19, height: 19 }}
                >
                  <Icon size={19} />
                </span>
                {isExpanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 flex flex-col gap-1 border-t border-[var(--separator)] pt-3">
          {/* Settings — temporarily hidden
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="flex items-center gap-3 h-10 px-3 rounded-[12px] text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-all"
          >
            <span className="shrink-0 grid place-items-center" style={{ width: 19, height: 19 }}>
              <Settings size={19} />
            </span>
            {isExpanded && <span>Settings</span>}
          </button>
          */}

          {/* User avatar row */}
          <div className="flex items-center gap-2.5 h-12 px-2 mt-1">
            <div
              className="w-8 h-8 rounded-[9px] grid place-items-center text-white text-[13px] font-bold shrink-0"
              style={{ background: "var(--brand-gradient-vivid)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                  {user?.name || "User"}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                  {user?.email}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 h-10 px-3 rounded-[12px] text-[14px] font-medium text-[var(--red)] hover:bg-[var(--red-tint)] transition-all"
          >
            <span
              className="shrink-0 grid place-items-center"
              style={{ width: 19, height: 19 }}
            >
              <LogOut size={18} />
            </span>
            {isExpanded && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — glass chrome */}
        <header
          className="glass-chrome border-b border-[var(--separator)] px-7 flex items-center gap-4 shrink-0 z-[var(--z-sticky)]"
          style={{ minHeight: 60 }}
        >
          <div className="flex-1 min-w-0 py-2.5">
            {title && (
              <h1 className="text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)] leading-tight truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[12.5px] text-[var(--text-secondary)] leading-tight truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://chromewebstore.google.com/detail/dcohpfeaohfiiinjjiinojlbnnfmihoh?utm_source=item-share-cb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-purple-700)] transition-colors"
            >
              Add to Chrome
            </a>
            <div
              className="w-9 h-9 rounded-[11px] grid place-items-center text-white text-[13px] font-bold"
              style={{ background: "var(--brand-gradient-vivid)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
