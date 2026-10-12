"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaStethoscope, FaCalendarAlt, FaCalendarCheck, FaCog, FaSignOutAlt } from "react-icons/fa";
import { IoPersonOutline, IoCallOutline, IoTimeOutline, IoCheckmarkCircle, IoCloseCircle, IoEllipseOutline } from "react-icons/io5";
import { PiHospitalBold } from "react-icons/pi";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const STATUS_COLORS = {
  confirmed: { bg: "#e0f5f4", color: "#0f6e56", label: "Confirmed" },
  completed:  { bg: "#e8f5e9", color: "#2e7d32", label: "Completed" },
  cancelled:  { bg: "#fdecea", color: "#c62828", label: "Cancelled" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.confirmed;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function AppointmentRow({ appt, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  async function changeStatus(newStatus) {
    setUpdating(true);
    await onStatusChange(appt._id, newStatus);
    setUpdating(false);
  }

  return (
    <div
      className="dash-appt-row"
      style={appt.isEmergency ? { borderLeft: "4px solid #ef4444", background: "#fffafa" } : {}}
    >
      <div className="dash-appt-info">
        <div
          className="dash-appt-avatar"
          style={appt.isEmergency ? { background: "#fee2e2", color: "#dc2626" } : {}}
        >
          {(appt.patientName || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p className="dash-appt-name">{appt.patientName || "Unknown"}</p>
            {appt.isEmergency && (
              <span
                style={{
                  background: "#dc2626",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                🚨 EMERGENCY
              </span>
            )}
          </div>
          <p className="dash-appt-meta">
            <IoCallOutline /> {appt.phone || "—"} &nbsp;·&nbsp;
            <IoTimeOutline /> {appt.time} &nbsp;·&nbsp; {appt.date}
          </p>
          {appt.aiDiagnosis && (
            <p style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, margin: "2px 0" }}>
              🤖 AI Detected Problem: {appt.aiDiagnosis}
            </p>
          )}
          {appt.reason && <p className="dash-appt-reason">{appt.reason}</p>}
          {appt.emergencyNotes && (
            <p style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, margin: "2px 0" }}>
              ⚠️ {appt.emergencyNotes}
            </p>
          )}
        </div>
      </div>
      <div className="dash-appt-right">
        <StatusBadge status={appt.status} />
        {appt.status === "confirmed" && (
          <div className="dash-appt-actions">
            <button
              className="dash-action-btn complete"
              onClick={() => changeStatus("completed")}
              disabled={updating}
              title="Mark completed"
            >
              <IoCheckmarkCircle />
            </button>
            <button
              className="dash-action-btn cancel"
              onClick={() => changeStatus("cancelled")}
              disabled={updating}
              title="Cancel"
            >
              <IoCloseCircle />
            </button>
          </div>
        )}
        {appt.status !== "confirmed" && (
          <button
            className="dash-action-btn restore"
            onClick={() => changeStatus("confirmed")}
            disabled={updating}
            title="Restore to confirmed"
          >
            <IoEllipseOutline />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today"); // today | all | schedule
  const [scheduleForm, setScheduleForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Auth check + load doctor
  useEffect(() => {
    fetch("/api/doctor-auth/me")
      .then((r) => {
        if (r.status === 401) { router.push("/doctor-portal/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setDoctor(data);
        setScheduleForm({
          availableDays: data.availableDays || [],
          slotDuration: data.slotDuration || 30,
          consultationFee: data.consultationFee || 0,
        });
      })
      .catch(() => router.push("/doctor-portal/login"));
  }, [router]);

  // Load appointments
  const loadAppointments = useCallback(async (doctorId) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?doctorId=${doctorId}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (doctor?._id) loadAppointments(doctor._id);
  }, [doctor, loadAppointments]);

  async function handleStatusChange(appointmentId, newStatus) {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => a._id === appointmentId ? { ...a, status: newStatus } : a)
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveSchedule() {
    if (!doctor) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/doctors/${doctor._id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      if (res.ok) {
        setSaveMsg("Schedule saved successfully!");
        setDoctor((prev) => ({ ...prev, ...scheduleForm }));
      } else {
        const d = await res.json();
        setSaveMsg(d.error || "Failed to save.");
      }
    } catch {
      setSaveMsg("Failed to save.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  async function handleLogout() {
    await fetch("/api/doctor-auth/logout", { method: "POST" });
    router.push("/doctor-portal/login");
  }

  function toggleDay(day) {
    setScheduleForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  }

  // Derived data
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === todayStr);
  const upcoming = appointments.filter((a) => a.date >= todayStr && a.status === "confirmed");
  const emergencyAppts = appointments.filter((a) => a.isEmergency);
  const stats = {
    today: todayAppts.length,
    upcoming: upcoming.length,
    emergency: emergencyAppts.length,
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  if (!doctor) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 24, margin: "0 auto 16px" }} />
        <div className="skeleton" style={{ width: 140, height: 16, margin: "0 auto" }} />
      </div>
    );
  }

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <div className="dash-doc-avatar">
            {doctor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="dash-doc-name">{doctor.name}</p>
            <p className="dash-doc-spec">
              <FaStethoscope style={{ marginRight: 4 }} />
              {doctor.specialization}
            </p>
            <p className="dash-doc-hospital">
              <PiHospitalBold style={{ marginRight: 4 }} />
              {doctor.hospitalName}
            </p>
          </div>
        </div>

        <nav className="dash-nav">
          <button
            className={`dash-nav-btn ${tab === "today" ? "active" : ""}`}
            onClick={() => setTab("today")}
          >
            <FaCalendarAlt /> Today
          </button>
          <button
            className={`dash-nav-btn ${tab === "emergency" ? "active" : ""}`}
            style={emergencyAppts.length > 0 ? { color: "#dc2626", fontWeight: "bold" } : {}}
            onClick={() => setTab("emergency")}
          >
            🚨 Emergency ({emergencyAppts.length})
          </button>
          <button
            className={`dash-nav-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
          >
            <FaCalendarCheck /> All Appointments
          </button>
          <button
            className={`dash-nav-btn ${tab === "schedule" ? "active" : ""}`}
            onClick={() => setTab("schedule")}
          >
            <FaCog /> Manage Schedule
          </button>
        </nav>

        <button className="dash-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="dash-main">

        {/* Stats bar */}
        <div className="dash-stats">
          <div className="dash-stat-box" style={stats.emergency > 0 ? { borderColor: "#fca5a5", background: "#fef2f2" } : {}}>
            <span className="dash-stat-num" style={stats.emergency > 0 ? { color: "#dc2626" } : {}}>{stats.emergency}</span>
            <span className="dash-stat-label" style={stats.emergency > 0 ? { color: "#b91c1c", fontWeight: 700 } : {}}>🚨 Emergency</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num">{stats.today}</span>
            <span className="dash-stat-label">Today</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num">{stats.upcoming}</span>
            <span className="dash-stat-label">Upcoming</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num">{stats.completed}</span>
            <span className="dash-stat-label">Completed</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num">{stats.total}</span>
            <span className="dash-stat-label">Total</span>
          </div>
        </div>

        {/* EMERGENCY TAB */}
        {tab === "emergency" && (
          <div className="dash-section">
            <h2 className="dash-section-title" style={{ color: "#dc2626" }}>
              🚨 Emergency Priority Cases
              <span className="dash-count" style={{ background: "#fee2e2", color: "#dc2626" }}>{emergencyAppts.length}</span>
            </h2>
            {loading ? (
              [1,2].map((i) => (
                <div key={i} className="dash-appt-row skeleton-card">
                  <div className="skeleton dash-appt-skeleton" />
                </div>
              ))
            ) : emergencyAppts.length === 0 ? (
              <div className="dash-empty">
                <FaCalendarAlt className="dash-empty-icon" />
                <p>No active emergency cases reported.</p>
              </div>
            ) : (
              emergencyAppts.map((appt) => (
                <AppointmentRow
                  key={appt._id}
                  appt={appt}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        )}

        {/* TODAY TAB */}
        {tab === "today" && (
          <div className="dash-section">
            <h2 className="dash-section-title">
              Today&apos;s Appointments
              <span className="dash-count">{todayAppts.length}</span>
            </h2>
            {loading ? (
              [1,2,3].map((i) => (
                <div key={i} className="dash-appt-row skeleton-card">
                  <div className="skeleton dash-appt-skeleton" />
                </div>
              ))
            ) : todayAppts.length === 0 ? (
              <div className="dash-empty">
                <FaCalendarAlt className="dash-empty-icon" />
                <p>No appointments today.</p>
              </div>
            ) : (
              todayAppts
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => (
                  <AppointmentRow key={appt._id} appt={appt} onStatusChange={handleStatusChange} />
                ))
            )}
          </div>
        )}

        {/* ALL APPOINTMENTS TAB */}
        {tab === "all" && (
          <div className="dash-section">
            <h2 className="dash-section-title">
              All Appointments
              <span className="dash-count">{appointments.length}</span>
            </h2>

            {loading ? (
              [1,2,3,4].map((i) => (
                <div key={i} className="dash-appt-row skeleton-card">
                  <div className="skeleton dash-appt-skeleton" />
                </div>
              ))
            ) : appointments.length === 0 ? (
              <div className="dash-empty">
                <FaCalendarCheck className="dash-empty-icon" />
                <p>No appointments yet.</p>
              </div>
            ) : (
              // Group by date
              Object.entries(
                appointments
                  .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time))
                  .reduce((acc, appt) => {
                    (acc[appt.date] = acc[appt.date] || []).push(appt);
                    return acc;
                  }, {})
              ).map(([date, appts]) => (
                <div key={date}>
                  <p className="dash-date-header">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                    {date === todayStr && <span className="dash-today-pill">Today</span>}
                  </p>
                  {appts.map((appt) => (
                    <AppointmentRow key={appt._id} appt={appt} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* SCHEDULE TAB */}
        {tab === "schedule" && scheduleForm && (
          <div className="dash-section">
            <h2 className="dash-section-title">Manage Schedule</h2>

            <div className="dash-schedule-card">
              <h3 className="dash-schedule-subtitle">Available Days</h3>
              <div className="dash-day-grid">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    className={`dash-day-btn ${scheduleForm.availableDays.includes(day) ? "active" : ""}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-schedule-card">
              <h3 className="dash-schedule-subtitle">Slot Settings</h3>
              <div className="dash-schedule-row">
                <div className="ap-input-group">
                  <label className="ap-label">Slot Duration (minutes)</label>
                  <select
                    className="ap-input"
                    value={scheduleForm.slotDuration}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, slotDuration: Number(e.target.value) }))}
                  >
                    {[15, 20, 30, 45, 60].map((v) => (
                      <option key={v} value={v}>{v} min</option>
                    ))}
                  </select>
                </div>
                <div className="ap-input-group">
                  <label className="ap-label">Consultation Fee (₹)</label>
                  <div className="ap-input-wrapper">
                    <span className="ap-input-icon" style={{ fontSize: 14 }}>₹</span>
                    <input
                      type="number"
                      className="ap-input"
                      min="0"
                      value={scheduleForm.consultationFee}
                      onChange={(e) => setScheduleForm((p) => ({ ...p, consultationFee: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ padding: "12px 32px", fontSize: 15 }}
              onClick={handleSaveSchedule}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Schedule"}
            </button>

            {saveMsg && (
              <p className={saveMsg.includes("success") ? "success" : "error"} style={{ marginTop: 12 }}>
                {saveMsg}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
