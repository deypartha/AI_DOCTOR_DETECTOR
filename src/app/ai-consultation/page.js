"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaUserMd,
  FaStethoscope,
  FaAmbulance,
  FaShieldAlt,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaLocationArrow,
  FaClock,
  FaPhoneAlt,
  FaCheckCircle,
  FaTimes,
  FaHospital,
  FaHeartbeat,
} from "react-icons/fa";
import {
  IoSparkles,
  IoAlertCircle,
  IoNavigateCircle,
  IoCall,
} from "react-icons/io5";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "@/app/styles/ai-consultation.css";

const QUICK_SYMPTOMS = [
  { label: "❤️ Severe Chest Pain", text: "Severe chest pain radiating to left arm with rapid heartbeats and sweating", critical: true },
  { label: "🫁 Shortness of Breath", text: "Severe shortness of breath, feeling suffocated, chest tightness and gasping", critical: true },
  { label: "🧠 Sudden Weakness / Stroke", text: "Sudden facial drooping, weakness on one side of arm and slurred speech", critical: true },
  { label: "🦴 Broken Bone / Fracture", text: "Severe fall injury with suspected broken bone, extreme swelling and cannot bear weight", critical: false },
  { label: "🔥 High Fever & Shivering", text: "High fever (103°F) for 3 days with shivering, severe headache, body ache and nausea", critical: false },
  { label: "🤢 Severe Abdominal Pain", text: "Unbearable sharp pain in lower right stomach with continuous vomiting", critical: true },
  { label: "👶 Infant High Fever", text: "Baby has 102°F fever, crying uncontrollably and refusing milk for past 6 hours", critical: true },
  { label: "🩹 Skin Rash & Itching", text: "Intense red itchy rash spreading across arms and neck with hives", critical: false },
  { label: "🩸 Deep Cut / Bleeding", text: "Deep open cut wound bleeding heavily after accident", critical: true },
  { label: "💧 Kidney / Flank Pain", text: "Severe sharp pain in lower back and side flank with burning urination", critical: false },
];

function AIConsultationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Input states
  const [problemDescription, setProblemDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [city, setCity] = useState("Amritsar");
  const [userCoords, setUserCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | detecting | active | error
  const [isEmergencyForced, setIsEmergencyForced] = useState(false);

  // Sync initial query parameter
  useEffect(() => {
    const initialText = searchParams.get("initial");
    if (initialText) {
      setProblemDescription(initialText);
      const isCrit = QUICK_SYMPTOMS.some((s) => s.text.toLowerCase().includes(initialText.toLowerCase()) && s.critical);
      if (isCrit) setIsEmergencyForced(true);
    }
  }, [searchParams]);

  // Response states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diagnosisData, setDiagnosisData] = useState(null);

  // Emergency Booking Modal State
  const [selectedEmergencyDoctor, setSelectedEmergencyDoctor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // GPS detection
  function handleDetectGPS() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsStatus("detecting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsStatus("active");
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setGpsStatus("error");
      },
      { timeout: 10000 }
    );
  }

  // Symptom chip click handler
  function handleAddSymptom(text, isCritical) {
    setProblemDescription((prev) => {
      if (!prev) return text;
      return `${prev}. Also feeling: ${text}`;
    });
    if (isCritical) {
      setIsEmergencyForced(true);
    }
  }

  // AI analysis submit
  async function handleAnalyze(e) {
    e?.preventDefault();
    if (!problemDescription.trim()) {
      setError("Please describe what health problem or symptoms you are experiencing.");
      return;
    }

    setLoading(true);
    setError("");
    setDiagnosisData(null);
    setBookingSuccessData(null);

    try {
      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemDescription: problemDescription.trim(),
          additionalNotes: additionalNotes.trim(),
          userLat: userCoords?.lat,
          userLng: userCoords?.lng,
          city: city.trim(),
          isEmergencyForced,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to analyze symptoms.");
      }

      setDiagnosisData(data);

      // Scroll smoothly to results
      setTimeout(() => {
        const resultsEl = document.getElementById("ai-results-anchor");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err) {
      setError(err.message || "An error occurred during AI analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Open fast-track emergency modal
  function openEmergencyModal(doctor) {
    setSelectedEmergencyDoctor(doctor);
    setBookingError("");
    setBookingSuccessData(null);
    setModalOpen(true);
  }

  // Submit emergency booking
  async function handleConfirmEmergencyBooking(e) {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setBookingError("Please provide your name and phone number.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");

    try {
      const res = await fetch("/api/emergency/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedEmergencyDoctor._id,
          hospitalId: selectedEmergencyDoctor.hospital._id,
          patientName: patientName.trim(),
          phone: patientPhone.trim(),
          email: patientEmail.trim(),
          symptoms: problemDescription,
          aiDiagnosis: diagnosisData?.analysis?.detectedProblem || "Emergency Triage",
          aiSummary: diagnosisData?.analysis?.summary || "",
          emergencyContact: emergencyContact.trim(),
          preferredTime: selectedEmergencyDoctor.earliestSlot?.time || "Immediate Triage",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Emergency booking failed.");
      }

      setBookingSuccessData(data);
    } catch (err) {
      setBookingError(err.message || "Failed to complete emergency booking.");
    } finally {
      setBookingLoading(false);
    }
  }

  const analysis = diagnosisData?.analysis;
  const isEmergency = analysis?.isEmergency || isEmergencyForced;

  return (
    <>
      <Navbar />

      <main className="ai-container">
        {/* Hero Header */}
        <div className="ai-hero-header">
          <div className={`ai-badge ${isEmergencyForced ? "emergency" : ""}`}>
            {isEmergencyForced ? (
              <>
                <IoAlertCircle /> 🚨 Emergency Mode Activated
              </>
            ) : (
              <>
                <IoSparkles /> Intelligent AI Health Diagnostics & Triage
              </>
            )}
          </div>
          <h1 className="ai-title">
            Describe Your Problem,{" "}
            <span className={isEmergencyForced ? "alert" : ""}>
              AI Finds The Nearest Doctor
            </span>
          </h1>
          <p className="ai-subtitle">
            Elaborate on any illness or symptoms. Our clinical AI analyzes your condition,
            assesses urgency, and instantly connects you with the nearest specialist — with
            fast-track priority appointments for critical emergencies.
          </p>
        </div>

        {/* Emergency Alert Hotline Strip */}
        <div className="emergency-hotline-strip">
          <div className="hotline-left">
            <div className="hotline-icon">🚑</div>
            <div>
              <div className="hotline-title">Life-Threatening Emergency? Immediate Help Available</div>
              <div className="hotline-subtitle">
                National Ambulance: <strong>108</strong> · Police & Disaster: <strong>112</strong> · Instant 24/7 Response
              </div>
            </div>
          </div>
          <div className="hotline-buttons">
            <a href="tel:108" className="btn-hotline">
              <IoCall /> Call 108 Ambulance
            </a>
            <a href="tel:112" className="btn-hotline">
              <FaPhoneAlt /> Call 112 Helpline
            </a>
          </div>
        </div>

        {/* Input Formulation Card */}
        <section className={`ai-card ${isEmergencyForced ? "emergency-border" : ""}`}>
          <h2 className="card-heading">
            <FaStethoscope style={{ color: isEmergencyForced ? "#dc2626" : "#2aa9a1" }} />
            Step 1: Elaborate Your Health Symptoms
          </h2>
          <p className="card-desc">
            Please be as descriptive as possible (mention duration, pain level, specific body parts, and how it started):
          </p>

          {/* Quick symptom pills */}
          <div className="quick-symptoms-label">Quick Symptoms (Click to add):</div>
          <div className="quick-chips">
            {QUICK_SYMPTOMS.map((item, idx) => (
              <button
                type="button"
                key={idx}
                className={`symptom-chip ${item.critical ? "critical" : ""}`}
                onClick={() => handleAddSymptom(item.text, item.critical)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Symptom Textarea */}
          <textarea
            className="symptom-textarea"
            placeholder="E.g., I have severe chest pain that started 30 minutes ago, spreading to my left arm, along with sweating and difficulty catching my breath..."
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
          />

          {/* Controls: Location & Emergency Mode */}
          <div className="triage-controls-grid">
            {/* Location Selector */}
            <div className="control-box">
              <div className="control-label">
                <span>📍 Patient Location</span>
                {userCoords && (
                  <span style={{ color: "#047857", fontWeight: 700 }}>
                    GPS: {userCoords.lat.toFixed(2)}°, {userCoords.lng.toFixed(2)}°
                  </span>
                )}
              </div>
              <div className="location-input-row">
                <input
                  type="text"
                  className="location-input"
                  placeholder="Enter City or Area (e.g. Amritsar, Jalandhar, Mohali)"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setUserCoords(null);
                    setGpsStatus("idle");
                  }}
                />
                <button
                  type="button"
                  className={`gps-btn ${gpsStatus === "active" ? "active" : ""}`}
                  onClick={handleDetectGPS}
                  title="Detect GPS"
                >
                  <FaLocationArrow />
                  {gpsStatus === "detecting"
                    ? "Locating..."
                    : gpsStatus === "active"
                    ? "GPS Active"
                    : "Detect GPS"}
                </button>
              </div>
            </div>

            {/* Emergency Checkbox Toggle */}
            <div className="control-box">
              <div className="control-label">🚨 Emergency Assessment Priority</div>
              <div className="emergency-toggle-row">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    className="emergency-checkbox"
                    checked={isEmergencyForced}
                    onChange={(e) => setIsEmergencyForced(e.target.checked)}
                  />
                  <span>Mark as Serious / Emergency Condition</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: "#dc2626", background: "#fee2e2", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            type="button"
            className={`btn-analyze ${isEmergencyForced ? "emergency-style" : ""}`}
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <IoSparkles className="spin-icon" /> AI is analyzing symptoms & locating nearest doctors...
              </>
            ) : isEmergencyForced ? (
              <>
                <FaAmbulance /> 🚨 Analyze Emergency & Locate Nearest Doctor Immediately
              </>
            ) : (
              <>
                <IoSparkles /> Analyze Symptoms & Show Nearest Doctors →
              </>
            )}
          </button>
        </section>

        {/* Results Section Anchor */}
        <div id="ai-results-anchor" />

        {/* AI Diagnosis and Recommendations */}
        {diagnosisData && analysis && (
          <div className="diagnosis-container">
            {/* Step 2: Clinical Assessment Card */}
            <div
              className={`diagnosis-header-card ${
                analysis.severity === "emergency"
                  ? "emergency"
                  : analysis.severity === "urgent"
                  ? "urgent"
                  : "routine"
              }`}
            >
              <div className="triage-top-row">
                <div
                  className={`triage-pill ${
                    analysis.severity === "emergency"
                      ? "emergency"
                      : analysis.severity === "urgent"
                      ? "urgent"
                      : "routine"
                  }`}
                >
                  {analysis.severity === "emergency" ? (
                    <>
                      <FaExclamationTriangle /> CRITICAL EMERGENCY CASE
                    </>
                  ) : analysis.severity === "urgent" ? (
                    <>
                      <IoAlertCircle /> URGENT CARE RECOMMENDED
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> ROUTINE CONSULTATION
                    </>
                  )}
                </div>

                <div className="triage-score">
                  AI Severity Assessment: <strong>{analysis.severityScore}/100</strong>
                </div>
              </div>

              <h2 className="detected-problem-name">
                Detected Problem: {analysis.detectedProblem}
              </h2>

              <div className="detected-spec-tag">
                <FaUserMd /> Recommended Specialist: <strong>{analysis.specialization}</strong>
              </div>

              <p className="ai-summary-text">{analysis.summary}</p>
              <p style={{ fontWeight: 600, color: analysis.isEmergency ? "#b91c1c" : "#0f766e", fontSize: "14px" }}>
                {analysis.urgencyAdvice}
              </p>

              {/* Advice Grid: First-Aid and Red Flags */}
              <div className="advice-grid">
                {analysis.firstAid?.length > 0 && (
                  <div className="advice-box">
                    <div className="advice-title">
                      <FaHeartbeat style={{ color: "#2aa9a1" }} /> Immediate First-Aid & Precautions:
                    </div>
                    <ul className="advice-list">
                      {analysis.firstAid.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.redFlags?.length > 0 && (
                  <div className="advice-box red-flags">
                    <div className="advice-title" style={{ color: "#dc2626" }}>
                      <FaExclamationTriangle style={{ color: "#dc2626" }} /> Red Flags (Call 108 if observed):
                    </div>
                    <ul className="advice-list">
                      {analysis.redFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Nearest Doctor Recommendations */}
            <section className="nearest-doctors-section">
              <div className="section-header-row">
                <div>
                  <h2 className="section-title">
                    {analysis.isEmergency ? "🚨 Nearest Available Doctors for Emergency Care" : "👨‍⚕️ Recommended Doctors (Sorted by Nearest Distance)"}
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                    Showing verified doctors matching <strong>{analysis.specialization}</strong> closest to you
                  </p>
                </div>
                <div className="location-context-badge">
                  <FaMapMarkerAlt style={{ color: "#2aa9a1" }} />
                  Nearest from: {diagnosisData.userLocation?.cityName || city || "Current Location"}
                </div>
              </div>

              {/* Recommended Doctors Grid */}
              <div className="doctor-recs-grid">
                {diagnosisData.recommendedDoctors?.map((doc, idx) => {
                  const isTopEmergencyDoctor = idx === 0 && analysis.isEmergency;
                  const initials = (doc.name || "?")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={doc._id}
                      className={`rec-doctor-card ${isTopEmergencyDoctor ? "emergency-highlight" : ""}`}
                    >
                      <div>
                        {/* Top tags */}
                        <div className="card-top-badges">
                          <span className="distance-tag">
                            <FaMapMarkerAlt /> {doc.distanceKm != null ? `${doc.distanceKm} km away` : "Nearby"}
                          </span>
                          <span className="match-tag">
                            {doc.matchType === "exact" ? "🎯 Matched Specialist" : "👨‍⚕️ Available Doctor"}
                          </span>
                        </div>

                        {/* Profile Info */}
                        <div className="rec-doc-profile">
                          <div className="rec-avatar">{initials}</div>
                          <div className="rec-doc-info">
                            <h3>{doc.name}</h3>
                            <div className="rec-doc-spec">
                              <FaStethoscope /> {doc.specialization}
                            </div>
                            <div className="rec-doc-exp">
                              {doc.experience} years clinical experience
                            </div>
                          </div>
                        </div>

                        {/* Hospital details */}
                        {doc.hospital && (
                          <div className="rec-hosp-info">
                            <div className="rec-hosp-name">
                              <FaHospital /> {doc.hospital.name}
                            </div>
                            <div className="rec-hosp-address">
                              <FaMapMarkerAlt style={{ marginTop: 2, flexShrink: 0 }} />
                              <span>{doc.hospital.address}</span>
                            </div>
                            <div className="rec-hosp-phone">
                              <FaPhoneAlt />
                              <a href={`tel:${doc.hospital.emergencyPhone || doc.hospital.phone}`}>
                                Emergency: {doc.hospital.emergencyPhone || doc.hospital.phone}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Slot and Fee */}
                        <div className="rec-slot-info">
                          <div className={`slot-time-pill ${doc.earliestSlot?.isImmediate ? "immediate" : ""}`}>
                            <FaClock />
                            {doc.earliestSlot?.isImmediate
                              ? `Earliest: Today, ${doc.earliestSlot.time}`
                              : `Next: ${doc.earliestSlot?.dayName}, ${doc.earliestSlot?.time}`}
                          </div>
                          <div className="rec-fee">₹{doc.consultationFee}</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="card-actions">
                        {analysis.isEmergency ? (
                          <button
                            type="button"
                            className="btn-emergency-book"
                            onClick={() => openEmergencyModal(doc)}
                          >
                            <FaAmbulance /> 🚨 1-Click Emergency Fast-Book
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-standard-book"
                            onClick={() => router.push(`/doctors/${doc._id}`)}
                          >
                            Book Appointment →
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: "13px", padding: "8px" }}
                          onClick={() => router.push(`/doctors/${doc._id}`)}
                        >
                          View Doctor Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Emergency Priority Booking Modal */}
        {modalOpen && selectedEmergencyDoctor && (
          <div className="modal-overlay">
            <div className="emergency-modal">
              <div className="modal-header">
                <h2>
                  <FaAmbulance /> Emergency Priority Appointment Booking
                </h2>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                {!bookingSuccessData ? (
                  <form onSubmit={handleConfirmEmergencyBooking}>
                    <div className="emergency-info-banner">
                      <div style={{ fontWeight: 800, color: "#991b1b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <FaExclamationTriangle /> Fast-Track Emergency Patient Registration
                      </div>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        Assigning immediate consultation with <strong>{selectedEmergencyDoctor.name}</strong> at{" "}
                        <strong>{selectedEmergencyDoctor.hospital?.name}</strong> (
                        {selectedEmergencyDoctor.distanceKm != null ? `${selectedEmergencyDoctor.distanceKm} km away` : "Nearest Hospital"}).
                      </div>
                      <div style={{ fontSize: 13, color: "#dc2626", marginTop: 4, fontWeight: 700 }}>
                        Slot: Today, {selectedEmergencyDoctor.earliestSlot?.time || "Immediate Triage"}
                      </div>
                    </div>

                    <div className="modal-form-group">
                      <label>Patient Full Name *</label>
                      <input
                        type="text"
                        className="modal-form-input"
                        placeholder="Enter patient's name"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Patient Contact Phone *</label>
                      <input
                        type="tel"
                        className="modal-form-input"
                        placeholder="E.g., +91 98765 43210"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Email Address (For Emergency Confirmation Pass)</label>
                      <input
                        type="email"
                        className="modal-form-input"
                        placeholder="patient@example.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Accompanying Kin / Emergency Attendant Phone</label>
                      <input
                        type="tel"
                        className="modal-form-input"
                        placeholder="Relative / Emergency contact phone"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                      />
                    </div>

                    {bookingError && (
                      <div style={{ color: "#dc2626", background: "#fee2e2", padding: "10px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", fontWeight: 600 }}>
                        ⚠️ {bookingError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn-confirm-emergency"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <>Registering Emergency Booking...</>
                      ) : (
                        <>
                          <FaCheckCircle /> Confirm Emergency Priority Booking Now
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Emergency Success Receipt */
                  <div className="emergency-receipt-card">
                    <div className="receipt-icon">
                      <FaCheckCircle />
                    </div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#166534", marginBottom: "6px" }}>
                      Emergency Booking Confirmed!
                    </h3>
                    <p style={{ fontSize: "14px", color: "#475569" }}>
                      The emergency desk at <strong>{bookingSuccessData.appointment?.hospitalId?.name}</strong> has been notified.
                    </p>

                    <div className="pass-code-box">
                      <div className="pass-code-label">Your Emergency Pass Code</div>
                      <div className="pass-code">{bookingSuccessData.emergencyPassCode}</div>
                    </div>

                    <div className="receipt-steps">
                      <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", color: "#1e293b" }}>
                        Arrival Instructions:
                      </div>
                      <ol>
                        {bookingSuccessData.emergencyInstructions?.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          bookingSuccessData.appointment?.hospitalId?.name + " " + bookingSuccessData.appointment?.hospitalId?.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ flex: 1, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <IoNavigateCircle style={{ fontSize: 18 }} /> Get Directions
                      </a>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setModalOpen(false);
                          router.push("/my-appointments");
                        }}
                      >
                        View in My Appointments
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

export default function AIConsultationPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>Loading AI Health Assistant...</div>}>
      <AIConsultationInner />
    </Suspense>
  );
}
