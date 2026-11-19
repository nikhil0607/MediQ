import express from "express";
import {
  getTokens,
  getTokenById,
  getPublicPass,
  createToken,
  callNextPatient,
  startConsultation,
  finishConsultation,
  skipPatient,
  recallPatient,
  markNoShow,
  cancelToken,
  updatePriority,
  pauseQueue,
  resumeQueue
} from "../controllers/queueController.js";

const router = express.Router();

router.get("/tokens", getTokens);
router.get("/tokens/:id", getTokenById);
router.get("/pass/:passToken", getPublicPass);
router.post("/tokens", createToken);
router.post("/call-next", callNextPatient);
router.post("/tokens/:id/start", startConsultation);
router.post("/tokens/:id/finish", finishConsultation);
router.post("/tokens/:id/skip", skipPatient);
router.post("/tokens/:id/recall", recallPatient);
router.post("/tokens/:id/no-show", markNoShow);
router.post("/tokens/:id/cancel", cancelToken);
router.patch("/tokens/:id/priority", updatePriority);
router.post("/doctors/:id/pause", pauseQueue);
router.post("/doctors/:id/resume", resumeQueue);

export default router;
