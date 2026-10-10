import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button, Card, Skeleton } from 'src/core/primitives';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { useConsent } from 'src/products/aiAssistants/hooks/useConsent.js';
import { ConsentScopes } from 'src/products/aiAssistants/components/ConsentScopes.jsx';

/** The authorize query parameters the backend validated and forwarded. */
const PARAMS = ['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 'code_challenge', 'code_challenge_method', 'resource'];

/**
 * Where Claude.ai (or another app) sends the user to connect. Logs in first when needed, then
 * shows who is asking and what it wants. Approve and Deny both end in a redirect back to the
 * app, which the backend builds; this page only follows it. A bad request shows a message, not
 * a blank page, and never redirects (we cannot trust the redirect_uri until the server did).
 */
export default function OAuthConsentPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [search] = useSearchParams();
  const params = useMemo(() => Object.fromEntries(PARAMS.filter((k) => search.get(k) !== null).map((k) => [k, search.get(k)])), [search]);

  if (authLoading) return <Shell><Skeleton className="h-24 w-full" /></Shell>;
  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <ConsentBody params={params} />;
}

function ConsentBody({ params }) {
  const consent = useConsent(params);
  const [picked, setPicked] = useState(null);
  const scopes = picked ?? consent.requested.filter((s) => s !== 'act');

  useEffect(() => {
    if (consent.redirectTo) window.location.assign(consent.redirectTo);
  }, [consent.redirectTo]);

  if (consent.loading) return <Shell><Skeleton className="h-24 w-full" /></Shell>;

  if (!consent.client) {
    return (
      <Shell>
        <h1 className="text-[length:var(--ui-t-title)] font-medium text-[var(--ui-text-primary)]">We can’t connect this app</h1>
        <p className="mt-2 text-[var(--ui-text-secondary)]" role="alert">
          {consent.error?.message || 'This connection request is not valid. Go back to the app and try connecting again.'}
        </p>
      </Shell>
    );
  }

  const busy = consent.submitting || Boolean(consent.redirectTo);
  return (
    <Shell>
      <h1 className="text-[length:var(--ui-t-title)] font-medium text-[var(--ui-text-primary)]">Connect {consent.client.name} to Spurly?</h1>
      <p className="mt-1 text-[var(--ui-text-secondary)]">It will act on your Spurly account as you.</p>
      <AppIdentity client={consent.client} redirectUri={params.redirect_uri} />
      <ConsentScopes requested={consent.requested} value={scopes} onChange={setPicked} disabled={busy} />
      {consent.error && <p className="mt-3 text-[var(--ui-danger-fg)]" role="alert">{consent.error.message}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={consent.deny} disabled={busy}>Deny</Button>
        <Button variant="primary" onClick={() => consent.approve(scopes)} disabled={busy || scopes.length === 0} loading={busy}>Approve</Button>
      </div>
    </Shell>
  );
}

/**
 * The app's name is chosen by whoever registered it, so it proves nothing. Show where it really is:
 * its address when it has one (a published client document), otherwise say plainly that it is unverified,
 * and always where approving will send the browser.
 */
function AppIdentity({ client, redirectUri }) {
  const host = (value) => (value && URL.canParse(value) ? new URL(value).host || new URL(value).protocol : null);
  const clientHost = client.id?.startsWith('https://') ? host(client.id) : null;
  const returnHost = host(redirectUri);
  return (
    <dl className="mt-3 mb-4 rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] p-3 text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]" data-testid="app-identity">
      <div className="flex gap-2"><dt>App address</dt><dd className="font-medium text-[var(--ui-text-primary)]">{clientHost ?? 'Unverified: this app registered itself'}</dd></div>
      {returnHost && <div className="flex gap-2"><dt>Returns you to</dt><dd className="font-medium text-[var(--ui-text-primary)]">{returnHost}</dd></div>}
      <p className="mt-2 text-[var(--ui-text-tertiary)]">Only approve if you started this from an app you trust.</p>
    </dl>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card className="w-full max-w-md p-6">{children}</Card>
    </div>
  );
}
