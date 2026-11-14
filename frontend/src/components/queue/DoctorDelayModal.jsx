import React, { useState } from "react";
import { X, Clock, AlertTriangle, Check, RefreshCw } from "lucide-react";

export function DoctorDelayModal({ doctor, onClose, onSave }) {
  const [delayMins, setDelayMins] = useState(doctor?.currentDelayMins || 10);
  const [reason, setReason] = useState(doctor?.delayReason || "Extended Consultation & Procedure");
  const [submitting, setSubmitting] = useState(false);

  const quickDelays = [5, 10, 15, 20, 30, 45];
  const quickReasons = [
    "Extended Consultation & Procedure",
    "Emergency Ward Consultation",
    "Critical Care Case Review",
    "Hospital Staff Medical Briefing",
    "Equipment Diagnostic Calibration"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(doctor.id, Number(delayMins), reason);
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setSubmitting(true);
    try {
      await onSave(doctor.id, 0, "");
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Declare Schedule Delay</h3>
              <p className="text-xs text-amber-100">{doctor?.name} ({doctor?.cabinNumber})</p>
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
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Automatic Realtime ETA Update:</span> Setting a delay will automatically recalculate the estimated waiting time for every waiting patient and push a live notification to their phones without page refresh.
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Delay Duration (Minutes)
            </label>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {quickDelays.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDelayMins(min)}
                  className={`py-2 text-xs font-bold rounded-lg border transition ${
                    Number(delayMins) === min
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  +{min}m
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              max="180"
              value={delayMins}
              onChange={(e) => setDelayMins(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              placeholder="Or enter custom minutes"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason for Delay
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition mb-2"
            >
              {quickReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other / Clinical Unforeseen Event">Other / Clinical Unforeseen Event</option>
            </select>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Or write custom reason for patient display"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {doctor?.currentDelayMins > 0 ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="px-3 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Delay (Back on Schedule)</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
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
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? "Broadcasting..." : "Apply & Update ETAs"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

