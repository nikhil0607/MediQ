import React, { useState, useEffect } from "react";
import { useQueue } from "../context/QueueContext";
import { sounds } from "../utils/audio";
import {
  Tv,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Activity,
  Clock,
  Sparkles,
  MapPin,
  Stethoscope
} from "lucide-react";

export function PublicQueueDisplayPage() {
  const { doctors, tokens, isConnected } = useQueue();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioAnnounce, setAudioAnnounce] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500">
      {/* Top TV Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Medi<span className="text-teal-400">Q</span> Live Display</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Broadcast
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Central Waiting Hall & Triage Display</p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-black font-mono tracking-tight text-teal-300">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-xs text-slate-400">
              {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAudioAnnounce(!audioAnnounce);
                if (!audioAnnounce) sounds.playCallChime();
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Toggle Audio"
            >
              {audioAnnounce ? <Volume2 className="w-5 h-5 text-teal-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Doctor Cabin Big Display Cards */}
      <main className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
        {doctors.map((doc) => {
          const docTokens = tokens.filter((t) => t.doctorId === doc.id);
          const activeToken = docTokens.find((t) => t.status === "CALLING" || t.status === "IN_CONSULTATION");
          const isCalling = activeToken?.status === "CALLING";
          const waitingCount = docTokens.filter((t) => t.status === "WAITING").length;

          return (
            <div
              key={doc.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                isCalling
                  ? "bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/50 shadow-2xl shadow-amber-500/10 animate-pulse-subtle"
                  : activeToken
                  ? "bg-slate-900/90 border-teal-500/50 shadow-xl"
                  : "bg-slate-900/40 border-slate-800"
              }`}
            >
              <div>
                {/* Cabin Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                    {doc.cabinNumber}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      isCalling
                        ? "bg-amber-500 text-slate-950 animate-bounce"
                        : activeToken
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isCalling ? "CALLING NOW" : activeToken ? "SERVING" : "AVAILABLE"}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-base text-white truncate">{doc.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{doc.departmentName || doc.specialization}</p>
                </div>

                {/* Giant Serving Token Display */}
                <div className="my-6 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-1">
                    Serving Token
                  </div>
                  {activeToken ? (
                    <div className="inline-block bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-3 shadow-inner">
                      <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                        {activeToken.tokenNumber}
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-600 font-mono py-3">
                      — Ready —
                    </div>
                  )}

                  {activeToken && (
                    <div className="text-sm font-bold text-slate-200 mt-2 truncate">
                      {activeToken.patientName}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Cabin Footer: Waiting Count */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">In Line:</span>
                <span className="font-mono font-bold text-teal-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  {waitingCount} waiting
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Live Ticker */}
      <footer className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 flex items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">Notice:</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap text-slate-300 font-medium">
          Scan your token QR code to track queue status on your smartphone • Feel free to wait in the cafeteria • You will receive audio announcements when called.
        </div>
        <div className="shrink-0 text-slate-500 font-mono text-[11px] hidden sm:block">
          MediQ Queue Engine v1.0
        </div>
      </footer>
    </div>
  );
}

