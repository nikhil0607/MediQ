import express from "express";
import { getSettings, updateSettings, getDepartments } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", getSettings);
router.patch("/", updateSettings);
router.get("/departments", getDepartments);

export default router;

