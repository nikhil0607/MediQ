/**
 * MediQ Dynamic ETA Calculation Service
 * Accurately models waiting time based on doctor pace, current consultation elapsed time,
 * doctor delays, and queue position with priority overrides.
 */

export function calculateETAForToken({
  token,
  allTokensForDoctor,
  doctor,
  bufferMins = 2
}) {
  const avgMins = Number(doctor?.avgConsultationMins || 12);
  const currentDelay = Number(doctor?.currentDelayMins || 0);

  // If already in consultation, ETA is 0
  if (token.status === "IN_CONSULTATION") {
    return {
      estimatedWaitMinutes: 0,
      patientsAhead: 0,
      isNext: true,
      currentServingToken: token.tokenNumber,
      isDelayed: currentDelay > 0,
      delayMinutes: currentDelay,
      delayReason: doctor?.delayReason || "",
      estimatedCallTime: new Date().toISOString()
    };
  }

  // If completed or cancelled or no-show
  if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(token.status)) {
    return {
      estimatedWaitMinutes: 0,
      patientsAhead: 0,
      isNext: false,
      currentServingToken: null,
      isDelayed: false,
      delayMinutes: 0,
      delayReason: "",
      estimatedCallTime: null
    };
  }

  // Find currently serving token (CALLING or IN_CONSULTATION)
  const servingToken = allTokensForDoctor.find(t => 
    t.status === "IN_CONSULTATION" || t.status === "CALLING"
  );

  // Calculate remaining time for the patient currently being served
  let currentPatientRemainingMins = 0;
  if (servingToken) {
    if (servingToken.id === token.id) {
      return {
        estimatedWaitMinutes: 0,
        patientsAhead: 0,
        isNext: true,
        currentServingToken: servingToken.tokenNumber,
        isDelayed: currentDelay > 0,
        delayMinutes: currentDelay,
        delayReason: doctor?.delayReason || "",
        estimatedCallTime: new Date().toISOString()
      };
    }

    if (servingToken.consultationStartedAt) {
      const elapsedMs = Date.now() - new Date(servingToken.consultationStartedAt).getTime();
      const elapsedMins = Math.floor(elapsedMs / (1000 * 60));
      currentPatientRemainingMins = Math.max(1, (avgMins + bufferMins) - elapsedMins);
    } else {
      // Just called, consultation about to begin
      currentPatientRemainingMins = avgMins + bufferMins;
    }
  }

  // Filter all tokens waiting ahead of this token
  // Active queue ordering: Emergency priority first, then creation timestamp / registration sequence
  const waitingTokens = allTokensForDoctor.filter(t => 
    (t.status === "WAITING" || (t.status === "CALLING" && t.id !== servingToken?.id))
  );

  // Sort queue by priority (EMERGENCY > SENIOR > NORMAL) and then createdAt
  const priorityRank = { EMERGENCY: 0, SENIOR: 1, NORMAL: 2 };
  waitingTokens.sort((a, b) => {
    const rankDiff = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
    if (rankDiff !== 0) return rankDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const myIndexInWaitlist = waitingTokens.findIndex(t => t.id === token.id);
  const patientsAhead = myIndexInWaitlist === -1 ? 0 : myIndexInWaitlist + (servingToken ? 1 : 0);

  // Calculate cumulative wait minutes
  let waitMinutes = 0;
  if (servingToken) {
    waitMinutes += currentPatientRemainingMins;
  }

  if (myIndexInWaitlist > 0) {
    waitMinutes += myIndexInWaitlist * (avgMins + bufferMins);
  }

  // Add doctor delay if doctor is running behind
  waitMinutes += currentDelay;

  // Round up to sensible display integer
  const finalWaitMinutes = Math.max(0, Math.ceil(waitMinutes));
  const estimatedCallTime = new Date(Date.now() + finalWaitMinutes * 60 * 1000).toISOString();

  return {
    estimatedWaitMinutes: finalWaitMinutes,
    patientsAhead: Math.max(0, patientsAhead),
    isNext: patientsAhead <= 1,
    currentServingToken: servingToken ? servingToken.tokenNumber : "None",
    isDelayed: currentDelay > 0,
    delayMinutes: currentDelay,
    delayReason: doctor?.delayReason || "",
    estimatedCallTime
  };
}

