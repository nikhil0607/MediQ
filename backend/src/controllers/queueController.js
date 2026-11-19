import { store } from "../db/store.js";

export const getTokens = async (req, res) => {
  try {
    const { doctorId, status } = req.query;
    const tokens = store.getTokens({ doctorId, status });
    res.json({ success: true, count: tokens.length, data: tokens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTokenById = async (req, res) => {
  try {
    const { id } = req.params;
    const token = store.getTokenById(id);
    if (!token) {
      return res.status(404).json({ success: false, message: "Token not found" });
    }
    res.json({ success: true, data: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPublicPass = async (req, res) => {
  try {
    const { passToken } = req.params;
    const pass = store.getPublicPass(passToken);
    if (!pass) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired queue pass."
      });
    }
    res.json({ success: true, data: pass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createToken = async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      appointmentType,
      doctorId,
      priority,
      notes
    } = req.body;

    if (!patientName || !patientName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Patient name is required"
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Please select an assigned doctor"
      });
    }

    const token = await store.createToken({
      patientName: patientName.trim(),
      patientPhone: patientPhone ? patientPhone.trim() : "",
      patientAge: patientAge ? Number(patientAge) : null,
      patientGender: patientGender || "Other",
      appointmentType: appointmentType || "General Consultation",
      doctorId,
      priority: priority || "NORMAL",
      notes: notes ? notes.trim() : ""
    });

    res.status(201).json({ success: true, message: "Token generated successfully", data: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const callNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    const token = store.callNextPatient(doctorId);
    if (!token) {
      return res.status(200).json({
        success: false,
        message: "No waiting patients remaining in this doctor's queue",
        data: null
      });
    }

    res.json({ success: true, message: `Called token ${token.tokenNumber}`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const startConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const token = store.startConsultation(id);
    res.json({ success: true, message: "Consultation started", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const finishConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const token = store.finishConsultation(id);
    res.json({ success: true, message: "Consultation completed", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const skipPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const token = store.skipPatient(id, reason);
    res.json({ success: true, message: `Patient ${token.tokenNumber} skipped`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const recallPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const token = store.recallPatient(id);
    res.json({ success: true, message: `Patient ${token.tokenNumber} recalled to queue`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const token = store.markNoShow(id);
    res.json({ success: true, message: "Marked as No-Show", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const cancelToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const token = store.cancelToken(id, reason);
    res.json({ success: true, message: "Token cancelled", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    if (!priority) {
      return res.status(400).json({ success: false, message: "Priority is required" });
    }
    const token = store.updateTokenPriority(id, priority);
    res.json({ success: true, message: `Priority set to ${priority}`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const pauseQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doc = store.pauseQueue(id, reason);
    res.json({ success: true, message: `Queue paused for ${doc.name}`, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resumeQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = store.resumeQueue(id);
    res.json({ success: true, message: `Queue resumed for ${doc.name}`, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
