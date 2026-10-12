import connectDB from "../../../../../server/config/db";
import Appointment from "../../../../../server/models/Appointment";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const phone = searchParams.get("phone")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!phone && !email) {
      return Response.json(
        { error: "Please provide a phone number or email address." },
        { status: 400 }
      );
    }

    // Build filter: match phone OR email (case-insensitive)
    const orClauses = [];
    if (phone) orClauses.push({ phone });
    if (email) orClauses.push({ email: { $regex: new RegExp(`^${email}$`, "i") } });

    const appointments = await Appointment.find({ $or: orClauses })
      .populate("doctorId", "name specialization consultationFee")
      .populate("hospitalId", "name address phone emergencyPhone")
      .sort({ date: -1, time: 1 })
      .limit(20);

    return Response.json(appointments);
  } catch (err) {
    console.error("Appointment lookup error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
