import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './app/AuthProvider';
import type { AuthUser } from './services/api';
import { AppRoutes } from './app/routes';
import { AppStoreProvider } from './lib/appStore';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { TermsScreen } from './screens/TermsScreen';
import { useEffect, useRef, useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5000 } },
});

type AuthView = 'login' | 'register' | 'terms';
const HASH: Record<AuthView, string> = { login: '', register: 'registro', terms: 'terminos' };
const viewFromHash = (): AuthView => (location.hash === '#registro' ? 'register' : location.hash === '#terminos' ? 'terms' : 'login');

/** Login, registro y términos comparten flujo; la vista vive en el hash (#registro, #terminos) para que "atrás" funcione. */
function AuthFlow({ onAuth }: { onAuth: (user: AuthUser, token: string) => void }) {
  const [view, setView] = useState<AuthView>(viewFromHash);
  const previous = useRef<AuthView | null>(null); // de dónde se abrieron los términos
  useEffect(() => {
    const sync = () => setView(viewFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  const go = (v: AuthView) => { if (v === 'terms') previous.current = view; location.hash = HASH[v]; };
  // Al autenticarse se limpia el hash para no dejar "#registro" en la app
  const done = (u: AuthUser, t: string) => { history.replaceState(null, '', location.pathname + location.search); onAuth(u, t); };
  // Los términos se abren en modal sobre la vista anterior (login o registro); "atrás" cierra el modal
  const base: 'login' | 'register' = view === 'terms'
    ? (previous.current === 'register' ? 'register' : 'login')
    : (view === 'register' ? 'register' : 'login');
  return (
    <>
      {base === 'register'
        ? <RegisterScreen onRegistered={done} onLogin={() => go('login')} onTerms={() => go('terms')} />
        : <LoginScreen onLogin={done} onRegister={() => go('register')} onTerms={() => go('terms')} />}
      {view === 'terms' && <TermsScreen onBack={() => go(previous.current ?? 'login')} />}
    </>
  );
}

function Gate() {
  const { user, login } = useAuth();
  if (!user) return <AuthFlow onAuth={login} />;
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
