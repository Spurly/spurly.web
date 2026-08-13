import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'src/core/context/AuthContext';
import { ToastProvider } from 'src/ui/primitives';
import { AppRoutes } from 'src/routes';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* Inside AuthProvider so anything that can toast can also read the
              user, and outside the router so a toast survives navigation. */}
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
