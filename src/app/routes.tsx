import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from '../pages/login/LoginPage';
import { StoreSelectorPage } from '../pages/store-selector/StoreSelectorPage';
import { StorePanelPage } from '../pages/store-panel/StorePanelPage';
import { LabPanelPage } from '../pages/lab-panel/LabPanelPage';

import { NewOSForm } from '../pages/store-panel/NewOSForm';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { SellerManagementPage } from '../pages/store-panel/SellerManagementPage';
import { DeliveryPanelPage } from '../pages/delivery-panel/DeliveryPanelPage';

// Helper component for private routes requiring active login session
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to respective landing page
    const defaultLanding =
      user.role === 'laboratorio'
        ? '/lab'
        : user.role === 'motoboy'
        ? '/delivery-panel'
        : '/store/dashboard';
    return <Navigate to={defaultLanding} replace />;
  }

  return <>{children}</>;
}

// Helper requiring store selection for shop level users
function StoreSelectionRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const selectedStoreId = useAuthStore((s) => s.selectedStoreId);
  const selectStore = useAuthStore((s) => s.selectStore);

  React.useEffect(() => {
    if (user?.role === 'vendedor' && !selectedStoreId) {
      const storeId = user.storeId || 'norte-1';
      const storeName = user.storeName || 'Norte 1';
      selectStore(storeId, storeName);
    }
  }, [user, selectedStoreId, selectStore]);

  // Only vendedor MUST select a store. Gerente can operate in consolidated mode
  const needsSelection = user?.role === 'vendedor';
  if (needsSelection && !selectedStoreId) {
    return null; // Wait for useEffect to auto-select the fixed store
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const user = useAuthStore((s) => s.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Store selection step */}
        <Route
          path="/selecionar-loja"
          element={
            <ProtectedRoute allowedRoles={['gerente', 'admin']}>
              <StoreSelectorPage />
            </ProtectedRoute>
          }
        />

        {/* Protected layout routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <StoreSelectionRoute>
                <MainLayout />
              </StoreSelectionRoute>
            </ProtectedRoute>
          }
        >
          {/* Main dashboard redirect checks */}
          <Route
            index
            element={
              user?.role === 'laboratorio' ? (
                <Navigate to="/lab" replace />
              ) : user?.role === 'motoboy' ? (
                <Navigate to="/delivery-panel" replace />
              ) : (
                <Navigate to="/store/dashboard" replace />
              )
            }
          />

          {/* Store management */}
          <Route path="store/dashboard" element={<StorePanelPage initialTab="dashboard" />} />
          <Route path="store/track" element={<StorePanelPage initialTab="track" />} />
          <Route path="store/new" element={<NewOSForm />} />
          <Route path="store/edit/:id" element={<NewOSForm />} />
          <Route path="store/deliveries" element={<StorePanelPage initialTab="deliveries" />} />
          <Route
            path="store/config"
            element={
              <ProtectedRoute allowedRoles={['gerente', 'admin']}>
                <SellerManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="rectifications" element={<StorePanelPage initialTab="rectifications" />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Motoboy panel */}
          <Route
            path="delivery-panel"
            element={
              <ProtectedRoute allowedRoles={['motoboy', 'admin']}>
                <DeliveryPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Laboratório */}
          <Route
            path="lab"
            element={
              <ProtectedRoute allowedRoles={['laboratorio']}>
                <LabPanelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="lab/deliveries"
            element={
              <ProtectedRoute allowedRoles={['laboratorio']}>
                <LabPanelPage initialTab="deliveries" />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute allowedRoles={['laboratorio']}>
                <LabPanelPage initialTab="notifications" />
              </ProtectedRoute>
            }
          />
          <Route
            path="caveats"
            element={
              <ProtectedRoute allowedRoles={['laboratorio']}>
                <LabPanelPage initialTab="caveats" />
              </ProtectedRoute>
            }
          />

          {/* Dashboards */}
          <Route
            path="dashboard/store"
            element={<Navigate to="/store/dashboard" replace />}
          />


        </Route>

        {/* Fallback to index */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRoutes;
