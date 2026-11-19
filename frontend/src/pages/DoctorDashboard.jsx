import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueue } from "../context/QueueContext";
import { useAuth } from "../context/AuthContext";
import { DoctorDelayModal } from "../components/queue/DoctorDelayModal";
import { DoctorAvailabilityModal } from "../components/queue/DoctorAvailabilityModal";
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
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  Timer,
  ChevronRight,
  Activity,
  FileText,
  User,
  Users,
  AlertCircle
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
    toggleDoctorPause,
    setDoctorAvailability,
    pauseDoctorQueue,
    resumeDoctorQueue
  } = useQueue();

  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active doctor
  const currentDocId = doctorId || user.doctorId || doctors[0]?.id || "doc-1";
  const doctor = doctors.find((d) => d.id === currentDocId) || doctors[0];

  // Tokens for this doctor
  const docTokens = tokens.filter((t) => t.doctorId === doctor?.id);
  const inConsultationToken = docTokens.find((t) => t.status === "IN_CONSULTATION" || t.status === "CONSULTING");
  const callingToken = docTokens.find((t) => t.status === "CALLING" || t.status === "CALLED");
  const waitingTokens = docTokens.filter((t) => t.status === "WAITING");
  const completedToday = docTokens.filter((t) => t.status === "COMPLETED");

  // Next patient in line
  const nextPatient = waitingTokens[0] || null;

  // Timer for active consultation
  useEffect(() => {
    let interval = null;
    if (inConsultationToken && (inConsultationToken.consultationStartedAt || inConsultationToken.calledAt)) {
      const startMs = new Date(inConsultationToken.consultationStartedAt || inConsultationToken.calledAt).getTime();
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

  const getWaitingDurationMins = (timestamp) => {
    if (!timestamp) return 0;
    const diffMs = Date.now() - new Date(timestamp).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
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

  const handlePauseResume = async () => {
    if (doctor.isPaused) {
      await resumeDoctorQueue(doctor.id);
    } else {
      await pauseDoctorQueue(doctor.id, "Doctor on Break");
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
  const isUnavailable = doctor.status === "UNAVAILABLE";
  const isPaused = Boolean(doctor.isPaused);

  // Compute Current Availability Status Label & Styling
  const getAvailabilityStatus = () => {
    if (isUnavailable) {
      return {
        label: "Unavailable",
        sub: doctor.availabilityReason || "Off Duty",
        badge: "bg-rose-100 text-rose-800 border-rose-300",
        dot: "bg-rose-500"
      };
    }
    if (isPaused) {
      return {
        label: "Queue Paused",
        sub: doctor.pauseReason || "Doctor on Break",
        badge: "bg-amber-100 text-amber-900 border-amber-300",
        dot: "bg-amber-500"
      };
    }
    if (inConsultationToken) {
      return {
        label: "In Consultation",
        sub: `Serving ${inConsultationToken.tokenNumber}`,
        badge: "bg-teal-100 text-teal-800 border-teal-300",
        dot: "bg-teal-500 animate-pulse"
      };
    }
    if (isDelayed) {
      return {
        label: "Delayed",
        sub: `+${doctor.currentDelayMins}m (${doctor.delayReason || "Extended"})`,
        badge: "bg-orange-100 text-orange-900 border-orange-300",
        dot: "bg-orange-500"
      };
    }
    return {
      label: "Available",
      sub: "Ready for Consultations",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      dot: "bg-emerald-500 animate-ping"
    };
  };

  const availability = getAvailabilityStatus();

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
                  {/* Realtime Doctor Availability Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${availability.badge}`}>
                    <span className={`w-2 h-2 rounded-full ${availability.dot}`} />
                    <span>{availability.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-teal-700">{doctor.specialization}</span>
                  <span>•</span>
                  <span>Avg Duration: {doctor.avgConsultationMins} mins/patient</span>
                  <span>•</span>
                  <span className="text-slate-500">{availability.sub}</span>
                </div>
              </div>
            </div>

            {/* Doctor Actions: Switch doctor, Availability toggle, Pause/Resume, Delay */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Doctor switcher dropdown */}
              <div className="relative">
                <select
                  value={doctor.id}
                  onChange={(e) => handleDoctorSwitch(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Switch: {d.name} ({d.cabinNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mark Available / Unavailable Control */}
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  isUnavailable
                    ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                    : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                }`}
                title="Change Doctor Availability State"
              >
                {isUnavailable ? <UserX className="w-3.5 h-3.5 text-rose-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isUnavailable ? "Mark Available" : "Mark Unavailable"}</span>
              </button>

              {/* Pause / Resume Queue Button */}
              <button
                onClick={handlePauseResume}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  isPaused
                    ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
                title={isPaused ? "Resume patient calling" : "Pause queue temporarily"}
              >
                {isPaused ? <PlayCircle className="w-3.5 h-3.5 text-amber-700" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? "Resume Queue" : "Pause Queue"}</span>
              </button>

              {/* Declare Delay Button */}
              <button
                onClick={() => setShowDelayModal(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  isDelayed
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isDelayed ? `Delayed (+${doctor.currentDelayMins}m)` : "Mark Delayed"}</span>
              </button>
            </div>
          </div>

          {/* Alert Banners: Delay or Unavailable or Paused */}
          <div className="space-y-2 mt-4">
            {isUnavailable && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Doctor Unavailable:</strong> {doctor.availabilityReason || "Off Duty / Ward Duties"}. Reception and patient passes will reflect status.
                  </span>
                </div>
                <button
                  onClick={() => setDoctorAvailability(doctor.id, "AVAILABLE", "")}
                  className="text-xs font-bold text-rose-900 underline hover:text-rose-950 ml-2 cursor-pointer"
                >
                  Mark Available Now
                </button>
              </div>
            )}

            {isPaused && !isUnavailable && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Pause className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Queue Paused:</strong> {doctor.pauseReason || "Doctor on temporary break"}. Calling next patient is suspended until queue is resumed.
                  </span>
                </div>
                <button
                  onClick={() => resumeDoctorQueue(doctor.id)}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950 ml-2 cursor-pointer"
                >
                  Resume Queue Now
                </button>
              </div>
            )}

            {isDelayed && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Schedule Delay Active:</strong> +{doctor.currentDelayMins} mins ({doctor.delayReason || "Extended Procedure"}). All patient waiting times have adjusted dynamically.
                  </span>
                </div>
                <button
                  onClick={() => setDoctorDelay(doctor.id, 0, "")}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950 ml-2 cursor-pointer"
                >
                  Reset to On-Time
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Active Cabin & Queue (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Consultation Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${inConsultationToken ? "bg-teal-500 animate-ping" : callingToken ? "bg-amber-500 animate-ping" : "bg-slate-400"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cabin Status ({doctor.cabinNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      inConsultationToken
                        ? "bg-teal-100 text-teal-800"
                        : callingToken
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : isPaused
                        ? "bg-amber-50 text-amber-700"
                        : isUnavailable
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {inConsultationToken
                      ? "In Consultation"
                      : callingToken
                      ? `Summoned to ${doctor.cabinNumber}`
                      : isPaused
                      ? "Queue Paused"
                      : isUnavailable
                      ? "Cabin Offline"
                      : "Cabin Available"}
                  </span>
                </div>
              </div>

              {/* State 1: Patient Currently In Consultation */}
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
                        {inConsultationToken.priority === "PRIORITY" && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            PRIORITY
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {inConsultationToken.patientName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {inConsultationToken.patientAge ? `${inConsultationToken.patientAge} years • ` : ""}
                        {inConsultationToken.patientGender || "General"}
                        {inConsultationToken.patientPhone ? ` • ${inConsultationToken.patientPhone}` : ""}
                        {inConsultationToken.appointmentType ? ` • ${inConsultationToken.appointmentType}` : ""}
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
                /* State 3: Doctor is ready to call next */
                <div className="pt-8 pb-6 text-center space-y-4">
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
                      disabled={waitingTokens.length === 0 || isPaused || isUnavailable}
                      className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Call Next Patient to {doctor.cabinNumber}</span>
                    </button>
                    {(isPaused || isUnavailable) && (
                      <div className="text-xs text-amber-700 mt-2 font-medium">
                        {isPaused ? "Resume queue to call the next patient." : "Mark doctor available to call patients."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Next Patient Card (Up Next Preview) */}
            {nextPatient && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
                    <Users className="w-4 h-4" />
                    <span>Up Next in Line</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Arrival: {new Date(nextPatient.registeredAt || nextPatient.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-2 rounded-2xl bg-teal-50 border border-teal-200 font-mono font-bold text-xl text-teal-800">
                      {nextPatient.tokenNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {nextPatient.patientName}
                        </span>
                        {nextPatient.priority === "EMERGENCY" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            EMERGENCY
                          </span>
                        )}
                        {nextPatient.priority === "PRIORITY" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            PRIORITY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {nextPatient.appointmentType || "General Consultation"}
                        {nextPatient.notes ? ` • Note: ${nextPatient.notes}` : ""}
                      </div>
                    </div>
                  </div>

                  {!inConsultationToken && !callingToken && (
                    <button
                      onClick={() => callNext(doctor.id)}
                      disabled={isPaused || isUnavailable}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Call {nextPatient.tokenNumber}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Waiting Queue List for This Doctor */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Live Waiting Queue ({waitingTokens.length})
                  </h3>
                  <p className="text-xs text-slate-500">Ordered by Priority & Arrival Sequence</p>
                </div>
                {waitingTokens.length > 0 && !inConsultationToken && !callingToken && !isPaused && !isUnavailable && (
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
                  waitingTokens.map((tok, idx) => {
                    const waitMins = getWaitingDurationMins(tok.registeredAt || tok.createdAt);
                    return (
                      <div
                        key={tok.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2 transition"
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
                              {tok.priority === "PRIORITY" && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  PRIORITY
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {tok.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                              <span className="font-medium text-slate-700">
                                Waiting: {waitMins} mins
                              </span>
                              <span>•</span>
                              <span>
                                Est. wait: {tok.eta?.formattedRange || `~${tok.eta?.estimatedWaitMinutes || (idx + 1) * doctor.avgConsultationMins} mins`}
                              </span>
                              {tok.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic">{tok.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {!inConsultationToken && !callingToken && idx === 0 && !isPaused && !isUnavailable && (
                            <button
                              onClick={() => callNext(doctor.id)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                            >
                              Call Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Cabin Metrics & Quick Controls */}
          <div className="space-y-6">
            {/* Performance Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Today's Clinic Performance</h3>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Doctor Availability</span>
                  <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${availability.badge}`}>
                    {availability.label}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Total Waiting Patients</span>
                  <span className="font-mono font-black text-teal-700 text-lg">
                    {waitingTokens.length}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Completed Consultations</span>
                  <span className="font-mono font-black text-slate-900 text-lg">
                    {completedToday.length}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600">Average Duration (T_avg)</div>
                    <div className="text-[10px] text-slate-400">Dynamic Empirical Pace</div>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {doctor.avgConsultationMins}m / patient
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Schedule Status</span>
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
              <p className="text-xs text-amber-800 leading-relaxed">
                Running late? One-click delay updates recalculate ETAs for all waiting patients and alert their passes instantly.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDoctorDelay(doctor.id, mins, "Doctor Procedure Extended")}
                    className="py-2 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 shadow-xs transition cursor-pointer"
                  >
                    +{mins} mins
                  </button>
                ))}
              </div>
              {isDelayed && (
                <button
                  onClick={() => setDoctorDelay(doctor.id, 0, "")}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
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

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <DoctorAvailabilityModal
          doctor={doctor}
          onClose={() => setShowAvailabilityModal(false)}
          onSave={setDoctorAvailability}
        />
      )}
    </div>
  );
}
