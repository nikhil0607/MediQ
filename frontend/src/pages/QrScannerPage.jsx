import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { useQueue } from "../context/QueueContext";
import { api } from "../services/api";
import { sounds } from "../utils/audio";
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
  Upload,
  SwitchCamera,
  ShieldAlert,
  Smartphone,
  Eye,
  Check,
  Building,
  MapPin,
  Users
} from "lucide-react";

export function QrScannerPage() {
  const navigate = useNavigate();
  const { tokens } = useQueue();

  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cameraState, setCameraState] = useState("IDLE"); // IDLE, REQUESTING, ACTIVE, DENIED, ERROR
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" or "user"
  const [autoRedirect, setAutoRedirect] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Extract passToken, token ID, or tokenNumber from decoded QR string / URL
  const extractTokenIdentifier = (text) => {
    if (!text) return "";
    const clean = text.trim();
    if (clean.includes("/track/")) {
      const parts = clean.split("/track/");
      return parts[parts.length - 1].split("?")[0].replace(/\/$/, "");
    }
    if (clean.includes("/pass/")) {
      const parts = clean.split("/pass/");
      return parts[parts.length - 1].split("?")[0].replace(/\/$/, "");
    }
    return clean;
  };

  // Fetch token / public pass details
  const handleLookup = async (rawIdentifier, source = "manual") => {
    if (!rawIdentifier) return;
    const identifier = extractTokenIdentifier(rawIdentifier);

    setLookupLoading(true);
    setError("");

    try {
      // 1. Try public pass endpoint (validates pass on server with privacy)
      let found = null;
      try {
        const passRes = await api.getPublicPass(identifier);
        if (passRes.success && passRes.data) {
          found = passRes.data;
        }
      } catch (err) {
        // Fallback to internal token fetch if staff
      }

      // 2. If not found via public pass, check internal token store
      if (!found) {
        try {
          const tokenRes = await api.getTokenById(identifier);
          if (tokenRes.success && tokenRes.data) {
            found = tokenRes.data;
          }
        } catch (err) {}
      }

      // 3. Fallback to local tokens list in context
      if (!found && tokens && tokens.length > 0) {
        const local = tokens.find(
          (t) =>
            t.id === identifier ||
            t.passToken === identifier ||
            t.tokenNumber.toUpperCase() === identifier.toUpperCase()
        );
        if (local) found = local;
      }

      if (found) {
        sounds.playNotice();
        setScannedResult(found);

        // Handle auto-redirect if enabled
        if (autoRedirect) {
          const passId = found.passToken || found.id;
          setRedirectCountdown(2);
          countdownTimerRef.current = setInterval(() => {
            setRedirectCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownTimerRef.current);
                navigate(`/track/${passId}`);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setError(`No active queue pass found for "${rawIdentifier}". Please check the token code.`);
      }
    } catch (err) {
      setError(err.message || "Failed to locate queue pass. Please verify the code.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Start Camera scanning with Html5Qrcode
  const startScanner = async (cameraIdOrConfig) => {
    try {
      setError("");
      setCameraState("REQUESTING");

      // Stop previous instance if running
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode("mediq-qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Query available video devices
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          if (!selectedCameraId) {
            setSelectedCameraId(devices[0].id);
          }
        }
      } catch (e) {
        console.warn("Could not enumerate video devices:", e);
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const cameraParam = cameraIdOrConfig || (selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode });

      await html5QrCode.start(
        cameraParam,
        config,
        (decodedText) => {
          handleLookup(decodedText, "camera");
        },
        () => {
          // Frame decode miss - normal while searching for QR
        }
      );

      setCameraState("ACTIVE");
    } catch (err) {
      console.error("Camera scanner error:", err);
      if (err.name === "NotAllowedError" || String(err).includes("Permission denied")) {
        setCameraState("DENIED");
        setError("Camera permission denied. Please allow camera access in your browser, or use manual lookup / photo scan.");
      } else {
        setCameraState("ERROR");
        setError("Unable to start device camera. Please check your camera settings or use manual lookup.");
      }
    }
  };

  // Stop camera
  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setCameraState("IDLE");
      } catch (e) {}
    }
  };

  // Switch camera facing mode
  const toggleFacingMode = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startScanner({ facingMode: nextMode });
  };

  // Handle image file scan
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLookupLoading(true);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("mediq-qr-reader");
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleLookup(decodedText, "file");
    } catch (err) {
      setError("No valid QR code could be detected in the uploaded image. Please try a clearer picture.");
    } finally {
      setLookupLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto-start camera when mounting
  useEffect(() => {
    startScanner({ facingMode: "environment" });

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleLookup(manualCode.trim(), "manual");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Digital Queue Verification Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            QR Scanner & Pass Validator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Scan patient digital queue pass QR codes using your device camera, upload pass photos, or verify token numbers.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Live Camera Viewfinder */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Live Device Camera</h2>
            </div>

            <div className="flex items-center gap-2">
              {cameraState === "ACTIVE" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Scanning Active</span>
                </span>
              )}
              {cameraState === "REQUESTING" && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Requesting Camera...</span>
                </span>
              )}
            </div>
          </div>

          {/* Scanner Container with Custom Visual Overlay Frame */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 min-h-[300px] flex items-center justify-center">
            {/* Target element for html5-qrcode video */}
            <div id="mediq-qr-reader" className="w-full h-full overflow-hidden" />

            {/* Custom Visual Overlay Frame */}
            {cameraState === "ACTIVE" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-56 h-56 border-2 border-teal-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                  {/* Corner accents */}
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-teal-400 rounded-tl-sm" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-teal-400 rounded-tr-sm" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-teal-400 rounded-bl-sm" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-teal-400 rounded-br-sm" />

                  {/* Animated Laser Scan Beam */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] animate-scan-beam" />
                </div>
              </div>
            )}

            {/* Camera Permission Denied Screen */}
            {cameraState === "DENIED" && (
              <div className="absolute inset-0 bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Camera Access Blocked</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                    Browser camera permission was denied. Please click the lock or camera icon in your address bar to allow camera access.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => startScanner({ facingMode })}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Photo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Camera Stopped Screen */}
            {cameraState === "IDLE" && (
              <div className="absolute inset-0 bg-slate-900 text-white p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-teal-400 flex items-center justify-center border border-slate-700">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-white">Camera is Standby</h3>
                <button
                  onClick={() => startScanner({ facingMode })}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Scanner Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              {cameraState === "ACTIVE" ? (
                <button
                  onClick={stopScanner}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
                >
                  Pause Camera
                </button>
              ) : (
                <button
                  onClick={() => startScanner({ facingMode })}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
              )}

              <button
                onClick={toggleFacingMode}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Switch between front and back camera"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-teal-600" />
                <span>{facingMode === "environment" ? "Back Camera" : "Front Camera"}</span>
              </button>
            </div>

            {/* Hidden file input for QR image upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-800 font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span>Scan QR Image</span>
            </button>
          </div>

          {/* Quick Active Tokens Strip for Demonstration */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Quick Test: Select Active Queue Token
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokens.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLookup(t.passToken || t.tokenNumber, "quick")}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 transition cursor-pointer"
                >
                  {t.tokenNumber}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Manual Lookup, Errors & Verified Pass Result */}
        <div className="lg:col-span-5 space-y-6">
          {/* Manual Input Fallback Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600" />
                <span>Manual Token Lookup</span>
              </h2>
              <span className="text-[10px] text-slate-600 font-mono">Fallback Mode</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. GEN-101, pass_..., or URL"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Verify</span>}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRedirect}
                  onChange={(e) => setAutoRedirect(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Auto-redirect to pass on scan</span>
              </label>

              {redirectCountdown !== null && redirectCountdown > 0 && (
                <span className="text-[11px] font-bold text-teal-700 animate-pulse">
                  Redirecting in {redirectCountdown}s...
                </span>
              )}
            </div>
          </div>

          {/* Scanning / Lookup Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Verified Scanned Pass Result Card */}
          {scannedResult ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-teal-500 shadow-xl shadow-teal-500/10 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Queue Pass
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-600">
                  {scannedResult.passToken ? `Pass: ${scannedResult.passToken.slice(0, 10)}...` : "Active Token"}
                </span>
              </div>

              {/* Token & Patient Headline */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-block bg-teal-50 border border-teal-200 text-teal-800 font-mono font-black text-2xl sm:text-3xl px-3 py-1 rounded-xl">
                    {scannedResult.tokenNumber}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {scannedResult.patientName}
                  </h3>
                  <div className="text-xs text-slate-600">
                    {scannedResult.appointmentType || "General Consultation"}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      scannedResult.status === "IN_CONSULTATION"
                        ? "bg-teal-100 text-teal-800 ring-1 ring-teal-300"
                        : scannedResult.status === "CALLING"
                        ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 animate-pulse"
                        : scannedResult.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {scannedResult.queueStatus || scannedResult.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-600" /> Assigned Doctor
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">
                    {scannedResult.doctor?.name || "Consultant"}
                  </div>
                  <div className="text-[10px] text-teal-700 truncate">
                    {scannedResult.doctor?.specialization || "General Medicine"}
                  </div>
                </div>

                <div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" /> Cabin Destination
                  </div>
                  <div className="font-bold text-teal-700 mt-0.5">
                    {scannedResult.doctor?.cabinNumber || "Cabin 102"}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {scannedResult.department?.floor || "Ground Floor"}
                  </div>
                </div>

                <div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-600" /> Est. Waiting Time
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    ~{scannedResult.eta?.estimatedWaitMinutes ?? 10} mins
                  </div>
                </div>

                <div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-600" /> Ahead in Line
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {scannedResult.eta?.patientsAhead ?? 0} patients
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const passId = scannedResult.passToken || scannedResult.id;
                    navigate(`/track/${passId}`);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Digital Queue Pass</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-600 space-y-2">
              <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">Awaiting Valid Pass Scan</div>
              <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                Scan patient's QR code from their phone or physical receipt to view room destination and queue status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
