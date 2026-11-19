import express from "express";
import {
  getDoctors,
  getDoctorById,
  updateDoctor,
  setDoctorDelay,
  toggleDoctorPause,
  setDoctorAvailability
} from "../controllers/doctorController.js";

const router = express.Router();

router.get("/doctors", getDoctors);
router.get("/doctors/:id", getDoctorById);
router.patch("/doctors/:id", updateDoctor);
router.post("/doctors/:id/delay", setDoctorDelay);
router.post("/doctors/:id/toggle-pause", toggleDoctorPause);
router.post("/doctors/:id/availability", setDoctorAvailability);

export default router;

