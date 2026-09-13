import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'src/platform/auth/AuthContext';
import { SubscriptionProvider } from 'src/platform/billing/hooks/SubscriptionContext';
import { ToastProvider, ConfirmProvider } from 'src/ui/primitives';
import { ThemeProvider } from 'src/ui/theme';
import { AppRoutes } from 'src/app/routes';

function App() {
  return (
    <HelmetProvider>
      {/*
        * Outermost of the providers, and deliberately outside the router:
        * the theme is a property of the document, not of a route, and it
        * must not remount on navigation. index.html has already stamped
        * data-theme before first paint -- this provider takes over that
        * attribute and owns it from here.
        */}
      <ThemeProvider>
      {/*
        * v6 future flags, opted into early. Both are v7's behaviour and both
        * silence a console warning on every page load.
        *
        * v7_startTransition — router state updates are wrapped in
        * React.startTransition. This is the one that actually changes
        * something here: routes are lazily loaded, so without it a navigation
        * swaps straight to RouteFallback's spinner, and with it React keeps
        * the current page on screen while the next chunk loads. Better, but a
        * real change — tests/routes.lazy.test.jsx covers the paths.
        *
        * v7_relativeSplatPath — a no-op for this app. It only affects relative
        * links resolved inside a splat route, and the one splat route here
        * ("*") renders <Navigate to="/"> , an absolute path.
        */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
