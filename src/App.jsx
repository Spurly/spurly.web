import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'src/core/context/AuthContext';
import { SubscriptionProvider } from 'src/core/context/SubscriptionContext';
import { ToastProvider, ConfirmProvider } from 'src/ui/primitives';
import { AppRoutes } from 'src/routes';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* Inside AuthProvider so it can read the signed-in user; wraps
              everything below so any page can check subscription status
              without re-fetching it itself. */}
          <SubscriptionProvider>
            {/* Inside AuthProvider so anything that can toast can also read the
                user, and outside the router so a toast survives navigation. */}
            <ToastProvider>
              {/* Inside ToastProvider so a confirmed action can toast its result
                  from the same handler that awaited the confirmation. */}
              <ConfirmProvider>
                <AppRoutes />
              </ConfirmProvider>
            </ToastProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
