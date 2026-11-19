import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { sounds } from "../utils/audio";
import { NotificationHistoryDrawer } from "../components/queue/NotificationHistoryDrawer";
import {
  Activity,
  Clock,
  Users,
  MapPin,
  Stethoscope,
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Check,
  RefreshCw,
  Building,
  Calendar,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  BellRing,
  CheckCheck
} from "lucide-react";

export function PatientTrackPage() {
  const { tokenId } = useParams();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);
  const [browserPermission, setBrowserPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );

  const prevStatusRef = useRef(null);
  const prevEtaRef = useRef(null);
  const wasPausedRef = useRef(null);
  const firedKeysRef = useRef(new Set());
  const eventSourceRef = useRef(null);

  // Load existing notifications and fired keys from localStorage
  useEffect(() => {
    if (!tokenId) return;
    try {
      const storedNotifs = localStorage.getItem(`mediq_notifs_${tokenId}`);
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      }
      const storedKeys = localStorage.getItem(`mediq_fired_${tokenId}`);
      if (storedKeys) {
        firedKeysRef.current = new Set(JSON.parse(storedKeys));
      }
    } catch (e) {
      console.warn("Error restoring notification history:", e);
    }
  }, [tokenId]);

  // Save notifications to localStorage when updated
  const saveNotifications = useCallback(
    (newNotifs) => {
      setNotifications(newNotifs);
      if (tokenId) {
        try {
          localStorage.setItem(`mediq_notifs_${tokenId}`, JSON.stringify(newNotifs));
        } catch (e) {}
      }
    },
    [tokenId]
  );

  // Dispatch a Smart Notification (with deduplication)
  const dispatchSmartNotification = useCallback(
    ({ eventKey, title, message, type }) => {
      if (!eventKey || firedKeysRef.current.has(eventKey)) {
        return; // Already fired! Prevent duplicate notifications.
      }

      // Mark as fired
      firedKeysRef.current.add(eventKey);
      if (tokenId) {
        try {
          localStorage.setItem(
            `mediq_fired_${tokenId}`,
            JSON.stringify(Array.from(firedKeysRef.current))
          );
        } catch (e) {}
      }

      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        eventKey,
        title,
        message,
        type, // "urgent" | "warning" | "info" | "delay" | "resume"
        timestamp: new Date().toISOString(),
        read: false
      };

      // Add to notifications
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        if (tokenId) {
          try {
            localStorage.setItem(`mediq_notifs_${tokenId}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });

      // Show temporary floating in-app banner
      setActiveBanner(newNotif);
      setTimeout(() => {
        setActiveBanner((current) => (current?.id === newNotif.id ? null : current));
      }, 7000);

      // Play audio chime
      if (audioEnabled) {
        if (type === "urgent") {
          sounds.playCallChime();
          sounds.vibrate([300, 150, 300, 150, 500]);
        } else {
          sounds.playNotice();
          sounds.vibrate([200, 100, 200]);
        }
      }

      // Web Browser Notification if permission granted
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, {
            body: message,
            icon: "/favicon.ico"
          });
        } catch (err) {
          console.warn("Browser notification dispatch failed:", err);
        }
      }
    },
    [tokenId, audioEnabled]
  );

  // Request browser notification permission explicitly
  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Web browser notifications are not supported on this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === "granted") {
        new Notification("MediQ Alerts Enabled", {
          body: "You will receive real-time queue notifications directly on your screen.",
          icon: "/favicon.ico"
        });
      }
    } catch (e) {
      console.warn("Notification request error:", e);
    }
  };

  // Process smart notification rules on queue state change
  const processNotificationTriggers = useCallback(
    (data) => {
      if (!data || !data.tokenNumber) return;

      const isCompleted = data.status === "COMPLETED" || data.queueStatus === "Completed";
      const isConsulting = data.status === "IN_CONSULTATION" || data.queueStatus === "Consulting";
      const isCalling = data.status === "CALLING" || data.status === "CALLED" || data.queueStatus === "Next in Line";
      const patientsAhead = data.eta?.patientsAhead ?? 0;
      const docName = data.doctor?.name || "the Doctor";
      const cabinNum = data.doctor?.cabinNumber || "assigned cabin";
      const delayMins = data.doctor?.currentDelayMins || data.eta?.delayMinutes || 0;
      const isPaused = Boolean(data.doctor?.isPaused);

      // Rule 1: 5 patients ahead
      if (!isCompleted && !isConsulting && !isCalling && patientsAhead === 5) {
        dispatchSmartNotification({
          eventKey: `5_ahead_${data.tokenNumber}`,
          title: "5 Patients Ahead",
          message: `There are 5 patients ahead in ${docName}'s queue. Estimated wait is ${data.eta?.formattedRange || "approaching"}.`,
          type: "info"
        });
      }

      // Rule 2: 2 patients ahead
      if (!isCompleted && !isConsulting && !isCalling && patientsAhead === 2) {
        dispatchSmartNotification({
          eventKey: `2_ahead_${data.tokenNumber}`,
          title: "2 Patients Ahead",
          message: `Your turn is approaching! Only 2 patients ahead of you. Please stay close to ${cabinNum}.`,
          type: "info"
        });
      }

      // Rule 3: Your turn is approaching (1 patient ahead or "Almost Your Turn")
      if (!isCompleted && !isConsulting && !isCalling && (patientsAhead === 1 || data.queueStatus === "Almost Your Turn")) {
        dispatchSmartNotification({
          eventKey: `approaching_${data.tokenNumber}`,
          title: "Your Turn is Approaching",
          message: `Only 1 patient remains ahead. Please move toward ${cabinNum}.`,
          type: "warning"
        });
      }

      // Rule 4: You are next (0 patients ahead in waiting status)
      if (!isCompleted && !isConsulting && !isCalling && data.status === "WAITING" && (patientsAhead === 0 || data.queueStatus === "Next in Line")) {
        dispatchSmartNotification({
          eventKey: `you_are_next_${data.tokenNumber}`,
          title: "You Are Next",
          message: `You are next in line! You will be called into ${cabinNum} momentarily.`,
          type: "warning"
        });
      }

      // Rule 5: Your turn has arrived (Status is CALLING / CALLED)
      if (isCalling) {
        dispatchSmartNotification({
          eventKey: `turn_arrived_${data.tokenNumber}_${data.calledAt || "calling"}`,
          title: "Your Turn Has Arrived!",
          message: `Please proceed immediately to ${cabinNum}. ${docName} is ready for your consultation.`,
          type: "urgent"
        });
      }

      // Rule 6: Doctor is delayed
      if (!isCompleted && !isConsulting && delayMins > 0) {
        dispatchSmartNotification({
          eventKey: `delay_${data.tokenNumber}_${delayMins}`,
          title: `Doctor Delayed (+${delayMins}m)`,
          message: `${docName} has announced a ${delayMins}-minute schedule delay (${data.doctor?.delayReason || "Extended Procedure"}). Your ETA has been updated.`,
          type: "delay"
        });
      }

      // Rule 7: Queue has resumed
      if (wasPausedRef.current === true && !isPaused) {
        dispatchSmartNotification({
          eventKey: `resumed_${data.tokenNumber}_${Date.now()}`,
          title: "Queue Has Resumed",
          message: `${docName}'s consultation room has resumed calling patients.`,
          type: "resume"
        });
      }

      // Record paused state for transition detection
      wasPausedRef.current = isPaused;
    },
    [dispatchSmartNotification]
  );

  // Fetch verified public queue pass from server (strictly privacy-safe)
  const fetchPass = useCallback(
    async (isSilent = false) => {
      if (!tokenId) return;
      if (!isSilent) setLoading(true);

      try {
        let res;
        try {
          res = await api.getPublicPass(tokenId);
        } catch (e) {
          res = await api.getTokenById(tokenId);
        }

        if (res && res.success && res.data) {
          const data = res.data;

          // Process all 7 Smart Notification Rules
          processNotificationTriggers(data);

          prevStatusRef.current = data.status;
          prevEtaRef.current = data.eta;
          setPass(data);
          setError("");
          setLastUpdated(new Date());
        } else {
          setError(res?.message || "Queue pass not found or expired.");
        }
      } catch (err) {
        console.warn("Pass fetch notice:", err);
        if (!isSilent) {
          setError("Invalid or expired queue pass identifier.");
        }
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [tokenId, processNotificationTriggers]
  );

  // Initial load
  useEffect(() => {
    fetchPass();
  }, [fetchPass]);

  // Real-time synchronization: Supabase Realtime + Reactive SSE Stream
  useEffect(() => {
    if (!tokenId) return;

    // 1. Supabase Realtime Subscription (if configured)
    let supabaseChannel = null;
    if (isSupabaseConfigured && supabase) {
      try {
        supabaseChannel = supabase
          .channel(`public-pass-${tokenId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "tokens" },
            () => {
              fetchPass(true);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsLiveConnected(true);
            }
          });
      } catch (e) {
        console.warn("Supabase Realtime setup warning:", e);
      }
    }

    // 2. Reactive SSE Stream fallback (guarantees live sync on local or non-Supabase setups)
    const eventsUrl = import.meta.env.VITE_EVENTS_URL || "/events";
    let es = null;

    try {
      es = new EventSource(eventsUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsLiveConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && payload.event) {
            fetchPass(true);
          }
        } catch {
          // ignore keepalive parse error
        }
      };

      es.onerror = () => {
        if (!supabaseChannel) {
          setIsLiveConnected(false);
        }
      };
    } catch (err) {
      console.warn("SSE connection error:", err);
    }

    // Polling safety fallback every 6 seconds to ensure ETA stays accurate
    const pollInterval = setInterval(() => {
      fetchPass(true);
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
      if (supabaseChannel && supabase) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [tokenId, fetchPass]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestChime = () => {
    sounds.playCallChime();
    sounds.vibrate([200, 100, 200]);
  };

  const handleMarkAsRead = (notifId) => {
    const updated = notifications.map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  // Format registration time nicely
  const formatTime = (isoString) => {
    if (!isoString) return "Today";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Today";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // If loading initially
  if (loading && !pass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Locating Queue Pass...</h2>
            <p className="text-xs text-slate-500 mt-1">Connecting to live hospital queue engine</p>
          </div>
        </div>
      </div>
    );
  }

  // If invalid or not found
  if (error || !pass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Queue Pass Not Found</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {error || "This queue pass identifier does not exist or has already expired."}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600">
            If you recently registered at the reception, please check your receipt or rescan the QR code.
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/scanner"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition"
            >
              Open QR Scanner
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Return to MediQ Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Compute status helpers
  const queueStatus = pass.queueStatus || "Waiting";
  const isCalling = pass.status === "CALLING" || pass.status === "CALLED" || queueStatus === "Next in Line";
  const isConsulting = pass.status === "IN_CONSULTATION" || pass.status === "CONSULTING" || queueStatus === "Consulting";
  const isCompleted = pass.status === "COMPLETED" || queueStatus === "Completed";
  const isSkipped = pass.status === "SKIPPED" || queueStatus === "Skipped";
  const isDelayed = Boolean(pass.doctor?.currentDelayMins > 0 || pass.eta?.isDelayed || queueStatus === "Delayed");
  const isAlmostTurn = queueStatus === "Almost Your Turn";
  const isRegistered = queueStatus === "Registered";

  // Status Badge Configuration matching the 8 possible states
  const getStatusBadgeConfig = () => {
    switch (queueStatus) {
      case "Completed":
        return {
          bg: "bg-emerald-50 border-emerald-300 text-emerald-800",
          dot: "bg-emerald-500",
          label: "Consultation Completed",
          sub: "Thank you for visiting today"
        };
      case "Consulting":
        return {
          bg: "bg-teal-50 border-teal-300 text-teal-800 ring-2 ring-teal-400/20",
          dot: "bg-teal-500 animate-pulse",
          label: "Inside Doctor Cabin",
          sub: "Consultation in progress"
        };
      case "Next in Line":
        return {
          bg: "bg-amber-50 border-amber-300 text-amber-900 ring-4 ring-amber-400/30 animate-pulse",
          dot: "bg-amber-500 animate-ping",
          label: "It's Your Turn! Next in Line",
          sub: `Please proceed to ${pass.doctor?.cabinNumber || "Cabin"}`
        };
      case "Almost Your Turn":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800 ring-2 ring-amber-300/30",
          dot: "bg-amber-500 animate-pulse",
          label: "Almost Your Turn",
          sub: "Please stay near your assigned cabin"
        };
      case "Delayed":
        return {
          bg: "bg-orange-50 border-orange-300 text-orange-900",
          dot: "bg-orange-500",
          label: "Doctor Schedule Delayed",
          sub: `+${pass.doctor?.currentDelayMins || pass.eta?.delayMinutes || 15}m added to estimated time`
        };
      case "Skipped":
        return {
          bg: "bg-rose-50 border-rose-300 text-rose-800",
          dot: "bg-rose-500",
          label: "Patient Pass Skipped",
          sub: "Please visit reception to recall your token"
        };
      case "Registered":
        return {
          bg: "bg-sky-50 border-sky-300 text-sky-800",
          dot: "bg-sky-500",
          label: "Checked In & Registered",
          sub: "Assigned in queue order"
        };
      case "Waiting":
      default:
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-800",
          dot: "bg-blue-500 animate-pulse",
          label: "Waiting in Queue",
          sub: "Monitoring live doctor room progress"
        };
    }
  };

  const statusConfig = getStatusBadgeConfig();

  // Progress Stepper calculation (6 milestone stages)
  const getProgressStageIndex = () => {
    if (isCompleted) return 5;
    if (isConsulting) return 4;
    if (isCalling) return 3;
    if (isAlmostTurn) return 2;
    if (isRegistered) return 0;
    return 1; // Waiting
  };

  const currentStageIndex = getProgressStageIndex();

  const progressSteps = [
    { label: "Registered", key: "reg" },
    { label: "Waiting", key: "wait" },
    { label: "Almost Turn", key: "almost" },
    { label: "Calling", key: "call" },
    { label: "Consulting", key: "consult" },
    { label: "Completed", key: "done" }
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-16 flex flex-col items-center">
      {/* Mobile-First Header with MediQ Branding */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  Medi<span className="text-teal-600">Q</span>
                </span>
                <span className="text-[9px] font-bold uppercase bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                  Pass
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{isLiveConnected ? "Live Sync Active" : "Connecting stream..."}</span>
              </div>
            </div>
          </div>

          {/* Smart Notification Drawer Button, Audio Chime & Share Controls */}
          <div className="flex items-center gap-1.5">
            {/* Notification Center Trigger with Unread Count Badge */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="View Notification History"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                audioEnabled
                  ? "bg-teal-50 text-teal-700 border-teal-200"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
              title={audioEnabled ? "Hospital Chime: Enabled" : "Hospital Chime: Muted"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Share or Copy Pass Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Active Smart Alert Banner */}
      {activeBanner && (
        <div className="w-full max-w-md px-4 pt-3 animate-slide-down">
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-start justify-between gap-3 border border-slate-800">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>{activeBanner.title}</span>
                  <span className="text-[10px] text-teal-300 bg-teal-900/60 px-1.5 py-0.2 rounded font-normal">
                    Now
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {activeBanner.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveBanner(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="w-full max-w-md px-4 pt-4 space-y-4">
        {/* Browser Notification Permission Pill / Request Box */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <div className="truncate text-slate-700">
              {browserPermission === "granted" ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                  Browser Push Alerts Active
                </span>
              ) : browserPermission === "denied" ? (
                <span className="text-slate-500">
                  Browser Push Alerts: Blocked in Settings
                </span>
              ) : browserPermission === "unsupported" ? (
                <span className="text-slate-500">
                  Browser Alerts not supported on this browser
                </span>
              ) : (
                <span className="text-slate-700">
                  Get notified when your turn approaches
                </span>
              )}
            </div>
          </div>

          {browserPermission === "default" && (
            <button
              onClick={requestBrowserPermission}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition shrink-0 cursor-pointer"
            >
              Enable Alerts
            </button>
          )}
        </div>

        {/* Calling Alert Banner (When turn arrives!) */}
        {isCalling && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white p-5 rounded-3xl shadow-xl shadow-amber-500/25 animate-bounce-subtle space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              <Bell className="w-3.5 h-3.5 animate-spin" />
              <span>It's Your Turn Now!</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Please Proceed to {pass.doctor?.cabinNumber || "Cabin"}
            </h2>
            <p className="text-xs text-amber-100 leading-relaxed max-w-xs mx-auto">
              {pass.doctor?.name} is ready for consultation. Please step inside cabin room {pass.doctor?.cabinNumber}.
            </p>
          </div>
        )}

        {/* Doctor Delay Alert Banner */}
        {isDelayed && !isCompleted && !isConsulting && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Doctor Schedule Update (+{pass.doctor?.currentDelayMins || pass.eta?.delayMinutes} mins)
              </div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                {pass.doctor?.name} has announced a slight delay due to {pass.doctor?.delayReason || "an extended clinical procedure"}. Your estimated waiting time has been recalculated automatically.
              </p>
            </div>
          </div>
        )}

        {/* Skipped Notice Banner */}
        {isSkipped && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-950">
                Patient Token Skipped
              </div>
              <p className="mt-0.5 text-rose-800 leading-relaxed">
                You were temporarily marked as away when called. Please visit the reception desk to have your token recalled and restored to the active queue.
              </p>
            </div>
          </div>
        )}

        {/* Main Digital Token Pass Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl shadow-slate-200/60 relative overflow-hidden space-y-5">
          {/* Clinic Name & Department */}
          <div className="text-center space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-600" />
              <span>{pass.clinicName || "MediQ Multi-Specialty Hospital"}</span>
            </div>
            <div className="text-xs font-semibold text-teal-700">
              {pass.department?.name || "Consultation Clinic"} • {pass.department?.floor || "Wing A"}
            </div>
          </div>

          {/* Giant Prominent Token Number */}
          <div className="text-center py-1">
            <div className="inline-block bg-teal-50/70 border-2 border-teal-500/40 rounded-3xl px-8 py-3.5 shadow-inner">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-teal-700 font-mono">
                {pass.tokenNumber}
              </span>
            </div>

            {/* Masked Patient Display Name (Privacy Protected) */}
            <div className="text-base font-bold text-slate-900 mt-3">
              {pass.patientName || "Patient Pass"}
            </div>

            <div className="text-xs text-slate-500">
              {pass.appointmentType || "General Consultation"}
            </div>
          </div>

          {/* Prominent Live Queue Status Pill */}
          <div className="text-center">
            <div className={`inline-flex flex-col items-center px-4 py-2 rounded-2xl border ${statusConfig.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {statusConfig.label}
                </span>
              </div>
              <span className="text-[11px] opacity-85 mt-0.5 font-medium">
                {statusConfig.sub}
              </span>
            </div>
          </div>

          {/* Core Live Queue Metrics (Wait Time, Ahead, Serving Now) */}
          <div className="grid grid-cols-3 gap-2 py-2 text-center border-t border-b border-slate-100">
            {/* Metric 1: Estimated Wait Time */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-teal-600" /> Wait
              </div>
              <div className="text-lg sm:text-xl font-black text-teal-700 font-mono mt-1">
                {isCompleted ? "0m" : isConsulting ? "Inside" : pass.eta?.minWaitMinutes ? `${pass.eta.minWaitMinutes}–${pass.eta.maxWaitMinutes}m` : `~${pass.eta?.estimatedWaitMinutes ?? 12}m`}
              </div>
              <div className="text-[10px] text-slate-500">
                {isDelayed ? "Delay Adj." : "Est. Range"}
              </div>
            </div>

            {/* Metric 2: Patients Ahead */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-slate-500" /> Ahead
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {isCompleted || isConsulting ? "0" : pass.eta?.patientsAhead ?? 0}
              </div>
              <div className="text-[10px] text-slate-500">
                {pass.eta?.patientsAhead === 1 ? "Next in turn" : "Patients"}
              </div>
            </div>

            {/* Metric 3: Currently Serving Token */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">
                Serving
              </div>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {pass.eta?.currentServingToken || "—"}
              </div>
              <div className="text-[10px] text-slate-500">Cabin Active</div>
            </div>
          </div>

          {/* Dynamic ETA Approximation Range Banner */}
          {!isCompleted && !isConsulting && (
            <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/80 text-center space-y-1">
              <div className="text-xs font-extrabold text-teal-900 flex items-center justify-center gap-1.5 flex-wrap">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span>ETA:</span>
                <span className="text-teal-800 bg-white px-2 py-0.5 rounded-lg border border-teal-200 font-mono">
                  {pass.eta?.formattedRange || `Approximately ${pass.eta?.estimatedWaitMinutes || 15} minutes`}
                </span>
              </div>
              <div className="text-[10px] text-teal-700 font-medium">
                Dynamic estimate based on doctor pace ({pass.eta?.doctorPace?.tAvg || pass.doctor?.avgConsultationMins || 12}m/patient) &amp; {pass.eta?.patientsAhead || 0} waiting ahead
              </div>
            </div>
          )}

          {/* Doctor & Room Card */}
          <div className="p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold text-slate-900 truncate">
                {pass.doctor?.name || "Consulting Physician"}
              </div>
              <div className="text-[11px] text-teal-700 font-medium truncate">
                {pass.doctor?.specialization || "General Medicine"}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Room</div>
              <div className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-teal-200 font-mono shadow-2xs">
                {pass.doctor?.cabinNumber || "Cabin"}
              </div>
            </div>
          </div>

          {/* Visual Queue Progress Indicator (Step Progression) */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Queue Journey</span>
              <span className="text-[10px] font-semibold text-slate-500 capitalize">
                Step {Math.min(currentStageIndex + 1, 6)} of 6
              </span>
            </div>

            {/* Multi-step progress bar */}
            <div className="grid grid-cols-6 gap-1 pt-1">
              {progressSteps.map((step, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                        isPassed
                          ? "bg-teal-600"
                          : isCurrent
                          ? "bg-teal-400 ring-2 ring-teal-300 animate-pulse"
                          : "bg-slate-200"
                      }`}
                    />
                    <span
                      className={`text-[9px] mt-1.5 truncate text-center ${
                        isCurrent
                          ? "font-extrabold text-teal-800"
                          : isPassed
                          ? "font-semibold text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Time & Privacy Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Registered at {formatTime(pass.registeredAt)}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Privacy Verified</span>
            </div>
          </div>
        </div>

        {/* Audio Test & Notification History Footer Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2.5">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-teal-600" />
              <span>Waiting Room Notifications ({notifications.length})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-[11px] text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
              >
                View History
              </button>
              <span>•</span>
              <button
                onClick={handleTestChime}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
              >
                Test Sound
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Keep this digital pass open on your phone. You will receive smart alerts when 5 or 2 patients remain, when your turn is approaching, or if the doctor experiences a delay.
          </p>
        </div>

        {/* Small timestamp */}
        <div className="text-center text-[10px] text-slate-600 flex items-center justify-center gap-1">
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Last sync: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </main>

      {/* Notification History Slide-Over Drawer */}
      <NotificationHistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
