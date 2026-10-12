import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    phone: String,
    openTime: String,
    closeTime: String,
    departments: [String],
    city: String,
    location: {
      lat: Number,
      lng: Number,
    },
    emergencyPhone: String,
    emergencyAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Hospital ||
  mongoose.model("Hospital", hospitalSchema);
