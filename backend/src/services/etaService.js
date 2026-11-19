/**
 * MediQ Dynamic ETA Calculation Service
 * 
 * Accurately models waiting time using:
 * - Dynamic consultation pace: T_avg = (0.7 × recent average) + (0.3 × historical average)
 * - Duration adjustment based on appointment type complexity
 * - Real elapsed time of currently consulting patient
 * - Queue pause buffers and doctor delay adjustments
 * - Natural approximate wait time range formatting (e.g. "Approximately 20–30 minutes")
 */

/**
 * Calculates dynamic average consultation duration for a doctor
 * T_avg = (0.7 × recent average) + (0.3 × historical average)
 */
export function calculateDynamicDoctorPace(doctor, allTokensForDoctor, defaultConfig = {}) {
  const defaultMins = Number(defaultConfig.defaultConsultationMins || 12);
  const historicalAvg = Number(doctor?.avgConsultationMins) || defaultMins;
  const sampleLimit = Number(defaultConfig.recentConsultationSampleLimit || 5);

  // Extract completed consultations with valid start & end timestamps
  const completedTokens = (allTokensForDoctor || [])
    .filter(t => 
      t.doctorId === doctor?.id &&
      t.status === "COMPLETED" &&
      t.consultationStartedAt &&
      t.completedAt
    )
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, sampleLimit);

  if (completedTokens.length === 0) {
    return {
      tAvg: historicalAvg,
      recentAvg: null,
      historicalAvg,
      sampleCount: 0,
      isEmpirical: false
    };
  }

  // Calculate actual duration in minutes for each completed token
  const durations = completedTokens.map(t => {
    const ms = new Date(t.completedAt).getTime() - new Date(t.consultationStartedAt).getTime();
    const mins = ms / (1000 * 60);
    // Clamp individual consultation outliers between 3 and 60 minutes
    return Math.max(3, Math.min(60, Math.round(mins * 10) / 10));
  });

  const recentAvg = durations.reduce((sum, d) => sum + d, 0) / durations.length;

  let tAvg;
  if (durations.length >= 2) {
    // Standard weighted formula: 70% recent empirical + 30% historical baseline
    tAvg = (0.7 * recentAvg) + (0.3 * historicalAvg);
  } else {
    // 1 sample: blend 40% recent + 60% historical
    tAvg = (0.4 * recentAvg) + (0.6 * historicalAvg);
  }

  // Round to 1 decimal place and clamp to sensible clinical bounds (4 to 45 mins)
  const clampedPace = Math.max(4, Math.min(45, Math.round(tAvg * 10) / 10));

  return {
    tAvg: clampedPace,
    recentAvg: Math.round(recentAvg * 10) / 10,
    historicalAvg,
    sampleCount: durations.length,
    isEmpirical: true
  };
}

/**
 * Returns complexity multiplier based on appointment type
 */
export function getAppointmentComplexityMultiplier(appointmentType = "") {
  const type = String(appointmentType).toLowerCase();

  if (type.includes("emergency") || type.includes("triage")) {
    return 1.4;
  }
  if (type.includes("specialist") || type.includes("procedure") || type.includes("surgery") || type.includes("dressing")) {
    return 1.25;
  }
  if (type.includes("follow") || type.includes("report") || type.includes("review")) {
    return 0.75;
  }
  if (type.includes("vaccination") || type.includes("immunization") || type.includes("routine")) {
    return 0.65;
  }
  // Default general consultation
  return 1.0;
}

/**
 * Formats approximate wait range (e.g. "Approximately 20–30 minutes")
 */
export function formatWaitRange(expectedMins, status = "WAITING") {
  if (status === "COMPLETED") {
    return "Completed";
  }
  if (status === "CONSULTING" || status === "IN_CONSULTATION") {
    return "Inside Doctor Cabin";
  }
  if (status === "CALLED" || status === "CALLING") {
    return "Next in Line (0–2 minutes)";
  }
  if (status === "SKIPPED") {
    return "Pass Skipped";
  }
  if (status === "CANCELLED" || status === "NO_SHOW") {
    return "Not in Active Queue";
  }

  if (expectedMins <= 3) {
    return "Less than 5 minutes";
  }
  if (expectedMins <= 8) {
    return "Approximately 5–10 minutes";
  }
  if (expectedMins <= 15) {
    return "Approximately 10–15 minutes";
  }

  // Bracket into 5 or 10-minute intervals
  const minWait = Math.max(5, Math.floor((expectedMins * 0.85) / 5) * 5);
  const maxWait = Math.max(minWait + 5, Math.ceil((expectedMins * 1.15) / 5) * 5);

  return `Approximately ${minWait}–${maxWait} minutes`;
}

/**
 * Main dynamic ETA calculation function for a specific token
 */
export function calculateETAForToken({
  token,
  allTokensForDoctor = [],
  doctor,
  bufferMins = 2,
  clinicSettings = {}
}) {
  const currentDelay = Number(doctor?.currentDelayMins || 0);
  const isDoctorPaused = Boolean(doctor?.isPaused);

  // Status check shortcuts
  const isCurrentlyConsulting = token.status === "CONSULTING" || token.status === "IN_CONSULTATION";
  const isCurrentlyCalled = token.status === "CALLED" || token.status === "CALLING";

  if (isCurrentlyConsulting) {
    return {
      estimatedWaitMinutes: 0,
      minWaitMinutes: 0,
      maxWaitMinutes: 0,
      formattedRange: "Currently Inside Cabin",
      patientsAhead: 0,
      isNext: true,
      currentServingToken: token.tokenNumber,
      isDelayed: currentDelay > 0,
      delayMinutes: currentDelay,
      delayReason: doctor?.delayReason || "",
      isPaused: isDoctorPaused,
      estimatedCallTime: new Date().toISOString()
    };
  }

  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(token.status)) {
    return {
      estimatedWaitMinutes: 0,
      minWaitMinutes: 0,
      maxWaitMinutes: 0,
      formattedRange: token.status === "COMPLETED" ? "Completed" : "Not Active",
      patientsAhead: 0,
      isNext: false,
      currentServingToken: null,
      isDelayed: false,
      delayMinutes: 0,
      delayReason: "",
      isPaused: false,
      estimatedCallTime: null
    };
  }

  // Calculate dynamic pace T_avg = (0.7 × recent) + (0.3 × historical)
  const pace = calculateDynamicDoctorPace(doctor, allTokensForDoctor, clinicSettings);
  const baseTAvg = pace.tAvg;

  // Find currently serving token for this doctor
  const activeServingToken = allTokensForDoctor.find(t => 
    t.status === "CONSULTING" || t.status === "IN_CONSULTATION" ||
    t.status === "CALLED" || t.status === "CALLING"
  );

  // If this token itself is the one called
  if (isCurrentlyCalled || (activeServingToken && activeServingToken.id === token.id && (token.status === "CALLED" || token.status === "CALLING"))) {
    return {
      estimatedWaitMinutes: 1,
      minWaitMinutes: 0,
      maxWaitMinutes: 2,
      formattedRange: "Next in Line (0–2 minutes)",
      patientsAhead: 0,
      isNext: true,
      currentServingToken: token.tokenNumber,
      isDelayed: currentDelay > 0,
      delayMinutes: currentDelay,
      delayReason: doctor?.delayReason || "",
      isPaused: isDoctorPaused,
      estimatedCallTime: new Date().toISOString()
    };
  }

  // Calculate remaining time for the patient currently inside/called
  let currentPatientRemainingMins = 0;
  if (activeServingToken) {
    const currentMultiplier = getAppointmentComplexityMultiplier(activeServingToken.appointmentType);
    const expectedCurrentDuration = (baseTAvg * currentMultiplier) + bufferMins;

    if (activeServingToken.consultationStartedAt) {
      const elapsedMs = Date.now() - new Date(activeServingToken.consultationStartedAt).getTime();
      const elapsedMins = Math.floor(elapsedMs / (1000 * 60));
      currentPatientRemainingMins = Math.max(1, Math.round(expectedCurrentDuration - elapsedMins));
    } else {
      // Just called, consultation about to begin
      currentPatientRemainingMins = Math.round(expectedCurrentDuration);
    }
  }

  // Eligible waiting tokens ahead of target patient
  const waitingTokens = allTokensForDoctor.filter(t => 
    t.status === "WAITING" || 
    ((t.status === "CALLED" || t.status === "CALLING") && t.id !== activeServingToken?.id)
  );

  // Priority sorting: EMERGENCY (0) > SENIOR (1) > NORMAL (2), then registration order
  const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
  waitingTokens.sort((a, b) => {
    const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
    if (rankDiff !== 0) return rankDiff;

    // Secondary: sequence number if present, else registration timestamp
    if (a.queueSequenceNumber && b.queueSequenceNumber) {
      return a.queueSequenceNumber - b.queueSequenceNumber;
    }
    return new Date(a.createdAt || a.registeredAt).getTime() - new Date(b.createdAt || b.registeredAt).getTime();
  });

  const myIndexInWaitlist = waitingTokens.findIndex(t => t.id === token.id);
  const eligibleAheadTokens = myIndexInWaitlist > 0 ? waitingTokens.slice(0, myIndexInWaitlist) : [];
  const patientsAhead = (myIndexInWaitlist === -1 ? 0 : myIndexInWaitlist) + (activeServingToken ? 1 : 0);

  // Calculate cumulative wait by summing individual expected durations of patients ahead
  let cumulativeWaitMins = 0;

  // Add current active consultation remaining time
  if (activeServingToken) {
    cumulativeWaitMins += currentPatientRemainingMins;
  }

  // Add expected duration for each patient waiting ahead
  for (const aheadPatient of eligibleAheadTokens) {
    const patientMultiplier = getAppointmentComplexityMultiplier(aheadPatient.appointmentType);
    cumulativeWaitMins += (baseTAvg * patientMultiplier) + bufferMins;
  }

  // Add known doctor schedule delay
  cumulativeWaitMins += currentDelay;

  // If queue is paused, add pause buffer (e.g. 10 minutes or remaining pause)
  if (isDoctorPaused) {
    cumulativeWaitMins += 10;
  }

  const finalExpectedWaitMinutes = Math.max(0, Math.ceil(cumulativeWaitMins));

  // Compute realistic approximate range
  let minWaitMinutes = 0;
  let maxWaitMinutes = 0;

  if (finalExpectedWaitMinutes <= 3) {
    minWaitMinutes = 0;
    maxWaitMinutes = 5;
  } else if (finalExpectedWaitMinutes <= 10) {
    minWaitMinutes = Math.max(1, finalExpectedWaitMinutes - 3);
    maxWaitMinutes = finalExpectedWaitMinutes + 3;
  } else {
    minWaitMinutes = Math.max(5, Math.floor((finalExpectedWaitMinutes * 0.85) / 5) * 5);
    maxWaitMinutes = Math.max(minWaitMinutes + 5, Math.ceil((finalExpectedWaitMinutes * 1.15) / 5) * 5);
  }

  const formattedRange = formatWaitRange(finalExpectedWaitMinutes, token.status);
  const estimatedCallTime = new Date(Date.now() + finalExpectedWaitMinutes * 60 * 1000).toISOString();

  return {
    estimatedWaitMinutes: finalExpectedWaitMinutes,
    minWaitMinutes,
    maxWaitMinutes,
    formattedRange,
    patientsAhead: Math.max(0, patientsAhead),
    isNext: patientsAhead <= 1,
    currentServingToken: activeServingToken ? activeServingToken.tokenNumber : "None",
    isDelayed: currentDelay > 0,
    delayMinutes: currentDelay,
    delayReason: doctor?.delayReason || "",
    isPaused: isDoctorPaused,
    pauseReason: doctor?.pauseReason || "",
    estimatedCallTime,
    doctorPace: {
      tAvg: pace.tAvg,
      recentAvg: pace.recentAvg,
      sampleCount: pace.sampleCount,
      isEmpirical: pace.isEmpirical
    }
  };
}
