import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { QueueProvider } from "./context/QueueContext";
import { Navbar } from "./components/common/Navbar";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReceptionistDashboard } from "./pages/ReceptionistDashboard";
import { DoctorDashboard } from "./pages/DoctorDashboard";
import { PatientTrackPage } from "./pages/PatientTrackPage";
import { QrScannerPage } from "./pages/QrScannerPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PublicQueueDisplayPage } from "./pages/PublicQueueDisplayPage";

function AppLayout() {
  const location = useLocation();

  // Fullscreen displays, dedicated patient view, and landing page hide main staff navbar
  // Landing page has its own SaaS navbar with in-page anchors and login/get started buttons
  const isLandingPage = location.pathname === "/";
  const hideStaffNavbar =
    isLandingPage ||
    location.pathname === "/display" ||
    location.pathname.startsWith("/track/");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {!hideStaffNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/track/:tokenId" element={<PatientTrackPage />} />
          <Route path="/display" element={<PublicQueueDisplayPage />} />

          {/* Protected Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/:doctorId?"
            element={
              <ProtectedRoute allowedRoles={["doctor", "admin"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "doctor", "admin"]}>
                <QrScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin", "receptionist", "doctor"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <QueueProvider>
          <Router>
            <AppLayout />
          </Router>
        </QueueProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
