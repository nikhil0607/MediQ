import React, { useState } from "react";
import { useQueue } from "../context/QueueContext";
import { NewPatientModal } from "../components/queue/NewPatientModal";
import { TokenReceiptModal } from "../components/queue/TokenReceiptModal";
import { PriorityModal } from "../components/queue/PriorityModal";
import {
  Users,
  UserPlus,
  Search,
  Clock,
  Activity,
  Printer,
  ChevronRight,
  ShieldAlert,
  Volume2,
  Stethoscope,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  MoreVertical
} from "lucide-react";

export function ReceptionistDashboard() {
  const {
    tokens,
    doctors,
    createToken,
    callNext,
    markNoShow,
    cancelToken,
    updateTokenPriority,
    loading
  } = useQueue();

  const [showNewModal, setShowNewModal] = useState(false);
  const [activeReceiptToken, setActiveReceiptToken] = useState(null);
  const [priorityModalToken, setPriorityModalToken] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Registration handler
  const handleRegisterPatient = async (formData) => {
    const res = await createToken(formData);
    if (res.success && res.data) {
      setShowNewModal(false);
      setActiveReceiptToken(res.data);
    }
  };

  // Filter tokens
  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.patientPhone && t.patientPhone.includes(searchQuery));

    const matchesDoctor = doctorFilter === "ALL" || t.doctorId === doctorFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && ["WAITING", "CALLING", "IN_CONSULTATION"].includes(t.status)) ||
      t.status === statusFilter;

    return matchesSearch && matchesDoctor && matchesStatus;
  });

  // KPI Computations
  const totalToday = tokens.length;
  const inConsultationCount = tokens.filter((t) => t.status === "IN_CONSULTATION").length;
  const waitingCount = tokens.filter((t) => t.status === "WAITING").length;
  const callingCount = tokens.filter((t) => t.status === "CALLING").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Frontdesk & Triage Station</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Reception Queue Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Register arriving patients, print digital QR tokens, and manage room flows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNewModal(true)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Patient & Print QR</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Total Registered Today</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalToday}</div>
              <div className="text-[11px] text-teal-700 mt-1 font-medium">All departments</div>
            </div>

            <div className="bg-teal-50/50 rounded-2xl p-4 border border-teal-200/80">
              <div className="text-xs font-semibold text-teal-900">In Active Consultation</div>
              <div className="text-2xl font-black text-teal-800 mt-1 font-mono">{inConsultationCount}</div>
              <div className="text-[11px] text-teal-700 mt-1 font-medium">Inside doctor cabins</div>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80">
              <div className="text-xs font-semibold text-amber-900">Waiting in Lobby</div>
              <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{waitingCount}</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">{callingCount} currently being called</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-600">Active Doctors on Duty</div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{doctors.length}</div>
              <div className="text-[11px] text-slate-600 mt-1 font-medium">4 specialties open</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Live Doctor Cabins Status Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Live Cabin Queue Status</span>
            </h2>
            <span className="text-xs text-slate-600 font-medium">Click "Call Next" to summon next patient</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {doctors.map((doc) => {
              const isDelayed = doc.currentDelayMins > 0;
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl p-5 border transition shadow-xs flex flex-col justify-between ${
                    isDelayed ? "border-amber-300 ring-1 ring-amber-200/60" : "border-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        {doc.cabinNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          doc.status === "IN_CONSULTATION"
                            ? "bg-teal-100 text-teal-800"
                            : isDelayed
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {doc.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 mt-1 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">{doc.departmentName || doc.specialization}</p>

                    {isDelayed && (
                      <div className="mt-2.5 p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Delayed +{doc.currentDelayMins}m ({doc.delayReason || "Procedure"})</span>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-slate-600 text-[11px]">Serving Token</div>
                        <div className="font-mono font-bold text-slate-900 text-base mt-0.5">
                          {doc.currentServingToken || "None"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-600 text-[11px]">Waiting</div>
                        <div className="font-bold text-teal-700 text-base mt-0.5">
                          {doc.waitingCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => callNext(doc.id)}
                      disabled={doc.waitingCount === 0}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Call Next</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Queue List & Filter controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Master Patient Queue</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Showing {filteredTokens.length} of {tokens.length} total patient tokens
              </p>
            </div>

            {/* Filter and search bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search token or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              {/* Doctor filter dropdown */}
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none transition"
              >
                <option value="ALL">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Status filter tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {["ACTIVE", "WAITING", "COMPLETED", "ALL"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
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
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Token #</th>
                  <th className="py-3.5 px-4">Patient Info</th>
                  <th className="py-3.5 px-4">Doctor & Cabin</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Est. Wait / ETA</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-600">
                      No matching queue tokens found.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => {
                    const isCalling = token.status === "CALLING";
                    const isConsulting = token.status === "IN_CONSULTATION";
                    const isWaiting = token.status === "WAITING";

                    return (
                      <tr
                        key={token.id}
                        className={`hover:bg-slate-50/80 transition ${
                          isCalling ? "bg-amber-50/40" : isConsulting ? "bg-teal-50/30" : ""
                        }`}
                      >
                        {/* Token # */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {token.tokenNumber}
                          </span>
                        </td>

                        {/* Patient */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 text-xs">{token.patientName}</div>
                          <div className="text-[11px] text-slate-600">
                            {token.patientAge ? `${token.patientAge}y • ` : ""}
                            {token.patientGender || "Other"}
                            {token.patientPhone ? ` • ${token.patientPhone}` : ""}
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{token.doctor?.name || "Doctor"}</div>
                          <div className="text-[11px] text-teal-700 font-medium">
                            {token.doctor?.cabinNumber || "Cabin 101"}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => setPriorityModalToken(token)}
                            className="cursor-pointer"
                            title="Click to change priority"
                          >
                            {token.priority === "EMERGENCY" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                EMERGENCY
                              </span>
                            ) : token.priority === "SENIOR" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                SENIOR
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                                Standard
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isConsulting
                                ? "bg-teal-100 text-teal-800"
                                : isCalling
                                ? "bg-amber-100 text-amber-800 animate-pulse"
                                : isWaiting
                                ? "bg-blue-50 text-blue-800"
                                : token.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConsulting
                                  ? "bg-teal-500"
                                  : isCalling
                                  ? "bg-amber-500"
                                  : isWaiting
                                  ? "bg-blue-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {token.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* ETA */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isConsulting ? (
                            <span className="text-teal-700 font-semibold">Now inside</span>
                          ) : isCalling ? (
                            <span className="text-amber-700 font-bold">Calling to cabin</span>
                          ) : isWaiting ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                ~{token.eta?.estimatedWaitMinutes || 12} mins
                              </div>
                              <div className="text-[11px] text-slate-600">
                                {token.eta?.patientsAhead || 0} ahead
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Open QR / Print Slip */}
                            <button
                              onClick={() => setActiveReceiptToken(token)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs cursor-pointer"
                              title="View & Print QR Token Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* View Live Pass */}
                            <a
                              href={`/track/${token.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-teal-700 hover:bg-teal-50 transition shadow-xs"
                              title="Open Patient Tracking Pass"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* Mark No Show / Cancel if waiting */}
                            {isWaiting && (
                              <button
                                onClick={() => cancelToken(token.id, "Cancelled by Reception Desk")}
                                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition"
                                title="Cancel Token"
                              >
                                Cancel
                              </button>
                            )}

                            {isCalling && (
                              <button
                                onClick={() => markNoShow(token.id)}
                                className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold transition"
                                title="Mark No-Show"
                              >
                                No-Show
                              </button>
                            )}
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
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewPatientModal
          doctors={doctors}
          onClose={() => setShowNewModal(false)}
          onSubmit={handleRegisterPatient}
        />
      )}

      {activeReceiptToken && (
        <TokenReceiptModal
          token={activeReceiptToken}
          onClose={() => setActiveReceiptToken(null)}
        />
      )}

      {priorityModalToken && (
        <PriorityModal
          token={priorityModalToken}
          onClose={() => setPriorityModalToken(null)}
          onSave={updateTokenPriority}
        />
      )}
    </div>
  );
}

