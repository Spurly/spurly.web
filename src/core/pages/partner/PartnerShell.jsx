import { Helmet } from 'react-helmet-async';
import { Card } from 'src/core/primitives';

/**
 * Bare, centered frame for the partner pages: no marketing chrome, no login
 * form, never indexed or cached.
 */
export function PartnerShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--ui-surface-page)] text-[var(--ui-text-primary)]">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <Card padding="lg" className="w-full max-w-md text-center">
        {children}
      </Card>
    </div>
  );
}
