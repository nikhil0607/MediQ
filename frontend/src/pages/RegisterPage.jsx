import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Activity,
  UserPlus,
  Mail,
  Lock,
  User,
  Stethoscope,
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle
} from "lucide-react";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginDemo } = useAuth();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    specialization: "General Medicine",
    cabinNumber: "Cabin 105"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await register(formData);

      showToast({
        title: "Account Created",
        message: `Welcome to MediQ, ${formData.name}!`,
        type: "success"
      });

      // Redirect based on registered role
      if (formData.role === "receptionist") {
        navigate("/receptionist");
      } else if (formData.role === "doctor") {
        navigate(`/doctor/${res.user?.doctorId || "doc-1"}`);
      } else {
        navigate("/settings");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (profileKey, targetPath) => {
    loginDemo(profileKey);
    showToast({
      title: "Demo Mode Active",
      message: "Signed in via Hackathon Sandbox Profile",
      type: "info"
    });
    navigate(targetPath);
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
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Staff Account</h2>
          <p className="text-xs text-slate-600 mt-1">
            Join your hospital or clinic team on the MediQ queue platform
          </p>
        </div>

        {/* Hackathon Demo Notice */}
        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950 text-xs">
          <div className="flex items-center justify-between font-bold mb-1">
            <span className="flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Hackathon Evaluator Sandbox</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 uppercase font-mono">
              Demo Access
            </span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
            Demo access must not be mistaken for secure production authentication. You can test instant 1-click accounts or register a custom staff profile below.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemo("receptionist", "/receptionist")}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 font-semibold text-[11px] text-amber-900 transition"
            >
              Demo Receptionist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("doctor_jenkins", "/doctor/doc-1")}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 font-semibold text-[11px] text-amber-900 transition"
            >
              Demo Doctor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("admin", "/settings")}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 font-semibold text-[11px] text-amber-900 transition"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Your Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "receptionist" })}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  formData.role === "receptionist"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "doctor" })}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  formData.role === "doctor"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "admin" })}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  formData.role === "admin"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder={formData.role === "doctor" ? "e.g. Dr. Ananya Sharma" : "e.g. Maya Lin"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@hospital.health"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Doctor specific fields */}
          {formData.role === "doctor" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cabin Room #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cabin 201"
                  value={formData.cabinNumber}
                  onChange={(e) => setFormData({ ...formData, cabinNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Creating Staff Account..." : "Create Account & Get Started"}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
