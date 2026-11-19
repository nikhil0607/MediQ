import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import { useNotification } from "./NotificationContext";

const QueueContext = createContext();

export function QueueProvider({ children }) {
  const [tokens, setTokens] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const eventSourceRef = useRef(null);

  const { showToast } = useNotification();

  // Load all initial state from backend
  const loadData = useCallback(async () => {
    try {
      const [tokRes, docRes, deptRes, setRes] = await Promise.all([
        api.getTokens(),
        api.getDoctors(),
        api.getDepartments(),
        api.getSettings()
      ]);

      if (tokRes.success) setTokens(tokRes.data);
      if (docRes.success) setDoctors(docRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (setRes.success) setSettings(setRes.data.settings);
    } catch (err) {
      console.warn("Error fetching initial queue data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    loadData();

    const eventsUrl = import.meta.env.VITE_EVENTS_URL || "/events";
    let es;

    try {
      es = new EventSource(eventsUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          setLastEvent(payload);

          const { event, data } = payload;

          if (event === "TOKEN_CREATED") {
            setTokens(prev => [data.token, ...prev.filter(t => t.id !== data.token.id)]);
            showToast({
              title: "New Token Issued",
              message: `Token ${data.token.tokenNumber} created for ${data.token.patientName}`,
              type: "info",
              sound: "notice"
            });
            api.getDoctors().then(res => res.success && setDoctors(res.data));
          } else if (event === "PATIENT_CALLED") {
            const { token, doctor, cabin } = data;
            setTokens(prev => prev.map(t => t.id === token.id ? token : t));
            showToast({
              title: `Calling Token ${token.tokenNumber}`,
              message: `${token.patientName} please report to ${cabin} (${doctor.name})`,
              type: "warning",
              sound: "call"
            });
            api.getDoctors().then(res => res.success && setDoctors(res.data));
          } else if (event === "CONSULTATION_STARTED" || event === "CONSULTATION_COMPLETED" || event === "TOKEN_UPDATED" || event === "PATIENT_SKIPPED" || event === "PATIENT_RECALLED") {
            if (data.token) {
              setTokens(prev => prev.map(t => t.id === data.token.id ? data.token : t));
            }
            api.getDoctors().then(res => res.success && setDoctors(res.data));
          } else if (event === "DOCTOR_DELAY_CHANGED") {
            const { doctorId, delayMins, reason } = data;
            setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, currentDelayMins: Number(delayMins), delayReason: reason } : d));
            api.getTokens().then(res => res.success && setTokens(res.data));
            showToast({
              title: "Doctor Schedule Adjusted",
              message: `Delay of ${delayMins} min updated. Patient wait times recalculated.`,
              type: "warning"
            });
          } else if (event === "DOCTOR_PAUSE_TOGGLED") {
            const { doctorId, isPaused, pauseReason } = data;
            setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, isPaused, pauseReason } : d));
          } else if (event === "DOCTOR_UPDATED") {
            if (data && data.id) {
              setDoctors(prev => prev.map(d => d.id === data.id ? { ...d, ...data } : d));
            }
          } else if (event === "QUEUE_UPDATED") {
            api.getTokens().then(res => res.success && setTokens(res.data));
            api.getDoctors().then(res => res.success && setDoctors(res.data));
          }
        } catch (err) {
          // ignore heartbeat parse errors
        }
      };

      es.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn("SSE connection error:", e);
    }

    // Fallback polling every 8 seconds if SSE is not active
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        api.getTokens().then(r => r.success && setTokens(r.data)).catch(() => {});
        api.getDoctors().then(r => r.success && setDoctors(r.data)).catch(() => {});
      }
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
    };
  }, [loadData, showToast, isConnected]);

  // Actions
  const createToken = async (data) => {
    const res = await api.createToken(data);
    if (res.success && res.data) {
      setTokens(prev => [res.data, ...prev.filter(t => t.id !== res.data.id)]);
      loadData();
    }
    return res;
  };

  const callNext = async (doctorId) => {
    const res = await api.callNextPatient(doctorId);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const startConsultation = async (tokenId) => {
    const res = await api.startConsultation(tokenId);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const finishConsultation = async (tokenId) => {
    const res = await api.finishConsultation(tokenId);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const skipPatient = async (tokenId, reason = "Patient not present / skipped") => {
    const res = await api.skipPatient(tokenId, reason);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const recallPatient = async (tokenId) => {
    const res = await api.recallPatient(tokenId);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const markNoShow = async (tokenId) => {
    const res = await api.markNoShow(tokenId);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const cancelToken = async (tokenId, reason) => {
    const res = await api.cancelToken(tokenId, reason);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const updateTokenPriority = async (tokenId, priority) => {
    const res = await api.updateTokenPriority(tokenId, priority);
    if (res.success && res.data) {
      setTokens(prev => prev.map(t => t.id === res.data.id ? res.data : t));
      loadData();
    }
    return res;
  };

  const setDoctorDelay = async (doctorId, delayMins, reason) => {
    const res = await api.setDoctorDelay(doctorId, delayMins, reason);
    if (res.success) {
      loadData();
    }
    return res;
  };

  const setDoctorAvailability = async (doctorId, status, reason) => {
    const res = await api.setDoctorAvailability(doctorId, status, reason);
    if (res.success) {
      loadData();
    }
    return res;
  };

  const pauseDoctorQueue = async (doctorId, reason) => {
    const res = await api.pauseDoctorQueue(doctorId, reason);
    if (res.success) {
      loadData();
    }
    return res;
  };

  const resumeDoctorQueue = async (doctorId) => {
    const res = await api.resumeDoctorQueue(doctorId);
    if (res.success) {
      loadData();
    }
    return res;
  };

  const toggleDoctorPause = async (doctorId) => {
    const res = await api.toggleDoctorPause(doctorId);
    if (res.success) {
      loadData();
    }
    return res;
  };

  return (
    <QueueContext.Provider
      value={{
        tokens,
        doctors,
        departments,
        settings,
        loading,
        isConnected,
        lastEvent,
        refresh: loadData,
        createToken,
        callNext,
        startConsultation,
        finishConsultation,
        skipPatient,
        recallPatient,
        markNoShow,
        cancelToken,
        updateTokenPriority,
        setDoctorDelay,
        setDoctorAvailability,
        pauseDoctorQueue,
        resumeDoctorQueue,
        toggleDoctorPause
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error("useQueue must be used within a QueueProvider");
  return context;
}
