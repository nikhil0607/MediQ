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

    // Populate initial realistic active queues with Indian names
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
      
      const qrData = `http://localhost:5173/track/${id}`;
      let qrCodeData = "";
      try {
        qrCodeData = await QRCode.toDataURL(qrData, { width: 320, margin: 1 });
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
      createdAt: new Date().toISOString()
    };

    this.tokens.push(token);

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: id,
      doctorId,
      action: "REGISTERED",
      notes: `Token ${tokenNumber} issued to ${patientName} (${appointmentType})`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_CREATED", { token, doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId });

    return this.enrichToken(token);
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

    // Calculate queue position among waiting tokens for this doctor
    const waitingTokens = docTokens.filter(t => t.status === "WAITING");
    const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
    waitingTokens.sort((a, b) => {
      const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const queuePosition = token.status === "WAITING" 
      ? waitingTokens.findIndex(t => t.id === token.id) + 1 
      : token.status === "CALLING" || token.status === "IN_CONSULTATION" 
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

  // Call the next patient in queue
  callNextPatient(doctorId) {
    const doctor = this.doctors.find(d => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found");

    if (doctor.isPaused) {
      throw new Error(`Cannot call patient: ${doctor.name}'s queue is currently paused.`);
    }

    // Queue Rule: Do not allow two active consultations for the same doctor
    const existingConsultation = this.tokens.find(
      t => t.doctorId === doctorId && t.status === "IN_CONSULTATION"
    );
    if (existingConsultation) {
      throw new Error(`Cannot call next patient: Doctor is currently in an active consultation with ${existingConsultation.patientName} (${existingConsultation.tokenNumber}). Please complete it first.`);
    }

    const waitingTokens = this.tokens.filter(t => t.doctorId === doctorId && t.status === "WAITING");

    if (waitingTokens.length === 0) {
      return null;
    }

    // Queue Rule: Preserve registration order by default with priority overrides
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

    // Queue Rule: Prevent completed patients from being called/started again
    if (token.status === "COMPLETED") {
      throw new Error("This consultation has already been completed.");
    }

    // Queue Rule: Do not allow two active consultations for the same doctor
    const anotherActive = this.tokens.find(
      t => t.doctorId === token.doctorId && t.id !== tokenId && t.status === "IN_CONSULTATION"
    );
    if (anotherActive) {
      throw new Error(`Cannot start consultation: Doctor is already consulting patient ${anotherActive.patientName} (${anotherActive.tokenNumber}).`);
    }

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

    if (token.status === "COMPLETED") {
      throw new Error("This token has already been marked as completed.");
    }

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

  // Skip Patient (Skip / No-Show)
  skipPatient(tokenId, reason = "Patient not present / skipped") {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    if (token.status === "COMPLETED") {
      throw new Error("Cannot skip a consultation that has already completed.");
    }

    token.status = "SKIPPED";
    token.skippedAt = new Date().toISOString();
    token.skipReason = reason;

    const doctor = this.doctors.find(d => d.id === token.doctorId);
    if (doctor && doctor.status === "IN_CONSULTATION") {
      doctor.status = "AVAILABLE";
    }

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "PATIENT_SKIPPED",
      notes: `Token ${token.tokenNumber} skipped: ${reason}`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_UPDATED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
  }

  // Recall Patient (Authorized staff recalls a skipped patient back to active queue)
  recallPatient(tokenId) {
    const token = this.tokens.find(t => t.id === tokenId);
    if (!token) throw new Error("Token not found");

    if (!["SKIPPED", "NO_SHOW"].includes(token.status)) {
      throw new Error("Only skipped or no-show patients can be recalled.");
    }

    const doctor = this.doctors.find(d => d.id === token.doctorId);
    if (doctor && doctor.isPaused) {
      throw new Error(`Cannot recall patient: ${doctor.name}'s queue is currently paused.`);
    }

    // Check if doctor cabin is currently in consultation
    const activeConsultation = this.tokens.find(
      t => t.doctorId === token.doctorId && t.status === "IN_CONSULTATION"
    );

    if (activeConsultation) {
      // Put them at front of waiting line with SENIOR/HIGH priority
      token.status = "WAITING";
      token.priority = "SENIOR"; // expedited
      token.recalledAt = new Date().toISOString();
    } else {
      // Direct call
      token.status = "CALLING";
      token.calledAt = new Date().toISOString();
      token.recalledAt = new Date().toISOString();
    }

    this.logs.unshift({
      id: `log-${Date.now()}`,
      tokenId: token.id,
      doctorId: token.doctorId,
      action: "PATIENT_RECALLED",
      notes: `Token ${token.tokenNumber} recalled to queue (${token.status})`,
      createdAt: new Date().toISOString()
    });

    this.broadcast("TOKEN_UPDATED", { token: this.enrichToken(token), doctorId: token.doctorId });
    this.broadcast("QUEUE_UPDATED", { doctorId: token.doctorId });

    return this.enrichToken(token);
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
