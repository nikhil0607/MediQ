import React from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Volume2
} from "lucide-react";

export function NotificationHistoryDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case "urgent":
        return <Volume2 className="w-4 h-4 text-amber-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "delay":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "resume":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "info":
      default:
        return <Bell className="w-4 h-4 text-teal-600" />;
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case "urgent":
        return "bg-amber-100 border-amber-200 text-amber-900";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "delay":
        return "bg-orange-50 border-orange-200 text-orange-900";
      case "resume":
        return "bg-emerald-50 border-emerald-200 text-emerald-900";
      case "info":
      default:
        return "bg-teal-50 border-teal-200 text-teal-900";
    }
  };

  const formatTimestamp = (iso) => {
    if (!iso) return "Just now";
    try {
      const d = new Date(iso);
      const diffSecs = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSecs < 60) return "Just now";
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Notification History</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Live alerts sent to this device</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Mark all read & Clear */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>

            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">No Notifications Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  You will receive real-time alerts when 5 or 2 patients remain, when your turn is approaching, or when the doctor calls you.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                className={`p-3.5 rounded-2xl transition cursor-pointer border ${
                  notif.read
                    ? "bg-white border-transparent hover:bg-slate-50 opacity-80"
                    : "bg-teal-50/40 border-teal-100/80 hover:bg-teal-50/70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${getBadgeClass(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0 font-medium">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-600">
          MediQ Smart Queue Alert System • In-App & Web Push
        </div>
      </div>
    </div>
  );
}
