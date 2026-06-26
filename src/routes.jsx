import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/components/ProtectedRoute';
import { HomePage } from 'src/pages/Home';
import { CapturedLeadsPage } from 'src/pages/CapturedLeads';
import { LeadDetailPage } from 'src/pages/LeadDetail';
import { SignalsPage } from 'src/pages/Signals';
import { SettingsPage } from 'src/pages/Settings';

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

      {/* Dashboard (protected) */}
      <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboard/leads" element={<ProtectedRoute><CapturedLeadsPage /></ProtectedRoute>} />
      <Route path="/dashboard/leads/:leadId" element={<ProtectedRoute><LeadDetailPage /></ProtectedRoute>} />
      <Route path="/dashboard/signals" element={<ProtectedRoute><SignalsPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
