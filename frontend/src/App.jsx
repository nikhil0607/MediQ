import React, { Component } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { QueueProvider } from "./context/QueueContext";
import { Navbar } from "./components/common/Navbar";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Activity, RefreshCw, Home, AlertTriangle } from "lucide-react";

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

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MediQ Application Runtime Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Application Notice</h2>
              <p className="text-xs text-slate-600 mt-1">
                A temporary interface error occurred. Please refresh the page to reconnect to the queue engine.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <a
                href="/"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout() {
  const location = useLocation();

  // Fullscreen displays, dedicated patient view, and landing page hide main staff navbar
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
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <QueueProvider>
            <Router>
              <AppLayout />
            </Router>
          </QueueProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
