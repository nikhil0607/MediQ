import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQueue } from "../context/QueueContext";
import { sounds } from "../utils/audio";
import {
  Activity,
  Clock,
  Users,
  MapPin,
  Stethoscope,
  Bell,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Share2,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight
} from "lucide-react";

export function PatientTrackPage() {
  const { tokenId } = useParams();
  const { tokens, isConnected, refresh } = useQueue();
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const previousStatusRef = useRef(null);

  // Find token from real-time context
  useEffect(() => {
    if (!tokenId) return;
    const found = tokens.find(
      (t) => t.id === tokenId || t.tokenNumber.toUpperCase() === tokenId.toUpperCase()
    );
    if (found) {
      // Check if status changed to CALLING
      if (previousStatusRef.current && previousStatusRef.current !== found.status) {
        if (found.status === "CALLING") {
          sounds.playCallChime();
          sounds.vibrate([300, 150, 300, 150, 500]);
        } else if (found.status === "IN_CONSULTATION") {
          sounds.playNotice();
        }
      }
      previousStatusRef.current = found.status;
      setToken(found);
    }
  }, [tokens, tokenId]);

  // Initial single fetch fallback if not in list yet
  useEffect(() => {
    if (!token && tokenId) {
      fetch(`/api/queue/tokens/${tokenId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setToken(data.data);
            previousStatusRef.current = data.data.status;
          }
        })
        .catch(() => {});
    }
  }, [tokenId, token]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestChime = () => {
    sounds.playCallChime();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Locating Your Queue Pass...</h2>
          <p className="text-xs text-slate-500 mt-2">Connecting to hospital queue stream</p>
          <div className="mt-6">
            <Link
              to="/"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 underline"
            >
              Return to MediQ Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCalling = token.status === "CALLING";
  const isConsulting = token.status === "IN_CONSULTATION";
  const isCompleted = token.status === "COMPLETED";
  const isCancelled = token.status === "CANCELLED";
  const isNoShow = token.status === "NO_SHOW";
  const isDelayed = Boolean(token.doctor?.currentDelayMins > 0 || token.eta?.isDelayed);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-16 flex flex-col items-center">
      {/* Mobile-First Header */}
      <div className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">Medi<span className="text-teal-600">Q</span> Pass</span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestChime}
              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-50 transition"
              title="Test Chime Sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-50 transition"
              title="Share or Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-md px-4 pt-5 space-y-4">
        {/* Calling Alert Banner (When turn arrives!) */}
        {isCalling && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-xl shadow-amber-500/25 animate-bounce-subtle space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              <Bell className="w-3.5 h-3.5 animate-spin" />
              <span>It's Your Turn Now!</span>
            </div>
            <h2 className="text-2xl font-black">
              Please Proceed to {token.doctor?.cabinNumber || "Cabin"}
            </h2>
            <p className="text-xs text-amber-100">
              {token.doctor?.name} is ready to see you. Please step forward to the room door.
            </p>
          </div>
        )}

        {/* Doctor Delay Alert Banner */}
        {isDelayed && !isCompleted && !isConsulting && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Doctor Schedule Update (+{token.eta?.delayMinutes || token.doctor?.currentDelayMins} mins)
              </div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                {token.doctor?.name} is slightly delayed due to {token.doctor?.delayReason || "an extended patient procedure"}. Your estimated waiting time has been dynamically adjusted.
              </p>
            </div>
          </div>
        )}

        {/* Main Digital Token Pass Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl shadow-slate-200/60 relative overflow-hidden">
          {/* Top Token Header */}
          <div className="text-center space-y-2 pb-5 border-b border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-600">
              {token.department?.name || "Clinic Consultation"}
            </div>

            {/* Giant Token Number */}
            <div className="py-2">
              <div className="inline-block bg-teal-50 border-2 border-teal-500/30 rounded-3xl px-8 py-3.5 shadow-inner">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-teal-700 font-mono">
                  {token.tokenNumber}
                </span>
              </div>
            </div>

            <div className="text-base font-bold text-slate-900">
              {token.patientName}
            </div>

            {/* Live Status Pill */}
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isCalling
                    ? "bg-amber-100 text-amber-800 animate-pulse ring-2 ring-amber-300"
                    : isConsulting
                    ? "bg-teal-100 text-teal-800 ring-2 ring-teal-300"
                    : isCompleted
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCalling
                      ? "bg-amber-500 animate-ping"
                      : isConsulting
                      ? "bg-teal-500 animate-pulse"
                      : isCompleted
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }`}
                />
                <span>{token.status.replace("_", " ")}</span>
              </span>
            </div>
          </div>

          {/* Core Queue Metrics (Wait Time, Ahead, Serving) */}
          <div className="grid grid-cols-3 gap-2 py-5 border-b border-slate-100 text-center">
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-center gap-0.5">
                <Clock className="w-3 h-3 text-slate-600" /> Wait
              </div>
              <div className="text-lg font-black text-teal-700 font-mono mt-1">
                {isCompleted ? "0m" : isConsulting ? "Inside" : `~${token.eta?.estimatedWaitMinutes || 12}m`}
              </div>
              <div className="text-[10px] text-slate-600">Est. Time</div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-600 uppercase flex items-center justify-center gap-0.5">
                <Users className="w-3 h-3 text-slate-600" /> Ahead
              </div>
              <div className="text-lg font-black text-slate-900 font-mono mt-1">
                {isCompleted || isConsulting ? "0" : token.eta?.patientsAhead || 0}
              </div>
              <div className="text-[10px] text-slate-600">Patients</div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-600 uppercase">
                Serving
              </div>
              <div className="text-lg font-black text-slate-900 font-mono mt-1">
                {token.eta?.currentServingToken || "—"}
              </div>
              <div className="text-[10px] text-slate-600">Token Now</div>
            </div>
          </div>

          {/* Doctor & Location Info */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-teal-50/60 rounded-2xl border border-teal-100/80">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {token.doctor?.name || "Consulting Physician"}
                </div>
                <div className="text-[11px] text-teal-700 font-medium truncate">
                  {token.doctor?.specialization || "General Medicine"}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-semibold text-slate-600 uppercase">Room</div>
                <div className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-teal-200 font-mono">
                  {token.doctor?.cabinNumber || "Cabin 101"}
                </div>
              </div>
            </div>
          </div>

          {/* Step Progress Tracker */}
          <div className="pt-6">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3">
              Consultation Journey
            </div>
            <div className="relative flex items-center justify-between text-center text-[10px] font-semibold">
              <div className="flex flex-col items-center flex-1">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center mb-1 text-[11px]">
                  ✓
                </div>
                <span className="text-slate-800">Registered</span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] ${
                    isCalling || isConsulting || isCompleted
                      ? "bg-teal-600 text-white"
                      : "bg-teal-100 text-teal-800 ring-2 ring-teal-400"
                  }`}
                >
                  {isCalling || isConsulting || isCompleted ? "✓" : "2"}
                </div>
                <span className="text-slate-800">In Queue</span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] ${
                    isConsulting || isCompleted
                      ? "bg-teal-600 text-white"
                      : isCalling
                      ? "bg-amber-500 text-white animate-bounce"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isConsulting || isCompleted ? "✓" : "3"}
                </div>
                <span className={isCalling ? "text-amber-800 font-bold" : "text-slate-600"}>
                  Called
                </span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] ${
                    isCompleted
                      ? "bg-teal-600 text-white"
                      : isConsulting
                      ? "bg-teal-600 text-white animate-pulse"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : "4"}
                </div>
                <span className={isConsulting ? "text-teal-800 font-bold" : "text-slate-600"}>
                  In Cabin
                </span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-[11px] ${
                    isCompleted ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : "5"}
                </div>
                <span className={isCompleted ? "text-emerald-800 font-bold" : "text-slate-600"}>
                  Done
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Relaxation & Freedom Tip */}
        <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-3 shadow-xs">
          <Coffee className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-800">You do not need to wait in the crowded hallway:</strong> Feel free to visit the hospital café, garden, or cafeteria. Your phone screen updates in real time and will chime when called.
          </div>
        </div>
      </main>
    </div>
  );
}

