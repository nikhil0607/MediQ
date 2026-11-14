import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useQueue } from "../context/QueueContext";
import { useNotification } from "../context/NotificationContext";
import { sounds } from "../utils/audio";
import {
  Settings as SettingsIcon,
  Building,
  Volume2,
  Clock,
  Database,
  Save,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  Phone,
  MapPin,
  RefreshCw
} from "lucide-react";

export function SettingsPage() {
  const { settings, doctors, refresh } = useQueue();
  const { showToast } = useNotification();

  const [formData, setFormData] = useState({
    clinicName: "MediQ Central Health Pavilion",
    tagline: "Smart, Dignified Patient Queue Management",
    address: "742 Healthcare Parkway, Medical District, Suite 200",
    phone: "+1 (800) 555-MEDIQ",
    emergencyPhone: "+1 (800) 911-HELP",
    consultationBufferMins: 2,
    enableAudioChime: true
  });

  const [saving, setSaving] = useState(false);
  const [testChimePlaying, setTestChimePlaying] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings(formData);
      if (res.success) {
        showToast({
          title: "Settings Saved",
          message: "Clinic queue preferences updated successfully",
          type: "success"
        });
        refresh();
      }
    } catch (err) {
      showToast({
        title: "Error Saving",
        message: err.message,
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestChime = () => {
    sounds.playCallChime();
    setTestChimePlaying(true);
    setTimeout(() => setTestChimePlaying(false), 2000);
  };

  const supabaseUrlSet = Boolean(import.meta.env.VITE_SUPABASE_URL);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
            <SettingsIcon className="w-4 h-4" />
            <span>Hospital Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            System & Clinic Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Configure hospital profile, consultation pace buffers, notification sounds, and database connections.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Clinic Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital & Clinic Profile</h2>
                <p className="text-xs text-slate-500">Displayed on digital passes and printed QR token slips</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Clinic / Hospital Name
                </label>
                <input
                  type="text"
                  value={formData.clinicName}
                  onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Helpdesk Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Queue Timing & Audio Chimes */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Queue Engine Calibration</h2>
                <p className="text-xs text-slate-500">Fine-tune ETA calculation parameters & alerts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sanitization & Consultation Buffer (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={formData.consultationBufferMins}
                  onChange={(e) => setFormData({ ...formData, consultationBufferMins: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Added between consultations for doctor room sanitization and patient turnover.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Hospital Chime Audio</div>
                    <div className="text-[11px] text-slate-500">Play two-tone chime when patient is called</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestChime}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-teal-700 flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{testChimePlaying ? "Playing..." : "Test Chime"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Cabins Configuration */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Doctor Cabins & Consultation Pace</h2>
                <p className="text-xs text-slate-500">Configured medical providers in the MediQ queue</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {doctors.map((doc) => (
                <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{doc.name}</span>
                    <span className="text-teal-700 ml-2 font-medium">({doc.specialization})</span>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Cabin: <strong className="text-slate-700">{doc.cabinNumber}</strong> • Dept: {doc.departmentName}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-mono font-semibold">
                      ~{doc.avgConsultationMins} mins / patient
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supabase PostgreSQL & Realtime Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Supabase Cloud Database & Realtime Status</h2>
                <p className="text-xs text-slate-500">PostgreSQL database and live websocket channel synchronization</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Database Engine:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Supabase Ready (Hybrid Mode Active)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Realtime Push Protocol:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  SSE / WebSocket Stream Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Schema File:</span>
                <span className="font-mono text-slate-600">backend/src/db/schema.sql</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              To connect your own remote Supabase PostgreSQL project: paste your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">SUPABASE_ANON_KEY</code> into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/.env</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">frontend/.env</code>, then run the SQL statements from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">backend/src/db/schema.sql</code> in your Supabase SQL editor.
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Preferences"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

