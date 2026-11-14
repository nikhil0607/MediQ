import React from "react";
import { AlertTriangle, HelpCircle, CheckCircle, X } from "lucide-react";

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // "warning" | "danger" | "info" | "success"
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      btnBg: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    danger: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-800",
      icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
      btnBg: "bg-rose-600 hover:bg-rose-700 text-white"
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white"
    },
    info: {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-800",
      icon: <HelpCircle className="w-6 h-6 text-teal-600" />,
      btnBg: "bg-teal-600 hover:bg-teal-700 text-white"
    }
  };

  const current = typeConfig[type] || typeConfig.warning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl ${current.bg} border ${current.border} flex items-center justify-center shrink-0`}>
            {current.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer ${current.btnBg} disabled:opacity-50`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
