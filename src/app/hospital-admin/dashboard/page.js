"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PiHospitalBold } from "react-icons/pi";
import { FaUserMd, FaCalendarAlt, FaCog, FaSignOutAlt, FaPlus, FaTrash } from "react-icons/fa";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";

// Days of the week shown in the "Add Doctor" form
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─────────────────────────────────────────────
// Small helper: coloured status badge
// ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    confirmed: { background: "#e0f5f4", color: "#0f6e56" },
    completed:  { background: "#e8f5e9", color: "#2e7d32" },
    cancelled:  { background: "#fdecea", color: "#c62828" },
  };
  const s = styles[status] || styles.confirmed;
  return (
    <span style={{ ...s, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();

  // hospital = the logged-in admin's hospital info
  const [hospital,     setHospital]     = useState(null);
  const [doctors,      setDoctors]      = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Which tab is currently shown: "doctors" | "appointments" | "settings"
  const [tab, setTab] = useState("doctors");

  // ── Add Doctor form state ──
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [addError,      setAddError]      = useState("");
  const [addLoading,    setAddLoading]    = useState(false);
  const [newDoctor,     setNewDoctor]     = useState({
    name: "", specialization: "", experience: "",
    consultationFee: "", slotDuration: "30",
    availableDays: [],
    loginEmail: "", loginPassword: "", // optional: creates doctor login
  });

  // ── Hospital settings form state ──
  const [settingsForm,  setSettingsForm]  = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg,   setSettingsMsg]   = useState("");

  // ── Confirm delete dialog ──
  const [deletingId,   setDeletingId]   = useState(null); // doctor _id to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─────────────────────────────────────────
  // On page load: check if admin is logged in
  // ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin-auth/me")
      .then((r) => {
        if (r.status === 401) {
          // Not logged in — send to login page
          router.push("/hospital-admin/login");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setHospital(data);
        // Pre-fill the settings form with current hospital data
        setSettingsForm({
          name:        data.name        || "",
          address:     data.address     || "",
          phone:       data.phone       || "",
          openTime:    data.openTime    || "",
          closeTime:   data.closeTime   || "",
          departments: data.departments?.join(", ") || "", // show as comma-separated string
        });
      })
      .catch(() => router.push("/hospital-admin/login"));
  }, [router]);

  // ─────────────────────────────────────────
  // Load doctors for this hospital
  // ─────────────────────────────────────────
  const loadDoctors = useCallback(async (hospitalId) => {
    try {
      const res  = await fetch(`/api/doctors?hospitalId=${hospitalId}`);
      const data = await res.json();
      // Only show active doctors (isActive: true)
      setDoctors(Array.isArray(data) ? data.filter((d) => d.isActive !== false) : []);
    } catch {
      setDoctors([]);
    }
  }, []);

  // ─────────────────────────────────────────
  // Load ALL appointments for this hospital
  // ─────────────────────────────────────────
  const loadAppointments = useCallback(async (hospitalId) => {
    try {
      const res  = await fetch(`/api/appointments?hospitalId=${hospitalId}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run loaders once hospital is known
  useEffect(() => {
    if (hospital?._id) {
      loadDoctors(hospital._id);
      loadAppointments(hospital._id);
    }
  }, [hospital, loadDoctors, loadAppointments]);

  // ─────────────────────────────────────────
  // Add a new doctor
  // ─────────────────────────────────────────
  async function handleAddDoctor() {
    setAddError("");

    // Validate required fields
    if (!newDoctor.name.trim()) {
      setAddError("Doctor name is required.");
      return;
    }
    // If they typed an email, password must also be filled
    if (newDoctor.loginEmail && !newDoctor.loginPassword) {
      setAddError("Please enter a password for the doctor login, or leave both blank.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDoctor,
          experience:      Number(newDoctor.experience)      || 0,
          consultationFee: Number(newDoctor.consultationFee) || 0,
          slotDuration:    Number(newDoctor.slotDuration)    || 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add doctor.");
        return;
      }

      // Success — add to the list and reset the form
      setDoctors((prev) => [...prev, data]);
      setShowAddForm(false);
      setNewDoctor({
        name: "", specialization: "", experience: "",
        consultationFee: "", slotDuration: "30",
        availableDays: [], loginEmail: "", loginPassword: "",
      });

    } catch {
      setAddError("Could not connect to server.");
    } finally {
      setAddLoading(false);
    }
  }

  // ─────────────────────────────────────────
  // Remove a doctor (soft delete)
  // ─────────────────────────────────────────
  async function handleRemoveDoctor() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/doctors/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        // Remove from the local list immediately
        setDoctors((prev) => prev.filter((d) => d._id !== deletingId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  }

  // ─────────────────────────────────────────
  // Save hospital settings
  // ─────────────────────────────────────────
  async function handleSaveSettings() {
    setSettingsSaving(true);
    setSettingsMsg("");
    try {
      const res = await fetch(`/api/admin/hospitals/${hospital._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settingsForm,
          // Convert comma-separated departments string back to array
          departments: settingsForm.departments
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setHospital((prev) => ({ ...prev, ...updated }));
        setSettingsMsg("Hospital settings saved successfully!");
      } else {
        const d = await res.json();
        setSettingsMsg(d.error || "Failed to save settings.");
      }
    } catch {
      setSettingsMsg("Could not connect to server.");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMsg(""), 3000);
    }
  }

  // ─────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────
  async function handleLogout() {
    await fetch("/api/admin-auth/logout", { method: "POST" });
    router.push("/hospital-admin/login");
  }

  // Toggle an available day in the add doctor form
  function toggleDay(day) {
    setNewDoctor((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  }

  // ─────────────────────────────────────────
  // Loading state — show skeleton while fetching
  // ─────────────────────────────────────────
  if (!hospital) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div className="skeleton" style={{ width: 200, height: 24, margin: "0 auto 16px" }} />
        <div className="skeleton" style={{ width: 140, height: 16, margin: "0 auto" }} />
      </div>
    );
  }

  // Quick stats for the stat bar at top
  const todayStr     = new Date().toISOString().slice(0, 10);
  const todayCount   = appointments.filter((a) => a.date === todayStr).length;
  const pendingCount = appointments.filter((a) => a.status === "confirmed").length;

  return (
    <div className="dash-page">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          {/* Hospital logo (first letter of name) */}
          <div className="dash-doc-avatar" style={{ background: "#e8f0ff", color: "#4f6ef7", fontSize: 28 }}>
            {hospital.name.charAt(0)}
          </div>
          <div>
            <p className="dash-doc-name">{hospital.name}</p>
            <p className="dash-doc-spec">{hospital.address}</p>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="dash-nav">
          <button
            className={`dash-nav-btn ${tab === "doctors" ? "active" : ""}`}
            style={tab === "doctors" ? { background: "#e8f0ff", color: "#4f6ef7" } : {}}
            onClick={() => setTab("doctors")}
          >
            <FaUserMd /> Doctors
          </button>
          <button
            className={`dash-nav-btn ${tab === "appointments" ? "active" : ""}`}
            style={tab === "appointments" ? { background: "#e8f0ff", color: "#4f6ef7" } : {}}
            onClick={() => setTab("appointments")}
          >
            <FaCalendarAlt /> Appointments
          </button>
          <button
            className={`dash-nav-btn ${tab === "settings" ? "active" : ""}`}
            style={tab === "settings" ? { background: "#e8f0ff", color: "#4f6ef7" } : {}}
            onClick={() => setTab("settings")}
          >
            <FaCog /> Hospital Settings
          </button>
        </nav>

        <button className="dash-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="dash-main">

        {/* Stats bar — shown on all tabs */}
        <div className="dash-stats">
          <div className="dash-stat-box">
            <span className="dash-stat-num" style={{ color: "#4f6ef7" }}>{doctors.length}</span>
            <span className="dash-stat-label">Doctors</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num" style={{ color: "#4f6ef7" }}>{todayCount}</span>
            <span className="dash-stat-label">Today</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num" style={{ color: "#4f6ef7" }}>{pendingCount}</span>
            <span className="dash-stat-label">Pending</span>
          </div>
          <div className="dash-stat-box">
            <span className="dash-stat-num" style={{ color: "#4f6ef7" }}>{appointments.length}</span>
            <span className="dash-stat-label">Total Appts</span>
          </div>
        </div>

        {/* ══════════════════════════════════
            TAB 1: DOCTORS
        ══════════════════════════════════ */}
        {tab === "doctors" && (
          <div className="dash-section">
            <h2 className="dash-section-title">
              Doctors
              <span className="dash-count" style={{ background: "#e8f0ff", color: "#4f6ef7" }}>
                {doctors.length}
              </span>
              {/* Button to open the Add Doctor form */}
              <button
                className="btn-primary admin-add-btn"
                onClick={() => { setShowAddForm(true); setAddError(""); }}
              >
                <FaPlus /> Add Doctor
              </button>
            </h2>

            {/* ── ADD DOCTOR FORM (shown when showAddForm is true) ── */}
            {showAddForm && (
              <div className="admin-form-card">
                <h3 className="dash-schedule-subtitle">New Doctor Details</h3>

                {/* Row 1: Name + Specialization */}
                <div className="dash-schedule-row" style={{ marginBottom: 16 }}>
                  <div className="ap-input-group">
                    <label className="ap-label">Full Name *</label>
                    <input className="ap-input" placeholder="Dr. Priya Sharma"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="ap-input-group">
                    <label className="ap-label">Specialization</label>
                    <input className="ap-input" placeholder="Cardiologist"
                      value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor((p) => ({ ...p, specialization: e.target.value }))} />
                  </div>
                </div>

                {/* Row 2: Experience + Fee + Slot */}
                <div className="admin-form-row-3" style={{ marginBottom: 16 }}>
                  <div className="ap-input-group">
                    <label className="ap-label">Experience (years)</label>
                    <input className="ap-input" type="number" placeholder="5"
                      value={newDoctor.experience}
                      onChange={(e) => setNewDoctor((p) => ({ ...p, experience: e.target.value }))} />
                  </div>
                  <div className="ap-input-group">
                    <label className="ap-label">Fee (₹)</label>
                    <input className="ap-input" type="number" placeholder="500"
                      value={newDoctor.consultationFee}
                      onChange={(e) => setNewDoctor((p) => ({ ...p, consultationFee: e.target.value }))} />
                  </div>
                  <div className="ap-input-group">
                    <label className="ap-label">Slot (min)</label>
                    <select className="ap-input" value={newDoctor.slotDuration}
                      onChange={(e) => setNewDoctor((p) => ({ ...p, slotDuration: e.target.value }))}>
                      {[15, 20, 30, 45, 60].map((v) => (
                        <option key={v} value={v}>{v} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Available days */}
                <div style={{ marginBottom: 16 }}>
                  <label className="ap-label" style={{ marginBottom: 8, display: "block" }}>
                    Available Days
                  </label>
                  <div className="dash-day-grid">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={`dash-day-btn ${newDoctor.availableDays.includes(day) ? "active" : ""}`}
                        onClick={() => toggleDay(day)}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional: create doctor login at same time */}
                <div className="admin-login-section">
                  <p className="admin-section-label">
                    Doctor Login Credentials <span style={{ color: "#9ca3af" }}>(optional)</span>
                  </p>
                  <div className="dash-schedule-row">
                    <div className="ap-input-group">
                      <label className="ap-label">Doctor Email</label>
                      <input className="ap-input" type="email" placeholder="doctor@hospital.com"
                        value={newDoctor.loginEmail}
                        onChange={(e) => setNewDoctor((p) => ({ ...p, loginEmail: e.target.value }))} />
                    </div>
                    <div className="ap-input-group">
                      <label className="ap-label">Doctor Password</label>
                      <input className="ap-input" type="password" placeholder="Min 6 characters"
                        value={newDoctor.loginPassword}
                        onChange={(e) => setNewDoctor((p) => ({ ...p, loginPassword: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {addError && <p className="error" style={{ marginBottom: 12 }}>{addError}</p>}

                {/* Form action buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    className="btn-primary"
                    style={{ background: "#4f6ef7" }}
                    onClick={handleAddDoctor}
                    disabled={addLoading}
                  >
                    {addLoading ? "Adding..." : "Add Doctor"}
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => { setShowAddForm(false); setAddError(""); }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── DOCTORS LIST ── */}
            {doctors.length === 0 ? (
              <div className="dash-empty">
                <FaUserMd className="dash-empty-icon" />
                <p>No doctors yet. Click &quot;Add Doctor&quot; to get started.</p>
              </div>
            ) : (
              doctors.map((doc) => (
                <div key={doc._id} className="admin-doctor-row">
                  {/* Avatar with initials */}
                  <div className="doctor-avatar-initials" style={{ width: 48, height: 48, fontSize: 16 }}>
                    {doc.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p className="dash-appt-name">{doc.name}</p>
                    <p className="dash-appt-meta">
                      {doc.specialization} &nbsp;·&nbsp; {doc.experience} yrs &nbsp;·&nbsp; ₹{doc.consultationFee}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {(doc.availableDays || []).map((d) => (
                        <span key={d} className="day-pill">{d.slice(0, 3)}</span>
                      ))}
                    </div>
                  </div>

                  {/* Remove button — opens confirmation dialog */}
                  <button
                    className="dash-action-btn cancel"
                    title="Remove doctor"
                    onClick={() => setDeletingId(doc._id)}
                  >
                    <FaTrash style={{ fontSize: 14 }} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 2: APPOINTMENTS
        ══════════════════════════════════ */}
        {tab === "appointments" && (
          <div className="dash-section">
            <h2 className="dash-section-title">
              All Appointments
              <span className="dash-count" style={{ background: "#e8f0ff", color: "#4f6ef7" }}>
                {appointments.length}
              </span>
            </h2>

            {loading ? (
              [1,2,3].map((i) => (
                <div key={i} className="dash-appt-row skeleton-card">
                  <div className="skeleton dash-appt-skeleton" />
                </div>
              ))
            ) : appointments.length === 0 ? (
              <div className="dash-empty">
                <FaCalendarAlt className="dash-empty-icon" />
                <p>No appointments booked yet.</p>
              </div>
            ) : (
              // Sort newest date first
              [...appointments]
                .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time))
                .map((appt) => (
                  <div
                    key={appt._id}
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
                          <p className="dash-appt-name">{appt.patientName}</p>
                          {appt.isEmergency && (
                            <span
                              style={{
                                background: "#dc2626",
                                color: "white",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              🚨 EMERGENCY
                            </span>
                          )}
                        </div>
                        <p className="dash-appt-meta">
                          {appt.date} &nbsp;·&nbsp; {appt.time} &nbsp;·&nbsp;
                          Dr. {appt.doctorId?.name || "—"} ({appt.doctorId?.specialization || "Doctor"})
                        </p>
                        {appt.aiDiagnosis && (
                          <p style={{ fontSize: 12, color: "#0284c7", fontWeight: 600, margin: "2px 0" }}>
                            🤖 AI Triage: {appt.aiDiagnosis}
                          </p>
                        )}
                        {appt.reason && (
                          <p className="dash-appt-reason">{appt.reason}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            TAB 3: HOSPITAL SETTINGS
        ══════════════════════════════════ */}
        {tab === "settings" && settingsForm && (
          <div className="dash-section">
            <h2 className="dash-section-title">Hospital Settings</h2>

            <div className="dash-schedule-card">
              <h3 className="dash-schedule-subtitle">Basic Information</h3>

              <div className="dash-schedule-row" style={{ marginBottom: 16 }}>
                <div className="ap-input-group">
                  <label className="ap-label">Hospital Name</label>
                  <input className="ap-input" value={settingsForm.name}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="ap-input-group">
                  <label className="ap-label">Phone Number</label>
                  <input className="ap-input" value={settingsForm.phone}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              <div className="ap-input-group" style={{ marginBottom: 16 }}>
                <label className="ap-label">Address</label>
                <input className="ap-input" value={settingsForm.address}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, address: e.target.value }))} />
              </div>

              <div className="dash-schedule-row" style={{ marginBottom: 16 }}>
                <div className="ap-input-group">
                  <label className="ap-label">Opening Time</label>
                  <input className="ap-input" placeholder="9:00 AM" value={settingsForm.openTime}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, openTime: e.target.value }))} />
                </div>
                <div className="ap-input-group">
                  <label className="ap-label">Closing Time</label>
                  <input className="ap-input" placeholder="6:00 PM" value={settingsForm.closeTime}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, closeTime: e.target.value }))} />
                </div>
              </div>

              <div className="ap-input-group">
                <label className="ap-label">Departments</label>
                <input className="ap-input"
                  placeholder="Cardiology, Orthopedics, Neurology (comma separated)"
                  value={settingsForm.departments}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, departments: e.target.value }))} />
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ padding: "12px 32px", fontSize: 15, background: "#4f6ef7" }}
              onClick={handleSaveSettings}
              disabled={settingsSaving}
            >
              {settingsSaving ? "Saving..." : "Save Settings"}
            </button>

            {settingsMsg && (
              <p
                className={settingsMsg.includes("success") ? "success" : "error"}
                style={{ marginTop: 12 }}
              >
                {settingsMsg}
              </p>
            )}
          </div>
        )}

      </main>

      {/* ── CONFIRM DELETE DIALOG ── */}
      {deletingId && (
        <div className="admin-overlay">
          <div className="admin-dialog">
            <h3>Remove Doctor?</h3>
            <p>
              This will remove the doctor from your hospital. Their past appointments
              will still be visible. You can add them again later.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="btn-primary"
                style={{ background: "#ef4444" }}
                onClick={handleRemoveDoctor}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Removing..." : "Yes, Remove"}
              </button>
              <button className="btn-outline" onClick={() => setDeletingId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
