import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/app/ProtectedRoute';
import { AdminRoute } from 'src/app/AdminRoute';
import { SubscribeGate } from 'src/app/SubscribeGate';
import { DashboardHomeRedirect } from 'src/app/DashboardHomeRedirect';
import { RouteFallback } from 'src/app/RouteFallback';

/**
 * Route-level code splitting.
 *
 * Everything below `lazy()` leaves the initial bundle. The three groups are
 * split the way users actually arrive:
 *
 *  - MARKETING is what an anonymous visitor loads. It must not carry the
 *    dashboard, the admin console or the data grid.
 *  - AUTH is the next step and nothing more.
 *  - The DASHBOARD (products/leadgen + platform) is only reachable behind
 *    ProtectedRoute + SubscribeGate, so a signed-out visitor never downloads
 *    it. This is also the seam the hub product plugs into: a second product
 *    becomes another lazy group rather than more weight in one bundle.
 *  - ADMIN is a handful of internal users; it has no business in anyone
 *    else's download.
 *
 * The route guards themselves stay EAGER — they decide what to render, so
 * lazy-loading them would put a spinner in front of every redirect.
 */

// Marketing
const MarketingLayout = lazy(() => import('src/marketing/MarketingLayout').then((m) => ({ default: m.MarketingLayout })));
const MarketingHome = lazy(() => import('src/marketing/MarketingHome.jsx'));
const Privacy = lazy(() => import('src/marketing/pages/Privacy.jsx'));
const Terms = lazy(() => import('src/marketing/pages/Terms.jsx'));
const Support = lazy(() => import('src/marketing/pages/Support.jsx'));
const BlogIndex = lazy(() => import('src/marketing/pages/BlogIndex.jsx'));
const PersonalizePost = lazy(() => import('src/marketing/pages/blog/PersonalizePost.jsx'));
const FoundersPost = lazy(() => import('src/marketing/pages/blog/FoundersPost.jsx'));
const RecruitersPost = lazy(() => import('src/marketing/pages/blog/RecruitersPost.jsx'));

// Auth + onboarding
const SignupPage = lazy(() => import('src/core/pages/auth/SignupPage.jsx'));
const VerifyEmailPage = lazy(() => import('src/core/pages/auth/VerifyEmailPage.jsx'));
const LoginPage = lazy(() => import('src/core/pages/auth/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('src/core/pages/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('src/core/pages/auth/ResetPasswordPage.jsx'));
const SubscribePage = lazy(() => import('src/core/pages/auth/SubscribePage.jsx'));
const SubscribeCallbackPage = lazy(() => import('src/core/pages/auth/SubscribeCallbackPage.jsx'));
const OnboardingSurveyPage = lazy(() => import('src/core/pages/auth/OnboardingSurveyPage.jsx'));
const InstallExtensionPage = lazy(() => import('src/core/pages/auth/InstallExtensionPage.jsx'));
const OnboardingLinkedInPage = lazy(() => import('src/core/pages/auth/OnboardingLinkedInPage.jsx'));

// products/leadgen — the signed-in dashboard
const TemplatesPage = lazy(() => import('src/products/pages/templates').then((m) => ({ default: m.TemplatesPage })));
const SettingsPage = lazy(() => import('src/products/pages/accountSettings').then((m) => ({ default: m.SettingsPage })));
const LinkedInSettingsPage = lazy(() => import('src/products/pages/settings').then((m) => ({ default: m.LinkedInSettingsPage })));
const NotificationsPage = lazy(() => import('src/core/pages/notifications/NotificationsPage.jsx'));
const HubDashboardPage = lazy(() => import('src/products/pages/dashboard').then((m) => ({ default: m.HubDashboardPage })));
const HubLeadsPage = lazy(() => import('src/products/pages/leads').then((m) => ({ default: m.HubLeadsPage })));
const HubCampaignsPage = lazy(() => import('src/products/pages/campaigns').then((m) => ({ default: m.HubCampaignsPage })));
const HubCampaignDetailPage = lazy(() => import('src/products/pages/campaigns').then((m) => ({ default: m.HubCampaignDetailPage })));
const HubEnrichmentPage = lazy(() => import('src/products/pages/enrichment').then((m) => ({ default: m.HubEnrichmentPage })));
const HubEnrichmentDetailPage = lazy(() => import('src/products/pages/enrichment').then((m) => ({ default: m.HubEnrichmentDetailPage })));
const HubSequencesPage = lazy(() => import('src/products/pages/sequences').then((m) => ({ default: m.HubSequencesPage })));
const HubNewSequencePage = lazy(() => import('src/products/pages/sequences').then((m) => ({ default: m.HubNewSequencePage })));
const HubSequenceDetailPage = lazy(() => import('src/products/pages/sequences').then((m) => ({ default: m.HubSequenceDetailPage })));
const HubInboxPage = lazy(() => import('src/products/pages/inbox').then((m) => ({ default: m.HubInboxPage })));
const ImportPage = lazy(() => import('src/products/pages/import').then((m) => ({ default: m.ImportPage })));

// Admin console
const AdminUsersPage = lazy(() => import('src/core/pages/admin/Users').then((m) => ({ default: m.AdminUsersPage })));
const AdminInsightsPage = lazy(() => import('src/core/pages/admin/Insights').then((m) => ({ default: m.AdminInsightsPage })));
const AdminTransactionsPage = lazy(() => import('src/core/pages/admin/Transactions').then((m) => ({ default: m.AdminTransactionsPage })));
const AdminPricingPage = lazy(() => import('src/core/pages/admin/Pricing').then((m) => ({ default: m.AdminPricingPage })));
const AdminPaymentsPage = lazy(() => import('src/core/pages/admin/Payments').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminBillingPage = lazy(() => import('src/core/pages/admin/Billing').then((m) => ({ default: m.AdminBillingPage })));

const UiPreview = lazy(() => import('src/dev/UiPreview.jsx').then((m) => ({ default: m.UiPreview })));

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      {/* Public marketing site */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<MarketingHome />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<Support />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/personalize-linkedin-connection-requests" element={<PersonalizePost />} />
        <Route path="/blog/free-linkedin-outreach-pipeline-founders" element={<FoundersPost />} />
        <Route path="/blog/sales-navigator-candidate-pipelines-recruiters" element={<RecruitersPost />} />
      </Route>

      {/* Auth + onboarding (full-page, outside the marketing chrome) */}
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/verify" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Mandatory paywall. Every account lands here right after signup
          (VerifyEmailPage navigates here, not to /onboarding), and
          SubscribeGate below sends anyone without an active subscription
          back here from onboarding/install/dashboard. Protected by auth
          only — NOT wrapped in SubscribeGate, since that would loop. */}
      <Route path="/subscribe" element={<ProtectedRoute><SubscribePage /></ProtectedRoute>} />
      <Route path="/subscribe/callback" element={<ProtectedRoute><SubscribeCallbackPage /></ProtectedRoute>} />

      <Route path="/onboarding" element={<ProtectedRoute><SubscribeGate><OnboardingSurveyPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/onboarding/linkedin" element={<ProtectedRoute><SubscribeGate><OnboardingLinkedInPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/onboarding/install" element={<ProtectedRoute><SubscribeGate><InstallExtensionPage /></SubscribeGate></ProtectedRoute>} />

      {/* Dashboard (protected + requires an active subscription).
          The People page was retired (2026-09-14), and the old two-tier
          leadgen/hub entitlement split was removed the same day — every
          active subscriber now has full access to everything below, so
          there is nothing left to branch on. Login, password reset,
          onboarding, the LinkedIn callback and the marketing nav all send
          users to bare /dashboard, so it stays alive as a plain redirect
          to Hub's lead list (see DashboardHomeRedirect). */}
      <Route path="/dashboard" element={<ProtectedRoute><SubscribeGate><DashboardHomeRedirect /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/templates" element={<ProtectedRoute><SubscribeGate><TemplatesPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/import" element={<ProtectedRoute><SubscribeGate><ImportPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SubscribeGate><SettingsPage /></SubscribeGate></ProtectedRoute>} />
      {/* No SubscribeGate, deliberately: a lapsed subscriber is exactly who needs to see the entitlement-grace-started notification telling them so. */}
      <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      {/* Hub's settings page, under /dashboard only because that is where the
          user looks for settings. This is the page with the Connect button,
          and Connect is the click that starts billing us for a linked
          account. */}
      <Route path="/dashboard/settings/linkedin" element={<ProtectedRoute><SubscribeGate><LinkedInSettingsPage /></SubscribeGate></ProtectedRoute>} />

      {/* Hub — the second workspace. Its own namespace rather than a branch of
          /dashboard, so splitting it to its own bundle or subdomain later is
          moving a folder rather than a rewrite (ARCHITECTURE.md §2b). Same
          guards as the dashboard: signed in, then paid up. The old second-tier
          "hub" entitlement gate (HubGate, /hub/upgrade) was removed
          2026-09-14 — every active subscriber now has full access. */}
      <Route path="/hub" element={<Navigate to="/hub/dashboard" replace />} />
      <Route path="/hub/dashboard" element={<ProtectedRoute><SubscribeGate><HubDashboardPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/leads" element={<ProtectedRoute><SubscribeGate><HubLeadsPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/campaigns" element={<ProtectedRoute><SubscribeGate><HubCampaignsPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/campaigns/:id" element={<ProtectedRoute><SubscribeGate><HubCampaignDetailPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/enrichment" element={<ProtectedRoute><SubscribeGate><HubEnrichmentPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/enrichment/:id" element={<ProtectedRoute><SubscribeGate><HubEnrichmentDetailPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/sequences" element={<ProtectedRoute><SubscribeGate><HubSequencesPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/sequences/new" element={<ProtectedRoute><SubscribeGate><HubNewSequencePage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/sequences/:id" element={<ProtectedRoute><SubscribeGate><HubSequenceDetailPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/hub/inbox" element={<ProtectedRoute><SubscribeGate><HubInboxPage /></SubscribeGate></ProtectedRoute>} />

      {/* Legacy /leads and /people paths — kept permanently so existing
          bookmarks and any extension deep links keep working. The People page
          itself was retired (2026-09-14); a stale Person id can't be resolved
          against a HubLead anyway, so these land on bare /dashboard (see
          DashboardHomeRedirect) rather than assuming every visitor has hub. */}
      <Route path="/dashboard/leads" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/leads/:leadId" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/people" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/people/:leadId" element={<Navigate to="/dashboard" replace />} />

      {/* Legacy /enrich path — same reasoning as /leads above. The page was
          briefly called Enrich; it is named Import again because importing is
          what the user comes here to do, and enriching is one action they take
          on the rows once they have arrived. */}
      <Route path="/dashboard/enrich" element={<Navigate to="/dashboard/import" replace />} />

      {/* Admin console (admin-only; backend also enforces via adminMiddleware) */}
      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/insights" element={<AdminRoute><AdminInsightsPage /></AdminRoute>} />
      <Route path="/admin/transactions" element={<AdminRoute><AdminTransactionsPage /></AdminRoute>} />
      <Route path="/admin/pricing" element={<AdminRoute><AdminPricingPage /></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><AdminPaymentsPage /></AdminRoute>} />
      <Route path="/admin/billing" element={<AdminRoute><AdminBillingPage /></AdminRoute>} />

      {/* Every primitive in every state, on one page. Dev only — the route
          isn't registered in a production build, so it can't be reached and
          the component tree-shakes out. */}
      {import.meta.env.DEV && <Route path="/dev/ui" element={<UiPreview />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
