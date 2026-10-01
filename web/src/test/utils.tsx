import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../app/AuthProvider';
import { AppStoreProvider } from '../lib/appStore';

/** Renderiza con todos los proveedores de la app (modo simulación). */
export function renderWithProviders(ui: React.ReactElement, route = '/') {
  localStorage.setItem('auth_token', 't');
  localStorage.setItem('auth_user', JSON.stringify({ id: '1', name: 'Test User', email: 't@x.co', points: 10, level: 1 }));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <AppStoreProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </AppStoreProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
