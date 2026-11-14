import { store } from "../db/store.js";

export const getAnalytics = async (req, res) => {
  try {
    const analytics = store.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

