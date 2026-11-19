import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, DEMO_PROFILES } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Activity,
  Lock,
  Mail,
  Users,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle
} from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginDemo, loading } = useAuth();
  const { showToast } = useNotification();

  const [email, setEmail] = useState("reception@mediq.health");
  const [password, setPassword] = useState("password123");
  const [selectedRole, setSelectedRole] = useState("receptionist");
  const [error, setError] = useState("");

  const destinationPath = (role, doctorId, tokenNumber) => {
    // If user originally tried to navigate somewhere specific
    if (location.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    if (role === "doctor") {
      return `/doctor/${doctorId || "doc-1"}`;
    }
    if (role === "admin") {
      return "/settings";
    }
    if (role === "patient") {
      return `/track/${tokenNumber || "GEN-103"}`;
    }
    return "/receptionist";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login({ email, password, role: selectedRole });
      const role = res.user?.role || selectedRole;
      const docId = res.user?.doctorId;

      showToast({
        title: "Signed In Successfully",
        message: `Welcome back, ${res.user?.name || "Staff Member"}!`,
        type: "success"
      });

      navigate(destinationPath(role, docId));
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    }
  };

  const handleQuickDemo = (profileKey) => {
    const profile = loginDemo(profileKey);
    showToast({
      title: "Demo Mode Active",
      message: `Signed in as Demo ${profile.role.toUpperCase()} (${profile.name})`,
      type: "info"
    });
    navigate(destinationPath(profile.role, profile.doctorId, profile.tokenNumber));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition">
              <Activity className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Portal Login</h2>
          <p className="text-xs text-slate-600 mt-1">
            Sign in to access your MediQ hospital or clinic workspace
          </p>
        </div>

        {/* Hackathon Demo Notice & Instant 1-Click Access */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-2.5">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Hackathon Demonstration Sandbox</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono uppercase">
              Demo Access
            </span>
          </div>

          <div className="p-2 bg-white/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 font-medium leading-relaxed">
            ⚠️ <strong>Notice for Reviewers:</strong> Demo access provides instant role switching for evaluation and must not be mistaken for secure production authentication. Production deployments enforce Supabase Auth.
          </div>

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleQuickDemo("receptionist")}
              className="w-full px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Receptionist: Pooja Verma (MediQ Care Centre)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("doctor_sharma")}
              className="w-full px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Doctor 1: Dr. Sharma — General Physician (Cabin 102)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("doctor_mehta")}
              className="w-full px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Doctor 2: Dr. Mehta — Dermatologist (Cabin 105)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("patient")}
              className="w-full px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-teal-700" />
                <span>Demo Patient: Amit Kumar (Pass: GEN-103)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="w-full px-3 py-2 bg-white hover:bg-amber-100/60 border border-amber-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>Demo Administrator: Dr. Arvind Swaminathan (Reset Controls)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-slate-600 font-semibold">Or Sign in with Credentials</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("receptionist");
                  setEmail("reception@mediq.health");
                }}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  selectedRole === "receptionist"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Reception
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("doctor");
                  setEmail("doctor.sharma@mediq.health");
                }}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  selectedRole === "doctor"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setEmail("admin@mediq.health");
                }}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  selectedRole === "admin"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Workspace"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
          Need a new hospital staff account?{" "}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-800 underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
