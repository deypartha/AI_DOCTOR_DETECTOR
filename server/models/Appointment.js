import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    patientName: String,
    email: String,
    phone: String,
    reason: String,
    status: {
      type: String,
      default: "confirmed",
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    severity: {
      type: String,
      enum: ["routine", "urgent", "emergency"],
      default: "routine",
    },
    aiDiagnosis: String,
    aiSummary: String,
    emergencyNotes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);
