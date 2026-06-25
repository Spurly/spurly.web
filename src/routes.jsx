import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from 'src/components/ProtectedRoute';
import { LoginPage } from 'src/pages/Login';
import { HomePage } from 'src/pages/Home';
import { CapturedLeadsPage } from 'src/pages/CapturedLeads';
import { LeadDetailPage } from 'src/pages/LeadDetail';
import { SignalsPage } from 'src/pages/Signals';
import { SettingsPage } from 'src/pages/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboard/leads" element={<ProtectedRoute><CapturedLeadsPage /></ProtectedRoute>} />
      <Route path="/dashboard/leads/:leadId" element={<ProtectedRoute><LeadDetailPage /></ProtectedRoute>} />
      <Route path="/dashboard/signals" element={<ProtectedRoute><SignalsPage /></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
