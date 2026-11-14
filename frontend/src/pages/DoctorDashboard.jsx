import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueue } from "../context/QueueContext";
import { useAuth } from "../context/AuthContext";
import { DoctorDelayModal } from "../components/queue/DoctorDelayModal";
import {
  Stethoscope,
  Clock,
  UserCheck,
  Volume2,
  AlertTriangle,
  Play,
  CheckCircle2,
  UserX,
  Pause,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  Timer,
  ChevronRight,
  Activity,
  FileText
} from "lucide-react";

export function DoctorDashboard() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user, loginAs } = useAuth();
  const {
    doctors,
    tokens,
    callNext,
    startConsultation,
    finishConsultation,
    markNoShow,
    setDoctorDelay,
    toggleDoctorPause
  } = useQueue();

  const [showDelayModal, setShowDelayModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active doctor
  const currentDocId = doctorId || user.doctorId || doctors[0]?.id || "doc-1";
  const doctor = doctors.find((d) => d.id === currentDocId) || doctors[0];

  // Tokens for this doctor
  const docTokens = tokens.filter((t) => t.doctorId === doctor?.id);
  const inConsultationToken = docTokens.find((t) => t.status === "IN_CONSULTATION");
  const callingToken = docTokens.find((t) => t.status === "CALLING");
  const waitingTokens = docTokens.filter((t) => t.status === "WAITING");
  const completedToday = docTokens.filter((t) => t.status === "COMPLETED");

  // Timer for active consultation
  useEffect(() => {
    let interval = null;
    if (inConsultationToken && inConsultationToken.consultationStartedAt) {
      const startMs = new Date(inConsultationToken.consultationStartedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));

      interval = setInterval(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [inConsultationToken]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleDoctorSwitch = (newId) => {
    const target = doctors.find((d) => d.id === newId);
    if (target) {
      loginAs("doctor", { doctorId: target.id, name: target.name, specialization: target.specialization });
      navigate(`/doctor/${target.id}`);
    }
  };

  // Complete and immediately call next
  const handleCompleteAndCallNext = async (tokenId) => {
    await finishConsultation(tokenId);
    if (waitingTokens.length > 0) {
      await callNext(doctor.id);
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading doctor profile...
      </div>
    );
  }

  const isDelayed = doctor.currentDelayMins > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Doctor Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Doctor Info & Switcher */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {doctor.name}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {doctor.cabinNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-teal-700">{doctor.specialization}</span>
                  <span>•</span>
                  <span>Avg: {doctor.avgConsultationMins} mins/patient</span>
                </div>
              </div>
            </div>

            {/* Doctor Actions: Switch doctor, Pause, Delay */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Doctor switcher dropdown */}
              <div className="relative">
                <select
                  value={doctor.id}
                  onChange={(e) => handleDoctorSwitch(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none transition"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Switch: {d.name} ({d.cabinNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pause Queue Button */}
              <button
                onClick={() => toggleDoctorPause(doctor.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  doctor.isPaused
                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{doctor.isPaused ? "Queue Paused (Resume)" : "Take Break"}</span>
              </button>

              {/* Declare Delay Button */}
              <button
                onClick={() => setShowDelayModal(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                  isDelayed
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isDelayed ? `Delayed (+${doctor.currentDelayMins}m)` : "Declare Delay"}</span>
              </button>
            </div>
          </div>

          {/* Delay Notification Banner */}
          {isDelayed && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Schedule Delay Active:</strong> +{doctor.currentDelayMins} mins ({doctor.delayReason || "Procedure"}). Patient waiting times have adjusted dynamically.
                </span>
              </div>
              <button
                onClick={() => setDoctorDelay(doctor.id, 0, "")}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950 ml-2"
              >
                Reset to On-Time
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Consultation Room (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Consultation Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cabin Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      inConsultationToken
                        ? "bg-teal-100 text-teal-800"
                        : callingToken
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {inConsultationToken
                      ? "In Consultation"
                      : callingToken
                      ? `Summoned to ${doctor.cabinNumber}`
                      : "Cabin Available"}
                  </span>
                </div>
              </div>

              {/* Body: State 1: Patient Currently In Consultation */}
              {inConsultationToken ? (
                <div className="pt-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                        Current Patient
                      </div>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                          {inConsultationToken.tokenNumber}
                        </span>
                        {inConsultationToken.priority === "EMERGENCY" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {inConsultationToken.patientName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {inConsultationToken.patientAge ? `${inConsultationToken.patientAge} years • ` : ""}
                        {inConsultationToken.patientGender || "Other"}
                        {inConsultationToken.patientPhone ? ` • ${inConsultationToken.patientPhone}` : ""}
                      </p>
                    </div>

                    {/* Consultation Live Stopwatch */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 text-center min-w-[160px] shadow-md">
                      <div className="text-[11px] uppercase font-bold tracking-wider text-teal-400 flex items-center justify-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        <span>Elapsed Time</span>
                      </div>
                      <div className="text-3xl font-black font-mono mt-1 text-white">
                        {formatTimer(elapsedSeconds)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Target: ~{doctor.avgConsultationMins}m
                      </div>
                    </div>
                  </div>

                  {/* Clinical Notes / Chief Complaint */}
                  {inConsultationToken.notes && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reception Notes / Reason for Visit</span>
                      </div>
                      <p className="text-slate-600">{inConsultationToken.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-100">
                    <button
                      onClick={() => handleCompleteAndCallNext(inConsultationToken.id)}
                      className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Call Next Patient</span>
                    </button>

                    <button
                      onClick={() => finishConsultation(inConsultationToken.id)}
                      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Complete Only</span>
                    </button>

                    <button
                      onClick={() => markNoShow(inConsultationToken.id)}
                      className="px-3 py-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Mark No-Show</span>
                    </button>
                  </div>
                </div>
              ) : callingToken ? (
                /* State 2: Patient Summoned, waiting for them to walk into cabin */
                <div className="pt-6 space-y-5 text-center sm:text-left">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                        Summoned Patient (Door Bell Active)
                      </span>
                      <div className="text-3xl font-black font-mono text-slate-900 mt-1">
                        {callingToken.tokenNumber}
                      </div>
                      <div className="text-base font-bold text-slate-800">
                        {callingToken.patientName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Called at: {callingToken.calledAt ? new Date(callingToken.calledAt).toLocaleTimeString() : "Just now"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => startConsultation(callingToken.id)}
                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Consultation</span>
                      </button>

                      <button
                        onClick={() => markNoShow(callingToken.id)}
                        className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-600" />
                        <span>No-Show</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* State 3: Doctor is idle, ready to call next */
                <div className="pt-10 pb-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Cabin Ready for Next Patient</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {waitingTokens.length} patients currently waiting in queue
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => callNext(doctor.id)}
                      disabled={waitingTokens.length === 0}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Call Next Patient to {doctor.cabinNumber}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Waiting Queue List for This Doctor */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Waiting Line ({waitingTokens.length})
                  </h3>
                  <p className="text-xs text-slate-500">Ordered by Priority & Arrival Sequence</p>
                </div>
                {waitingTokens.length > 0 && !inConsultationToken && !callingToken && (
                  <button
                    onClick={() => callNext(doctor.id)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Call Top Patient</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">
                {waitingTokens.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No waiting patients in this doctor's queue.
                  </div>
                ) : (
                  waitingTokens.map((tok, idx) => (
                    <div
                      key={tok.id}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-slate-400 text-xs">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {tok.tokenNumber}
                            </span>
                            <span className="font-semibold text-xs text-slate-800">
                              {tok.patientName}
                            </span>
                            {tok.priority === "EMERGENCY" && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                EMERGENCY
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Est. wait: ~{tok.eta?.estimatedWaitMinutes || (idx + 1) * doctor.avgConsultationMins} mins
                            {tok.notes ? ` • Note: ${tok.notes}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => callNext(doctor.id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition cursor-pointer"
                        >
                          Summon
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Cabin Metrics & Today's Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Today's Clinic Performance</h3>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Completed Consultations</span>
                  <span className="font-mono font-black text-slate-900 text-lg">
                    {completedToday.length}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Waiting Patients</span>
                  <span className="font-mono font-black text-teal-700 text-lg">
                    {waitingTokens.length}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Consultation Pace</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {doctor.avgConsultationMins}m / patient
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Current Delay Status</span>
                  <span
                    className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                      isDelayed
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isDelayed ? `+${doctor.currentDelayMins}m Delayed` : "On Schedule"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Delay Declarer Widget */}
            <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Quick Delay Adjuster</h4>
              </div>
              <p className="text-xs text-amber-800">
                Running late? Click a button to automatically update all waiting patients' passes without phone calls.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDoctorDelay(doctor.id, mins, "Doctor Procedure Extended")}
                    className="py-2 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 shadow-xs transition"
                  >
                    +{mins} mins
                  </button>
                ))}
              </div>
              {isDelayed && (
                <button
                  onClick={() => setDoctorDelay(doctor.id, 0, "")}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Clear Delay & Resume On-Time
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delay Modal */}
      {showDelayModal && (
        <DoctorDelayModal
          doctor={doctor}
          onClose={() => setShowDelayModal(false)}
          onSave={setDoctorDelay}
        />
      )}
    </div>
  );
}

