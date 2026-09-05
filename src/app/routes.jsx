import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/app/ProtectedRoute';
import { AdminRoute } from 'src/app/AdminRoute';
import { SubscribeGate } from 'src/app/SubscribeGate';
import { PeoplePage } from 'src/platform/people';
import { UiPreview } from 'src/dev/UiPreview.jsx';
import { ConnectionsPage } from 'src/products/leadgen/connections';
import { CampaignsPage } from 'src/products/leadgen/campaigns';
import { CampaignDetailPage } from 'src/products/leadgen/campaigns/CampaignDetailPage.jsx';
import { TemplatesPage } from 'src/products/leadgen/templates';
import { SettingsPage } from 'src/products/leadgen/settings';
import { ImportPage } from 'src/products/leadgen/import';
import { AdminUsersPage } from 'src/platform/admin/pages/Users';
import { AdminInsightsPage } from 'src/platform/admin/pages/Insights';
import { AdminTransactionsPage } from 'src/platform/admin/pages/Transactions';
import { AdminPricingPage } from 'src/platform/admin/pages/Pricing';
import { AdminBillingPage } from 'src/platform/admin/pages/Billing';
import { AdminPaymentsPage } from 'src/platform/admin/pages/Payments';

import SignupPage from 'src/platform/auth/SignupPage.jsx';
import VerifyEmailPage from 'src/platform/auth/VerifyEmailPage.jsx';
import LoginPage from 'src/platform/auth/LoginPage.jsx';
import ForgotPasswordPage from 'src/platform/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from 'src/platform/auth/ResetPasswordPage.jsx';
import SubscribePage from 'src/platform/auth/SubscribePage.jsx';
import SubscribeCallbackPage from 'src/platform/auth/SubscribeCallbackPage.jsx';
import OnboardingSurveyPage from 'src/platform/auth/OnboardingSurveyPage.jsx';
import InstallExtensionPage from 'src/platform/auth/InstallExtensionPage.jsx';

import { MarketingLayout } from 'src/marketing/MarketingLayout';
import MarketingHome from 'src/marketing/MarketingHome.jsx';
import Privacy from 'src/marketing/pages/Privacy.jsx';
import Terms from 'src/marketing/pages/Terms.jsx';
import Support from 'src/marketing/pages/Support.jsx';
import BlogIndex from 'src/marketing/pages/BlogIndex.jsx';
import PersonalizePost from 'src/marketing/pages/blog/PersonalizePost.jsx';
import FoundersPost from 'src/marketing/pages/blog/FoundersPost.jsx';
import RecruitersPost from 'src/marketing/pages/blog/RecruitersPost.jsx';

export function AppRoutes() {
  return (
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
  );
}
