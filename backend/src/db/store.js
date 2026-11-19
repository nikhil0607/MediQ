import crypto from "crypto";
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
      ORTHO: 400,
      DERM: 500,
      GYN: 600,
      OPHTH: 700,
      ENT: 800,
      NEURO: 900,
      PULMO: 1000
    };

    // Sequential queue sequence tracker per doctor
    this.sequenceByDoctor = {};

    // Concurrency locks to prevent race conditions during simultaneous queue operations
    this.locks = new Map();

    // Populate initial realistic active queues with Indian names
    this.seedInitialQueues();
  }

  // Concurrency Lock: Prevents conflicting queue mutations for the same doctor
  async withDoctorLock(doctorId, fn) {
    const key = String(doctorId);
    const start = Date.now();
    while (this.locks.has(key)) {
      if (Date.now() - start > 6000) {
        throw new Error("Queue lock timeout: another staff operation is currently modifying this doctor's queue. Please retry.");
      }
      await new Promise(r => setTimeout(r, 20));
    }
    this.locks.set(key, true);
    try {
      return await fn();
    } finally {
      this.locks.delete(key);
    }
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
      // Dr. Ananya Sharma (General Medicine)
      {
        patientName: "Sunita Aggarwal",
        patientPhone: "+91 98112 34567",
        patientAge: 42,
        patientGender: "Female",
        appointmentType: "Routine Health Checkup",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "IN_CONSULTATION",
        consultationStartedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        notes: "Routine quarterly wellness checkup & thyroid review"
      },
      {
        patientName: "Rahul Mehra",
        patientPhone: "+91 98234 56789",
        patientAge: 29,
        patientGender: "Male",
        appointmentType: "General Consultation",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Viral fever, throat irritation and body ache"
      },
      {
        patientName: "Kausalya Devi",
        patientPhone: "+91 98345 67890",
        patientAge: 74,
        patientGender: "Female",
        appointmentType: "Follow-up Review",
        priority: "SENIOR",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Hypertension prescription refill and blood sugar monitoring"
      },
      {
        patientName: "Amit Singhania",
        patientPhone: "+91 98456 78901",
        patientAge: 38,
        patientGender: "Male",
        appointmentType: "General Consultation",
        priority: "NORMAL",
        doctorId: "doc-1",
        deptCode: "GEN",
        status: "WAITING",
        notes: "Mild fever and acute fatigue"
      },

      // Dr. Rajesh V. Iyer (Cardiology) - Doctor with a 15 min delay
      {
        patientName: "Ramesh Chandra Gupta",
        patientPhone: "+91 98567 89012",
        patientAge: 68,
        patientGender: "Male",
        appointmentType: "Specialist Consultation",
        priority: "NORMAL",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "IN_CONSULTATION",
        consultationStartedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        notes: "Post-angioplasty stent 3-month checkup"
      },
      {
        patientName: "Deepa Krishnan",
        patientPhone: "+91 98678 90123",
        patientAge: 51,
        patientGender: "Female",
        appointmentType: "Emergency Triage",
        priority: "EMERGENCY",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "WAITING",
        notes: "Acute retrosternal chest pain & palpitation"
      },
      {
        patientName: "Manpreet Singh Gill",
        patientPhone: "+91 98789 01234",
        patientAge: 62,
        patientGender: "Male",
        appointmentType: "Specialist Consultation",
        priority: "NORMAL",
        doctorId: "doc-2",
        deptCode: "CARD",
        status: "WAITING",
        notes: "TMT stress test and Holter monitoring review"
      },

      // Dr. Priya Nair (Pediatrics)
      {
        patientName: "Aarav Mehta (Mother: Neha)",
        patientPhone: "+91 98890 12345",
        patientAge: 4,
        patientGender: "Male",
        appointmentType: "Vaccination",
        priority: "NORMAL",
        doctorId: "doc-3",
        deptCode: "PED",
        status: "CALLING",
        calledAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        notes: "Booster vaccination and pediatric developmental milestone review"
      },
      {
        patientName: "Anaya Joshi",
        patientPhone: "+91 98901 23456",
        patientAge: 7,
        patientGender: "Female",
        appointmentType: "General Consultation",
        priority: "NORMAL",
        doctorId: "doc-3",
        deptCode: "PED",
        status: "WAITING",
        notes: "Persistent dry cough and mild wheezing"
      },

      // Dr. Vikramaditya Rathore (Orthopedics)
      {
        patientName: "Vikram Malhotra",
        patientPhone: "+91 99123 45678",
        patientAge: 55,
        patientGender: "Male",
        appointmentType: "Specialist Consultation",
        priority: "NORMAL",
        doctorId: "doc-4",
        deptCode: "ORTHO",
        status: "WAITING",
        notes: "Bilateral knee osteoarthritis & joint mobility stiffness"
      },

      // Dr. Arjun Banerjee (Dermatology)
      {
        patientName: "Pooja Nambiar",
        patientPhone: "+91 99234 56789",
        patientAge: 31,
        patientGender: "Female",
        appointmentType: "General Consultation",
        priority: "NORMAL",
        doctorId: "doc-5",
        deptCode: "DERM",
        status: "WAITING",
        notes: "Contact dermatitis and skin allergy follow-up"
      },

      // Dr. Sunita Deshmukh (Obstetrics & Gynecology)
      {
        patientName: "Vandana Sharma",
        patientPhone: "+91 99345 67890",
        patientAge: 28,
        patientGender: "Female",
        appointmentType: "Routine Health Checkup",
        priority: "NORMAL",
        doctorId: "doc-6",
        deptCode: "GYN",
        status: "WAITING",
        notes: "Antenatal 2nd trimester anomaly scan review"
      },

      // Dr. Sneha Kulkarni (Ophthalmology)
      {
        patientName: "Harish Natarajan",
        patientPhone: "+91 99456 78901",
        patientAge: 64,
        patientGender: "Male",
        appointmentType: "Specialist Consultation",
        priority: "SENIOR",
        doctorId: "doc-7",
        deptCode: "OPHTH",
        status: "WAITING",
        notes: "Cataract pre-operative evaluation and intraocular lens planning"
      },

      // Dr. Meenakshi Sundaram (ENT)
      {
        patientName: "Balwinder Kaur",
        patientPhone: "+91 99567 89012",
        patientAge: 49,
        patientGender: "Female",
        appointmentType: "Follow-up Review",
        priority: "NORMAL",
        doctorId: "doc-8",
        deptCode: "ENT",
        status: "WAITING",
        notes: "Chronic sinusitis and nasal endoscopy check"
      }
    ];

    for (const p of samplePatients) {
      this.tokenCounterByDept[p.deptCode] = (this.tokenCounterByDept[p.deptCode] || 100) + 1;
      const tokenNumber = `${p.deptCode}-${this.tokenCounterByDept[p.deptCode]}`;
      const id = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      const passToken = `pass_${crypto.randomBytes(12).toString("hex")}`;

      this.sequenceByDoctor[p.doctorId] = (this.sequenceByDoctor[p.doctorId] || 0) + 1;
      const queueSequenceNumber = this.sequenceByDoctor[p.doctorId];

      const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
      const qrData = `${clientBase}/track/${passToken}`;
      let qrCodeData = "";
      try {
        qrCodeData = await QRCode.toDataURL(qrData, {
          width: 320,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" }
        });
      } catch (err) {
        // ignore
      }

      const regTime = new Date(Date.now() - Math.floor(Math.random() * 40 + 10) * 60 * 1000).toISOString();

      this.tokens.push({
        id,
        passToken,
        tokenNumber,
        queueSequenceNumber,
        doctorId: p.doctorId,
        patientName: p.patientName,
        patientPhone: p.patientPhone,
        patientAge: p.patientAge,
        patientGender: p.patientGender,
        appointmentType: p.appointmentType || "General Consultation",
        priority: p.priority,
        status: p.status,
        consultationStartedAt: p.consultationStartedAt || null,
        calledAt: p.calledAt || null,
        completedAt: null,
        skippedAt: null,
        recalledAt: null,
        qrCodeData,
        trackingUrl: qrData,
        notes: p.notes || "",
        registeredAt: regTime,
        createdAt: regTime
      });
    }

    // Seed earlier completed consultations so doctor pace has realistic historical samples
    const completedSamples = [
      {
        patientName: "Gopal Subramanian",
        doctorId: "doc-1",
        deptCode: "GEN",
        appointmentType: "Follow-up Review",
        startMinsAgo: 38,
        durationMins: 11
      },
      {
        patientName: "Preeti Chawla",
        doctorId: "doc-1",
        deptCode: "GEN",
        appointmentType: "General Consultation",
        startMinsAgo: 24,
        durationMins: 13
      },
      {
        patientName: "Harishankar Trivedi",
        doctorId: "doc-2",
        deptCode: "CARD",
        appointmentType: "ECG Review",
        startMinsAgo: 35,
        durationMins: 16
      }
    ];

    for (const c of completedSamples) {
      this.tokenCounterByDept[c.deptCode] = (this.tokenCounterByDept[c.deptCode] || 100) + 1;
      const tokenNumber = `${c.deptCode}-${this.tokenCounterByDept[c.deptCode]}`;
      const id = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      const passToken = `pass_${crypto.randomBytes(12).toString("hex")}`;

      const started = new Date(Date.now() - c.startMinsAgo * 60000).toISOString();
      const completed = new Date(Date.now() - (c.startMinsAgo - c.durationMins) * 60000).toISOString();

      this.tokens.push({
        id,
        passToken,
        tokenNumber,
        queueSequenceNumber: (this.sequenceByDoctor[c.doctorId] = (this.sequenceByDoctor[c.doctorId] || 0) + 1),
        doctorId: c.doctorId,
        patientName: c.patientName,
        patientPhone: "+91 98000 00000",
        patientAge: 45,
        patientGender: "Other",
        appointmentType: c.appointmentType,
        priority: "NORMAL",
        status: "COMPLETED",
        consultationStartedAt: started,
        calledAt: started,
        completedAt: completed,
        actualDurationMins: c.durationMins,
        skippedAt: null,
        recalledAt: null,
        qrCodeData: "",
        trackingUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/track/${passToken}`,
        notes: "Completed routine visit",
        registeredAt: new Date(Date.now() - (c.startMinsAgo + 10) * 60000).toISOString(),
        createdAt: new Date(Date.now() - (c.startMinsAgo + 10) * 60000).toISOString()
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

  toggleDoctorPause(doctorId, reason = "") {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;
    doc.isPaused = !doc.isPaused;
    doc.pauseReason = doc.isPaused ? (reason || "Doctor Break / Temporary Pause") : "";

    this.logs.unshift({
      id: `log-${Date.now()}`,
      doctorId,
      action: doc.isPaused ? "QUEUE_PAUSED" : "QUEUE_RESUMED",
      notes: doc.isPaused ? `Queue paused: ${doc.pauseReason}` : "Queue resumed",
      createdAt: new Date().toISOString()
    });

    this.broadcast("DOCTOR_PAUSE_TOGGLED", { doctorId, isPaused: doc.isPaused, pauseReason: doc.pauseReason });
    this.broadcast("QUEUE_UPDATED", { doctorId });
    return doc;
  }

  pauseQueue(doctorId, reason = "Doctor on Break") {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;
    doc.isPaused = true;
    doc.pauseReason = reason;
    this.logs.unshift({
      id: `log-${Date.now()}`,
      doctorId,
      action: "QUEUE_PAUSED",
      notes: `Queue paused: ${reason}`,
      createdAt: new Date().toISOString()
    });
    this.broadcast("DOCTOR_PAUSE_TOGGLED", { doctorId, isPaused: true, pauseReason: reason });
    this.broadcast("QUEUE_UPDATED", { doctorId });
    return doc;
  }

  resumeQueue(doctorId) {
    const doc = this.doctors.find(d => d.id === doctorId);
    if (!doc) return null;
    doc.isPaused = false;
    doc.pauseReason = "";
    this.logs.unshift({
      id: `log-${Date.now()}`,
      doctorId,
      action: "QUEUE_RESUMED",
      notes: "Queue resumed",
      createdAt: new Date().toISOString()
    });
    this.broadcast("DOCTOR_PAUSE_TOGGLED", { doctorId, isPaused: false, pauseReason: "" });
    this.broadcast("QUEUE_UPDATED", { doctorId });
    return doc;
  }

  // --- Token and Queue Management ---
  async createToken({
    patientName,
    patientPhone,
    patientAge,
    patientGender,
    appointmentType = "General Consultation",
    doctorId,
    priority = "NORMAL",
    notes = "",
    performedBy = { role: "receptionist", name: "Frontdesk" }
  }) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found");

    return this.withDoctorLock(doctorId, async () => {
      const dept = this.departments.find(dp => dp.id === doctor.departmentId) || { code: "GEN" };
      this.tokenCounterByDept[dept.code] = (this.tokenCounterByDept[dept.code] || 100) + 1;
      const tokenNumber = `${dept.code}-${this.tokenCounterByDept[dept.code]}`;
      const id = `tok-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;

      // Cryptographically unpredictable queue pass identifier
      const passToken = `pass_${crypto.randomBytes(12).toString("hex")}`;
      const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
      const trackingUrl = `${clientBase}/track/${passToken}`;

      // Strictly sequential queue position for this doctor
      this.sequenceByDoctor[doctorId] = (this.sequenceByDoctor[doctorId] || 0) + 1;
      const queueSequenceNumber = this.sequenceByDoctor[doctorId];

      const qrCodeData = await QRCode.toDataURL(trackingUrl, {
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" }
      });

      const now = new Date().toISOString();
      const token = {
        id,
        passToken,
        tokenNumber,
        queueSequenceNumber,
        doctorId,
        patientName,
        patientPhone: patientPhone || "",
        patientAge: patientAge ? Number(patientAge) : null,
        patientGender: patientGender || "Other",
        appointmentType: appointmentType || "General Consultation",
        priority,
        status: "WAITING",
        consultationStartedAt: null,
        calledAt: null,
        completedAt: null,
        skippedAt: null,
        recalledAt: null,
        qrCodeData,
        trackingUrl,
        notes,
        registeredAt: now,
        createdAt: now
      };

      this.tokens.push(token);

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: id,
        tokenNumber,
        doctorId,
        action: "REGISTERED",
        previousStatus: "NONE",
        newStatus: "WAITING",
        performedBy,
        notes: `Token ${tokenNumber} (Seq #${queueSequenceNumber}) issued to ${patientName} (${appointmentType})`,
        timestamp: now
      });

      const enrichedToken = this.enrichToken(token);
      this.broadcast("TOKEN_CREATED", { token: enrichedToken, doctorId });
      this.broadcast("QUEUE_UPDATED", { doctorId });

      return enrichedToken;
    });
  }

  getTokens({ doctorId, status } = {}) {
    let result = [...this.tokens];
    if (doctorId && doctorId !== "ALL") {
      result = result.filter(t => t.doctorId === doctorId);
    }
    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        result = result.filter(t => ["WAITING", "CALLING", "IN_CONSULTATION"].includes(t.status));
      } else {
        result = result.filter(t => t.status === status);
      }
    }

    return result.map(t => this.enrichToken(t));
  }

  getTokenById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const token = this.tokens.find(
      t => t.id === cleanId ||
        (t.passToken && t.passToken === cleanId) ||
        t.tokenNumber.toUpperCase() === cleanId.toUpperCase()
    );
    if (!token) return null;
    return this.enrichToken(token);
  }

  getPublicPass(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim();
    const token = this.tokens.find(
      t => (t.passToken && t.passToken === clean) ||
        t.id === clean ||
        t.tokenNumber.toUpperCase() === clean.toUpperCase()
    );
    if (!token) return null;

    const enriched = this.enrichToken(token);

    // Compute public queue status strictly matching the 8 possible states:
    // Registered | Waiting | Almost Your Turn | Next in Line | Consulting | Completed | Delayed | Skipped
    let queueStatus = "Waiting";
    const isDoctorDelayed = Boolean(enriched.doctor?.currentDelayMins > 0 || enriched.eta?.isDelayed);
    const patientsAhead = enriched.eta?.patientsAhead ?? 0;

    if (enriched.status === "COMPLETED") {
      queueStatus = "Completed";
    } else if (enriched.status === "SKIPPED") {
      queueStatus = "Skipped";
    } else if (enriched.status === "IN_CONSULTATION") {
      queueStatus = "Consulting";
    } else if (enriched.status === "CALLING") {
      queueStatus = "Next in Line";
    } else if (isDoctorDelayed && enriched.status === "WAITING") {
      queueStatus = "Delayed";
    } else if (patientsAhead === 1 && enriched.status === "WAITING") {
      queueStatus = "Next in Line";
    } else if ((patientsAhead === 2 || patientsAhead === 3) && enriched.status === "WAITING") {
      queueStatus = "Almost Your Turn";
    } else if (enriched.queuePosition === 1 && patientsAhead === 0 && enriched.status === "WAITING") {
      queueStatus = "Next in Line";
    } else {
      const ageMinutes = (Date.now() - new Date(enriched.createdAt).getTime()) / (60 * 1000);
      if (ageMinutes < 3 && patientsAhead > 3) {
        queueStatus = "Registered";
      } else {
        queueStatus = "Waiting";
      }
    }

    // Mask patient name for privacy (e.g., "Sunita A." or "Sunita")
    const parts = (enriched.patientName || "Patient").trim().split(/\s+/);
    const maskedName = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0];

    // Strictly privacy-safe payload (NO phone numbers, NO other patients' data, NO DB IDs)
    return {
      tokenNumber: enriched.tokenNumber,
      passToken: enriched.passToken || enriched.id,
      patientName: maskedName,
      appointmentType: enriched.appointmentType,
      status: enriched.status,
      queueStatus,
      queuePosition: enriched.queuePosition,
      registeredAt: enriched.createdAt,
      calledAt: enriched.calledAt,
      consultationStartedAt: enriched.consultationStartedAt,
      completedAt: enriched.completedAt,
      clinicName: this.settings?.clinicName || "MediQ Apex Multi-Specialty Hospital & Research Institute",
      clinicAddress: this.settings?.address || "Sector 14, Institutional Area, New Delhi - 110025",
      doctor: {
        name: enriched.doctor?.name || "Consulting Physician",
        specialization: enriched.doctor?.specialization || "General Medicine",
        cabinNumber: enriched.doctor?.cabinNumber || "Cabin",
        currentDelayMins: enriched.doctor?.currentDelayMins || 0,
        delayReason: enriched.doctor?.delayReason || "",
        isPaused: Boolean(enriched.doctor?.isPaused),
        pauseReason: enriched.doctor?.pauseReason || ""
      },
      department: {
        name: enriched.department?.name || "General Outpatient",
        floor: enriched.department?.floor || "Ground Floor"
      },
      eta: {
        estimatedWaitMinutes: enriched.eta?.estimatedWaitMinutes ?? 0,
        minWaitMinutes: enriched.eta?.minWaitMinutes ?? 0,
        maxWaitMinutes: enriched.eta?.maxWaitMinutes ?? 0,
        formattedRange: enriched.eta?.formattedRange || "10–15 minutes",
        patientsAhead,
        currentServingToken: enriched.eta?.currentServingToken || null,
        isDelayed: isDoctorDelayed,
        delayMinutes: enriched.doctor?.currentDelayMins || 0,
        delayReason: enriched.doctor?.delayReason || "",
        isPaused: Boolean(enriched.doctor?.isPaused),
        pauseReason: enriched.doctor?.pauseReason || "",
        estimatedCallTime: enriched.eta?.estimatedCallTime || null,
        doctorPace: enriched.eta?.doctorPace || null
      }
    };
  }

  enrichToken(token) {
    const doctor = this.doctors.find(d => d.id === token.doctorId);
    const department = doctor ? this.departments.find(dp => dp.id === doctor.departmentId) : null;
    const docTokens = this.tokens.filter(t => t.doctorId === token.doctorId);

    const eta = calculateETAForToken({
      token,
      allTokensForDoctor: docTokens,
      doctor,
      bufferMins: this.settings?.consultationBufferMins || 2,
      clinicSettings: this.settings || {}
    });

    // Calculate queue position among waiting tokens for this doctor
    const waitingTokens = docTokens.filter(t => t.status === "WAITING");
    const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
    waitingTokens.sort((a, b) => {
      const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
      if (rankDiff !== 0) return rankDiff;
      if (a.queueSequenceNumber && b.queueSequenceNumber) {
        return a.queueSequenceNumber - b.queueSequenceNumber;
      }
      return new Date(a.createdAt || a.registeredAt).getTime() - new Date(b.createdAt || b.registeredAt).getTime();
    });

    const isConsulting = token.status === "CONSULTING" || token.status === "IN_CONSULTATION";
    const isCalled = token.status === "CALLED" || token.status === "CALLING";

    const queuePosition = token.status === "WAITING"
      ? waitingTokens.findIndex(t => t.id === token.id) + 1
      : isCalled || isConsulting
        ? 1
        : 0;

    return {
      ...token,
      queuePosition,
      doctor: doctor ? {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
        cabinNumber: doctor.cabinNumber,
        avgConsultationMins: doctor.avgConsultationMins,
        status: doctor.status,
        currentDelayMins: doctor.currentDelayMins,
        delayReason: doctor.delayReason,
        isPaused: doctor.isPaused,
        pauseReason: doctor.pauseReason || ""
      } : null,
      department: department ? {
        name: department.name,
        floor: department.floor
      } : null,
      eta
    };
  }

  // Call the next patient in queue (Guarded by Concurrency Lock)
  async callNextPatient(doctorId, performedBy = { role: "staff", name: "Frontdesk Staff" }) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found");

    return this.withDoctorLock(doctorId, async () => {
      if (doctor.isPaused) {
        throw new Error(`Cannot call patient: Dr. ${doctor.name}'s queue is currently paused.`);
      }

      // Queue Rule: Do not allow two active consultations for the same doctor
      const existingConsultation = this.tokens.find(
        t => t.doctorId === doctorId && (t.status === "CONSULTING" || t.status === "IN_CONSULTATION")
      );
      if (existingConsultation) {
        throw new Error(
          `Cannot call next patient: Doctor is currently in consultation with ${existingConsultation.patientName} (${existingConsultation.tokenNumber}). Please complete or skip it first.`
        );
      }

      // Queue Rule: Prevent duplicate calling if another patient is already waiting at door
      const existingCalled = this.tokens.find(
        t => t.doctorId === doctorId && (t.status === "CALLED" || t.status === "CALLING")
      );
      if (existingCalled) {
        throw new Error(
          `Cannot call next patient: Token ${existingCalled.tokenNumber} (${existingCalled.patientName}) is currently called. Please start consultation or skip before calling another.`
        );
      }

      const waitingTokens = this.tokens.filter(t => t.doctorId === doctorId && t.status === "WAITING");
      if (waitingTokens.length === 0) {
        return null;
      }

      // Priority sort: EMERGENCY (0) > SENIOR (1) > NORMAL (2), then sequence number
      const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
      waitingTokens.sort((a, b) => {
        const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
        if (rankDiff !== 0) return rankDiff;
        if (a.queueSequenceNumber && b.queueSequenceNumber) {
          return a.queueSequenceNumber - b.queueSequenceNumber;
        }
        return new Date(a.createdAt || a.registeredAt).getTime() - new Date(b.createdAt || b.registeredAt).getTime();
      });

      const nextToken = waitingTokens[0];
      const previousStatus = nextToken.status;
      nextToken.status = "CALLED";
      nextToken.calledAt = new Date().toISOString();

      doctor.status = "AVAILABLE";

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: nextToken.id,
        tokenNumber: nextToken.tokenNumber,
        doctorId,
        action: "CALLED",
        previousStatus,
        newStatus: "CALLED",
        performedBy,
        notes: `Token ${nextToken.tokenNumber} (${nextToken.patientName}) called to ${doctor.cabinNumber}`,
        timestamp: new Date().toISOString()
      });

      const enriched = this.enrichToken(nextToken);
      this.broadcast("PATIENT_CALLED", {
        token: enriched,
        doctor,
        cabin: doctor.cabinNumber
      });
      this.broadcast("QUEUE_UPDATED", { doctorId });

      return enriched;
    });
  }

  // Start Consultation (Guarded by Concurrency Lock)
  async startConsultation(tokenId, performedBy = { role: "doctor", name: "Consulting Doctor" }) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    return this.withDoctorLock(token.doctorId, async () => {
      if (token.status === "COMPLETED") {
        throw new Error("This consultation has already been completed.");
      }

      const anotherActive = this.tokens.find(
        t => t.doctorId === token.doctorId && t.id !== tokenId && (t.status === "CONSULTING" || t.status === "IN_CONSULTATION")
      );
      if (anotherActive) {
        throw new Error(`Cannot start consultation: Doctor is already consulting patient ${anotherActive.patientName} (${anotherActive.tokenNumber}).`);
      }

      const previousStatus = token.status;
      token.status = "CONSULTING";
      token.consultationStartedAt = new Date().toISOString();

      const doctor = this.doctors.find(d => d.id === token.doctorId);
      if (doctor) {
        doctor.status = "IN_CONSULTATION";
      }

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        doctorId: token.doctorId,
        action: "CONSULTATION_STARTED",
        previousStatus,
        newStatus: "CONSULTING",
        performedBy,
        notes: `Consultation started for ${token.tokenNumber} in ${doctor?.cabinNumber || "Cabin"}`,
        timestamp: new Date().toISOString()
      });

      const enriched = this.enrichToken(token);
      this.broadcast("CONSULTATION_STARTED", { token: enriched, doctorId: token.doctorId });
      this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

      return enriched;
    });
  }

  // Complete Consultation (Guarded by Concurrency Lock)
  async finishConsultation(tokenId, performedBy = { role: "doctor", name: "Consulting Doctor" }) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    return this.withDoctorLock(token.doctorId, async () => {
      if (token.status === "COMPLETED") {
        throw new Error("This token has already been marked as completed.");
      }

      const previousStatus = token.status;
      token.status = "COMPLETED";
      token.completedAt = new Date().toISOString();

      // Record consultation actual duration in minutes for empirical dynamic ETA tracking
      const startTime = token.consultationStartedAt ? new Date(token.consultationStartedAt) : new Date(Date.now() - 10 * 60000);
      token.actualDurationMins = Math.max(1, Math.round((new Date(token.completedAt) - startTime) / 60000));

      const doctor = this.doctors.find(d => d.id === token.doctorId);
      if (doctor) {
        doctor.status = "AVAILABLE";
      }

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        doctorId: token.doctorId,
        action: "COMPLETED",
        previousStatus,
        newStatus: "COMPLETED",
        performedBy,
        notes: `Consultation completed for ${token.tokenNumber} (${token.actualDurationMins} mins duration)`,
        timestamp: new Date().toISOString()
      });

      const enriched = this.enrichToken(token);
      this.broadcast("CONSULTATION_COMPLETED", { token: enriched, doctorId: token.doctorId });
      this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

      return enriched;
    });
  }

  // Skip Patient (Skip / No-Show)
  async skipPatient(tokenId, reason = "Patient not present / skipped", performedBy = { role: "staff", name: "Staff Member" }) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    return this.withDoctorLock(token.doctorId, async () => {
      if (token.status === "COMPLETED") {
        throw new Error("Cannot skip a consultation that has already completed.");
      }

      const previousStatus = token.status;
      token.status = "SKIPPED";
      token.skippedAt = new Date().toISOString();
      token.skipReason = reason;

      const doctor = this.doctors.find(d => d.id === token.doctorId);
      if (doctor && doctor.status === "IN_CONSULTATION") {
        doctor.status = "AVAILABLE";
      }

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        doctorId: token.doctorId,
        action: "SKIPPED",
        previousStatus,
        newStatus: "SKIPPED",
        performedBy,
        notes: `Token ${token.tokenNumber} skipped: ${reason}`,
        timestamp: new Date().toISOString()
      });

      const enriched = this.enrichToken(token);
      this.broadcast("TOKEN_UPDATED", { token: enriched, doctorId: token.doctorId });
      this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

      return enriched;
    });
  }

  // Recall Patient (Follows Clinic's Configured Recall Policy)
  async recallPatient(tokenId, performedBy = { role: "staff", name: "Staff Member" }) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    return this.withDoctorLock(token.doctorId, async () => {
      if (!["SKIPPED", "NO_SHOW"].includes(token.status)) {
        throw new Error("Only skipped or no-show patients can be recalled.");
      }

      const doctor = this.doctors.find(d => d.id === token.doctorId);
      if (doctor && doctor.isPaused) {
        throw new Error(`Cannot recall patient: ${doctor.name}'s queue is currently paused.`);
      }

      const previousStatus = token.status;
      token.recalledAt = new Date().toISOString();
      delete token.skipReason;

      const policy = this.settings?.recallPolicy || "NEXT"; // "NEXT", "ORIGINAL_POSITION", "END"

      if (policy === "NEXT") {
        // Recalls patient directly to front of line with highest expedited priority
        token.status = "WAITING";
        token.priority = "EMERGENCY";
      } else if (policy === "ORIGINAL_POSITION") {
        // Restores to waiting queue maintaining original sequence number and registration order
        token.status = "WAITING";
      } else if (policy === "END") {
        // Re-appends to the very end of the doctor's queue
        token.status = "WAITING";
        this.sequenceByDoctor[token.doctorId] = (this.sequenceByDoctor[token.doctorId] || 0) + 1;
        token.queueSequenceNumber = this.sequenceByDoctor[token.doctorId];
        token.createdAt = new Date().toISOString();
      }

      this.logs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        doctorId: token.doctorId,
        action: "RECALLED",
        previousStatus,
        newStatus: token.status,
        performedBy,
        notes: `Token ${token.tokenNumber} recalled via policy: ${policy} (${token.priority} priority)`,
        timestamp: new Date().toISOString()
      });

      const enriched = this.enrichToken(token);
      this.broadcast("TOKEN_UPDATED", { token: enriched, doctorId: token.doctorId });
      this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

      return enriched;
    });
  }

  // Audit Logs API
  getAuditLogs({ doctorId, tokenId, limit = 50 } = {}) {
    let logs = [...this.logs];
    if (doctorId && doctorId !== "ALL") {
      logs = logs.filter(l => l.doctorId === doctorId);
    }
    if (tokenId) {
      logs = logs.filter(l => l.tokenId === tokenId);
    }
    return logs.slice(0, Number(limit) || 50);
  }

  // Mark No-Show
  markNoShow(tokenId) {
    return this.skipPatient(tokenId, "Marked as No-Show");
  }

  // Cancel Token
  cancelToken(tokenId, reason = "Patient requested cancellation") {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    if (token.status === "COMPLETED") {
      throw new Error("Cannot cancel a completed consultation.");
    }

    token.status = "CANCELLED";
    token.cancelledAt = new Date().toISOString();
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
    const skipped = this.tokens.filter(t => t.status === "SKIPPED" || t.status === "NO_SHOW").length;
    const cancelled = this.tokens.filter(t => t.status === "CANCELLED").length;

    // Calculate actual average wait time from completed or waiting tokens
    const waitTimes = this.tokens.map(t => t.eta?.estimatedWaitMinutes || 12);
    const avgWaitTimeOverall = Math.round(waitTimes.reduce((a, b) => a + b, 0) / (waitTimes.length || 1));

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

    // Hourly traffic distribution
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
        skipped,
        cancelled,
        activeQueues: this.doctors.filter(d => !d.isPaused).length,
        avgWaitTimeOverall,
        satisfactionRate: 98.4
      },
      deptStats,
      hourlyData,
      doctorStats,
      recentLogs: this.logs.slice(0, 25)
    };
  }
}

export const store = new MediQStore();
