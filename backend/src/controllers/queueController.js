import { store } from "../db/store.js";

// Helper: Extract staff identity for audit logging
function extractStaffPerformer(req) {
  const role = req.headers["x-user-role"] || req.user?.role || "staff";
  const name = req.headers["x-user-name"] || req.user?.name || `${role.toUpperCase()} Staff`;
  return { role, name };
}

// Rule 9: Only authorized staff can modify queue states
function checkStaffAuthorization(req, res) {
  const role = (req.headers["x-user-role"] || req.user?.role || "staff").toLowerCase();
  const allowed = ["receptionist", "doctor", "admin", "staff"];
  if (!allowed.includes(role)) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Only authorized clinical staff can perform queue operations."
    });
    return false;
  }
  return true;
}

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
    if (!checkStaffAuthorization(req, res)) return;

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

    const performer = extractStaffPerformer(req);
    const token = await store.createToken({
      patientName: patientName.trim(),
      patientPhone: patientPhone ? patientPhone.trim() : "",
      patientAge: patientAge ? Number(patientAge) : null,
      patientGender: patientGender || "Other",
      appointmentType: appointmentType || "General Consultation",
      doctorId,
      priority: priority || "NORMAL",
      notes: notes ? notes.trim() : "",
      performedBy: performer
    });

    res.status(201).json({ success: true, message: "Token generated successfully", data: token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const callNextPatient = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    const performer = extractStaffPerformer(req);
    const token = await store.callNextPatient(doctorId, performer);
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
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const performer = extractStaffPerformer(req);
    const token = await store.startConsultation(id, performer);
    res.json({ success: true, message: "Consultation started", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const finishConsultation = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const performer = extractStaffPerformer(req);
    const token = await store.finishConsultation(id, performer);
    res.json({ success: true, message: "Consultation completed", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const skipPatient = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const { reason } = req.body;
    const performer = extractStaffPerformer(req);
    const token = await store.skipPatient(id, reason, performer);
    res.json({ success: true, message: `Patient ${token.tokenNumber} skipped`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const recallPatient = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const performer = extractStaffPerformer(req);
    const token = await store.recallPatient(id, performer);
    res.json({ success: true, message: `Patient ${token.tokenNumber} recalled to queue`, data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const markNoShow = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const performer = extractStaffPerformer(req);
    const token = await store.skipPatient(id, "Marked as No-Show", performer);
    res.json({ success: true, message: "Marked as No-Show", data: token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const cancelToken = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

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
    if (!checkStaffAuthorization(req, res)) return;

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
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const { reason } = req.body;
    const performer = extractStaffPerformer(req);
    const doc = store.pauseQueue(id, reason, performer);
    res.json({ success: true, message: `Queue paused for Dr. ${doc.name}`, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const resumeQueue = async (req, res) => {
  try {
    if (!checkStaffAuthorization(req, res)) return;

    const { id } = req.params;
    const performer = extractStaffPerformer(req);
    const doc = store.resumeQueue(id, performer);
    res.json({ success: true, message: `Queue resumed for Dr. ${doc.name}`, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { doctorId, tokenId, limit } = req.query;
    const logs = store.getAuditLogs({ doctorId, tokenId, limit });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetDemoData = async (req, res) => {
  try {
    const role = (req.headers["x-user-role"] || "").toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Demo data reset is restricted to Demo Administrators. Please switch to the Admin profile to reset demo data."
      });
    }

    const result = store.resetDemoData();
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
