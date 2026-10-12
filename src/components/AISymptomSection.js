"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaStethoscope,
  FaAmbulance,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";
import { IoSparkles, IoAlertCircle } from "react-icons/io5";

export default function AISymptomSection() {
  const router = useRouter();
  const [symptomText, setSymptomText] = useState("");

  const popularSymptoms = [
    "Severe Chest Pain & Sweating",
    "Shortness of Breath / Asthma",
    "High Fever (103°F) & Shivering",
    "Broken Bone / Inability to Walk",
    "Unbearable Stomach Pain & Vomiting",
    "Infant Fever & Continuous Crying",
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (symptomText.trim()) {
      router.push(`/ai-consultation?initial=${encodeURIComponent(symptomText.trim())}`);
    } else {
      router.push("/ai-consultation");
    }
  }

  function handleQuickPick(text) {
    router.push(`/ai-consultation?initial=${encodeURIComponent(text)}`);
  }

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
        padding: "70px 24px",
        borderRadius: "24px",
        maxWidth: "1200px",
        margin: "40px auto",
        boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.4)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(42, 169, 161, 0.2)",
            color: "#5eead4",
            padding: "6px 16px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "16px",
            border: "1px solid rgba(42, 169, 161, 0.4)",
          }}
        >
          <IoSparkles /> Instant AI Clinical Assessment & Nearest Doctor Finder
        </div>

        <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "14px", lineHeight: 1.3 }}>
          Feeling Unwell? Let AI Detect Your Problem & Connect You With The Nearest Doctor
        </h2>

        <p style={{ color: "#94a3b8", fontSize: "16px", marginBottom: "30px", lineHeight: 1.6 }}>
          Elaborate your symptoms in plain language. Our clinical AI analyzes the potential condition,
          determines severity, and finds verified specialists at nearest hospitals. In serious conditions,
          get an emergency priority appointment immediately.
        </p>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "white",
            padding: "8px 8px 8px 18px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            maxWidth: "720px",
            margin: "0 auto 24px",
          }}
        >
          <FaStethoscope style={{ color: "#2aa9a1", fontSize: "20px", flexShrink: 0 }} />
          <input
            type="text"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "#0f172a",
              background: "transparent",
            }}
            placeholder="Describe your health problem (e.g. sharp chest pain, high fever for 3 days...)"
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
            }}
          >
            Detect Problem <FaArrowRight />
          </button>
        </form>

        {/* Quick Symptoms */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "30px" }}>
          <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center", marginRight: "4px" }}>
            Common issues:
          </span>
          {popularSymptoms.map((sym, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPick(sym)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#e2e8f0",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Features Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            textAlign: "left",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ background: "rgba(42, 169, 161, 0.2)", color: "#2aa9a1", padding: "10px", borderRadius: "10px" }}>
              <IoSparkles />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>AI Symptom Detection</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Understands actual illness and primary specialty</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ background: "rgba(2, 132, 199, 0.2)", color: "#38bdf8", padding: "10px", borderRadius: "10px" }}>
              <FaMapMarkerAlt />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>Nearest Doctors First</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>GPS calculation finds closest recovery specialists</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ background: "rgba(220, 38, 38, 0.2)", color: "#f87171", padding: "10px", borderRadius: "10px" }}>
              <FaAmbulance />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>Emergency Priority Booking</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Critical patients get available nearest slot immediately</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
