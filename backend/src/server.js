import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import queueRoutes from "./routes/queueRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { store } from "./db/store.js";
import "./config/supabase.js"; // Initialize Supabase if keys provided

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

// Server-Sent Events (SSE) Endpoint for Real-time Queue Updates
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connection handshake
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", message: "MediQ Realtime Stream Active" })}\n\n`);

  // Subscribe to store broadcasts
  const unsubscribe = store.subscribe(payload => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// API Routes
app.use("/api/queue", queueRoutes);
app.use("/api", doctorRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);

// System Health & Diagnostics
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "MediQ Queue Engine",
    connectedClients: store.listeners.size
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "MediQ Hospital & Clinic Queue Management API",
    version: "1.0.0",
    docs: "/api/health"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MediQ Server running on http://localhost:${PORT}`);
  console.log(`📡 Realtime SSE stream live at http://localhost:${PORT}/events`);
});

