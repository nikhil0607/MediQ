import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQueue } from "../../context/QueueContext";
import {
  Activity,
  Users,
  Stethoscope,
  QrCode,
  Tv,
  BarChart3,
  Settings,
  Radio,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  LogIn
} from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loginDemo, logout } = useAuth();
  const { isConnected, doctors } = useQueue();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/receptionist", label: "Reception", icon: Users },
    {
      to: user?.role === "doctor" && user?.doctorId ? `/doctor/${user.doctorId}` : "/doctor/doc-1",
      label: "Doctor Room",
      icon: Stethoscope
    },
    { to: "/scanner", label: "QR Scanner", icon: QrCode },
    { to: "/display", label: "TV Display", icon: Tv },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings }
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Medi<span className="text-teal-600">Q</span>
                </span>
                <span className="text-[10px] uppercase font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Queue Management</p>
            </div>
          </Link>

          {/* Navigation Links for Authenticated Staff */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-100 text-teal-700 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Realtime pill, Auth status, and Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Live Stream status pill */}
          <div
            title={isConnected ? "Realtime WebSocket/SSE connected" : "Connecting to stream..."}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{isConnected ? "Realtime Live" : "Connecting..."}</span>
          </div>

          {/* User state */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Demo Badge if sandbox */}
              {user.isDemo && (
                <span
                  title="Hackathon Demonstration Sandbox Profile"
                  className="hidden xl:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Demo Mode</span>
                </span>
              )}

              {/* Role switcher dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span className="capitalize font-semibold">{user.role}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block hover:block z-50">
                  <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500">
                    Signed in as: <strong className="text-slate-900 block truncate">{user.name}</strong>
                  </div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Demo Role:
                  </div>
                  <button
                    onClick={() => {
                      loginDemo("receptionist");
                      navigate("/receptionist");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      user.role === "receptionist" ? "bg-teal-50 text-teal-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Reception Desk</span>
                    {user.role === "receptionist" && <span className="text-[10px] font-bold text-teal-600">ACTIVE</span>}
                  </button>

                  <button
                    onClick={() => {
                      loginDemo("doctor_jenkins");
                      navigate("/doctor/doc-1");
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold truncate cursor-pointer ${
                      user.role === "doctor" && user.doctorId === "doc-1" ? "bg-teal-50 text-teal-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Dr. Sarah Jenkins (Cabin 102)
                  </button>

                  <button
                    onClick={() => {
                      loginDemo("doctor_vance");
                      navigate("/doctor/doc-2");
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold truncate cursor-pointer ${
                      user.role === "doctor" && user.doctorId === "doc-2" ? "bg-teal-50 text-teal-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Dr. Marcus Vance (Cabin 204 - Delayed)
                  </button>

                  <button
                    onClick={() => {
                      loginDemo("admin");
                      navigate("/settings");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      user.role === "admin" ? "bg-teal-50 text-teal-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span>Clinic Admin</span>
                    {user.role === "admin" && <span className="text-[10px] font-bold text-teal-600">ACTIVE</span>}
                  </button>

                  <div className="pt-2 mt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Out direct button */}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 md:hidden hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2 animate-fade-in">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Icon className="w-4 h-4 text-teal-600" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
