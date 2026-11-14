// Seed data for MediQ
export const initialDepartments = [
  {
    id: "dept-1",
    name: "General Medicine",
    code: "GEN",
    description: "Primary healthcare, routine consultations, and preventative medicine.",
    floor: "Ground Floor, Wing A"
  },
  {
    id: "dept-2",
    name: "Cardiology & Vascular",
    code: "CARD",
    description: "Heart health, hypertension monitoring, and ECG diagnostics.",
    floor: "2nd Floor, Wing B"
  },
  {
    id: "dept-3",
    name: "Pediatrics & Child Health",
    code: "PED",
    description: "Infant, child, and adolescent healthcare and immunizations.",
    floor: "1st Floor, Wing C"
  },
  {
    id: "dept-4",
    name: "Orthopedics & Sports Medicine",
    code: "ORTHO",
    description: "Bone fractures, joint pain, spine care, and mobility rehabilitation.",
    floor: "3rd Floor, Wing A"
  }
];

export const initialDoctors = [
  {
    id: "doc-1",
    name: "Dr. Sarah Jenkins, MD",
    email: "sarah.jenkins@mediq.health",
    departmentId: "dept-1",
    departmentName: "General Medicine",
    specialization: "Internal Medicine Specialist",
    cabinNumber: "Cabin 102",
    avgConsultationMins: 10,
    status: "IN_CONSULTATION", // AVAILABLE, IN_CONSULTATION, ON_BREAK, OFF_DUTY
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-1"
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, FACC",
    email: "marcus.vance@mediq.health",
    departmentId: "dept-2",
    departmentName: "Cardiology & Vascular",
    specialization: "Senior Interventional Cardiologist",
    cabinNumber: "Cabin 204",
    avgConsultationMins: 15,
    status: "IN_CONSULTATION",
    currentDelayMins: 15,
    delayReason: "Emergency Ward Consultation Call",
    isPaused: false,
    activeQueueId: "queue-2"
  },
  {
    id: "doc-3",
    name: "Dr. Emily Thorne, MD",
    email: "emily.thorne@mediq.health",
    departmentId: "dept-3",
    departmentName: "Pediatrics & Child Health",
    specialization: "Consultant Pediatrician",
    cabinNumber: "Cabin 108",
    avgConsultationMins: 12,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-3"
  },
  {
    id: "doc-4",
    name: "Dr. Robert Chen, MS",
    email: "robert.chen@mediq.health",
    departmentId: "dept-4",
    departmentName: "Orthopedics & Sports Medicine",
    specialization: "Joint Replacement & Spine Specialist",
    cabinNumber: "Cabin 301",
    avgConsultationMins: 15,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-4"
  }
];

export const initialSettings = {
  clinicName: "MediQ Central Health Pavilion",
  tagline: "Smart, Dignified Patient Queue Management",
  address: "742 Healthcare Parkway, Medical District, Suite 200",
  phone: "+1 (800) 555-MEDIQ",
  emergencyPhone: "+1 (800) 911-HELP",
  consultationBufferMins: 2,
  enableAudioChime: true,
  enableSmsAlerts: true,
  autoAdvanceNext: false
};

