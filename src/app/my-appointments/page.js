"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IoSearchOutline,
  IoCallOutline,
  IoMailOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";
import { FaStethoscope } from "react-icons/fa";
import "@/app/styles/my-appointments.css";

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed",  cls: "lk-badge lk-badge--confirmed" },
  completed:  { label: "Completed",  cls: "lk-badge lk-badge--completed" },
  cancelled:  { label: "Cancelled",  cls: "lk-badge lk-badge--cancelled" },
};

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isUpcoming(dateStr) {
  return dateStr >= new Date().toISOString().slice(0, 10);
}

export default function MyAppointmentsPage() {
  const router = useRouter();

  const [mode, setMode]       = useState("phone"); // "phone" | "email"
  const [input, setInput]     = useState("");
  const [results, setResults] = useState(null);   // null = not searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    const value = input.trim();
    if (!value) {
      setError("Please enter a phone number or email address.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const param = mode === "phone" ? `phone=${encodeURIComponent(value)}` : `email=${encodeURIComponent(value)}`;
      const res   = await fetch(`/api/appointments/lookup?${param}`);
      const data  = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResults(data);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleModeSwitch(newMode) {
    setMode(newMode);
    setInput("");
    setError("");
    setResults(null);
  }

  const upcoming = results?.filter((a) => isUpcoming(a.date) && a.status === "confirmed") ?? [];
  const past      = results?.filter((a) => !isUpcoming(a.date) || a.status !== "confirmed") ?? [];

  return (
    <div className="lk-page">
      {/* ── Hero search card ── */}
      <div className="lk-hero">
        <h1 className="lk-hero-title">My Appointments</h1>
        <p className="lk-hero-sub">
          Enter the phone number or email you used when booking to see all your appointments.
        </p>

        <div className="lk-card">
          {/* Toggle: phone / email */}
          <div className="lk-toggle">
            <button
              type="button"
              className={`lk-toggle-btn ${mode === "phone" ? "active" : ""}`}
              onClick={() => handleModeSwitch("phone")}
            >
              <IoCallOutline /> Phone
            </button>
            <button
              type="button"
              className={`lk-toggle-btn ${mode === "email" ? "active" : ""}`}
              onClick={() => handleModeSwitch("email")}
            >
              <IoMailOutline /> Email
            </button>
          </div>

          {/* Search form */}
          <form className="lk-form" onSubmit={handleSearch}>
            <div className="lk-input-wrap">
              <span className="lk-input-icon">
                {mode === "phone" ? <IoCallOutline /> : <IoMailOutline />}
              </span>
              <input
                className="lk-input"
                type={mode === "email" ? "email" : "tel"}
                placeholder={mode === "phone" ? "+91 9876543210" : "you@example.com"}
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(""); }}
                autoComplete={mode === "email" ? "email" : "tel"}
              />
            </div>

            <button type="submit" className="lk-search-btn" disabled={loading}>
              {loading ? (
                <span className="lk-spinner" />
              ) : (
                <>
                  <IoSearchOutline /> Search
                </>
              )}
            </button>
          </form>

          {error && <p className="lk-error">{error}</p>}
        </div>
      </div>

      {/* ── Results ── */}
      {results !== null && (
        <div className="lk-results">
          {results.length === 0 ? (
            <div className="lk-empty">
              <span className="lk-empty-icon">🔍</span>
              <p className="lk-empty-title">No appointments found</p>
              <p className="lk-empty-sub">
                No bookings are linked to that {mode === "phone" ? "phone number" : "email address"}.
                Double-check the details you used when booking.
              </p>
            </div>
          ) : (
            <>
              <p className="lk-results-count">
                Found <strong>{results.length}</strong> appointment{results.length !== 1 ? "s" : ""}
              </p>

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <section className="lk-section">
                  <h2 className="lk-section-title">
                    <span className="lk-section-dot lk-section-dot--upcoming" />
                    Upcoming
                  </h2>
                  <div className="lk-list">
                    {upcoming.map((appt) => (
                      <AppointmentCard key={appt._id} appt={appt} router={router} />
                    ))}
                  </div>
                </section>
              )}

              {/* Past / cancelled */}
              {past.length > 0 && (
                <section className="lk-section">
                  <h2 className="lk-section-title">
                    <span className="lk-section-dot lk-section-dot--past" />
                    Past &amp; Cancelled
                  </h2>
                  <div className="lk-list">
                    {past.map((appt) => (
                      <AppointmentCard key={appt._id} appt={appt} router={router} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt, router }) {
  const statusCfg  = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.confirmed;
  const doctorName = appt.doctorId?.name ?? "Doctor";
  const doctorSpec = appt.doctorId?.specialization ?? "";
  const hospName   = appt.hospitalId?.name ?? "Hospital";
  const hospAddr   = appt.hospitalId?.address ?? "";

  return (
    <div className="lk-appt-card">
      {/* Top row: doctor + badge */}
      <div className="lk-appt-top">
        <div className="lk-appt-avatar">
          {doctorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="lk-appt-doctor">
          <p className="lk-appt-name">Dr. {doctorName}</p>
          {doctorSpec && (
            <p className="lk-appt-spec">
              <FaStethoscope style={{ fontSize: 11 }} /> {doctorSpec}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {appt.isEmergency && (
            <span
              style={{
                background: "#dc2626",
                color: "white",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              🚨 EMERGENCY
            </span>
          )}
          <span className={statusCfg.cls}>{statusCfg.label}</span>
        </div>
      </div>

      {appt.aiDiagnosis && (
        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #bae6fd",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 13,
            color: "#0369a1",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          🤖 AI Detected Condition: <strong>{appt.aiDiagnosis}</strong>
        </div>
      )}

      {/* Detail grid */}
      <div className="lk-appt-grid">
        <div className="lk-appt-item">
          <IoCalendarOutline className="lk-appt-item-icon" />
          <div>
            <p className="lk-appt-item-label">Date</p>
            <p className="lk-appt-item-value">{formatDate(appt.date)}</p>
          </div>
        </div>

        <div className="lk-appt-item">
          <IoTimeOutline className="lk-appt-item-icon" />
          <div>
            <p className="lk-appt-item-label">Time</p>
            <p className="lk-appt-item-value">{appt.time}</p>
          </div>
        </div>

        <div className="lk-appt-item">
          <IoPersonOutline className="lk-appt-item-icon" />
          <div>
            <p className="lk-appt-item-label">Patient</p>
            <p className="lk-appt-item-value">{appt.patientName || "—"}</p>
          </div>
        </div>

        <div className="lk-appt-item">
          <IoLocationOutline className="lk-appt-item-icon" />
          <div>
            <p className="lk-appt-item-label">Hospital</p>
            <p className="lk-appt-item-value">{hospName}</p>
            {hospAddr && <p className="lk-appt-item-sub">{hospAddr}</p>}
          </div>
        </div>
      </div>

      {/* Reason (if any) */}
      {appt.reason && (
        <p className="lk-appt-reason">
          <strong>Reason / Symptoms:</strong> {appt.reason}
        </p>
      )}

      {/* CTA: book again or emergency navigation */}
      <div className="lk-appt-footer" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {appt.isEmergency && appt.hospitalId?.phone && (
          <a
            href={`tel:${appt.hospitalId.emergencyPhone || appt.hospitalId.phone}`}
            className="btn-outline"
            style={{
              borderColor: "#ef4444",
              color: "#dc2626",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              padding: "8px 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IoCallOutline /> Call Hospital
          </a>
        )}
        {hospAddr && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospName + " " + hospAddr)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
            style={{ fontSize: 13, textDecoration: "none", padding: "8px 14px" }}
          >
            📍 Directions
          </a>
        )}
        {appt.doctorId?._id && (
          <button
            className="lk-book-btn"
            onClick={() => router.push(`/doctors/${appt.doctorId._id}`)}
          >
            Book again
          </button>
        )}
      </div>
    </div>
  );
}
