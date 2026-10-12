// Haversine distance calculator and city geocoding helpers

export const KNOWN_CITIES = {
  amritsar: { name: "Amritsar", lat: 31.6340, lng: 74.8723 },
  jalandhar: { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
  mohali: { name: "Mohali", lat: 30.7046, lng: 76.7179 },
  chandigarh: { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  ludhiana: { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
  patiala: { name: "Patiala", lat: 30.3398, lng: 76.3869 },
  bathinda: { name: "Bathinda", lat: 30.2110, lng: 74.9455 },
  delhi: { name: "Delhi", lat: 28.6139, lng: 77.2090 },
  "new delhi": { name: "New Delhi", lat: 28.6139, lng: 77.2090 },
  gurgaon: { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
  gurugram: { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
  noida: { name: "Noida", lat: 28.5355, lng: 77.3910 },
  mumbai: { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
  bengaluru: { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  bangalore: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  kolkata: { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
};

/**
 * Calculates straight-line distance in km between two geo-coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (Number.isNaN(numLat1) || Number.isNaN(numLon1) || Number.isNaN(numLat2) || Number.isNaN(numLon2)) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Resolves latitude and longitude for a given city or address string
 */
export function resolveCoordinates(input = "") {
  if (!input) return null;
  const lower = String(input).toLowerCase().trim();

  for (const [key, val] of Object.entries(KNOWN_CITIES)) {
    if (lower.includes(key)) {
      return { lat: val.lat, lng: val.lng, cityName: val.name };
    }
  }

  return null;
}

/**
 * Ensures hospital has valid coordinates even if legacy record
 */
export function getHospitalCoordinates(hospital) {
  if (hospital?.location?.lat && hospital?.location?.lng) {
    return { lat: hospital.location.lat, lng: hospital.location.lng };
  }

  if (hospital?.city) {
    const resolved = resolveCoordinates(hospital.city);
    if (resolved) return { lat: resolved.lat, lng: resolved.lng };
  }

  if (hospital?.address) {
    const resolved = resolveCoordinates(hospital.address);
    if (resolved) return { lat: resolved.lat, lng: resolved.lng };
  }

  // Fallback default coordinates (Lawrence Road, Amritsar)
  return { lat: 31.6340, lng: 74.8723 };
}

/**
 * Computes next available emergency or routine appointment slot for a doctor
 */
export function computeEarliestSlot(doctor, hospital) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const availableDaysSet = new Set(
    (doctor?.availableDays || []).map((d) => d.toLowerCase().slice(0, 3))
  );

  // Search next 7 days for the first match
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = days[d.getDay()];
    const shortDay = dayName.toLowerCase().slice(0, 3);

    // If doctor works on this day or no restricted days specified
    if (availableDaysSet.size === 0 || availableDaysSet.has(shortDay)) {
      const dateStr = d.toISOString().slice(0, 10);
      const isToday = i === 0;

      // Slot calculation
      const openTime = hospital?.openTime || "09:00 AM";
      const slotDuration = doctor?.slotDuration || 30;

      let slotTime = openTime;
      if (isToday) {
        // If today, find a slot in the next 15-45 minutes or emergency immediate
        const curHour = now.getHours();
        const curMin = now.getMinutes();
        const nextHour = (curHour % 12 || 12);
        const ampm = curHour >= 12 ? "PM" : "AM";
        const roundedMin = Math.ceil((curMin + 15) / 15) * 15;
        if (roundedMin < 60) {
          slotTime = `${nextHour}:${roundedMin.toString().padStart(2, "0")} ${ampm}`;
        } else {
          const advHour = ((curHour + 1) % 12 || 12);
          const advAmpm = (curHour + 1) >= 12 ? "PM" : "AM";
          slotTime = `${advHour}:00 ${advAmpm}`;
        }
      }

      return {
        date: dateStr,
        dayName,
        time: slotTime,
        isImmediate: isToday,
      };
    }
  }

  return {
    date: now.toISOString().slice(0, 10),
    dayName: days[now.getDay()],
    time: "Immediate Emergency Walk-in",
    isImmediate: true,
  };
}
