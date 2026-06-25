import { DashboardLayout } from 'src/components/DashboardLayout';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="h-full grid place-items-center p-8">
        <div className="max-w-md w-full text-center">
          <div
            className="inline-grid place-items-center w-20 h-20 rounded-[22px] mb-6"
            style={{ background: 'var(--accent-tint)' }}
          >
            <Settings size={36} style={{ color: 'var(--brand-purple)' }} />
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)] mb-3">
            Coming soon™
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-6">
            (Yes, we're actually building this. We swear.)
          </p>
          <div className="flex items-center justify-center gap-2 text-[13px] text-[var(--text-tertiary)]">
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--brand-purple)' }} />
            <span>Plot twist: It's really happening</span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--brand-purple)' }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
