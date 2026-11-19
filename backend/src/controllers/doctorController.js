import { store } from "../db/store.js";

export const getDoctors = async (req, res) => {
  try {
    const doctors = store.getDoctors();
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = store.getDoctorById(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = store.updateDoctor(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, message: "Doctor details updated", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setDoctorDelay = async (req, res) => {
  try {
    const { id } = req.params;
    const { delayMins, reason } = req.body;
    const updated = store.setDoctorDelay(id, delayMins, reason);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({
      success: true,
      message: `Delay updated to ${delayMins} mins. All patient ETAs recalculated.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleDoctorPause = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = store.toggleDoctorPause(id);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({
      success: true,
      message: `Queue ${updated.isPaused ? "paused" : "resumed"}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const updated = store.setDoctorAvailability(id, status, reason);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    res.json({
      success: true,
      message: `Doctor availability set to ${status}`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

