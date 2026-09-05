import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/app/ProtectedRoute';
import { AdminRoute } from 'src/app/AdminRoute';
import { SubscribeGate } from 'src/app/SubscribeGate';
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
const SignupPage = lazy(() => import('src/platform/auth/SignupPage.jsx'));
const VerifyEmailPage = lazy(() => import('src/platform/auth/VerifyEmailPage.jsx'));
const LoginPage = lazy(() => import('src/platform/auth/LoginPage.jsx'));
const ForgotPasswordPage = lazy(() => import('src/platform/auth/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('src/platform/auth/ResetPasswordPage.jsx'));
const SubscribePage = lazy(() => import('src/platform/auth/SubscribePage.jsx'));
const SubscribeCallbackPage = lazy(() => import('src/platform/auth/SubscribeCallbackPage.jsx'));
const OnboardingSurveyPage = lazy(() => import('src/platform/auth/OnboardingSurveyPage.jsx'));
const InstallExtensionPage = lazy(() => import('src/platform/auth/InstallExtensionPage.jsx'));

// products/leadgen — the signed-in dashboard
const PeoplePage = lazy(() => import('src/products/leadgen/people').then((m) => ({ default: m.PeoplePage })));
const ConnectionsPage = lazy(() => import('src/products/leadgen/connections').then((m) => ({ default: m.ConnectionsPage })));
const CampaignsPage = lazy(() => import('src/products/leadgen/campaigns').then((m) => ({ default: m.CampaignsPage })));
const CampaignDetailPage = lazy(() => import('src/products/leadgen/campaigns/CampaignDetailPage.jsx').then((m) => ({ default: m.CampaignDetailPage })));
const TemplatesPage = lazy(() => import('src/products/leadgen/templates').then((m) => ({ default: m.TemplatesPage })));
const SettingsPage = lazy(() => import('src/products/leadgen/settings').then((m) => ({ default: m.SettingsPage })));
const ImportPage = lazy(() => import('src/products/leadgen/import').then((m) => ({ default: m.ImportPage })));

// Admin console
const AdminUsersPage = lazy(() => import('src/platform/admin/pages/Users').then((m) => ({ default: m.AdminUsersPage })));
const AdminInsightsPage = lazy(() => import('src/platform/admin/pages/Insights').then((m) => ({ default: m.AdminInsightsPage })));
const AdminTransactionsPage = lazy(() => import('src/platform/admin/pages/Transactions').then((m) => ({ default: m.AdminTransactionsPage })));
const AdminPricingPage = lazy(() => import('src/platform/admin/pages/Pricing').then((m) => ({ default: m.AdminPricingPage })));
const AdminPaymentsPage = lazy(() => import('src/platform/admin/pages/Payments').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminBillingPage = lazy(() => import('src/platform/admin/pages/Billing').then((m) => ({ default: m.AdminBillingPage })));

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
      <Route path="/onboarding/install" element={<ProtectedRoute><SubscribeGate><InstallExtensionPage /></SubscribeGate></ProtectedRoute>} />

      {/* Dashboard (protected + requires an active subscription).
          People is the landing surface — there is no separate Home page. Login,
          password reset, onboarding, the LinkedIn callback and the marketing nav
          all send users to bare /dashboard, so it stays alive as a redirect
          rather than making all of those know about /dashboard/people. */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/people" element={<ProtectedRoute><SubscribeGate><PeoplePage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/connections" element={<ProtectedRoute><SubscribeGate><ConnectionsPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/campaigns" element={<ProtectedRoute><SubscribeGate><CampaignsPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/campaigns/:campaignId" element={<ProtectedRoute><SubscribeGate><CampaignDetailPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/templates" element={<ProtectedRoute><SubscribeGate><TemplatesPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/import" element={<ProtectedRoute><SubscribeGate><ImportPage /></SubscribeGate></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SubscribeGate><SettingsPage /></SubscribeGate></ProtectedRoute>} />

      {/* Legacy /leads paths — kept permanently so existing bookmarks and any
          extension deep links keep working after the rename to /people. The
          per-lead page no longer exists (details open in a drawer on the list),
          so old detail links land on the list rather than 404. */}
      <Route path="/dashboard/leads" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/leads/:leadId" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/people/:leadId" element={<Navigate to="/dashboard/people" replace />} />

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
