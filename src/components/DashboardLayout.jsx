import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth.js';
import { Menu, LogOut, Home, Eye, List, Radio, Settings, Send, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Discover', icon: Eye, href: '/dashboard/discover' },
    { label: 'Captured Leads', icon: TrendingUp, href: '/dashboard/leads' },
    { label: 'Lists', icon: List, href: '/dashboard/lists' },
    { label: 'Enrichment Queue', icon: Zap, href: '/dashboard/enrichment' },
    { label: 'Signals', icon: Radio, href: '/dashboard/signals' },
    { label: 'Exports', icon: Send, href: '/dashboard/exports' },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="flex h-screen bg-spurly-surface-bg">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-spurly-navy text-white transition-all duration-300 flex flex-col border-r border-spurly-navy-light/10 overflow-y-auto`}
      >
        {/* Logo Area */}
        <div className="px-6 py-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {sidebarOpen ? (
              <>
                <img src="/Spurly icon.png" alt="Spurly" className="w-12 h-12 flex-shrink-0 object-contain" />
                <span className="text-2xl font-bold truncate">Spurly</span>
              </>
            ) : (
              <img src="/Spurly icon.png" alt="Spurly" className="w-12 h-12 mx-auto object-contain" />
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-spurly-navy-light/10 rounded-spurly transition flex-shrink-0"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-spurly transition text-sm font-medium ${
                  active
                    ? 'bg-spurly-purple text-white'
                    : 'text-spurly-text-secondary hover:bg-spurly-navy-light/10'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Workspace Section */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-t border-spurly-navy-light/10">
            <p className="text-xs text-spurly-text-secondary font-semibold mb-3 px-4">WORKSPACE</p>
            <div className="px-4 py-2">
              <div className="text-sm font-medium mb-1">Acme Growth</div>
              <p className="text-xs text-spurly-text-secondary">Workspace</p>
            </div>
          </div>
        )}

        {/* Settings & User */}
        <div className="p-4 border-t border-spurly-navy-light/10 space-y-3 flex-shrink-0">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-spurly hover:bg-spurly-navy-light/10 text-spurly-text-secondary transition text-sm font-medium"
          >
            <Settings size={18} />
            {sidebarOpen && <span>Settings</span>}
          </button>
          {sidebarOpen && (
            <div className="px-4 py-3 border-t border-spurly-navy-light/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-spurly-purple to-spurly-blue rounded-spurly flex items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-spurly-text-secondary truncate">{user?.email}</div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-spurly hover:bg-spurly-error/10 text-spurly-error transition text-sm font-medium"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-spurly-border px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-label text-spurly-text-secondary">Search leads, lists, companies...</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-spurly-navy-light hover:text-spurly-purple transition">
              Add to Chrome
            </button>
            <button className="text-sm font-medium text-spurly-navy-light hover:text-spurly-purple transition">
              Invite Team
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-spurly-purple to-spurly-blue rounded-spurly flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
