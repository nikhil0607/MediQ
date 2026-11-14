// Seed data for MediQ with diverse Indian medical specialties and providers
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
    name: "Orthopedics & Joint Care",
    code: "ORTHO",
    description: "Bone fractures, joint pain, spine care, and mobility rehabilitation.",
    floor: "3rd Floor, Wing A"
  },
  {
    id: "dept-5",
    name: "Dermatology & Skin Care",
    code: "DERM",
    description: "Skin conditions, allergies, clinical cosmetology, and laser care.",
    floor: "1st Floor, Wing A"
  },
  {
    id: "dept-6",
    name: "Obstetrics & Gynecology",
    code: "GYN",
    description: "Women's wellness, antenatal care, and reproductive health.",
    floor: "2nd Floor, Wing A"
  },
  {
    id: "dept-7",
    name: "Ophthalmology & Eye Care",
    code: "OPHTH",
    description: "Comprehensive vision testing, retina care, and cataract consultations.",
    floor: "Ground Floor, Wing C"
  },
  {
    id: "dept-8",
    name: "ENT (Ear, Nose & Throat)",
    code: "ENT",
    description: "Sinusitis, hearing diagnostics, vertigo, and throat treatments.",
    floor: "2nd Floor, Wing C"
  },
  {
    id: "dept-9",
    name: "Neurology & Brain Health",
    code: "NEURO",
    description: "Headaches, neuropathy, epilepsy, stroke, and neuromuscular care.",
    floor: "3rd Floor, Wing B"
  },
  {
    id: "dept-10",
    name: "Pulmonology & Respiratory",
    code: "PULMO",
    description: "Asthma, COPD, lung infections, and post-viral respiratory review.",
    floor: "1st Floor, Wing B"
  }
];

export const initialDoctors = [
  {
    id: "doc-1",
    name: "Dr. Ananya Sharma, MD",
    email: "ananya.sharma@mediq.health",
    departmentId: "dept-1",
    departmentName: "General Medicine",
    specialization: "Internal Medicine Specialist",
    cabinNumber: "Cabin 102",
    avgConsultationMins: 10,
    status: "IN_CONSULTATION",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-1"
  },
  {
    id: "doc-2",
    name: "Dr. Rajesh V. Iyer, DM",
    email: "rajesh.iyer@mediq.health",
    departmentId: "dept-2",
    departmentName: "Cardiology & Vascular",
    specialization: "Senior Interventional Cardiologist",
    cabinNumber: "Cabin 204",
    avgConsultationMins: 15,
    status: "IN_CONSULTATION",
    currentDelayMins: 15,
    delayReason: "Emergency Ward Angiography Consultation",
    isPaused: false,
    activeQueueId: "queue-2"
  },
  {
    id: "doc-3",
    name: "Dr. Priya Nair, MD",
    email: "priya.nair@mediq.health",
    departmentId: "dept-3",
    departmentName: "Pediatrics & Child Health",
    specialization: "Consultant Pediatrician & Neonatologist",
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
    name: "Dr. Vikramaditya Rathore, MS",
    email: "vikramaditya.rathore@mediq.health",
    departmentId: "dept-4",
    departmentName: "Orthopedics & Joint Care",
    specialization: "Joint Replacement & Arthroscopy Specialist",
    cabinNumber: "Cabin 301",
    avgConsultationMins: 15,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-4"
  },
  {
    id: "doc-5",
    name: "Dr. Arjun Banerjee, MD, DNB",
    email: "arjun.banerjee@mediq.health",
    departmentId: "dept-5",
    departmentName: "Dermatology & Skin Care",
    specialization: "Consultant Dermatologist & Dermatosurgeon",
    cabinNumber: "Cabin 105",
    avgConsultationMins: 10,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-5"
  },
  {
    id: "doc-6",
    name: "Dr. Sunita Deshmukh, MD, DGO",
    email: "sunita.deshmukh@mediq.health",
    departmentId: "dept-6",
    departmentName: "Obstetrics & Gynecology",
    specialization: "Senior Obstetrician & High-Risk Pregnancy Specialist",
    cabinNumber: "Cabin 202",
    avgConsultationMins: 14,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-6"
  },
  {
    id: "doc-7",
    name: "Dr. Sneha Kulkarni, MS",
    email: "sneha.kulkarni@mediq.health",
    departmentId: "dept-7",
    departmentName: "Ophthalmology & Eye Care",
    specialization: "Vitreo-Retina & Phaco-Cataract Surgeon",
    cabinNumber: "Cabin 114",
    avgConsultationMins: 12,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-7"
  },
  {
    id: "doc-8",
    name: "Dr. Meenakshi Sundaram, MS, DLO",
    email: "meenakshi.sundaram@mediq.health",
    departmentId: "dept-8",
    departmentName: "ENT (Ear, Nose & Throat)",
    specialization: "Head, Neck & Endoscopic Sinus Surgeon",
    cabinNumber: "Cabin 206",
    avgConsultationMins: 10,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-8"
  },
  {
    id: "doc-9",
    name: "Dr. Rohan Verma, DM",
    email: "rohan.verma@mediq.health",
    departmentId: "dept-9",
    departmentName: "Neurology & Brain Health",
    specialization: "Neurologist, Stroke & Epilepsy Specialist",
    cabinNumber: "Cabin 305",
    avgConsultationMins: 18,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-9"
  },
  {
    id: "doc-10",
    name: "Dr. Amitav Ghosh, MD, FCCP",
    email: "amitav.ghosh@mediq.health",
    departmentId: "dept-10",
    departmentName: "Pulmonology & Respiratory",
    specialization: "Senior Pulmonologist & Sleep Apnea Specialist",
    cabinNumber: "Cabin 112",
    avgConsultationMins: 14,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-10"
  },
  {
    id: "doc-11",
    name: "Dr. Kavita Reddy, MD, DM",
    email: "kavita.reddy@mediq.health",
    departmentId: "dept-1",
    departmentName: "General Medicine",
    specialization: "Consultant Diabetologist & Endocrinologist",
    cabinNumber: "Cabin 210",
    avgConsultationMins: 12,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-11"
  },
  {
    id: "doc-12",
    name: "Dr. Harpreet Singh Gill, MS, MCh",
    email: "harpreet.gill@mediq.health",
    departmentId: "dept-4",
    departmentName: "Orthopedics & Joint Care",
    specialization: "Pediatric Orthopedics & Trauma Surgeon",
    cabinNumber: "Cabin 308",
    avgConsultationMins: 15,
    status: "AVAILABLE",
    currentDelayMins: 0,
    delayReason: "",
    isPaused: false,
    activeQueueId: "queue-12"
  }
];

export const initialSettings = {
  clinicName: "MediQ Apex Multi-Specialty Hospital & Research Institute",
  tagline: "Smart, Dignified Patient Queue Management Platform",
  address: "Plot 14, Institutional Area, Health City, Sector 44, New Delhi, Delhi 110001",
  phone: "+91 (11) 4500-8000",
  emergencyPhone: "+91 98110 23456",
  consultationBufferMins: 2,
  enableAudioChime: true,
  enableSmsAlerts: true,
  autoAdvanceNext: false
};
