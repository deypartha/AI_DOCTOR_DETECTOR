"use client";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="navbar">
      <div className="logo">
        <button onClick={() => router.push("/")}>MediBook</button>
      </div>

      <ul className="nav-links">
        <li><button className="view-all" onClick={() => router.push("/")}>Home</button></li>
        <li><button className="view-all" onClick={() => router.push("/hospitals")}>Hospitals</button></li>
        <li><button className="view-all" style={{ color: "#2aa9a1", fontWeight: "bold" }} onClick={() => router.push("/ai-consultation")}>🤖 AI Doctor</button></li>
        <li>About</li>
        <li>Contact</li>
      </ul>

      <div className="nav-actions">
        <button
          className="btn-outline"
          style={{ borderColor: "#ef4444", color: "#dc2626", fontWeight: "bold" }}
          onClick={() => router.push("/ai-consultation")}
        >
          🚨 Emergency / AI Finder
        </button>
        <button className="btn-outline admin-nav-btn" onClick={() => router.push("/hospital-admin/login")}>
          Hospital Admin
        </button>
        <button className="btn-outline" onClick={() => router.push("/doctor-portal/login")}>
          Doctor Login
        </button>
        <button className="btn-primary" onClick={() => router.push("/hospitals")}>
          Book Appointment
        </button>
        <button className="btn-primary" onClick={() => router.push("/my-appointments")}>
          My Appointments
        </button>
      </div>
    </nav>
  );
}
