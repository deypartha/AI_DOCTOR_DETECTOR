"use client";
import styles from "./Hero.module.css";
import { useRouter } from "next/navigation";


export default function Hero() {
  const router = useRouter();

  return (
    <section className="hero">
      <span className="badge">Book in under 2 minutes</span>

      <h1 className={styles.animated_text}>
        Your Health, <br />
        <span>Our Priority </span>
      </h1>

      <p className={styles.animated_text}>
        Book appointments with top doctors at leading hospitals.
        Simple, fast, and secure healthcare scheduling.
      </p>

      <div className="hero-buttons" style={{ flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "15px" }}>
        <button
          className="btn-primary"
          style={{ background: "#0284c7", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}
          onClick={() => router.push("/ai-consultation")}
        >
          🤖 AI Problem Detector & Doctor Finder →
        </button>
        <button
          className="btn-outline"
          style={{ borderColor: "#ef4444", color: "#dc2626", fontWeight: "bold", background: "#fef2f2" }}
          onClick={() => router.push("/ai-consultation")}
        >
          🚨 Emergency Fast Booking
        </button>
        <button className="btn-outline" onClick={() => router.push("/hospitals")}>
          Find a Hospital
        </button>
      </div>
    </section>
  );
}
