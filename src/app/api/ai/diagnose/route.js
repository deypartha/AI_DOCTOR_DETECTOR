import connectDB from "../../../../../server/config/db";
import Doctor from "../../../../../server/models/Doctor";
import Hospital from "../../../../../server/models/Hospital";
import { diagnosePatientProblem } from "../../../../../server/lib/aiTriage";
import {
  calculateDistanceKm,
  resolveCoordinates,
  getHospitalCoordinates,
  computeEarliestSlot,
} from "../../../../../server/lib/geoUtils";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      problemDescription,
      additionalNotes = "",
      userLat,
      userLng,
      city = "",
      isEmergencyForced = false,
    } = body;

    if (!problemDescription || !problemDescription.trim()) {
      return Response.json(
        { error: "Please describe your health symptoms or condition." },
        { status: 400 }
      );
    }

    // 1. Run AI Clinical Diagnosis and Triage
    const analysis = await diagnosePatientProblem(
      problemDescription,
      additionalNotes,
      Boolean(isEmergencyForced)
    );

    if (analysis.error) {
      return Response.json({ error: analysis.error }, { status: 400 });
    }

    // 2. Resolve User Location Coordinates
    let patientCoords = null;
    if (userLat != null && userLng != null && !Number.isNaN(Number(userLat)) && !Number.isNaN(Number(userLng))) {
      patientCoords = { lat: Number(userLat), lng: Number(userLng), source: "gps" };
    } else if (city && city.trim()) {
      const resolved = resolveCoordinates(city);
      if (resolved) {
        patientCoords = { lat: resolved.lat, lng: resolved.lng, cityName: resolved.cityName, source: "city" };
      }
    }

    // Fallback if location not provided: default to Amritsar centre
    if (!patientCoords) {
      patientCoords = { lat: 31.6340, lng: 74.8723, cityName: "Amritsar", source: "default" };
    }

    // 3. Fetch all hospitals and doctors
    const hospitals = await Hospital.find();
    const hospitalMap = new Map();
    for (const h of hospitals) {
      hospitalMap.set(String(h._id), h);
    }

    const doctors = await Doctor.find();

    // 4. Score and calculate distance for each doctor
    const targetSpecLower = (analysis.specialization || "").toLowerCase();

    const scoredDoctors = doctors.map((doc) => {
      const hosp = hospitalMap.get(String(doc.hospitalId));
      const hospCoords = getHospitalCoordinates(hosp);
      const distance = calculateDistanceKm(
        patientCoords.lat,
        patientCoords.lng,
        hospCoords.lat,
        hospCoords.lng
      );

      const docSpecLower = (doc.specialization || "").toLowerCase();
      let matchType = "other";
      let matchScore = 50;

      if (docSpecLower === targetSpecLower || docSpecLower.includes(targetSpecLower) || targetSpecLower.includes(docSpecLower)) {
        matchType = "exact";
        matchScore = 100;
      } else if (
        docSpecLower.includes("physician") ||
        docSpecLower.includes("general") ||
        docSpecLower.includes("surgeon")
      ) {
        matchType = "general_fallback";
        matchScore = 75;
      }

      // Proximity penalty/bonus (closer is higher priority)
      if (distance != null) {
        const proximityBonus = Math.max(0, 30 - distance);
        matchScore += proximityBonus;
      }

      const earliestSlot = computeEarliestSlot(doc, hosp);

      return {
        _id: doc._id,
        name: doc.name,
        specialization: doc.specialization,
        experience: doc.experience,
        consultationFee: doc.consultationFee,
        slotDuration: doc.slotDuration,
        availableDays: doc.availableDays,
        hospital: hosp
          ? {
              _id: hosp._id,
              name: hosp.name,
              address: hosp.address,
              city: hosp.city,
              phone: hosp.phone,
              emergencyPhone: hosp.emergencyPhone || hosp.phone,
              emergencyAvailable: hosp.emergencyAvailable !== false,
              openTime: hosp.openTime,
              closeTime: hosp.closeTime,
              departments: hosp.departments,
              location: hospCoords,
            }
          : null,
        distanceKm: distance != null ? distance : 5.0,
        matchType,
        matchScore: Math.round(matchScore),
        earliestSlot,
      };
    });

    // 5. Separate exact/relevant doctors vs others
    const exactMatches = scoredDoctors.filter((d) => d.matchType === "exact");
    const fallbackMatches = scoredDoctors.filter((d) => d.matchType === "general_fallback");
    const otherMatches = scoredDoctors.filter((d) => d.matchType === "other");

    // Sort within each bucket by distance (nearest first), then match score
    const sortByDistanceThenScore = (a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return b.matchScore - a.matchScore;
    };

    exactMatches.sort(sortByDistanceThenScore);
    fallbackMatches.sort(sortByDistanceThenScore);
    otherMatches.sort(sortByDistanceThenScore);

    // Final list of recommended doctors
    const recommendedDoctors = [
      ...exactMatches,
      ...fallbackMatches,
      ...otherMatches,
    ];

    // 6. Find the Nearest Emergency Doctor
    // Preference: Nearest doctor in emergency-capable hospital, matching specialty or general/surgeon
    let nearestEmergencyDoctor = null;
    const emergencyCandidates = exactMatches.length > 0 ? exactMatches : fallbackMatches.length > 0 ? fallbackMatches : recommendedDoctors;
    if (emergencyCandidates.length > 0) {
      nearestEmergencyDoctor = emergencyCandidates[0];
    }

    return Response.json({
      analysis,
      userLocation: patientCoords,
      recommendedDoctors,
      nearestEmergencyDoctor,
      emergencyHotlines: {
        ambulance: "108",
        policeMedicalEmergency: "112",
        emergencyHospitalPhone: nearestEmergencyDoctor?.hospital?.emergencyPhone || "+91 98760 11119",
      },
    });
  } catch (error) {
    console.error("AI Diagnose error:", error);
    return Response.json(
      { error: error.message || "Failed to analyze symptoms" },
      { status: 500 }
    );
  }
}
