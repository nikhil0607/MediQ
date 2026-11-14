# MediQ | Smart Hospital & Clinic Queue Management Platform

> **A specialized healthcare queue platform designed to eliminate waiting room uncertainty and overcrowding through digital QR passes, live queue tracking, dynamic doctor delay compensation, and real-time alerts.**

---

## 🌟 Project Highlights

- **SaaS Healthcare Landing Page**: Complete landing experience highlighting core value propositions, interactive FAQ accordions, and a visual digital pass mockup.
- **Role-Based Authentication**: Custom & Supabase Auth integration supporting `Receptionist`, `Doctor`, and `Admin` roles with protected route boundaries (`ProtectedRoute.jsx`).
- **Hackathon Evaluation Sandbox**: Dedicated 1-click role switcher with explicit evaluator disclaimers separating demo access from production security.
- **Digital QR Passes**: Receptionists generate unique digital tokens with high-resolution QR codes that patients scan to access their personal mobile queue pass without downloading any app.
- **Dynamic Real-Time ETAs**: Waiting time automatically recalculates in real-time based on doctor consultation pace, active consultation elapsed time, queue position, priority triage, and doctor-declared delays.
- **Instant Doctor Delay Sync**: If a doctor experiences an emergency procedure or delay (e.g. `+15 mins`), setting a delay instantly recalculates every waiting patient's estimated call time and pushes an update across all open passes without refreshing.
- **Multi-Role Healthcare Interface**:
  - **Receptionist Dashboard**: Patient registration, doctor/department allocation, priority triage (`NORMAL`, `SENIOR`, `EMERGENCY`), printable QR token slips, and live cabin overview.
  - **Doctor Cabin Room**: Patient call bell, real-time consultation stopwatch, one-click "Complete & Call Next", schedule delay declarer, and queue break toggle.
  - **Patient Digital Pass (`/track/:id`)**: Mobile-first responsive live pass with giant token number, live status badge, doctor cabin destination, ETA countdown, audio chime, and mobile vibration upon being summoned.
  - **Camera QR Scanner (`/scanner`)**: Built-in camera scanner powered by `html5-qrcode` plus manual token code lookup for clinic door check-in.
  - **Hospital TV Display (`/display`)**: Fullscreen overhead monitor board for waiting halls showing currently summoned tokens per cabin with audio broadcast.
  - **Executive Analytics (`/analytics`)**: Recharts-powered graphs for hourly patient flow, department volume, doctor throughput, and live audit event trails.
  - **Clinic Settings (`/settings`)**: Hospital profile branding, consultation buffer minutes, audio chime controls, and Supabase integration configuration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, HTML5 Audio API |
| **Authentication** | Supabase Auth (with automatic local session fallback), Protected Route Guards |
| **Backend** | Node.js, Express, Server-Sent Events (SSE) Real-Time Stream, CORS |
| **Database & Realtime** | Supabase PostgreSQL, Supabase Realtime, Resilient Hybrid Store |
| **QR Code Generation** | `qrcode` |
| **QR Code Scanner** | `html5-qrcode` |
| **Analytics & Data Viz**| `recharts` |

---

## 📂 Project Structure

```text
MediQ/
├── frontend/                     # React + Vite Frontend Application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx                # Responsive navbar with auth state & demo switcher
│   │   │   │   └── ProtectedRoute.jsx        # Role-based route guard
│   │   │   └── queue/
│   │   │       ├── NewPatientModal.jsx       # Patient registration form
│   │   │       ├── TokenReceiptModal.jsx     # Printable QR receipt slip
│   │   │       ├── DoctorDelayModal.jsx      # Doctor schedule delay declarer
│   │   │       └── PriorityModal.jsx         # Emergency triage bump
│   │   ├── context/
│   │   │   ├── AuthContext.jsx               # Role, login, register, demo sandbox & Supabase Auth
│   │   │   ├── NotificationContext.jsx       # Toasts and audio chime management
│   │   │   └── QueueContext.jsx              # Real-time state & SSE subscriptions
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx               # Premium SaaS landing page with Hero pass mockup
│   │   │   ├── LoginPage.jsx                 # Staff login with Hackathon Sandbox 1-click access
│   │   │   ├── RegisterPage.jsx              # Staff registration with role specialization
│   │   │   ├── ReceptionistDashboard.jsx     # Master queue table & token generation
│   │   │   ├── DoctorDashboard.jsx           # Doctor room consultation manager
│   │   │   ├── PatientTrackPage.jsx          # Mobile live digital queue pass
│   │   │   ├── QrScannerPage.jsx             # Camera QR check-in terminal
│   │   │   ├── AnalyticsPage.jsx             # Recharts throughput & wait analytics
│   │   │   ├── SettingsPage.jsx              # Hospital profile & engine settings
│   │   │   └── PublicQueueDisplayPage.jsx    # Waiting room TV monitor board
│   │   ├── services/
│   │   │   ├── api.js                        # Unified Express API client
│   │   │   └── supabase.js                   # Supabase client & realtime channels
│   │   ├── utils/
│   │   │   └── audio.js                      # Web Audio API synthesized hospital chime
│   │   ├── App.jsx                           # Route declarations & protection mapping
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
│
├── backend/                      # Node.js + Express Real-Time API Engine
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js                   # Supabase connection setup
│   │   ├── controllers/                      # Queue, doctor, analytics, settings controllers
│   │   ├── routes/                           # Express modular routes
│   │   ├── services/
│   │   │   └── etaService.js                 # Dynamic ETA calculation engine
│   │   ├── db/
│   │   │   ├── schema.sql                    # Production Supabase PostgreSQL schema
│   │   │   ├── seedData.js                   # Realistic seed departments & doctors
│   │   │   └── store.js                      # Reactive data store & SSE broadcaster
│   │   └── server.js                         # Express server with /events SSE stream
│   ├── package.json
│   ├── .env.example
│   └── .env
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Startup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   npm install
   npm start
   ```
   *The backend starts at `http://localhost:5000` with the SSE stream at `http://localhost:5000/events`.*

### 2. Frontend Startup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your web browser at:
   ```text
   http://localhost:5173
   ```

---

## 🔒 Authentication & Role Protection

MediQ protects hospital operations dashboards behind role guards:

| Route | Minimum Allowed Roles | Unauthenticated Behavior |
|---|---|---|
| `/` | Public | Displays SaaS Landing Page |
| `/login` | Public | Displays Login & Hackathon Sandbox |
| `/register` | Public | Staff & Doctor Registration |
| `/track/:id` | Public | Mobile Patient Digital Pass |
| `/display` | Public | Fullscreen Waiting Room TV |
| `/receptionist` | `receptionist`, `admin` | Redirects to `/login` |
| `/doctor/:id?` | `doctor`, `admin` | Redirects to `/login` |
| `/scanner` | `receptionist`, `doctor`, `admin`| Redirects to `/login` |
| `/analytics` | `admin`, `receptionist`, `doctor` | Redirects to `/login` |
| `/settings` | `admin` | Redirects to `/login` |

### Hackathon Evaluator Sandbox
To enable quick and comprehensive demonstration during hackathon evaluation without credential friction:
1. Navigate to `/login` or `/register`.
2. Look at the amber **Hackathon Demonstration Sandbox** box.
3. Click any 1-click demo role:
   - **Receptionist**: `reception@mediq.health` (Elena Rostova)
   - **Doctor (Jenkins)**: `doctor.jenkins@mediq.health` (Dr. Sarah Jenkins - Cabin 102)
   - **Doctor (Vance)**: `doctor.vance@mediq.health` (Dr. Marcus Vance - Cabin 204, Delayed)
   - **Admin**: `admin@mediq.health` (Hospital Operations Director)
4. Evaluator disclaimer: *"Demo access provides instant role switching for evaluation and must not be mistaken for secure production authentication."*
