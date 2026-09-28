import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'src/core/auth/hooks/AuthContext';
import { SubscriptionProvider } from 'src/core/billing/hooks/SubscriptionContext';
import { ToastProvider, ConfirmProvider } from 'src/core/primitives';
import { ThemeProvider } from 'src/core/theme';
import { AppRoutes } from 'src/app/routes';
import { PageViewTracker } from 'src/app/PageViewTracker';

// Exported so src/entry-server.jsx can prerender the public pages with the
// SAME tree the browser hydrates — only the router differs (StaticRouter on
// the server, BrowserRouter here). Hydration needs the two to match exactly.
const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

export function AppTree({ Router = BrowserRouter, routerProps = {}, helmetContext }) {
  return (
    <HelmetProvider context={helmetContext}>
      {/*
        * Light is the only supported theme, so this provider has nothing to
        * stamp on the document -- it exists only so `useTheme()` keeps
        * resolving for any code that still reads it. Kept outside the
        * router since it's a property of the document, not of a route.
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
      <Router future={ROUTER_FUTURE} {...routerProps}>
        <PageViewTracker />
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
      </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}

function App() {
  return <AppTree />;
}

export default App;
