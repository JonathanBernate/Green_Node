import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/AuthProvider';
import { AppRoutes } from './app/routes';
import { AppStoreProvider } from './lib/appStore';
import { LoginScreen } from './screens/LoginScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5000 } },
});

function Gate() {
  const { user, login } = useAuth();
  if (!user) return <LoginScreen onLogin={login} />;
  return (
    <AppStoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppStoreProvider>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
