import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from 'src/core/context/AuthContext';
import { AppRoutes } from 'src/routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
