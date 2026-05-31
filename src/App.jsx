import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from 'src/context/AuthContext';
import { LoginPage } from 'src/pages/Login';
import { HomePage } from 'src/pages/Home';
import { CapturedLeadsPage } from 'src/pages/CapturedLeads';
import { LeadDetailPage } from 'src/pages/LeadDetail';
import { EnrichmentQueuePage } from 'src/pages/EnrichmentQueue';
import { DiscoverPage } from 'src/pages/Discover';
import { ListsPage } from 'src/pages/Lists';
import { SignalsPage } from 'src/pages/Signals';
import { ExportsPage } from 'src/pages/Exports';
import { SettingsPage } from 'src/pages/Settings';
import { ProtectedRoute } from 'src/components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/leads"
            element={
              <ProtectedRoute>
                <CapturedLeadsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/leads/:leadId"
            element={
              <ProtectedRoute>
                <LeadDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/enrichment"
            element={
              <ProtectedRoute>
                <EnrichmentQueuePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/discover"
            element={
              <ProtectedRoute>
                <DiscoverPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/lists"
            element={
              <ProtectedRoute>
                <ListsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/signals"
            element={
              <ProtectedRoute>
                <SignalsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/exports"
            element={
              <ProtectedRoute>
                <ExportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
