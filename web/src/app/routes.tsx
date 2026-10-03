import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ContainerKioskLayout } from '../components/layout/ContainerKioskLayout';
import { isContainerUser } from '../services/api';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ContainersPage } from '../pages/Containers/ContainersPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { NetworkPage } from '../pages/Network/NetworkPage';
import { CollectionPointsPage } from '../pages/CollectionPoints/CollectionPointsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { MorePage } from '../pages/MorePage';
import { ScanTab } from '../screens/tabs/ScanTab';
import { MapTab } from '../screens/tabs/MapTab';
import { HistoryTab } from '../screens/tabs/HistoryTab';
import { EducationTab } from '../screens/tabs/EducationTab';

/** Rol 'contenedor': únicamente la clasificación de residuos. El backend aplica el mismo límite. */
function ContainerRoutes() {
  return (
    <Routes>
      <Route element={<ContainerKioskLayout />}>
        <Route path="classification" element={<ScanTab />} />
        <Route path="*" element={<Navigate to="/classification" replace />} />
      </Route>
    </Routes>
  );
}

export function AppRoutes() {
  const { user } = useAuth();
  if (isContainerUser(user)) return <ContainerRoutes />;
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="classification" element={<ScanTab />} />
        <Route path="containers" element={<ContainersPage />} />
        <Route path="map" element={<MapTab />} />
        <Route path="collection-points" element={<CollectionPointsPage />} />
        <Route path="network" element={<NetworkPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="history" element={<HistoryTab />} />
        <Route path="learn" element={<EducationTab />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="profile" element={<Navigate to="/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
