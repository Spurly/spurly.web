import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CapturedLeadsPage } from './pages/CapturedLeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { EnrichmentQueuePage } from './pages/EnrichmentQueuePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ListsPage } from './pages/ListsPage';
import { SignalsPage } from './pages/SignalsPage';
import { ExportsPage } from './pages/ExportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

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
