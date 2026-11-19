import React, { useState } from "react";
import { X, UserCheck, UserX, AlertCircle, Check } from "lucide-react";

export function DoctorAvailabilityModal({ doctor, onClose, onSave }) {
  const isCurrentlyUnavailable = doctor?.status === "UNAVAILABLE";
  const [targetStatus, setTargetStatus] = useState(isCurrentlyUnavailable ? "AVAILABLE" : "UNAVAILABLE");
  const [reason, setReason] = useState(doctor?.availabilityReason || "Emergency Ward Rounds");
  const [submitting, setSubmitting] = useState(false);

  const unavailableReasons = [
    "Emergency Ward Rounds",
    "Emergency Surgery / ICU Call",
    "Scheduled Lunch / Rest Break",
    "Doctor Shift Finished for Today",
    "Clinical Staff Medical Briefing",
    "Personal / Academic Leave"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(doctor.id, targetStatus, targetStatus === "AVAILABLE" ? "" : reason);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className={`p-5 flex items-center justify-between text-white ${
          targetStatus === "AVAILABLE" ? "bg-emerald-600" : "bg-rose-600"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              {targetStatus === "AVAILABLE" ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {targetStatus === "AVAILABLE" ? "Mark Doctor Available" : "Mark Doctor Unavailable"}
              </h3>
              <p className="text-xs text-white/80">{doctor?.name} • Cabin {doctor?.cabinNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTargetStatus("AVAILABLE")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                targetStatus === "AVAILABLE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Available (On Duty)
            </button>
            <button
              type="button"
              onClick={() => setTargetStatus("UNAVAILABLE")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                targetStatus === "UNAVAILABLE"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Unavailable (Off Duty / Ward)
            </button>
          </div>

          {targetStatus === "UNAVAILABLE" ? (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Notice for Reception & Patients:</span> Marking unavailable will inform reception staff and update clinic displays. Patients currently in queue will remain safe in queue sequence.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition mb-2"
                >
                  {unavailableReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="Other / Clinical Unscheduled Duty">Other / Clinical Unscheduled Duty</option>
                </select>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Or enter custom reason note"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                Doctor will be marked as <strong className="text-emerald-950">Active & Available</strong> to take new patient consultations in Cabin {doctor?.cabinNumber}.
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-md transition flex items-center gap-1.5 ${
                targetStatus === "AVAILABLE"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "Updating..." : "Confirm Status"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
