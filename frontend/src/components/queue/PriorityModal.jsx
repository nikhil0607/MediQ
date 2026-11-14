import React, { useState } from "react";
import { X, ShieldAlert, UserCheck, Star, AlertTriangle } from "lucide-react";

export function PriorityModal({ token, onClose, onSave }) {
  const [priority, setPriority] = useState(token?.priority || "NORMAL");
  const [submitting, setSubmitting] = useState(false);

  if (!token) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(token.id, priority);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Update Priority</h3>
            <p className="text-xs text-slate-300">Token {token.tokenNumber} ({token.patientName})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label
              onClick={() => setPriority("NORMAL")}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                priority === "NORMAL"
                  ? "bg-teal-50/60 border-teal-500 text-teal-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="p"
                checked={priority === "NORMAL"}
                onChange={() => setPriority("NORMAL")}
                className="mt-1"
              />
              <div>
                <div className="text-xs font-bold">Normal Priority</div>
                <div className="text-[11px] text-slate-600">Standard first-come-first-served sequence.</div>
              </div>
            </label>

            <label
              onClick={() => setPriority("SENIOR")}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                priority === "SENIOR"
                  ? "bg-amber-50/60 border-amber-500 text-amber-950"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="p"
                checked={priority === "SENIOR"}
                onChange={() => setPriority("SENIOR")}
                className="mt-1"
              />
              <div>
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-600" /> Senior / Assisted
                </div>
                <div className="text-[11px] text-slate-600">Expedited care for elderly or mobility-impaired patients.</div>
              </div>
            </label>

            <label
              onClick={() => setPriority("EMERGENCY")}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                priority === "EMERGENCY"
                  ? "bg-rose-50 border-rose-500 text-rose-950 shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="p"
                checked={priority === "EMERGENCY"}
                onChange={() => setPriority("EMERGENCY")}
                className="mt-1"
              />
              <div>
                <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Emergency Triage Jump
                </div>
                <div className="text-[11px] text-slate-600">Bypasses regular queue to be called next immediately.</div>
              </div>
            </label>
          </div>

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
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
            >
              {submitting ? "Saving..." : "Update Priority"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

