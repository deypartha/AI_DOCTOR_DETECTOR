"use client";

import { useEffect, useMemo, useState } from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import BookingConfirmation from "./skeletons/BookingConfirmation";
import {
  IoTimeOutline,
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";

function parseTimeToMinutes(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toUpperCase();

  // Formats like "9:00 AM", "09:30PM", "9 AM"
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return hour * 60 + minutes;
  }

  // Fallback: "HH:MM" 24h
  const parts = trimmed.split(":").map(Number);
  if (parts.length === 2 && !parts.some(Number.isNaN)) {
    return parts[0] * 60 + parts[1];
  }

  return null;
}

function generateTimeSlots(openTime, closeTime, slotDuration) {
  if (!openTime || !closeTime || !slotDuration) return [];

  const startMinutes = parseTimeToMinutes(openTime);
  const endMinutes = parseTimeToMinutes(closeTime);

  if (startMinutes == null || endMinutes == null) return [];

  const slots = [];
  for (let t = startMinutes; t + slotDuration <= endMinutes; t += slotDuration) {
    const hour24 = Math.floor(t / 60);
    const minutes = t % 60;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    const label = `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    slots.push(label);
  }

  return slots;
}

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function normalizeAvailableDays(availableDays) {
  if (!Array.isArray(availableDays) || availableDays.length === 0) return null;
  return new Set(availableDays.map((d) => String(d).slice(0, 3).toLowerCase()));
}

function isDateSelectable({ date, today, allowedSet }) {
  const dateDay = startOfDay(date);
  const todayDay = startOfDay(today);
  if (dateDay < todayDay) return false;

  if (!allowedSet) return true;
  const weekdayLong = date.toLocaleDateString("en-US", { weekday: "long" });
  const weekdayShort = weekdayLong.slice(0, 3).toLowerCase();
  return allowedSet.has(weekdayShort);
}

function buildMonthCells({ year, month, today, allowedSet }) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const leadingBlanks = firstDay.getDay(); // 0=Sun..6=Sat
  const totalCells = 42; // 6 rows * 7 columns

  const cells = [];

  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ kind: "blank", key: `b-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const selectable = isDateSelectable({ date, today, allowedSet });
    cells.push({
      kind: "day",
      key: date.toISOString(),
      date,
      isAvailable: selectable,
    });
  }

  while (cells.length < totalCells) {
    cells.push({ kind: "blank", key: `t-${cells.length}` });
  }

  return cells;
}

export default function BookAppointment({ doctor, hospital }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // FIX 6: Track confirmed booking for confirmation screen
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  const allowedSet = useMemo(
    () => normalizeAvailableDays(doctor?.availableDays || []),
    [doctor?.availableDays]
  );

  const cells = useMemo(
    () =>
      buildMonthCells({
        year: viewYear,
        month: viewMonth,
        today,
        allowedSet,
      }),
    [viewYear, viewMonth, today, allowedSet]
  );

  const timeSlots = useMemo(() => {
    const allSlots = generateTimeSlots(
      hospital?.openTime || "09:00",
      hospital?.closeTime || "17:00",
      doctor?.slotDuration || 30
    );

    // If the selected date is today, filter out time slots that have already passed
    if (selectedDate) {
      const selectedDay = startOfDay(selectedDate);
      const todayDay = startOfDay(today);
      const isToday = selectedDay.getTime() === todayDay.getTime();

      if (isToday) {
        const nowMinutes = today.getHours() * 60 + today.getMinutes();
        return allSlots.filter((slot) => {
          const slotMinutes = parseTimeToMinutes(slot);
          return slotMinutes !== null && slotMinutes > nowMinutes;
        });
      }
    }

    return allSlots;
  }, [hospital?.openTime, hospital?.closeTime, doctor?.slotDuration, selectedDate, today]);

  useEffect(() => {
    // Preselect the first available date in the current view month (if any).
    if (selectedDate) return;
    const firstAvailable = cells.find(
      (c) => c.kind === "day" && c.isAvailable
    );
    if (firstAvailable?.date) setSelectedDate(firstAvailable.date);
  }, [cells, selectedDate]);

  useEffect(() => {
    // When selected date changes, load already booked slots for that doctor/date.
    const doctorId = doctor?._id;
    if (!selectedDate || !doctorId) {
      setBookedSlots([]);
      return;
    }

    const controller = new AbortController();

    async function loadBooked() {
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const res = await fetch(
          `/api/appointments?doctorId=${doctorId}&date=${dateStr}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setBookedSlots([]);
          return;
        }
        const data = await res.json();
        setBookedSlots(Array.isArray(data) ? data.map((a) => a.time) : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
        setBookedSlots([]);
      }
    }

    loadBooked();

    return () => controller.abort();
  }, [selectedDate, doctor]);

  useEffect(() => {
    // If user changes date, reset time selection and messages.
    setSelectedTime("");
    setError("");
    setSuccess("");
  }, [selectedDate]);

  async function handleBook() {
    if (!selectedDate || !selectedTime) {
      setError("Please select date and time first.");
      setSuccess("");
      return;
    }

    if (!fullName || !email || !phone) {
      setError("Please fill in your name, email, and phone.");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospitalId: hospital?._id || doctor?.hospitalId,
          doctorId: doctor?._id,
          date: selectedDate.toISOString().slice(0, 10),
          time: selectedTime,
          patientName: fullName,
          email,
          phone,
          reason,
          isEmergency: Boolean(reason && reason.includes("EMERGENCY")),
          severity: reason && reason.includes("EMERGENCY") ? "emergency" : "routine",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create appointment");
      }

      setSuccess("Appointment booked successfully!");
      setError("");
      // Mark this slot as booked so it can't be selected again
      setBookedSlots((prev) =>
        prev.includes(selectedTime) ? prev : [...prev, selectedTime]
      );
      // FIX 6: Switch to confirmation screen with visit + patient details
      setConfirmedBooking({
        date: selectedDate,
        time: selectedTime,
        patientName: fullName,
        patientEmail: email,
        patientPhone: phone,
        patientReason: reason,
      });
      setSelectedTime("");
    } catch (err) {
      console.error(err);
      setError("Could not book appointment. Please try again.");
      setSuccess("");
    } finally {
      setSubmitting(false);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth, 1);

  // FIX 6: Show confirmation screen after successful booking
  if (confirmedBooking) {
    return (
      <BookingConfirmation
        doctor={doctor}
        hospital={hospital}
        date={confirmedBooking.date}
        time={confirmedBooking.time}
        patientName={confirmedBooking.patientName}
        patientEmail={confirmedBooking.patientEmail}
        patientPhone={confirmedBooking.patientPhone}
        patientReason={confirmedBooking.patientReason}
        onBookAnother={() => {
          setConfirmedBooking(null);
          setSelectedDate(null);
          setSelectedTime("");
          setFullName("");
          setEmail("");
          setPhone("");
          setReason("");
          setSuccess("");
          setError("");
        }}
      />
    );
  }

  const canGoPrev = (() => {
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const viewMonthStart = new Date(viewYear, viewMonth, 1);
    return viewMonthStart > currentMonthStart;
  })();

  function goPrevMonth() {
    if (!canGoPrev) return;
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(null);
    setSelectedTime("");
  }

  function goNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(null);
    setSelectedTime("");
  }

  return (
    <section className="ap-booking">
      <h2 className="ap-title">Book an Appointment</h2>

      <div className="ap-step-card">
        <div className="ap-step-header">
          <h3>Step 1: Select Date &amp; Time</h3>
          <p>Choose your preferred appointment slot</p>
        </div>

        <div className="ap-grid">
          {/* Select Date */}
          <div className="ap-panel">
            <div className="ap-panel-title">
              <FaRegCalendarAlt />
              <span>Select Date</span>
            </div>

            <div className="ap-calendar">
              <div className="ap-calendar-nav">
                <button
                  type="button"
                  className="ap-nav-btn"
                  onClick={goPrevMonth}
                  disabled={!canGoPrev}
                  aria-label="Previous month"
                >
                  ‹
                </button>

                <div className="ap-month">
                  {monthLabel.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                <button
                  type="button"
                  className="ap-nav-btn"
                  onClick={goNextMonth}
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>

              <div className="ap-calendar-grid">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="ap-dow">
                    {d}
                  </div>
                ))}

                {cells.map((cell) => {
                  if (cell.kind === "blank") {
                    return <div key={cell.key} className="ap-blank" />;
                  }

                  const isSelected =
                    selectedDate &&
                    cell.date.toDateString() === selectedDate.toDateString();

                  const classes = [
                    "ap-day",
                    !cell.isAvailable && "disabled",
                    isSelected && "active",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={classes}
                      disabled={!cell.isAvailable}
                      onClick={() => {
                        if (!cell.isAvailable) return;
                        setSelectedDate(cell.date);
                      }}
                    >
                      {cell.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Select Time */}
          <div className="ap-panel">
            <div className="ap-panel-title">
              <IoTimeOutline />
              <span>Select Time</span>
            </div>

            {!selectedDate ? (
              <div className="ap-empty">Please select a date first</div>
            ) : timeSlots.length === 0 ? (
              <div className="ap-empty">
                No slots available for this day.
              </div>
            ) : (
              <div className="ap-time-grid">
                {timeSlots.map((slot) => (
                  // Disable slots that are already booked for this doctor/date
                  <button
                    key={slot}
                    type="button"
                    className={
                      "ap-time" +
                      (slot === selectedTime ? " active" : "") +
                      (bookedSlots.includes(slot) ? " booked" : "")
                    }
                    disabled={bookedSlots.includes(slot)}
                    onClick={() => {
                      if (bookedSlots.includes(slot)) return;
                      setSelectedTime(slot);
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="ap-step2-card">
          <div className="ap-step2-header">
            <h3>Step 2: Your Details</h3>
            <p>Please provide your contact information</p>
          </div>

          <div className="ap-form">
            <div className="ap-form-row">
              <div className="ap-input-group">
                <label className="ap-label">Full Name</label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon">
                    <IoPersonOutline />
                  </span>
                  <input
                    type="text"
                    className="ap-input"
                    placeholder="Patient Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="ap-input-group">
                <label className="ap-label">Email</label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon">
                    <IoMailOutline />
                  </span>
                  <input
                    type="email"
                    className="ap-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ap-form-row">
              <div className="ap-input-group full">
                <label className="ap-label">Phone Number</label>
                <div className="ap-input-wrapper">
                  <span className="ap-input-icon">
                    <IoCallOutline />
                  </span>
                  <input
                    type="tel"
                    className="ap-input"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ap-form-row">
              <div className="ap-input-group full">
                <label className="ap-label">
                  Reason for Visit <span className="ap-label-optional">(Optional)</span>
                </label>
                <div className="ap-input-wrapper textarea">
                  <span className="ap-input-icon">
                    <IoDocumentTextOutline />
                  </span>
                  <textarea
                    rows={3}
                    className="ap-textarea"
                    placeholder="Briefly describe your symptoms or reason for the appointment..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="ap-step2-confirm"
              onClick={handleBook}
              disabled={submitting}
            >
              {submitting ? "Booking..." : "Confirm Appointment"}
            </button>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

