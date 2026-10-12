import connectDB from "../../../../../server/config/db";
import Appointment from "../../../../../server/models/Appointment";
import Doctor from "../../../../../server/models/Doctor";
import Hospital from "../../../../../server/models/Hospital";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      doctorId,
      hospitalId,
      patientName,
      phone,
      email,
      symptoms,
      aiDiagnosis,
      aiSummary,
      emergencyContact,
      preferredTime,
    } = body;

    if (!doctorId || !hospitalId || !patientName || !phone) {
      return Response.json(
        { error: "Doctor, Hospital, Patient Name, and Phone are required for emergency booking." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const timeLabel = preferredTime || `Immediate (${curHour % 12 || 12}:${curMin.toString().padStart(2, "0")} ${curHour >= 12 ? "PM" : "AM"})`;

    const appointment = await Appointment.create({
      doctorId,
      hospitalId,
      patientName: patientName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : "",
      date: todayStr,
      time: timeLabel,
      reason: `🚨 [EMERGENCY TRIAGE] ${aiDiagnosis || "Critical Condition"}: ${symptoms || ""}`.slice(0, 500),
      isEmergency: true,
      severity: "emergency",
      status: "confirmed",
      aiDiagnosis: aiDiagnosis || "Urgent Emergency Triage",
      aiSummary: aiSummary || "Patient marked as emergency condition by AI clinical triage system.",
      emergencyNotes: emergencyContact ? `Emergency Kin Contact: ${emergencyContact}` : "Immediate attention required",
    });

    // Populate details for the confirmation receipt
    const populatedAppt = await Appointment.findById(appointment._id)
      .populate("doctorId", "name specialization consultationFee")
      .populate("hospitalId", "name address phone emergencyPhone");

    return Response.json(
      {
        success: true,
        message: "Emergency priority appointment confirmed successfully! Hospital has been alerted.",
        appointment: populatedAppt,
        emergencyPassCode: `EMERG-${String(appointment._id).slice(-6).toUpperCase()}`,
        emergencyInstructions: [
          "Proceed to the Emergency / Casualty desk upon hospital arrival.",
          `Show Emergency Pass Code: EMERG-${String(appointment._id).slice(-6).toUpperCase()}`,
          "Keep all previous medical records and IDs accessible.",
          "If traveling by vehicle, turn on hazard lights for urgent transit.",
          "If condition worsens en route, dial 108 immediately.",
        ],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Emergency booking error:", error);
    return Response.json(
      { error: error.message || "Failed to process emergency booking." },
      { status: 500 }
    );
  }
}
