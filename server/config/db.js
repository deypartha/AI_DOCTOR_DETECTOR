import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medibook";
    await mongoose.connect(mongoUri, {
      dbName: "medibook",
    });

    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw new Error("Database connection failed");
  }
};

export default connectDB;
