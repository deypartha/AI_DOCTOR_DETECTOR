/**
 * AI Health Assistant & Clinical Triage Engine
 * Analyzes patient symptom descriptions, determines probable medical conditions,
 * evaluates severity and urgency (Routine vs Urgent vs Critical Emergency),
 * maps to the optimal medical specialty, and generates first-aid advice.
 */

// Comprehensive medical rules & keyword matching taxonomy
const MEDICAL_TAXONOMY = [
  {
    category: "Cardiology",
    specialization: "Cardiologist",
    keywords: [
      "chest pain", "chest tightness", "chest pressure", "heart attack", "cardiac",
      "radiating pain to left arm", "arm pain", "jaw pain", "angina", "palpitation",
      "irregular heartbeat", "heart fluttering", "heavy chest", "racing heart"
    ],
    emergencyKeywords: [
      "crushing chest pain", "sweating chest pain", "radiating to arm", "heart attack",
      "crushing pressure", "chest tightness breathlessness"
    ],
    conditions: [
      "Suspected Acute Coronary Syndrome / Angina",
      "Cardiac Arrhythmia / Palpitations",
      "Cardiovascular Distress"
    ],
    firstAid: [
      "Sit down immediately and rest in an upright, comfortable position.",
      "Loosen any tight clothing around your neck and chest.",
      "Stay calm and avoid any physical exertion or stair climbing.",
      "Do NOT attempt to drive yourself; arrange emergency transport or call 108 / 112.",
      "If you have prescribed emergency nitroglycerin/sorbitrate from your doctor, use as instructed."
    ],
    redFlags: [
      "Pain radiating to left arm, back, neck, or jaw",
      "Cold profuse sweating with dizziness or nausea",
      "Fainting or sudden loss of consciousness"
    ],
    baseSeverity: "emergency"
  },
  {
    category: "Pulmonology",
    specialization: "Pulmonologist",
    keywords: [
      "breath", "breathing", "shortness of breath", "dyspnea", "asthma", "wheezing",
      "choking", "coughing blood", "lung", "chest congestion", "heavy cough",
      "cannot inhale", "gasping", "pneumonia", "bronchitis", "suffocating"
    ],
    emergencyKeywords: [
      "gasping for air", "cannot breathe", "choking", "coughing blood", "blue lips",
      "severe asthma attack", "stridor"
    ],
    conditions: [
      "Acute Respiratory Distress / Asthma Flare-up",
      "Lower Respiratory Tract Infection / Pneumonia",
      "Bronchial Spasm"
    ],
    firstAid: [
      "Sit upright — do NOT lie flat on your back.",
      "Ensure access to fresh, open air; loosen constricting garments.",
      "Use your prescribed bronchodilator / rescue inhaler with spacer if available.",
      "Practice slow, pursed-lip breathing to reduce hyperventilation.",
      "Seek emergency medical evaluation if breathing continues to be strained."
    ],
    redFlags: [
      "Bluish tint on fingernails, gums, or lips (Cyanosis)",
      "Inability to speak in full sentences due to breathlessness",
      "Stridor or high-pitched wheezing when breathing in"
    ],
    baseSeverity: "emergency"
  },
  {
    category: "Neurology",
    specialization: "Neurologist",
    keywords: [
      "stroke", "facial drop", "slurred speech", "paralysis", "numbness one side",
      "seizure", "fit", "convulsion", "thunderclap headache", "worst headache",
      "loss of consciousness", "fainted", "unresponsive", "blackout", "dizziness",
      "migraine", "vertigo", "vision loss sudden", "confusion sudden"
    ],
    emergencyKeywords: [
      "stroke", "facial drop", "one side paralyzed", "slurred speech", "seizure",
      "unresponsive", "sudden worst headache", "coma", "collapsed"
    ],
    conditions: [
      "Suspected Acute Cerebrovascular Event (Stroke / TIA)",
      "Neurological Seizure / Syncope",
      "Severe Migraine / Cluster Cephalea"
    ],
    firstAid: [
      "Check the FAST indicators (Face drooping, Arm weakness, Speech slurred, Time to call).",
      "Keep the person lying safely on their side (recovery position) if dizzy or recovering from seizure.",
      "Do NOT administer oral food, water, or medication to prevent choking/aspiration.",
      "Note the exact time symptoms started — this is critical for clot-busting stroke treatments.",
      "Call emergency ambulance immediately if paralysis or speech loss is observed."
    ],
    redFlags: [
      "Sudden weakness or numbness in face, arm, or leg (especially on one side)",
      "Sudden trouble speaking or understanding speech",
      "Sudden severe headache with no known previous cause"
    ],
    baseSeverity: "emergency"
  },
  {
    category: "Orthopedics",
    specialization: "Orthopedic Surgeon",
    keywords: [
      "fracture", "broken bone", "dislocation", "bone sticking out", "sprain",
      "twisted ankle", "knee injury", "joint pain", "cannot walk", "bone crack",
      "swelling fall", "ligament", "sports injury", "back pain severe", "shoulder pop"
    ],
    emergencyKeywords: [
      "compound fracture", "bone through skin", "unbearable fracture", "spinal injury",
      "pelvic injury fall", "cannot move legs"
    ],
    conditions: [
      "Suspected Bone Fracture / Dislocation",
      "Acute Ligament Tear / Severe Joint Sprain",
      "Musculoskeletal Trauma"
    ],
    firstAid: [
      "Rest the injured limb and do not attempt to bear weight or walk.",
      "Immobilize the affected joint or bone using a makeshift splint or supportive sling.",
      "Apply an ice pack wrapped in a cloth for 15-20 minutes to minimize swelling (avoid direct ice on skin).",
      "Elevate the injured limb above heart level if comfortable.",
      "Do not try to force, push back, or realign any dislocated joint or bone."
    ],
    redFlags: [
      "Open wound where bone is visible or protruding (Emergency)",
      "Numbness, loss of sensation, or pale cold fingers/toes beyond the injury",
      "Rapid swelling with extreme deformity"
    ],
    baseSeverity: "urgent"
  },
  {
    category: "Gastroenterology",
    specialization: "Gastroenterologist",
    keywords: [
      "stomach pain", "abdominal pain", "belly ache", "vomiting blood", "black stools",
      "severe acidity", "gallbladder", "appendix", "appendicitis", "gastritis",
      "jaundice", "liver", "bloating", "indigestion", "cramps stomach", "loose motions"
    ],
    emergencyKeywords: [
      "vomiting blood", "black tarry stools", "rigid abdomen", "unbearable lower right pain",
      "appendicitis acute", "extreme dehydration"
    ],
    conditions: [
      "Acute Gastritis / Peptic Ulcer Disease",
      "Suspected Acute Appendicitis or Cholecystitis",
      "Acute Gastroenteritis / Gastrointestinal Infection"
    ],
    firstAid: [
      "Sip small amounts of water or oral rehydration solution (ORS) if dehydrated.",
      "Avoid heavy, greasy, spicy, or solid food; eat light broth or bland items.",
      "Do not take NSAID painkillers (like ibuprofen) without doctor guidance as they can irritate stomach lining.",
      "If pain is localized sharply to the lower right abdomen, do not apply heating pads.",
      "Seek urgent medical review if vomiting persists or pain escalates rapidly."
    ],
    redFlags: [
      "Vomiting coffee-ground material or bright red blood",
      "Black, tar-colored foul stools",
      "Rigid, board-like abdomen that is unbearable to touch"
    ],
    baseSeverity: "urgent"
  },
  {
    category: "Pediatrics",
    specialization: "Pediatrician",
    keywords: [
      "baby", "child", "infant", "toddler", "kid", "newborn", "baby fever",
      "child cough", "baby not drinking", "pediatric", "child vomiting", "crying non-stop"
    ],
    emergencyKeywords: [
      "infant high fever", "baby lethargic", "baby breathing fast chest sinking",
      "child convulsions", "baby blue lips"
    ],
    conditions: [
      "Pediatric Febrile Illness",
      "Childhood Acute Respiratory / Viral Infection",
      "Pediatric Gastroenteritis"
    ],
    firstAid: [
      "Keep the child comfortable, dressed in lightweight clothing in a well-ventilated room.",
      "Maintain hydration with frequent small sips of water, milk, or oral rehydration fluids.",
      "Offer paracetamol only according to the child's exact weight dosage recommended by pediatrician.",
      "Never give aspirin to children or adolescents (risk of Reye's syndrome).",
      "Monitor temperature and alertness closely."
    ],
    redFlags: [
      "Lethargy, unusual drowsiness, or difficult to awaken",
      "Fast breathing with chest ribs sinking in (retractions)",
      "High fever in infants under 3 months of age"
    ],
    baseSeverity: "urgent"
  },
  {
    category: "Gynecology",
    specialization: "Gynecologist",
    keywords: [
      "pregnancy", "pregnant", "period pain", "menstrual", "vaginal bleeding",
      "pelvic pain", "pcos", "ovary", "cramps uterine", "missed period", "fibroid"
    ],
    emergencyKeywords: [
      "heavy bleeding pregnancy", "severe ectopic pain", "pregnancy high fever",
      "water broke early", "severe pelvic agony"
    ],
    conditions: [
      "Acute Pelvic / Gynecological Condition",
      "Obstetric / Pregnancy Emergency",
      "Severe Dysmenorrhea / Ovarian Cyst Discomfort"
    ],
    firstAid: [
      "Lie down comfortably and rest.",
      "Stay hydrated and avoid strenuous activities.",
      "Track bleeding amount (number of sanitary pads per hour) for the medical team.",
      "If pregnant with sudden bleeding or sharp one-sided abdominal pain, proceed immediately to the hospital."
    ],
    redFlags: [
      "Soaking more than two pads per hour with large clots",
      "Sudden sharp, severe lower abdominal pain during known or suspected pregnancy",
      "Fever with foul-smelling discharge"
    ],
    baseSeverity: "urgent"
  },
  {
    category: "ENT",
    specialization: "ENT Specialist",
    keywords: [
      "ear", "earache", "throat", "sore throat", "tonsil", "tonsillitis", "sinus",
      "nosebleed", "ear discharge", "hearing loss", "hoarseness", "nose block",
      "ear ringing", "tinnitus", "swallowing pain"
    ],
    emergencyKeywords: [
      "uncontrollable nosebleed", "throat closing up", "cannot swallow saliva",
      "foreign object stuck throat", "stridor throat"
    ],
    conditions: [
      "Acute Tonsillopharyngitis / Throat Infection",
      "Acute Otitis Media / Ear Infection",
      "Sinusitis / Upper Airway Congestion"
    ],
    firstAid: [
      "For sore throat: Gargle with warm saline water 3-4 times daily.",
      "For nosebleeds: Lean forward slightly (do NOT tilt head back) and pinch the soft part of your nose firmly for 10 minutes.",
      "Stay well-hydrated with warm fluids like herbal tea or soup.",
      "Avoid inserting cotton buds or foreign objects into the ear canal."
    ],
    redFlags: [
      "Inability to swallow even saliva or fluids",
      "Difficulty breathing or whistling sound in throat",
      "Persistent nosebleed lasting over 20 minutes despite continuous pressure"
    ],
    baseSeverity: "routine"
  },
  {
    category: "Dermatology",
    specialization: "Dermatologist",
    keywords: [
      "skin", "rash", "itch", "itching", "eczema", "acne", "pimples", "hives",
      "allergy skin", "red patches", "peeling skin", "blister", "boil", "fungal"
    ],
    emergencyKeywords: [
      "blistering all over", "skin peeling wide areas", "rash with lip tongue swelling",
      "anaphylaxis rash"
    ],
    conditions: [
      "Allergic Contact Dermatitis / Urticaria",
      "Acute Eczema Flare or Skin Infection",
      "Papulosquamous Dermatitis"
    ],
    firstAid: [
      "Wash gently with mild fragrance-free cleanser and cool water.",
      "Apply soothing calamine lotion or cool damp compress to alleviate itching.",
      "Avoid scratching to prevent secondary bacterial infection.",
      "Avoid harsh soaps, deodorants, or unknown cosmetic products on affected areas."
    ],
    redFlags: [
      "Rash accompanied by difficulty breathing, wheezing, or facial/lip swelling (Anaphylaxis)",
      "High fever accompanying widespread painful blistering rash",
      "Rapidly spreading red, hot, swollen skin area"
    ],
    baseSeverity: "routine"
  },
  {
    category: "General Medicine",
    specialization: "General Physician",
    keywords: [
      "fever", "chills", "body ache", "weakness", "fatigue", "cold", "flu",
      "viral", "typhoid", "malaria", "dengue", "headache mild", "malaise",
      "loss of appetite", "general checkup", "health consultation"
    ],
    emergencyKeywords: [
      "fever 104", "fever with petechiae red spots", "fever with stiff neck",
      "delirium fever", "dengue bleeding gums"
    ],
    conditions: [
      "Acute Febrile Illness / Viral Infection",
      "Seasonal Influenza / Upper Respiratory Tract Infection",
      "Generalized Fatigue & Malaise"
    ],
    firstAid: [
      "Rest adequately and avoid physical strain.",
      "Stay well hydrated with warm water, coconut water, and soups.",
      "Use lukewarm water sponge to bring down high body temperature.",
      "Monitor your temperature and fluid intake twice daily."
    ],
    redFlags: [
      "High fever persisting over 3 days or exceeding 103°F (39.5°C)",
      "Fever accompanied by severe neck stiffness and aversion to light",
      "Red pinpoint rash spots (petechiae) or bleeding gums (Dengue warning)"
    ],
    baseSeverity: "routine"
  },
  {
    category: "Urology",
    specialization: "Urologist",
    keywords: [
      "kidney stone", "urine", "urination", "burning urine", "blood in urine",
      "flank pain", "back side pain sharp", "cannot pee", "urinary retention", "prostate"
    ],
    emergencyKeywords: [
      "cannot pass urine at all", "severe hematuria dark blood", "intractable renal colic"
    ],
    conditions: [
      "Suspected Renal Colic / Nephrolithiasis (Kidney Stones)",
      "Urinary Tract Infection (UTI)",
      "Acute Urinary Obstruction"
    ],
    firstAid: [
      "Drink plenty of water if kidney stones are suspected and urination is flowing.",
      "Apply gentle warm compress on lower back / flank for comfort.",
      "Avoid holding back urine; empty bladder as needed.",
      "Consult a doctor promptly for urine examination and ultrasound prescription."
    ],
    redFlags: [
      "Complete inability to pass urine despite urge (Acute Retention)",
      "High fever with shivering and severe flank pain (Pyelonephritis)",
      "Significant visible blood in urine"
    ],
    baseSeverity: "urgent"
  },
  {
    category: "Ophthalmology",
    specialization: "Ophthalmologist",
    keywords: [
      "eye", "vision", "eye pain", "blurred vision", "double vision", "red eye",
      "conjunctivitis", "chemical in eye", "eye injury", "foreign body eye"
    ],
    emergencyKeywords: [
      "sudden blindness", "chemical burn eye", "penetrating eye trauma", "halos and severe eye pain"
    ],
    conditions: [
      "Acute Conjunctivitis / Eye Infection",
      "Corneal Abrasion / Ocular Trauma",
      "Acute Visual Disturbance"
    ],
    firstAid: [
      "Do NOT rub or apply pressure to the eye.",
      "If chemicals entered the eye, flush immediately with clean running tap water for 15 minutes.",
      "Do not try to remove any foreign object embedded in the eyeball.",
      "Cover the eye loosely with a clean eye shield or paper cup and visit an ophthalmologist immediately."
    ],
    redFlags: [
      "Sudden partial or complete loss of sight in one or both eyes",
      "Severe eye pain accompanied by headache, nausea, or rainbow halos",
      "Penetrating injury or foreign body in the eyeball"
    ],
    baseSeverity: "urgent"
  }
];

/**
 * Perform rule-based clinical NLP triage
 */
export function analyzeWithClinicalRules(problemDescription = "", isEmergencyForced = false) {
  const text = String(problemDescription).toLowerCase();

  let bestMatch = null;
  let highestScore = 0;
  let hasEmergencyKeyword = isEmergencyForced;

  // General emergency triggers across any symptom text
  const universalEmergencyTerms = [
    "emergency", "unconscious", "collapsed", "fainted", "cannot breathe",
    "can't breathe", "suffocating", "choking", "bleeding profusely",
    "vomiting blood", "stroke", "heart attack", "crushing pain",
    "unbearable pain", "dying", "severe accident", "seizure", "paralyzed"
  ];

  for (const term of universalEmergencyTerms) {
    if (text.includes(term)) {
      hasEmergencyKeyword = true;
      break;
    }
  }

  // Score each taxonomy
  for (const tax of MEDICAL_TAXONOMY) {
    let score = 0;

    // Check emergency keywords for this specific category
    for (const em of tax.emergencyKeywords) {
      if (text.includes(em)) {
        score += 35;
        hasEmergencyKeyword = true;
      }
    }

    // Check standard keywords
    for (const kw of tax.keywords) {
      if (text.includes(kw)) {
        score += 15;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = tax;
    }
  }

  // Fallback if no specific keyword matched
  if (!bestMatch || highestScore === 0) {
    bestMatch = MEDICAL_TAXONOMY.find((t) => t.category === "General Medicine") || MEDICAL_TAXONOMY[0];
  }

  // Determine severity and triage score
  let severity = "routine";
  let severityScore = 35;

  if (hasEmergencyKeyword || isEmergencyForced || bestMatch.baseSeverity === "emergency") {
    severity = "emergency";
    severityScore = Math.max(88, Math.min(99, 85 + Math.floor(Math.random() * 10)));
  } else if (bestMatch.baseSeverity === "urgent" || text.includes("severe") || text.includes("intense") || text.includes("high fever")) {
    severity = "urgent";
    severityScore = Math.max(65, Math.min(84, 65 + Math.floor(Math.random() * 15)));
  } else {
    severity = "routine";
    severityScore = Math.max(25, Math.min(50, 30 + Math.floor(Math.random() * 15)));
  }

  // Pick top condition
  const primaryCondition = bestMatch.conditions[0];
  const secondaryCondition = bestMatch.conditions[1] || bestMatch.conditions[0];

  return {
    detectedProblem: primaryCondition,
    secondaryPossibility: secondaryCondition,
    specialization: bestMatch.specialization,
    category: bestMatch.category,
    severity,
    severityScore,
    isEmergency: severity === "emergency",
    summary: `Based on your description ("${problemDescription.slice(0, 100)}${problemDescription.length > 100 ? "..." : ""}"), our clinical AI has detected potential ${primaryCondition}. The recommended specialist is a ${bestMatch.specialization}.`,
    firstAid: bestMatch.firstAid,
    redFlags: bestMatch.redFlags,
    urgencyAdvice:
      severity === "emergency"
        ? "🚨 CRITICAL ATTENTION: Your symptoms show signs of an emergency. Immediate medical care or emergency doctor consultation is strongly advised. Call 108/112 if in distress."
        : severity === "urgent"
        ? "⚠️ URGENT CARE: Your symptoms suggest an acute issue that should be evaluated by a doctor within 12-24 hours."
        : "ℹ️ ROUTINE CARE: Your symptoms appear non-critical. A standard consultation with a doctor is recommended for proper assessment and prescription.",
    disclaimer: "This automated AI assessment provides guidance only and is not a definitive medical diagnosis. In case of life-threatening emergencies, call 108 / 112 immediately."
  };
}

/**
 * Attempts Gemini or OpenAI LLM analysis if API key is present, falls back gracefully to clinical rules
 */
export async function diagnosePatientProblem(problemDescription = "", additionalNotes = "", isEmergencyForced = false) {
  if (!problemDescription || problemDescription.trim().length === 0) {
    return {
      error: "Please describe your health symptoms or problem in detail."
    };
  }

  const combinedDescription = additionalNotes
    ? `${problemDescription}. Additional details: ${additionalNotes}`
    : problemDescription;

  // 1. Check if Gemini API Key is configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an AI Clinical Triage and Medical Specialist Recommendation system for a healthcare booking portal called MediBook.
Analyze the following patient symptom description:
"${combinedDescription}"

Provide your assessment in strict JSON format with exactly the following keys:
{
  "detectedProblem": "Short name of the probable condition (e.g. Acute Coronary Syndrome, Acute Gastroenteritis, Lumbar Sprain)",
  "secondaryPossibility": "Secondary alternative diagnosis",
  "specialization": "The best doctor specialist to consult (e.g., Cardiologist, Neurologist, Orthopedic Surgeon, Pulmonologist, Gastroenterologist, Dermatologist, ENT Specialist, Pediatrician, Gynecologist, Urologist, Ophthalmologist, General Physician, General Surgeon, Psychiatrist)",
  "severity": "emergency" | "urgent" | "routine",
  "severityScore": number between 20 and 99,
  "isEmergency": boolean (true if severity is emergency or life-threatening),
  "summary": "Clear, compassionate explanation of what the problem likely is and why this specialist is recommended (2-3 sentences)",
  "firstAid": ["Immediate practical first aid step 1", "Step 2", "Step 3"],
  "redFlags": ["Red flag symptom 1 to look out for", "Red flag 2"],
  "urgencyAdvice": "Actionable advice on urgency and transport"
}
Respond with ONLY the valid JSON object.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          parsed.disclaimer = "AI medical triage is an advisory system and does not substitute in-person emergency medical care.";
          if (isEmergencyForced) {
            parsed.isEmergency = true;
            parsed.severity = "emergency";
          }
          return parsed;
        }
      }
    } catch (llmErr) {
      console.warn("LLM API call failed, falling back to clinical rules engine:", llmErr.message);
    }
  }

  // 2. Default to Comprehensive Built-In Clinical Knowledge Engine
  return analyzeWithClinicalRules(combinedDescription, isEmergencyForced);
}
