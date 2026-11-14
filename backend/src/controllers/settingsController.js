import { store } from "../db/store.js";

export const getSettings = async (req, res) => {
  try {
    const settings = store.getSettings();
    const departments = store.getDepartments();
    res.json({
      success: true,
      data: {
        settings,
        departments
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updated = store.updateSettings(req.body);
    res.json({ success: true, message: "Settings updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = store.getDepartments();
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

