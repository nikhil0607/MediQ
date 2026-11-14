import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useQueue } from "../context/QueueContext";
import { api } from "../services/api";
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Stethoscope,
  Clock,
  ArrowRight,
  RefreshCw,
  UserCheck
} from "lucide-react";

export function QrScannerPage() {
  const navigate = useNavigate();
  const { tokens, callNext, startConsultation } = useQueue();
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const scannerRef = useRef(null);

  // Parse token ID or Number from scanned text / URL
  const extractTokenIdentifier = (text) => {
    if (!text) return "";
    const clean = text.trim();
    if (clean.includes("/track/")) {
      const parts = clean.split("/track/");
      return parts[parts.length - 1].replace(/\/$/, "");
    }
    return clean;
  };

  const handleLookup = async (identifier) => {
    if (!identifier) return;
    setLookupLoading(true);
    setError("");

    try {
      // First check in-memory tokens
      let found = tokens.find(
        (t) =>
          t.id === identifier ||
          t.tokenNumber.toUpperCase() === identifier.toUpperCase()
      );

      // If not in local list, fetch from API
      if (!found) {
        const res = await api.getTokenById(identifier);
        if (res.success && res.data) {
          found = res.data;
        }
      }

      if (found) {
        setScannedResult(found);
      } else {
        setError(`No patient queue pass found for "${identifier}".`);
      }
    } catch (err) {
      setError("Token lookup failed. Please verify the code.");
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    // Initialize html5-qrcode scanner
    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          const id = extractTokenIdentifier(decodedText);
          handleLookup(id);
        },
        (errorMessage) => {
          // scanner scanning error, ignore frame drops
        }
      );
    } catch (e) {
      console.warn("Scanner init notice:", e);
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (e) {}
      }
    };
  }, [tokens]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleLookup(extractTokenIdentifier(manualCode));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Verification & Check-in Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            QR Scanner & Token Validator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Scan patient phone digital passes or type token numbers to verify queue priority and room arrival.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Camera Scanner Container */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              <span>Camera Barcode / QR Scanner</span>
            </h2>
            <span className="text-[11px] text-slate-600 font-medium">Auto-Focus</span>
          </div>

          <div
            id="qr-reader-container"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          />

          <div className="text-[11px] text-slate-600 text-center leading-relaxed">
            Align patient's digital pass QR code inside the viewfinder. The token details will instantly appear.
          </div>

          {/* Quick Demo Pickers */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Quick Test: Select Active Queue Token
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.slice(0, 5).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLookup(t.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition"
                >
                  {t.tokenNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Manual Lookup & Result Card */}
        <div className="space-y-6">
          {/* Manual Input Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-teal-600" />
              <span>Manual Token Lookup</span>
            </h2>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. GEN-101, CARD-201, or token URL"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify</span>}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scanned Verification Result Card */}
          {scannedResult && (
            <div className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-xl shadow-teal-500/10 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Patient Pass
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  ID: {scannedResult.id.slice(0, 10)}...
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black font-mono text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                    {scannedResult.tokenNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {scannedResult.patientName}
                  </h3>
                  <div className="text-xs text-slate-600">
                    {scannedResult.patientAge ? `${scannedResult.patientAge}y • ` : ""}
                    {scannedResult.patientGender || "Other"}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                      scannedResult.status === "IN_CONSULTATION"
                        ? "bg-teal-100 text-teal-800"
                        : scannedResult.status === "CALLING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-50 text-blue-800"
                    }`}
                  >
                    {scannedResult.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">Assigned Doctor:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {scannedResult.doctor?.name || "Dr. Ananya Sharma"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600">Cabin Destination:</span>
                  <div className="font-bold text-teal-700 mt-0.5">
                    {scannedResult.doctor?.cabinNumber || "Cabin 102"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={`/track/${scannedResult.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Phone Pass</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

