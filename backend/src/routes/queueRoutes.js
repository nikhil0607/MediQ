import express from "express";
import {
  getTokens,
  getTokenById,
  createToken,
  callNextPatient,
  startConsultation,
  finishConsultation,
  markNoShow,
  cancelToken,
  updatePriority
} from "../controllers/queueController.js";

const router = express.Router();

router.get("/tokens", getTokens);
router.get("/tokens/:id", getTokenById);
router.post("/tokens", createToken);
router.post("/call-next", callNextPatient);
router.post("/tokens/:id/start", startConsultation);
router.post("/tokens/:id/finish", finishConsultation);
router.post("/tokens/:id/no-show", markNoShow);
router.post("/tokens/:id/cancel", cancelToken);
router.patch("/tokens/:id/priority", updatePriority);

export default router;

