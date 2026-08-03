import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import TripMIS from './pages/TripMIS';
import VendorVehicleMIS from './pages/VendorVehicleMIS';
import IAM from './pages/IAM';
import PrintSingleTrip from './pages/PrintSingleTrip';
import PrintSingleVendor from './pages/PrintSingleVendor';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { DialogProvider } from './context/DialogContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <DialogProvider>
              <NotificationProvider>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="trip-mis" replace />} />
                    <Route path="trip-mis" element={<TripMIS />} />
                    <Route path="vendor-mis" element={<VendorVehicleMIS />} />
                    <Route path="iam" element={<IAM />} />
                  </Route>
                  <Route path="/print-single-trip/:index" element={<ProtectedRoute><PrintSingleTrip /></ProtectedRoute>} />
                  <Route path="/print-single-vendor/:index" element={<ProtectedRoute><PrintSingleVendor /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </NotificationProvider>
            </DialogProvider>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
