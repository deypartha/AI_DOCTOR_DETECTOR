import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medibook";

// Schemas
const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    city: String,
    location: { lat: Number, lng: Number },
    phone: String,
    emergencyPhone: String,
    emergencyAvailable: { type: Boolean, default: true },
    openTime: String,
    closeTime: String,
    departments: [String],
  },
  { timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    specialization: String,
    experience: Number,
    consultationFee: Number,
    slotDuration: Number,
    availableDays: [String],
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  },
  { timestamps: true }
);

const doctorAuthSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const adminAuthSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    patientName: String,
    email: String,
    phone: String,
    reason: String,
    status: { type: String, default: "confirmed" },
    isEmergency: { type: Boolean, default: false },
    severity: { type: String, enum: ["routine", "urgent", "emergency"], default: "routine" },
    aiDiagnosis: String,
    aiSummary: String,
    emergencyNotes: String,
  },
  { timestamps: true }
);

const Hospital = mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
const DoctorAuth = mongoose.models.DoctorAuth || mongoose.model("DoctorAuth", doctorAuthSchema);
const AdminAuth = mongoose.models.AdminAuth || mongoose.model("AdminAuth", adminAuthSchema);
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

const hospitalsData = [
  {
    name: "Apollo Multispecialty Hospital",
    address: "Lawrence Road, Amritsar, Punjab 143001",
    city: "Amritsar",
    location: { lat: 31.6340, lng: 74.8723 },
    phone: "+91 98760 11111",
    emergencyPhone: "+91 98760 11119",
    emergencyAvailable: true,
    openTime: "8:00 AM",
    closeTime: "9:00 PM",
    departments: ["Cardiology", "Neurology", "Orthopedics", "Oncology"],
    adminEmail: "admin@apollo.com",
    adminPassword: "apollo123",
    doctors: [
      { name: "Dr. Rajesh Sharma", specialization: "Cardiologist", experience: 15, consultationFee: 1200, slotDuration: 30, availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"], loginEmail: "rajesh@apollo.com", loginPassword: "doctor123" },
      { name: "Dr. Priya Mehta",   specialization: "Neurologist",  experience: 10, consultationFee: 1000, slotDuration: 30, availableDays: ["Monday","Wednesday","Friday","Saturday"],             loginEmail: "priya@apollo.com",  loginPassword: "doctor123" },
      { name: "Dr. Anil Kapoor",   specialization: "Orthopedic Surgeon", experience: 12, consultationFee: 900, slotDuration: 45, availableDays: ["Tuesday","Thursday","Saturday"],                loginEmail: "anil@apollo.com",   loginPassword: "doctor123" },
    ],
  },
  {
    name: "Fortis Escorts Hospital",
    address: "Majitha Verka Bypass, Amritsar, Punjab 143004",
    city: "Amritsar",
    location: { lat: 31.6521, lng: 74.9085 },
    phone: "+91 98760 22222",
    emergencyPhone: "+91 98760 22229",
    emergencyAvailable: true,
    openTime: "9:00 AM",
    closeTime: "8:00 PM",
    departments: ["Gynecology", "Pediatrics", "Dermatology", "General Medicine"],
    adminEmail: "admin@fortis.com",
    adminPassword: "fortis123",
    doctors: [
      { name: "Dr. Sunita Bhatia",  specialization: "Gynecologist",      experience: 18, consultationFee: 800,  slotDuration: 30, availableDays: ["Monday","Tuesday","Wednesday","Thursday"],         loginEmail: "sunita@fortis.com",  loginPassword: "doctor123" },
      { name: "Dr. Vikram Singh",   specialization: "Pediatrician",      experience: 8,  consultationFee: 600,  slotDuration: 20, availableDays: ["Monday","Wednesday","Friday","Saturday","Sunday"], loginEmail: "vikram@fortis.com",  loginPassword: "doctor123" },
      { name: "Dr. Neha Arora",     specialization: "Dermatologist",     experience: 6,  consultationFee: 700,  slotDuration: 20, availableDays: ["Tuesday","Thursday","Friday"],                    loginEmail: "neha@fortis.com",   loginPassword: "doctor123" },
    ],
  },
  {
    name: "Max Super Speciality Hospital",
    address: "GT Road, Jalandhar, Punjab 144001",
    city: "Jalandhar",
    location: { lat: 31.3260, lng: 75.5762 },
    phone: "+91 98760 33333",
    emergencyPhone: "+91 98760 33339",
    emergencyAvailable: true,
    openTime: "7:00 AM",
    closeTime: "10:00 PM",
    departments: ["Urology", "Gastroenterology", "Pulmonologist", "Endocrinology"],
    adminEmail: "admin@max.com",
    adminPassword: "max12345",
    doctors: [
      { name: "Dr. Harpreet Gill",  specialization: "Urologist",         experience: 14, consultationFee: 1100, slotDuration: 30, availableDays: ["Monday","Tuesday","Thursday","Friday"],           loginEmail: "harpreet@max.com",  loginPassword: "doctor123" },
      { name: "Dr. Mandeep Kaur",   specialization: "Gastroenterologist",experience: 9,  consultationFee: 950,  slotDuration: 30, availableDays: ["Monday","Wednesday","Friday"],                   loginEmail: "mandeep@max.com",   loginPassword: "doctor123" },
      { name: "Dr. Sanjay Verma",   specialization: "Pulmonologist",     experience: 11, consultationFee: 850,  slotDuration: 30, availableDays: ["Tuesday","Wednesday","Thursday","Saturday"],     loginEmail: "sanjay@max.com",    loginPassword: "doctor123" },
    ],
  },
  {
    name: "Ivy Hospital",
    address: "Sector 71, Mohali, Punjab 160071",
    city: "Mohali",
    location: { lat: 30.7046, lng: 76.7179 },
    phone: "+91 98760 44444",
    emergencyPhone: "+91 98760 44449",
    emergencyAvailable: true,
    openTime: "8:30 AM",
    closeTime: "7:30 PM",
    departments: ["Ophthalmology", "ENT", "Psychiatry", "Physiotherapy"],
    adminEmail: "admin@ivy.com",
    adminPassword: "ivy12345",
    doctors: [
      { name: "Dr. Gurpreet Sandhu", specialization: "Ophthalmologist",  experience: 13, consultationFee: 750,  slotDuration: 20, availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"], loginEmail: "gurpreet@ivy.com",  loginPassword: "doctor123" },
      { name: "Dr. Ritu Malhotra",   specialization: "ENT Specialist",   experience: 7,  consultationFee: 650,  slotDuration: 20, availableDays: ["Monday","Wednesday","Friday","Saturday"],         loginEmail: "ritu@ivy.com",      loginPassword: "doctor123" },
      { name: "Dr. Amit Chauhan",    specialization: "Psychiatrist",     experience: 16, consultationFee: 1300, slotDuration: 60, availableDays: ["Tuesday","Thursday","Saturday"],                  loginEmail: "amit@ivy.com",      loginPassword: "doctor123" },
    ],
  },
  {
    name: "Civil Hospital Ludhiana",
    address: "Ferozepur Road, Ludhiana, Punjab 141001",
    city: "Ludhiana",
    location: { lat: 30.9010, lng: 75.8573 },
    phone: "+91 98760 55555",
    emergencyPhone: "+91 98760 55559",
    emergencyAvailable: true,
    openTime: "9:00 AM",
    closeTime: "5:00 PM",
    departments: ["General Medicine", "Surgery", "Radiology", "Pathology"],
    adminEmail: "admin@civil.com",
    adminPassword: "civil123",
    doctors: [
      { name: "Dr. Balwinder Johal", specialization: "General Physician", experience: 20, consultationFee: 300, slotDuration: 15, availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], loginEmail: "balwinder@civil.com", loginPassword: "doctor123" },
      { name: "Dr. Poonam Dhaliwal", specialization: "General Surgeon",  experience: 17, consultationFee: 500, slotDuration: 30, availableDays: ["Monday","Tuesday","Wednesday","Thursday","Friday"],           loginEmail: "poonam@civil.com",   loginPassword: "doctor123" },
      { name: "Dr. Rajeev Nair",     specialization: "Radiologist",      experience: 10, consultationFee: 400, slotDuration: 20, availableDays: ["Monday","Wednesday","Friday"],                               loginEmail: "rajeev@civil.com",   loginPassword: "doctor123" },
    ],
  },
];

async function seedDirect() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI, { dbName: "medibook" });
  console.log("Connected to MongoDB successfully!\n");

  // Clear existing collections for a fresh clean state
  await Hospital.deleteMany({});
  await Doctor.deleteMany({});
  await DoctorAuth.deleteMany({});
  await AdminAuth.deleteMany({});
  await Appointment.deleteMany({});

  console.log("Cleaned old test records.\nPopulating Hospitals, Doctors, Auth, and Sample Appointments...\n");

  const createdDoctors = [];
  const createdHospitals = [];

  for (const h of hospitalsData) {
    const hospital = await Hospital.create({
      name: h.name,
      address: h.address,
      city: h.city,
      location: h.location,
      phone: h.phone,
      emergencyPhone: h.emergencyPhone,
      emergencyAvailable: h.emergencyAvailable,
      openTime: h.openTime,
      closeTime: h.closeTime,
      departments: h.departments,
    });
    createdHospitals.push(hospital);
    console.log(`🏥 Created Hospital: ${hospital.name} (Location: ${hospital.city})`);

    // Admin Auth
    const adminHashed = await bcrypt.hash(h.adminPassword, 10);
    await AdminAuth.create({
      hospitalId: hospital._id,
      email: h.adminEmail.toLowerCase(),
      password: adminHashed,
    });
    console.log(`   🔑 Admin Login: ${h.adminEmail} (password: ${h.adminPassword})`);

    // Doctors
    for (const d of h.doctors) {
      const doctor = await Doctor.create({
        name: d.name,
        specialization: d.specialization,
        experience: d.experience,
        consultationFee: d.consultationFee,
        slotDuration: d.slotDuration,
        availableDays: d.availableDays,
        hospitalId: hospital._id,
      });
      createdDoctors.push({ doctor, hospital, d });
      console.log(`   👨‍⚕️ Added Doctor: ${doctor.name} — ${doctor.specialization}`);

      // Doctor Auth
      const docHashed = await bcrypt.hash(d.loginPassword, 10);
      await DoctorAuth.create({
        doctorId: doctor._id,
        email: d.loginEmail.toLowerCase(),
        password: docHashed,
      });
    }
    console.log("");
  }

  // Add Demo Appointments (including Emergency priority cases)
  const todayStr = new Date().toISOString().slice(0, 10);

  // 1. Emergency Case for Cardiologist Dr. Rajesh Sharma
  const cardiologist = createdDoctors.find((item) => item.doctor.specialization === "Cardiologist");
  if (cardiologist) {
    await Appointment.create({
      hospitalId: cardiologist.hospital._id,
      doctorId: cardiologist.doctor._id,
      date: todayStr,
      time: "Immediate Emergency Triage",
      patientName: "Amanpreet Kaur",
      phone: "+91 98765 12345",
      email: "amanpreet@example.com",
      reason: "🚨 [EMERGENCY TRIAGE] Acute Chest Pain radiating to left arm with rapid heartbeats and severe sweating",
      status: "confirmed",
      isEmergency: true,
      severity: "emergency",
      aiDiagnosis: "Suspected Acute Coronary Syndrome / Angina",
      aiSummary: "Patient exhibited crushing chest pain with autonomic signs. Flagged for critical immediate cardiac evaluation.",
      emergencyNotes: "Attendant Contact: +91 98765 99999 (Husband)",
    });
    console.log("🚨 Added Demo Emergency Appointment for Cardiologist Dr. Rajesh Sharma");
  }

  // 2. Urgent Case for Orthopedic Dr. Anil Kapoor
  const ortho = createdDoctors.find((item) => item.doctor.specialization === "Orthopedic Surgeon");
  if (ortho) {
    await Appointment.create({
      hospitalId: ortho.hospital._id,
      doctorId: ortho.doctor._id,
      date: todayStr,
      time: "11:30 AM",
      patientName: "Rohan Verma",
      phone: "+91 98765 23456",
      email: "rohan@example.com",
      reason: "Severe sports injury after fall: inability to bear weight on right knee, acute joint swelling",
      status: "confirmed",
      isEmergency: false,
      severity: "urgent",
      aiDiagnosis: "Suspected Ligament Tear / Fracture",
      aiSummary: "Acute joint trauma with mechanical block. X-ray / MRI advised.",
    });
    console.log("📅 Added Demo Urgent Appointment for Orthopedic Surgeon Dr. Anil Kapoor");
  }

  // 3. Routine Case for General Physician Dr. Balwinder Johal
  const gp = createdDoctors.find((item) => item.doctor.specialization === "General Physician");
  if (gp) {
    await Appointment.create({
      hospitalId: gp.hospital._id,
      doctorId: gp.doctor._id,
      date: todayStr,
      time: "10:15 AM",
      patientName: "Gurleen Singh",
      phone: "+91 98765 34567",
      email: "gurleen@example.com",
      reason: "Seasonal viral fever, body ache, and mild cough for past 2 days",
      status: "confirmed",
      isEmergency: false,
      severity: "routine",
      aiDiagnosis: "Acute Febrile Illness / Viral Infection",
      aiSummary: "Typical viral fever symptoms. Routine consultation and paracetamol prescribed.",
    });
    console.log("📅 Added Demo Routine Appointment for General Physician Dr. Balwinder Johal");
  }

  console.log("\n==========================================");
  console.log("🎉 DATABASE SEEDED SUCCESSFULLY!");
  console.log("Hospitals Created: 5");
  console.log("Doctors Created: 15");
  console.log("Sample Appointments: 3 (Including Emergency Case)");
  console.log("==========================================\n");

  await mongoose.disconnect();
}

seedDirect().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
