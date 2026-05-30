import { DashboardLayout } from '../components/DashboardLayout';

export function ListsPage() {
  return (
    <DashboardLayout>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-spurly-surface-bg to-white">
        <div className="max-w-2xl mx-auto text-center px-8">
          <div className="mb-8">
            <div className="inline-block p-6 rounded-spurly-lg bg-gradient-to-br from-spurly-purple/10 to-spurly-blue/10">
              <svg className="w-24 h-24 mx-auto text-spurly-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
