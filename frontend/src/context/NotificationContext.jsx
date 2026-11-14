import React, { createContext, useContext, useState, useCallback } from "react";
import { sounds } from "../utils/audio";
import { Bell, CheckCircle, AlertTriangle, Info, X } from "lucide-react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 4500, sound = false }) => {
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

      if (sound === "call") {
        sounds.playCallChime();
        sounds.vibrate([200, 100, 300]);
      } else if (sound === "notice") {
        sounds.playNotice();
      }

      setToasts((prev) => [...prev, { id, title, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <NotificationContext.Provider value={{ showToast, playCallChime: () => sounds.playCallChime(), playNotice: () => sounds.playNotice() }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                : toast.type === "error"
                ? "bg-rose-50/95 border-rose-200 text-rose-900"
                : toast.type === "warning"
                ? "bg-amber-50/95 border-amber-200 text-amber-900"
                : "bg-slate-900/95 border-slate-700 text-white"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600" />}
              {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-teal-400" />}
            </div>
            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              <div className={toast.title ? "opacity-90 text-xs mt-0.5" : ""}>{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
}

