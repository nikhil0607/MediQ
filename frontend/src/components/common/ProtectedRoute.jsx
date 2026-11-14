import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs font-semibold text-slate-500 animate-pulse">
          Authenticating MediQ Session...
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles required and user's role does not match
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== "admin") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Role Access Restricted</h2>
            <p className="text-xs text-slate-600 mt-1">
              You are signed in as <strong className="capitalize text-slate-900">{user.role}</strong> ({user.name}).
              This section is restricted to <strong className="text-slate-900">{allowedRoles.join(" or ")}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              to={user.role === "doctor" ? `/doctor/${user.doctorId || "doc-1"}` : "/receptionist"}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition shadow-xs"
            >
              Go to Your {user.role === "doctor" ? "Doctor Cabin" : "Reception Desk"}
            </Link>
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Switch Account / Role
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
