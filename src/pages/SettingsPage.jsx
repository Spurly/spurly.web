import { DashboardLayout } from '../components/DashboardLayout';

export function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-spurly-surface-bg to-white">
        <div className="max-w-2xl mx-auto text-center px-8">
          <div className="mb-8">
            <div className="inline-block p-6 rounded-spurly-lg bg-gradient-to-br from-spurly-purple/10 to-spurly-blue/10">
              <svg className="w-24 h-24 mx-auto text-spurly-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-section-heading font-bold text-spurly-navy-light mb-4">
            Coming soon™
          </h1>

          <p className="text-dashboard-title text-spurly-text-secondary mb-8 leading-relaxed">
            (Yes, we're actually building this. We swear.)
          </p>

          <div className="flex items-center justify-center gap-2 text-label text-spurly-text-secondary">
            <span className="w-1 h-1 rounded-full bg-spurly-purple"></span>
            <span>Plot twist: It's really happening</span>
            <span className="w-1 h-1 rounded-full bg-spurly-purple"></span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
