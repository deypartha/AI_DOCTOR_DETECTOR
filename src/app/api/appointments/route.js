import connectDB from "../../../../server/config/db";
import Appointment from "../../../../server/models/Appointment";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Basic validation
    if (!body.doctorId || !body.hospitalId || !body.date || !body.time) {
      return Response.json({ error: "doctorId, hospitalId, date and time are required" }, { status: 400 });
    }

    const appointment = await Appointment.create(body);
    return Response.json(appointment, { status: 201 });
  } catch (err) {
    console.error("Create appointment error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    // Build filter from query params
    // Supports: ?doctorId=... and/or ?date=... and/or ?hospitalId=...
    const filter = {};
    const doctorId   = searchParams.get("doctorId");
    const date       = searchParams.get("date");
    const hospitalId = searchParams.get("hospitalId");

    if (doctorId)   filter.doctorId   = doctorId;
    if (date)       filter.date       = date;
    if (hospitalId) filter.hospitalId = hospitalId;

    // populate doctorId so appointment rows can show the doctor's name
    const appointments = await Appointment.find(filter)
      .populate("doctorId", "name specialization consultationFee")
      .populate("hospitalId", "name address phone emergencyPhone")
      .sort({ date: -1, time: 1 });

    return Response.json(appointments);
  } catch (err) {
    console.error("Get appointments error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
