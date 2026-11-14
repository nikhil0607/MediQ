import { initialDepartments, initialDoctors, initialSettings } from "./seedData.js";
import { calculateETAForToken } from "../services/etaService.js";
import QRCode from "qrcode";

class MediQStore {
  constructor() {
    this.departments = [...initialDepartments];
    this.doctors = [...initialDoctors];
    this.settings = { ...initialSettings };
    this.tokens = [];
    this.logs = [];
    this.listeners = new Set();
    this.tokenCounterByDept = {
      GEN: 100,
      CARD: 200,
      PED: 300,
      ORTHO: 400
    };

    // Populate initial realistic active queues
    this.seedInitialQueues();
  }

  // Subscribe to real-time events (SSE)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Broadcast real-time event to all connected clients
  broadcast(event, data) {
    for (const listener of this.listeners) {
      try {
        listener({ event, data, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error("Error broadcasting to listener:", err);
      }
    }
  }

  async seedInitialQueues() {
    const samplePatients = [
      // Dr. Sarah Jenkins (General Medicine)
      {
        patientName: "Eleanor Vance",
        patientPhone: "+1 (555) 234-5678",
        patientAge: 42,
        patientGender: "Female",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "IN_CONSULTATION",
        consultationStartedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(), // 6 mins ago
        notes: "Routine quarterly wellness check"
      },
      {
        patientName: "Michael Chang",
        patientPhone: "+1 (555) 345-6789",
        patientAge: 29,
        patientGender: "Male",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Persistent seasonal allergies & cough"
      },
      {
        patientName: "Beatrice Miller",
        patientPhone: "+1 (555) 456-7890",
        patientAge: 74,
        patientGender: "Female",
        priority: "SENIOR",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Blood pressure prescription refill"
      },
      {
        patientName: "David Kowalski",
        patientPhone: "+1 (555) 567-8901",
        patientAge: 38,
        patientGender: "Male",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Mild fever and fatigue"
      },

      // Dr. Marcus Vance (Cardiology) - Doctor with a 15 min delay
      {
        patientName: "Arthur Pendelton",
        patientPhone: "+1 (555) 678-9012",
        patientAge: 68,
        patientGender: "Male",
        priority: "NORMAL",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "IN_CONSULTATION",
        consultationStartedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        notes: "Post-angioplasty follow-up"
      },
      {
        patientName: "Sophia Rodriguez",
        patientPhone: "+1 (555) 789-0123",
        patientAge: 51,
        patientGender: "Female",
        priority: "EMERGENCY",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "WAITING",
        notes: "Acute chest discomfort & arrhythmia"
      },
      {
        patientName: "James Harrison",
        patientPhone: "+1 (555) 890-1234",
        patientAge: 62,
        patientGender: "Male",
        priority: "NORMAL",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "WAITING",
        notes: "Stress test evaluation"
      },

      // Dr. Emily Thorne (Pediatrics)
      {
        patientName: "Leo Thomas (Mother: Claire)",
        patientPhone: "+1 (555) 901-2345",
        patientAge: 4,
        patientGender: "Male",
        priority: "NORMAL",
        doctorId: "doc-3",
        deptCode: "PED",
        status: "CALLING",
        calledAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        notes: "4-year vaccination and growth milestone"
      },
      {
        patientName: "Aaliyah Khan",
        patientPhone: "+1 (555) 912-3456",
        patientAge: 7,
        patientGender: "Female",
        priority: "NORMAL",
        doctorId: "doc-3",
        deptCode: "PED",
        status: "WAITING",
        notes: "Mild ear infection"
      }
    ];

    for (const p of samplePatients) {
      this.tokenCounterByDept[p.deptCode] = (this.tokenCounterByDept[p.deptCode] || 100) + 1;
      const tokenNumber = `${p.deptCode}-${this.tokenCounterByDept[p.deptCode]}`;
      const id = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      
      const qrData = `http://localhost:5173/track/${id}`;
      let qrCodeData = "";
      try {
        qrCodeData = await QRCode.toDataURL(qrData, { width: 280, margin: 1 });
      } catch (err) {
        // ignore
      }

      this.tokens.push({
        id,
        tokenNumber,
        doctorId: p.doctorId,
        patientName: p.patientName,
        patientPhone: p.patientPhone,
        patientAge: p.patientAge,
        patientGender: p.patientGender,
        priority: p.priority,
        status: p.status,
        consultationStartedAt: p.consultationStartedAt || null,
        calledAt: p.calledAt || null,
        completedAt: null,
        qrCodeData,
        notes: p.notes || "",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 40 + 10) * 60 * 1000).toISOString()
      });
    }

    console.log(`✨ Seeded ${this.tokens.length} realistic clinic queue tokens.`);
  }

  // --- Department APIs ---
  getDepartments() {
    return this.departments;
  }

  // --- Doctor APIs ---
  getDoctors() {
    return this.doctors.map(doc => {
      const docTokens = this.tokens.filter(t => t.doctorId === doc.id);
      const waitingCount = docTokens.filter(t => t.status === "WAITING").length;
      const serving = docTokens.find(t => t.status === "IN_CONSULTATION" || t.status === "CALLING");
      const completedToday = docTokens.filter(t => t.status === "COMPLETED").length;
      return {
        ...doc,
        waitingCount,
        currentServingToken: serving ? serving.tokenNumber : null,
        currentServingPatient: serving ? serving.patientName : null,
        completedToday
      };
    });
  }

  getDoctorById(id) {
    const doc = this.doctors.find(d => d.id === id);
    if (!doc) return null;
    const docTokens = this.tokens.filter(t => t.doctorId === id);
    const waitingCount = docTokens.filter(t => t.status === "WAITING").length;
    const serving = docTokens.find(t => t.status === "IN_CONSULTATION" || t.status === "CALLING");
    return {
      ...doc,
      waitingCount,
      currentServingToken: serving ? serving.tokenNumber : null,
      currentServingPatient: serving ? serving.patientName : null
    };
  }

  updateDoctor(id, updates) {
    const idx = this.doctors.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.doctors[idx] = { ...this.doctors[idx], ...updates };
    this.broadcast("DOCTOR_UPDATED", this.doctors[idx]);
    return this.doctors[idx];
  }

  setDoctorDelay(doctorId, delayMins, reason = "") {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;

    doc.currentDelayMins = Number(delayMins);
    doc.delayReason = reason;

    // Log the event
    this.logs.unshift({
      id: `log-${Date.now()}`,
      doctorId,
      action: "DELAY_UPDATED",
      notes: `Delay set to ${delayMins} mins: ${reason}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("DOCTOR_DELAY_CHANGED", { doctorId, delayMins, reason });
    this.broadcast("QUEUE_UPDATED", { doctorId });
    return doc;
  }

  toggleDoctorPause(doctorId) {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;
    doc.isPaused = !doc.isPaused;
    this.broadcast("DOCTOR_PAUSE_TOGGLED", { doctorId, isPaused: doc.isPaused });
    this.broadcast("QUEUE_UPDATED", { doctorId });
    return doc;
  }

  // --- Token and Queue Management ---
  async createToken({
    patientName,
    patientPhone,
    patientAge,
    patientGender,
    doctorId,
    priority = "NORMAL",
    notes = ""
  }) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found");

    const dept = this.departments.find(dp => dp.id === doctor.departmentId) || { code: "GEN" };
    this.tokenCounterByDept[dept.code] = (this.tokenCounterByDept[dept.code] || 100) + 1;
    const tokenNumber = `${dept.code}-${this.tokenCounterByDept[dept.code]}`;
    const id = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;

    const trackingUrl = `http://localhost:5173/track/${id}`;
    const qrCodeData = await QRCode.toDataURL(trackingUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" }
    });

    const token = {
      id,
      tokenNumber,
      doctorId,
      patientName,
      patientPhone: patientPhone || "",
      patientAge: patientAge ? Number(patientAge) : null,
      patientGender: patientGender || "Other",
      priority,
      status: "WAITING",
      consultationStartedAt: null,
      calledAt: null,
      completedAt: null,
      qrCodeData,
      trackingUrl,
      notes,
      createdAt: new Date().toISOString()
    };

    this.tokens.push(token);

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: id,
      doctorId,
      action: "REGISTERED",
      notes: `Token ${tokenNumber} issued to ${patientName}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_CREATED", { token, doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId });

    return this.enrichToken(token);
  }

  getTokens({ doctorId, status } = {}) {
    let result = [...this.tokens];
    if (doctorId) {
      result = result.filter(t => t.doctorId === doctorId);
    }
    if (status) {
      result = result.filter(t => t.status === status);
    }

    return result.map(t => this.enrichToken(t));
  }

  getTokenById(id) {
    const token = this.tokens.find(t => t.id === id || t.tokenNumber.toUpperCase() === id.toUpperCase());
    if (!token) return null;
    return this.enrichToken(token);
  }

  enrichToken(token) {
    const doctor = this.doctors.find(d => d.id === token.doctorId);
    const department = doctor ? this.departments.find(dp => dp.id === doctor.departmentId) : null;
    const docTokens = this.tokens.filter(t => t.doctorId === token.doctorId);

    const eta = calculateETAForToken({
      token,
      allTokensForDoctor: docTokens,
      doctor,
      bufferMins: this.settings.consultationBufferMins
    });

    return {
      ...token,
      doctor: doctor ? {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        cabinNumber: doctor.cabinNumber,
        avgConsultationMins: doctor.avgConsultationMins,
        status: doctor.status,
        currentDelayMins: doctor.currentDelayMins,
        delayReason: doctor.delayReason,
        isPaused: doctor.isPaused
      } : null,
      department: department ? {
        name: department.name,
        floor: department.floor
      } : null,
      eta
    };
  }

  // Call the next patient in queue
  callNextPatient(doctorId) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found");

    // Check if there is already someone in calling status or consultation
    const waitingTokens = this.tokens.filter(t => t.doctorId === doctorId && t.status === "WAITING");

    if (waitingTokens.length === 0) {
      return null;
    }

    // Sort priority
    const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
    waitingTokens.sort((a, b) => {
      const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const nextToken = waitingTokens[0];
    nextToken.status = "CALLING";
    nextToken.calledAt = new Date().toISOString();

    doctor.status = "AVAILABLE";

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: nextToken.id,
      doctorId,
      action: "CALLED",
      notes: `Token ${nextToken.tokenNumber} called to ${doctor.cabinNumber}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("PATIENT_CALLED", {
      token: this.enrichToken(nextToken),
      doctor,
      cabin: doctor.cabinNumber
    });
    this.broadcast("QUEUE_UPDATED", { doctorId });

    return this.enrichToken(nextToken);
  }

  // Start Consultation
  startConsultation(tokenId) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    token.status = "IN_CONSULTATION";
    token.consultationStartedAt = new Date().toISOString();

    const doctor = this.doctors.find(d => d.id === token.doctorId);
    if (doctor) {
      doctor.status = "IN_CONSULTATION";
    }

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "CONSULTATION_STARTED",
      notes: `Consultation started for ${token.tokenNumber}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("CONSULTATION_STARTED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Complete Consultation
  finishConsultation(tokenId) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    token.status = "COMPLETED";
    token.completedAt = new Date().toISOString();

    const doctor = this.doctors.find(d => d.id === token.doctorId);
    if (doctor) {
      doctor.status = "AVAILABLE";
    }

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "COMPLETED",
      notes: `Consultation finished for ${token.tokenNumber}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("CONSULTATION_COMPLETED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Mark No-Show
  markNoShow(tokenId) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    token.status = "NO_SHOW";
    const doctor = this.doctors.find(d => d.id === token.doctorId);
    if (doctor && doctor.status === "IN_CONSULTATION") {
      doctor.status = "AVAILABLE";
    }

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "NO_SHOW",
      notes: `Token ${token.tokenNumber} marked as No-Show`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_UPDATED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Cancel Token
  cancelToken(tokenId, reason = "Patient requested cancellation") {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    token.status = "CANCELLED";
    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "CANCELLED",
      notes: reason,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_UPDATED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Emergency / Priority Override
  updateTokenPriority(tokenId, newPriority) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    token.priority = newPriority;
    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "PRIORITY_CHANGED",
      notes: `Priority upgraded to ${newPriority}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_UPDATED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Settings
  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.broadcast("SETTINGS_UPDATED", this.settings);
    return this.settings;
  }

  // Analytics Calculation
  getAnalytics() {
    const totalTokens = this.tokens.length;
    const completed = this.tokens.filter(t => t.status === "COMPLETED").length;
    const waiting = this.tokens.filter(t => t.status === "WAITING").length;
    const calling = this.tokens.filter(t => t.status === "CALLING").length;
    const inConsultation = this.tokens.filter(t => t.status === "IN_CONSULTATION").length;
    const noShows = this.tokens.filter(t => t.status === "NO_SHOW").length;
    const cancelled = this.tokens.filter(t => t.status === "CANCELLED").length;

    // Department breakdown
    const deptStats = this.departments.map(dept => {
      const deptTokens = this.tokens.filter(t => {
        const doc = this.doctors.find(d => d.id === t.doctorId);
        return doc && doc.departmentId === dept.id;
      });
      return {
        name: dept.name,
        code: dept.code,
        totalPatients: deptTokens.length,
        completed: deptTokens.filter(t => t.status === "COMPLETED").length,
        waiting: deptTokens.filter(t => t.status === "WAITING").length,
        avgWaitMins: Math.round(deptTokens.reduce((acc, t) => acc + (t.eta?.estimatedWaitMinutes || 12), 0) / (deptTokens.length || 1))
      };
    });

    // Hourly traffic distribution (peak hours)
    const hourlyData = [
      { hour: "08:00 AM", patients: 4, avgWait: 8 },
      { hour: "09:00 AM", patients: 12, avgWait: 14 },
      { hour: "10:00 AM", patients: 18, avgWait: 22 },
      { hour: "11:00 AM", patients: 15, avgWait: 18 },
      { hour: "12:00 PM", patients: 9, avgWait: 12 },
      { hour: "01:00 PM", patients: 5, avgWait: 6 },
      { hour: "02:00 PM", patients: 14, avgWait: 16 },
      { hour: "03:00 PM", patients: 16, avgWait: 20 },
      { hour: "04:00 PM", patients: 11, avgWait: 15 },
      { hour: "05:00 PM", patients: 6, avgWait: 10 }
    ];

    // Doctor throughput comparison
    const doctorStats = this.doctors.map(doc => {
      const docTokens = this.tokens.filter(t => t.doctorId === doc.id);
      return {
        doctorName: doc.name.replace("Dr. ", ""),
        specialization: doc.specialization,
        completed: docTokens.filter(t => t.status === "COMPLETED").length,
        waiting: docTokens.filter(t => t.status === "WAITING").length,
        currentDelayMins: doc.currentDelayMins,
        avgConsultationTime: doc.avgConsultationMins
      };
    });

    return {
      overview: {
        totalTokens,
        completed,
        waiting,
        calling,
        inConsultation,
        noShows,
        cancelled,
        activeQueues: this.doctors.filter(d => !d.isPaused).length,
        avgWaitTimeOverall: 16, // mins
        satisfactionRate: 98.4 // %
      },
      deptStats,
      hourlyData,
      doctorStats,
      recentLogs: this.logs.slice(0, 20)
    };
  }
}

export const store = new MediQStore();

