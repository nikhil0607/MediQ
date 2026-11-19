import React, { useState } from "react";
import { Printer, Copy, Check, ExternalLink, X, Smartphone, Clock, MapPin, User, Stethoscope, Download } from "lucide-react";

export function TokenReceiptModal({ token, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!token) return null;

  const handleCopyLink = () => {
    const passIdentifier = token.passToken || token.id;
    const url = `${window.location.origin}/track/${passIdentifier}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!token.qrCodeData) return;
    const a = document.createElement("a");
    a.href = token.qrCodeData;
    a.download = `MediQ_Token_${token.tokenNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-800 text-white p-5 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-200">
              Registration Successful
            </span>
            <h3 className="text-xl font-bold tracking-tight mt-0.5">Digital Queue Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable & Visible Card Body */}
        <div id="printable-token" className="p-6 text-center space-y-4">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Patient Queue Token
          </div>

          <div className="inline-block bg-teal-50 border-2 border-teal-500/30 rounded-2xl px-6 py-3">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-teal-700 font-mono">
              {token.tokenNumber}
            </span>
          </div>

          <div className="text-slate-800 font-semibold text-base">
            {token.patientName}
            {token.patientAge ? <span className="text-xs text-slate-600 font-normal ml-1">({token.patientAge}y, {token.patientGender})</span> : null}
          </div>

          {token.appointmentType && (
            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {token.appointmentType}
            </div>
          )}

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm inline-block">
              {token.qrCodeData ? (
                <img
                  src={token.qrCodeData}
                  alt={`QR for ${token.tokenNumber}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                  Generating QR...
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-2 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span>Scan with phone camera to track live</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 grid grid-cols-2 gap-3 text-left text-xs">
            <div>
              <div className="text-slate-600 flex items-center gap-1 font-medium">
                <Stethoscope className="w-3.5 h-3.5 text-slate-600" /> Doctor
              </div>
              <div className="font-semibold text-slate-800 mt-0.5 truncate">
                {token.doctor?.name || "Consultant"}
              </div>
            </div>
            <div>
              <div className="text-slate-600 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-600" /> Cabin
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {token.doctor?.cabinNumber || "Room 101"}
              </div>
            </div>
            <div>
              <div className="text-slate-600 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-600" /> Est. Wait
              </div>
              <div className="font-semibold text-teal-700 mt-0.5">
                ~{token.eta?.estimatedWaitMinutes || 10} mins
              </div>
            </div>
            <div>
              <div className="text-slate-600 flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-600" /> Ahead
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {token.eta?.patientsAhead || 0} patients
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden when printed) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleDownloadQr}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs cursor-pointer"
            title="Download QR code image file"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Download QR</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? "Link Copied!" : "Copy URL"}</span>
          </button>

          <a
            href={`/track/${token.passToken || token.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-teal-700 hover:bg-teal-50 transition shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Pass</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
