import React, { useState } from "react";
import { X, UserPlus, AlertCircle, Stethoscope, Clock, ShieldAlert, Phone, User, FileText } from "lucide-react";

export function NewPatientModal({ doctors, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientAge: "",
    patientGender: "Female",
    appointmentType: "General Consultation",
    doctorId: doctors[0]?.id || "",
    priority: "NORMAL",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

  const appointmentTypes = [
    "General Consultation",
    "Follow-up Review",
    "Routine Health Checkup",
    "Specialist Consultation",
    "Emergency Triage",
    "Diagnostic & Lab Review"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientName.trim()) {
      setError("Please enter the patient's full name.");
      return;
    }
    if (!formData.doctorId) {
      setError("Please select an assigned doctor.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || "Failed to register patient");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">New Patient Registration</h3>
              <p className="text-xs text-slate-300">Generate unique queue token & digital QR pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Patient Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Clara Oswald"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Phone Number (Optional) & Appointment Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Appointment Type *
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              >
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="number"
                min="0"
                max="125"
                placeholder="e.g. 34"
                value={formData.patientAge}
                onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={formData.patientGender}
                onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Doctor / Department *
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.departmentName || doc.specialization} ({doc.cabinNumber}) [{doc.waitingCount} waiting]
                </option>
              ))}
            </select>

            {/* Doctor Info Card */}
            {selectedDoctor && (
              <div className="mt-2 p-3 bg-teal-50/70 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-teal-900">{selectedDoctor.cabinNumber}</span>
                    <span className="text-teal-700 ml-1.5">• Pace: ~{selectedDoctor.avgConsultationMins}m / patient</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Est. wait: ~{selectedDoctor.waitingCount * selectedDoctor.avgConsultationMins + (selectedDoctor.currentDelayMins || 0)}m
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Priority Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  formData.priority === "NORMAL"
                    ? "bg-teal-50 border-teal-500 text-teal-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={formData.priority === "NORMAL"}
                  onChange={() => setFormData({ ...formData, priority: "NORMAL" })}
                  className="sr-only"
                />
                <span>Standard</span>
              </label>

              <label
                className={`flex items-center justify-center p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  formData.priority === "SENIOR"
                    ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="SENIOR"
                  checked={formData.priority === "SENIOR"}
                  onChange={() => setFormData({ ...formData, priority: "SENIOR" })}
                  className="sr-only"
                />
                <span>Senior Citizen</span>
              </label>

              <label
                className={`flex items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  formData.priority === "EMERGENCY"
                    ? "bg-rose-50 border-rose-500 text-rose-800 shadow-2xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value="EMERGENCY"
                  checked={formData.priority === "EMERGENCY"}
                  onChange={() => setFormData({ ...formData, priority: "EMERGENCY" })}
                  className="sr-only"
                />
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Emergency</span>
              </label>
            </div>
            {formData.priority === "EMERGENCY" && (
              <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                ⚠️ Emergency tokens immediately jump to the top of the waiting line.
              </p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Clinical / Reception Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Needs wheelchair assistance, post-operative dressing"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? "Generating Token..." : "Issue Token & QR Pass"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
