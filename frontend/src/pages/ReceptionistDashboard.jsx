import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueue } from "../context/QueueContext";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { NewPatientModal } from "../components/queue/NewPatientModal";
import { TokenReceiptModal } from "../components/queue/TokenReceiptModal";
import { PriorityModal } from "../components/queue/PriorityModal";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  QrCode,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Pause,
  RotateCcw,
  SkipForward,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Stethoscope,
  Phone,
  RefreshCw,
  ExternalLink,
  UserCheck,
  FileText
} from "lucide-react";

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  const { user, logout, loginDemo } = useAuth();
  const { showToast } = useNotification();
  const {
    tokens,
    doctors,
    loading,
    refresh,
    createToken,
    callNext,
    startConsultation,
    finishConsultation,
    skipPatient,
    recallPatient,
    cancelToken,
    updateTokenPriority,
    pauseDoctorQueue,
    resumeDoctorQueue,
    lastEvent
  } = useQueue();

  // Navigation sidebar tab state
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "queue" | "register"
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false);
  const [receiptToken, setReceiptToken] = useState(null);
  const [priorityToken, setPriorityToken] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    type: "warning",
    onConfirm: () => {}
  });

  // Table filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Notification menu popover
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Live Summary KPI Computations
  const totalToday = tokens.length;
  const waitingCount = tokens.filter((t) => t.status === "WAITING").length;
  const inConsultationCount = tokens.filter((t) => t.status === "IN_CONSULTATION").length;
  const completedCount = tokens.filter((t) => t.status === "COMPLETED").length;
  const callingCount = tokens.filter((t) => t.status === "CALLING").length;
  const skippedCount = tokens.filter((t) => t.status === "SKIPPED" || t.status === "NO_SHOW").length;

  // Average waiting time across waiting tokens
  const averageWaitTime = useMemo(() => {
    const waitingTokens = tokens.filter((t) => t.status === "WAITING");
    if (waitingTokens.length === 0) return 0;
    const total = waitingTokens.reduce((sum, t) => sum + (t.eta?.estimatedWaitMinutes || 10), 0);
    return Math.round(total / waitingTokens.length);
  }, [tokens]);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.patientName?.toLowerCase().includes(q) ||
        t.tokenNumber?.toLowerCase().includes(q) ||
        (t.patientPhone && t.patientPhone.includes(q)) ||
        (t.appointmentType && t.appointmentType.toLowerCase().includes(q));

      const matchesDoctor = doctorFilter === "ALL" || t.doctorId === doctorFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && ["WAITING", "CALLING", "IN_CONSULTATION"].includes(t.status)) ||
        (statusFilter === "SKIPPED" && ["SKIPPED", "NO_SHOW"].includes(t.status)) ||
        t.status === statusFilter;

      return matchesSearch && matchesDoctor && matchesStatus;
    });
  }, [tokens, searchQuery, doctorFilter, statusFilter]);

  // Handle patient registration
  const handleRegisterSubmit = async (formData) => {
    const res = await createToken(formData);
    if (res.success && res.data) {
      setShowNewModal(false);
      setReceiptToken(res.data);
      showToast({
        title: "Token Generated",
        message: `Token ${res.data.tokenNumber} issued to ${res.data.patientName}`,
        type: "success"
      });
    }
  };

  // Queue actions with validation & feedback
  const handleCallNext = async (doctorId) => {
    try {
      const res = await callNext(doctorId);
      if (res.success && res.data) {
        showToast({
          title: "Patient Summoned",
          message: `Called token ${res.data.tokenNumber} (${res.data.patientName})`,
          type: "success",
          sound: "call"
        });
      } else if (!res.success) {
        showToast({
          title: "Notice",
          message: res.message || "No waiting patients remaining in this queue.",
          type: "info"
        });
      }
    } catch (err) {
      showToast({
        title: "Action Restricted",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleStartConsultation = async (token) => {
    try {
      await startConsultation(token.id);
      showToast({
        title: "Consultation In Progress",
        message: `Started consultation for ${token.tokenNumber}`,
        type: "success"
      });
    } catch (err) {
      showToast({
        title: "Cannot Start Consultation",
        message: err.message,
        type: "error"
      });
    }
  };

  const handleFinishConsultation = (token) => {
    setConfirmDialog({
      isOpen: true,
      title: "Complete Consultation?",
      message: `Mark consultation as completed for patient ${token.patientName} (${token.tokenNumber})?`,
      confirmText: "Complete Consultation",
      type: "success",
      onConfirm: async () => {
        try {
          await finishConsultation(token.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast({
            title: "Consultation Completed",
            message: `Token ${token.tokenNumber} marked as completed`,
            type: "success"
          });
        } catch (err) {
          showToast({
            title: "Error",
            message: err.message,
            type: "error"
          });
        }
      }
    });
  };

  const handleSkipPatient = (token) => {
    setConfirmDialog({
      isOpen: true,
      title: "Skip Patient?",
      message: `Move ${token.patientName} (${token.tokenNumber}) to skipped status? You can recall them later if they arrive.`,
      confirmText: "Skip Patient",
      type: "warning",
      onConfirm: async () => {
        try {
          await skipPatient(token.id, "Skipped by reception desk");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast({
            title: "Patient Skipped",
            message: `Token ${token.tokenNumber} moved to skipped list.`,
            type: "warning"
          });
        } catch (err) {
          showToast({
            title: "Error",
            message: err.message,
            type: "error"
          });
        }
      }
    });
  };

  const handleRecallPatient = async (token) => {
    try {
      await recallPatient(token.id);
      showToast({
        title: "Patient Recalled",
        message: `Token ${token.tokenNumber} returned to active queue.`,
        type: "success",
        sound: "call"
      });
    } catch (err) {
      showToast({
        title: "Cannot Recall",
        message: err.message,
        type: "error"
      });
    }
  };

  const handlePauseQueue = (doctor) => {
    setConfirmDialog({
      isOpen: true,
      title: "Pause Doctor Queue?",
      message: `Pause queue calling for ${doctor.name} (${doctor.cabinNumber})? Waiting patients will be notified that the queue is paused.`,
      confirmText: "Pause Queue",
      type: "warning",
      onConfirm: async () => {
        try {
          await pauseDoctorQueue(doctor.id, "Reception desk scheduled pause");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast({
            title: "Queue Paused",
            message: `Queue paused for ${doctor.name}`,
            type: "warning"
          });
        } catch (err) {
          showToast({ title: "Error", message: err.message, type: "error" });
        }
      }
    });
  };

  const handleResumeQueue = async (doctor) => {
    try {
      await resumeDoctorQueue(doctor.id);
      showToast({
        title: "Queue Resumed",
        message: `Queue resumed for ${doctor.name}`,
        type: "success"
      });
    } catch (err) {
      showToast({ title: "Error", message: err.message, type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Admin Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand & Logo */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Medi<span className="text-teal-400">Q</span>
              </span>
              <span className="text-[9px] font-bold uppercase bg-teal-900/60 text-teal-300 px-1.5 py-0.5 rounded border border-teal-700/50">
                Frontdesk
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab("overview");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                setShowNewModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <UserPlus className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Register Patient</span>
              </div>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">
                +New
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("queue");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "queue"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Queue Management</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {waitingCount}
              </span>
            </button>

            <Link
              to="/scanner"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>QR Scanner</span>
            </Link>

            <Link
              to="/analytics"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Analytics</span>
            </Link>

            <Link
              to="/settings"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer with Doctor Quick Switch & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Active Station
            </div>
            <div className="font-semibold text-white truncate">
              {user?.name || "Pooja Verma (Lead Reception - Wing A)"}
            </div>
            <div className="text-[11px] text-teal-400 mt-0.5">Frontdesk Wing A</div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Admin Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Receptionist Queue Console
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Triage, patient check-in & multi-doctor queue orchestrator
              </p>
            </div>
          </div>

          {/* Right Top Controls */}
          <div className="flex items-center gap-3">
            {/* Register Patient Button */}
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Register Patient</span>
              <span className="sm:hidden">+Patient</span>
            </button>

            {/* Notification Bell with Event Counter */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-1.5 right-1.5 animate-pulse" />
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-slide-up space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">Live Activity Notifications</span>
                    <span className="text-[10px] text-teal-600 font-semibold">Real-Time</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {lastEvent ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          Event: {lastEvent.event}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(lastEvent.timestamp || Date.now()).toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center py-3 text-xs">
                        No recent queue events.
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Active SSE queue listener is synchronized with all doctors.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                <div className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  {user?.name?.[0] || "R"}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                  {user?.name?.split(" ")[0] || "Reception"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 hidden group-hover:block hover:block z-50">
                <div className="px-3 py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Logged in as</span>
                  <div className="font-bold text-slate-900 truncate">{user?.name}</div>
                  <div className="text-slate-500 text-[11px]">{user?.email}</div>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    to="/display"
                    target="_blank"
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>Open Waiting Room TV</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
          {/* Section: 5 Live Summary Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Operations Snapshot
              </h2>
              <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Database Synchronized
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Card 1: Total patients today */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Patients Today
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1">
                  {totalToday}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Registered & Checked-in</div>
              </div>

              {/* Card 2: Currently waiting */}
              <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-2xs">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  Currently Waiting
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono mt-1">
                  {waitingCount}
                </div>
                <div className="text-[10px] text-amber-700 mt-1">
                  {callingCount > 0 ? `${callingCount} being summoned` : "In waiting queue"}
                </div>
              </div>

              {/* Card 3: Currently consulting */}
              <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-200 shadow-2xs">
                <div className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                  Currently Consulting
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-800 font-mono mt-1">
                  {inConsultationCount}
                </div>
                <div className="text-[10px] text-teal-700 mt-1">Inside doctor cabins</div>
              </div>

              {/* Card 4: Completed consultations */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
                <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  Completed Consultations
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-800 font-mono mt-1">
                  {completedCount}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1">Consulted successfully</div>
              </div>

              {/* Card 5: Average waiting time */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" />
                  <span>Avg. Waiting Time</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono mt-1">
                  ~{averageWaitTime}m
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Adaptive clinic buffer</div>
              </div>
            </div>
          </div>

          {/* Section: Doctor Cabin Queue Control Station */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>Doctor Cabin Queue Stations</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Manage independent doctor queues, summon next patients, or pause consultations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctors.map((doc) => {
                const docTokens = tokens.filter((t) => t.doctorId === doc.id);
                const activeToken = docTokens.find(
                  (t) => t.status === "IN_CONSULTATION" || t.status === "CALLING"
                );
                const isPaused = doc.isPaused;
                const isDelayed = doc.currentDelayMins > 0;
                const docWaitingCount = docTokens.filter((t) => t.status === "WAITING").length;

                return (
                  <div
                    key={doc.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs flex flex-col justify-between ${
                      isPaused
                        ? "border-rose-300 bg-rose-50/20"
                        : isDelayed
                        ? "border-amber-300"
                        : "border-slate-200 hover:border-teal-400"
                    }`}
                  >
                    <div>
                      {/* Doctor Card Top */}
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {doc.cabinNumber}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPaused
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : activeToken?.status === "IN_CONSULTATION"
                              ? "bg-teal-100 text-teal-800"
                              : activeToken?.status === "CALLING"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isPaused ? "PAUSED" : activeToken ? activeToken.status.replace("_", " ") : "AVAILABLE"}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{doc.departmentName || doc.specialization}</p>
                      </div>

                      {/* Doctor delay / pause notice */}
                      {isPaused ? (
                        <div className="mt-3 p-2 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                          <Pause className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span className="truncate">{doc.pauseReason || "Queue temporarily paused"}</span>
                        </div>
                      ) : isDelayed ? (
                        <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span className="truncate">+{doc.currentDelayMins}m: {doc.delayReason || "Procedure"}</span>
                        </div>
                      ) : null}

                      {/* Serving & Waiting stats */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Token</div>
                          <div className="font-mono font-bold text-slate-900 text-base mt-0.5 truncate">
                            {activeToken ? activeToken.tokenNumber : "None"}
                          </div>
                          {activeToken && (
                            <div className="text-[10px] text-teal-700 truncate font-medium">
                              {activeToken.patientName}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Waiting Line</div>
                          <div className="font-mono font-bold text-teal-700 text-base mt-0.5">
                            {docWaitingCount}
                          </div>
                          <div className="text-[10px] text-slate-500">patients</div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleCallNext(doc.id)}
                        disabled={isPaused || docWaitingCount === 0 || activeToken?.status === "IN_CONSULTATION"}
                        className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title={
                          activeToken?.status === "IN_CONSULTATION"
                            ? "Active consultation already in progress"
                            : isPaused
                            ? "Queue paused"
                            : "Summon next patient in queue"
                        }
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Call Next</span>
                      </button>

                      {isPaused ? (
                        <button
                          onClick={() => handleResumeQueue(doc)}
                          className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                          title="Resume Queue Calling"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePauseQueue(doc)}
                          className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                          title="Pause Queue for Break"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Queue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header & Controls */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Live Patient Queue Registry</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredTokens.length} of {tokens.length} total queue entries
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search token, patient, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                  />
                </div>

                {/* Doctor Filter */}
                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none transition"
                >
                  <option value="ALL">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.cabinNumber})
                    </option>
                  ))}
                </select>

                {/* Status Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {["ACTIVE", "WAITING", "SKIPPED", "COMPLETED", "ALL"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatusFilter(tab)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        statusFilter === tab
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Token #</th>
                    <th className="py-3.5 px-4">Patient Name & Type</th>
                    <th className="py-3.5 px-4">Assigned Doctor</th>
                    <th className="py-3.5 px-4">Registered At</th>
                    <th className="py-3.5 px-4">Queue Pos.</th>
                    <th className="py-3.5 px-4">Est. Waiting</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                          <span>Loading queue data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">
                        No patient queue tokens matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.map((token) => {
                      const isWaiting = token.status === "WAITING";
                      const isCalling = token.status === "CALLING";
                      const isConsulting = token.status === "IN_CONSULTATION";
                      const isCompleted = token.status === "COMPLETED";
                      const isSkipped = token.status === "SKIPPED" || token.status === "NO_SHOW";

                      return (
                        <tr
                          key={token.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isCalling ? "bg-amber-50/50" : isConsulting ? "bg-teal-50/30" : ""
                          }`}
                        >
                          {/* 1. Token Number */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {token.tokenNumber}
                            </span>
                          </td>

                          {/* 2. Patient Name & Appointment Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{token.patientName}</span>
                              {token.priority === "EMERGENCY" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                                  URGENT
                                </span>
                              )}
                              {token.priority === "SENIOR" && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  SENIOR
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="text-teal-700 font-medium">
                                {token.appointmentType || "General Checkup"}
                              </span>
                              {token.patientPhone && <span>• {token.patientPhone}</span>}
                            </div>
                          </td>

                          {/* 3. Doctor */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-900">{token.doctor?.name || "Consultant"}</div>
                            <div className="text-[11px] text-teal-700 font-semibold">
                              {token.doctor?.cabinNumber || "Cabin 101"}
                            </div>
                          </td>

                          {/* 4. Registration Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {new Date(token.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>

                          {/* 5. Queue Position */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isConsulting ? (
                              <span className="font-bold text-teal-700">In Cabin</span>
                            ) : isCalling ? (
                              <span className="font-bold text-amber-700">Next Up (#1)</span>
                            ) : isWaiting ? (
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                #{token.queuePosition || 1}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 6. Estimated Waiting Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isConsulting ? (
                              <span className="text-teal-700 font-semibold">In Progress</span>
                            ) : isCalling ? (
                              <span className="text-amber-700 font-bold">Summoned</span>
                            ) : isWaiting ? (
                              <div>
                                <span className="font-bold text-slate-900">
                                  ~{token.eta?.estimatedWaitMinutes || 10} mins
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  {token.eta?.patientsAhead || 0} ahead
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 7. Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isConsulting
                                  ? "bg-teal-100 text-teal-800"
                                  : isCalling
                                  ? "bg-amber-100 text-amber-800 animate-pulse ring-1 ring-amber-300"
                                  : isWaiting
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : isCompleted
                                  ? "bg-emerald-50 text-emerald-800"
                                  : isSkipped
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isConsulting
                                    ? "bg-teal-500 animate-pulse"
                                    : isCalling
                                    ? "bg-amber-500"
                                    : isWaiting
                                    ? "bg-blue-500"
                                    : isCompleted
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span>{token.status.replace("_", " ")}</span>
                            </span>
                          </td>

                          {/* 8. Functional Actions */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Action: Call Next / Summon */}
                              {isWaiting && (
                                <button
                                  onClick={() => handleCallNext(token.doctorId)}
                                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Call Next Patient"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Call</span>
                                </button>
                              )}

                              {/* Action: Start Consultation */}
                              {isCalling && (
                                <button
                                  onClick={() => handleStartConsultation(token)}
                                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Start Patient Consultation"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Start</span>
                                </button>
                              )}

                              {/* Action: Complete Consultation */}
                              {isConsulting && (
                                <button
                                  onClick={() => handleFinishConsultation(token)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Complete Consultation"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Finish</span>
                                </button>
                              )}

                              {/* Action: Skip Patient */}
                              {(isCalling || isWaiting) && (
                                <button
                                  onClick={() => handleSkipPatient(token)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Skip Patient (No-Show)"
                                >
                                  <SkipForward className="w-3 h-3" />
                                  <span>Skip</span>
                                </button>
                              )}

                              {/* Action: Recall Skipped Patient */}
                              {isSkipped && (
                                <button
                                  onClick={() => handleRecallPatient(token)}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                  title="Recall Skipped Patient Back to Queue"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Recall</span>
                                </button>
                              )}

                              {/* Print / Download QR Slip */}
                              <button
                                onClick={() => setReceiptToken(token)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                                title="Print or Download QR Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Priority Triage Modal */}
                              {!isCompleted && (
                                <button
                                  onClick={() => setPriorityToken(token)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                                  title="Change Priority (Emergency Bump)"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* View Patient Live Pass */}
                              <a
                                href={`/track/${token.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50 text-teal-700 transition cursor-pointer"
                                title="Open Live Patient Queue Pass"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Modals */}

      {/* Patient Registration Modal */}
      {showNewModal && (
        <NewPatientModal
          doctors={doctors}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleRegisterSubmit}
        />
      )}

      {/* Token Receipt & QR Slip Modal with Print & Download */}
      {receiptToken && (
        <TokenReceiptModal
          token={receiptToken}
          onClose={() => setReceiptToken(null)}
        />
      )}

      {/* Priority & Triage Modal */}
      {priorityToken && (
        <PriorityModal
          token={priorityToken}
          onClose={() => setPriorityToken(null)}
          onSave={updateTokenPriority}
        />
      )}

      {/* Action Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
