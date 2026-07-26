import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/components/ProtectedRoute';
import { AdminRoute } from 'src/components/AdminRoute';
import { CapturedLeadsPage } from 'src/pages/CapturedLeads';
import { CampaignsPage } from 'src/pages/Campaigns';
import { CampaignDetailPage } from 'src/pages/Campaigns/CampaignDetailPage.jsx';
import { TemplatesPage } from 'src/pages/Templates';
import { SettingsPage } from 'src/pages/Settings';
import { EnrichPage } from 'src/pages/Enrich';
import { AdminUsersPage } from 'src/pages/Admin/Users';
import { AdminInsightsPage } from 'src/pages/Admin/Insights';
import { AdminTransactionsPage } from 'src/pages/Admin/Transactions';
import { AdminPricingPage } from 'src/pages/Admin/Pricing';

import SignupPage from 'src/auth/SignupPage.jsx';
import VerifyEmailPage from 'src/auth/VerifyEmailPage.jsx';
import LoginPage from 'src/auth/LoginPage.jsx';
import ForgotPasswordPage from 'src/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from 'src/auth/ResetPasswordPage.jsx';
import OnboardingSurveyPage from 'src/auth/OnboardingSurveyPage.jsx';
import InstallExtensionPage from 'src/auth/InstallExtensionPage.jsx';

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
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingSurveyPage /></ProtectedRoute>} />
      <Route path="/onboarding/install" element={<ProtectedRoute><InstallExtensionPage /></ProtectedRoute>} />

      {/* Dashboard (protected).
          People is the landing surface — there is no separate Home page. Login,
          password reset, onboarding, the LinkedIn callback and the marketing nav
          all send users to bare /dashboard, so it stays alive as a redirect
          rather than making all of those know about /dashboard/people. */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/people" element={<ProtectedRoute><CapturedLeadsPage /></ProtectedRoute>} />
      <Route path="/dashboard/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/dashboard/campaigns/:campaignId" element={<ProtectedRoute><CampaignDetailPage /></ProtectedRoute>} />
      <Route path="/dashboard/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
      <Route path="/dashboard/enrich" element={<ProtectedRoute><EnrichPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Legacy /leads paths — kept permanently so existing bookmarks and any
          extension deep links keep working after the rename to /people. The
          per-lead page no longer exists (details open in a drawer on the list),
          so old detail links land on the list rather than 404. */}
      <Route path="/dashboard/leads" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/leads/:leadId" element={<Navigate to="/dashboard/people" replace />} />
      <Route path="/dashboard/people/:leadId" element={<Navigate to="/dashboard/people" replace />} />

      {/* Legacy /import path — same reasoning as /leads above. The page was
          renamed to Enrich because importing is just how leads arrive; the
          enrichment step is what the page is for. */}
      <Route path="/dashboard/import" element={<Navigate to="/dashboard/enrich" replace />} />

      {/* Admin console (admin-only; backend also enforces via adminMiddleware) */}
      <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/insights" element={<AdminRoute><AdminInsightsPage /></AdminRoute>} />
      <Route path="/admin/transactions" element={<AdminRoute><AdminTransactionsPage /></AdminRoute>} />
      <Route path="/admin/pricing" element={<AdminRoute><AdminPricingPage /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
