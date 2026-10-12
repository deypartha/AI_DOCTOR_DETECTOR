// Seed script — run with: node seed.js
// Creates 5 hospitals with 3 doctors each + admin credentials for each hospital

const BASE = "http://localhost:3000";

const hospitals = [
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
    departments: ["Urology", "Gastroenterology", "Pulmonology", "Endocrinology"],
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

async function post(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function seed() {
  console.log("Starting seed...\n");

  for (const h of hospitals) {
    // 1. Create hospital
    const hospital = await post("/api/hospitals", {
      name: h.name, address: h.address, city: h.city, location: h.location, phone: h.phone,
      emergencyPhone: h.emergencyPhone, emergencyAvailable: h.emergencyAvailable,
      openTime: h.openTime, closeTime: h.closeTime, departments: h.departments,
    });

    if (!hospital._id) {
      console.error(`Failed to create hospital: ${h.name}`, hospital);
      continue;
    }
    console.log(`✅ Hospital created: ${hospital.name} (${hospital._id})`);

    // 2. Register admin for this hospital
    const adminRes = await post("/api/admin-auth/register", {
      hospitalId: hospital._id,
      email: h.adminEmail,
      password: h.adminPassword,
    });
    console.log(`   Admin: ${h.adminEmail} / ${h.adminPassword} — ${adminRes.message || adminRes.error}`);

    // 3. Add each doctor
    for (const d of h.doctors) {
      const doctor = await post("/api/doctors", {
        name: d.name, specialization: d.specialization,
        experience: d.experience, consultationFee: d.consultationFee,
        slotDuration: d.slotDuration, availableDays: d.availableDays,
        hospitalId: hospital._id, isActive: true,
      });

      if (!doctor._id) {
        console.error(`   ❌ Failed to add doctor: ${d.name}`, doctor);
        continue;
      }
      console.log(`   👨‍⚕️  Doctor added: ${doctor.name}`);

      // 4. Create doctor login credentials
      const authRes = await post("/api/doctor-auth/register", {
        doctorId: doctor._id,
        email: d.loginEmail,
        password: d.loginPassword,
      });
      console.log(`      Login: ${d.loginEmail} / ${d.loginPassword} — ${authRes.message || authRes.error}`);
    }

    console.log("");
  }

  console.log("Seed complete!");
  console.log("\n── Admin logins ──────────────────────────────");
  hospitals.forEach(h => console.log(`${h.name}: ${h.adminEmail} / ${h.adminPassword}`));
  console.log("\n── Doctor logins (all passwords: doctor123) ──");
  hospitals.forEach(h => h.doctors.forEach(d => console.log(`${d.name}: ${d.loginEmail}`)));
}

seed().catch(console.error);
