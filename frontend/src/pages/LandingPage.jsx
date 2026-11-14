import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sounds } from "../utils/audio";
import {
  Activity,
  QrCode,
  Clock,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Stethoscope,
  Tv,
  BarChart3,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Volume2,
  Coffee,
  HeartPulse,
  Building2,
  HelpCircle,
  Check,
  Play,
  Share2
} from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [audioTesting, setAudioTesting] = useState(false);

  const handleTestChime = () => {
    sounds.playCallChime();
    setAudioTesting(true);
    setTimeout(() => setAudioTesting(false), 2000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const faqs = [
    {
      q: "Do patients need to install a mobile app to use MediQ?",
      a: "No! Patients do not need to download or install anything from the App Store or Google Play. When a patient scans their printed or digital QR code with their regular smartphone camera, their personalized, secure web queue pass opens instantly in any browser."
    },
    {
      q: "How does the estimated waiting time update if a doctor is delayed?",
      a: "MediQ features an automated Dynamic ETA Engine. If a doctor encounters a complex procedure or emergency case and declares a delay (e.g. +15 minutes) from their cabin dashboard, that buffer is immediately added and broadcasted via Supabase Realtime / SSE. Every waiting patient's digital pass updates in real-time with an explanatory delay notice without needing to refresh."
    },
    {
      q: "How are emergency or senior citizen patients handled?",
      a: "Receptionists can triage patient tokens with 'Emergency' or 'Senior Citizen' classifications. Emergency tokens automatically jump to the top of the waiting sequence, ensuring urgent cases are attended to without manual reshuffling."
    },
    {
      q: "How does patient notification work when their turn arrives?",
      a: "When a doctor or receptionist clicks 'Call Next', the patient's digital pass instantly lights up with an amber 'It's Your Turn' alert banner directing them to their assigned cabin. The web pass also sounds a pleasant two-tone hospital chime and activates mobile vibration on supported devices."
    },
    {
      q: "Can hospital waiting halls display queue status on overhead monitors?",
      a: "Yes. MediQ includes a dedicated Waiting Room TV Display (/display) designed specifically for overhead wall-mounted monitors. It displays live cabin-by-cabin token summons, in-line counts, and audio chimes in high-contrast full-screen."
    },
    {
      q: "How is patient medical privacy protected?",
      a: "MediQ is purely a queue and waiting time management system, not a heavy electronic medical record (EMR). It stores only minimum non-clinical check-in identifiers (token numbers and first names), avoiding unnecessary exposure of private health records."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* SaaS Landing Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:bg-teal-700 transition">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Medi<span className="text-teal-600">Q</span>
                </span>
                <span className="text-[10px] uppercase font-bold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                Queue Management
              </p>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("benefits")}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              Benefits
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="hover:text-teal-700 transition cursor-pointer"
            >
              FAQ
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user.role === "doctor" ? `/doctor/${user.doctorId || "doc-1"}` : "/receptionist"}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900 font-semibold text-xs hover:bg-slate-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 bg-white">
        {/* Subtle decorative radial background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-teal-50/80 via-teal-50/20 to-transparent pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Next-Gen Smart Hospital & Clinic Queue Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Your Time Matters.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">
                  Your Queue, Under Control.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Skip the uncertainty of hospital waiting rooms. Track your token, know your estimated waiting time, and get notified when your turn approaches.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>See How It Works</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={handleTestChime}
                  className="px-4 py-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-slate-700 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
                  title="Hear actual hospital call chime"
                >
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  <span>{audioTesting ? "Chiming..." : "Test Hospital Chime"}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero App Download Needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Live Updates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Doctor Delay Auto-Compensation</span>
                </div>
              </div>
            </div>

            {/* Hero Right Mockup: Visually attractive patient digital queue pass */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                {/* Glow aura behind card */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl blur-lg opacity-25" />

                {/* Smartphone pass mockup container */}
                <div className="relative bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xl space-y-5">
                  {/* Digital pass top header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">MediQ Live Pass</div>
                        <div className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Real-Time Stream Active</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-mono">
                      Active
                    </span>
                  </div>

                  {/* Token Number & Doctor Info */}
                  <div className="text-center space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      Your Queue Token
                    </div>

                    {/* Specified Token: A012 */}
                    <div className="inline-block bg-teal-50/80 border-2 border-teal-500/30 rounded-2xl px-8 py-3 shadow-inner">
                      <span className="text-5xl font-black tracking-tight text-teal-700 font-mono">
                        A012
                      </span>
                    </div>

                    {/* Specified Doctor: Dr. Sharma */}
                    <div className="pt-1">
                      <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-teal-600" />
                        <span>Dr. Sharma</span>
                      </div>
                      <div className="text-xs text-slate-500">Cabin 104 • General Medicine</div>
                    </div>

                    {/* Live Queue Status Badge */}
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        <span>In Queue — Relax in Café</span>
                      </span>
                    </div>
                  </div>

                  {/* Specified Required Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 pb-1 text-center">
                    {/* Currently Serving: A009 */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">
                        Serving
                      </div>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                        A009
                      </div>
                      <div className="text-[9px] text-slate-400">In Cabin</div>
                    </div>

                    {/* 3 Patients Ahead */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">
                        Ahead
                      </div>
                      <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                        3
                      </div>
                      <div className="text-[9px] text-slate-400">Patients</div>
                    </div>

                    {/* Estimated Wait: 25 minutes */}
                    <div className="p-2.5 bg-teal-50/70 rounded-2xl border border-teal-100">
                      <div className="text-[10px] font-semibold text-teal-800 uppercase flex items-center justify-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Wait
                      </div>
                      <div className="text-base font-black text-teal-700 font-mono mt-0.5">
                        25m
                      </div>
                      <div className="text-[9px] text-teal-800 font-medium">Estimated</div>
                    </div>
                  </div>

                  {/* Live Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Queue Progress</span>
                      <span className="font-bold text-teal-700">68% Done</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full w-[68%]" />
                    </div>
                  </div>

                  {/* Footnote on Card */}
                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                    <Coffee className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>You'll hear a chime when Dr. Sharma calls token A012.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: How MediQ Works (4 Steps) */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Frictionless Healthcare Experience
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How MediQ Works
          </h2>
          <p className="text-base text-slate-600">
            From arrival to doctor consultation, MediQ streamlines the patient journey in four simple, dignified steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Register */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-black mb-5 group-hover:bg-teal-600 group-hover:text-white transition">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Register</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The receptionist checks in the patient in seconds, selects doctor specialty, and issues a token with an instantly generated QR code.
            </p>
          </div>

          {/* Step 2: Scan */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-black mb-5 group-hover:bg-teal-600 group-hover:text-white transition">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Scan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patient scans the printed slip or digital badge with their smartphone camera. No app download or account creation required.
            </p>
          </div>

          {/* Step 3: Track */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-black mb-5 group-hover:bg-teal-600 group-hover:text-white transition">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Track</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Patient accesses their live personal queue pass. They see exact patients ahead, currently serving token, and dynamic ETA in real time.
            </p>
          </div>

          {/* Step 4: Get Notified */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative group hover:border-teal-500 transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-black mb-5 group-hover:bg-teal-600 group-hover:text-white transition">
              4
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Get Notified</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When the doctor clicks 'Call Next', the patient's phone screen glows amber, sounds a gentle hospital chime, and vibrates to call them inside.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Key Features */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Purpose-Built Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Real Clinic Operations
            </h2>
            <p className="text-base text-slate-600">
              MediQ is built specifically for hospital queue dynamics, not generic ticketing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* QR Tokens */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">QR-Based Digital Tokens</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unique encrypted QR codes generated per check-in. Compatible with thermal slip printers, SMS links, and door validation scanners.
              </p>
            </div>

            {/* Real-time Tracking */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Real-Time Queue Tracking</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by Supabase Realtime and reactive event streams. Screen updates occur automatically without patients pulling to refresh.
              </p>
            </div>

            {/* Smart ETA */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Adaptive ETA Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates wait times dynamically using elapsed consultation duration, doctor speed buffers, and schedule delays for maximum accuracy.
              </p>
            </div>

            {/* Notifications */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Channel Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audio hospital chime synthesized via Web Audio API, haptic phone vibration, and visual on-screen summoning when patient turn arrives.
              </p>
            </div>

            {/* Virtual Waiting */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Virtual Waiting Freedom</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Allows patients to safely leave congested hallways and wait in cafeteria gardens or nearby shops while maintaining their queue position.
              </p>
            </div>

            {/* Doctor Delay Compensation */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Doctor Delay Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Doctors declare unforeseen emergency delays with 1 click. MediQ automatically shifts all patient ETAs forward and shows the delay reason.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 & 4: Benefits for Patients and Clinics */}
      <section id="benefits" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Measurable Healthcare Impact
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Patients. Loved by Clinics.
          </h2>
          <p className="text-base text-slate-600">
            Transforming chaotic waiting spaces into calm, predictable medical consultations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Benefits for Patients */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Benefits for Patients</h3>
                <p className="text-xs text-slate-500">Dignified, anxiety-free healthcare experiences</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Eliminates Anxiety:</strong> Always know how many patients are ahead and the realistic estimated wait time.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Freedom of Movement:</strong> Wait outside in the fresh air, cafeteria, or car instead of germ-dense hallways.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Delay Transparency:</strong> If an emergency procedure delays your doctor, your screen updates with clear context.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Universal Access:</strong> Works smoothly on iOS, Android, or desktop without signing up or downloading an app.
                </div>
              </li>
            </ul>
          </div>

          {/* Benefits for Clinics */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Benefits for Clinics & Doctors</h3>
                <p className="text-xs text-slate-500">Operational excellence and higher doctor satisfaction</p>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">70% Less Lobby Congestion:</strong> Prevents overcrowded waiting rooms and reduces cross-infection risks.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">80% Fewer Frontdesk Interruptions:</strong> Cuts repetitive "How much longer?" inquiries to reception staff.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Streamlined Doctor Workflow:</strong> Cabin call bells, active consultation stopwatches, and one-click 'Call Next'.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Actionable Operational Analytics:</strong> Track hourly patient peak loads and doctor pace to optimize clinical staffing.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: About MediQ */}
      <section id="about" className="py-20 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Our Mission</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Reimagining Patient Waiting as a Dignified Experience
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl mx-auto">
            MediQ was built on a foundational belief: waiting for medical care should never feel like blind guesswork. By combining lightweight QR passes with real-time reactive infrastructure, we bridge the communication gap between busy doctors and waiting patients.
          </p>
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-teal-400 font-mono">0</div>
              <div className="text-xs text-slate-400 mt-1">App Installs Required</div>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-teal-400 font-mono">&lt; 1s</div>
              <div className="text-xs text-slate-400 mt-1">Real-Time Sync Latency</div>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-teal-400 font-mono">70%</div>
              <div className="text-xs text-slate-400 mt-1">Lobby Decongestion</div>
            </div>
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="text-2xl font-black text-teal-400 font-mono">98.4%</div>
              <div className="text-xs text-slate-400 mt-1">Patient Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: FAQ Accordion */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Got Questions?
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Everything you need to know about implementing MediQ in your practice.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-teal-700 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Modernize Your Hospital Waiting Experience?
          </h2>
          <p className="text-sm sm:text-base text-teal-100 max-w-2xl mx-auto">
            Get started with MediQ today. Run with instant demo sandbox or connect your production Supabase database in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-white text-teal-900 font-bold text-sm hover:bg-teal-50 transition shadow-lg shadow-black/20"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-white font-semibold text-sm border border-teal-500/30 transition"
            >
              Staff Portal Login
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-100">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-lg text-slate-900">Medi<span className="text-teal-600">Q</span></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Smart hospital & clinic queue management platform. Eliminating waiting uncertainty through digital QR passes and real-time alerts.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Queue Systems Operational</span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Hospital Portals
              </div>
              <div><Link to="/receptionist" className="text-slate-600 hover:text-teal-700">Reception Desk</Link></div>
              <div><Link to="/doctor/doc-1" className="text-slate-600 hover:text-teal-700">Dr. Ananya Sharma (Cabin 102)</Link></div>
              <div><Link to="/doctor/doc-2" className="text-slate-600 hover:text-teal-700">Dr. Rajesh V. Iyer (Cabin 204)</Link></div>
              <div><Link to="/display" className="text-slate-600 hover:text-teal-700">Waiting Room TV Display</Link></div>
              <div><Link to="/scanner" className="text-slate-600 hover:text-teal-700">QR Door Scanner</Link></div>
            </div>

            {/* Col 3 */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Navigation
              </div>
              <div><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-slate-600 hover:text-teal-700 cursor-pointer">Home</button></div>
              <div><button onClick={() => scrollToSection("how-it-works")} className="text-slate-600 hover:text-teal-700 cursor-pointer">How It Works</button></div>
              <div><button onClick={() => scrollToSection("features")} className="text-slate-600 hover:text-teal-700 cursor-pointer">Key Features</button></div>
              <div><button onClick={() => scrollToSection("benefits")} className="text-slate-600 hover:text-teal-700 cursor-pointer">Patient Benefits</button></div>
              <div><button onClick={() => scrollToSection("faq")} className="text-slate-600 hover:text-teal-700 cursor-pointer">FAQ</button></div>
            </div>

            {/* Col 4 */}
            <div className="space-y-2.5 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Technical & Security
              </div>
              <div className="text-slate-500">React 19 + Vite + Tailwind CSS</div>
              <div className="text-slate-500">Node.js + Express Real-Time API</div>
              <div className="text-slate-500">Supabase PostgreSQL & Realtime</div>
              <div className="text-slate-500">Encrypted QR Verification</div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} MediQ Healthcare Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>HIPAA Workflow Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
