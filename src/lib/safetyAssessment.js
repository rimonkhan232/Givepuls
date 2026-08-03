import { isCompatible, testCategoryOf } from "./bloodUtils";

const DISEASE_BN = {
  HIV: "এইচআইভি (HIV)",
  "Hepatitis B": "হেপাটাইটিস বি",
  "Hepatitis C": "হেপাটাইটিস সি",
  "VDRL (Syphilis)": "সিফিলিস (ভিডিআরএল)",
  Malaria: "ম্যালেরিয়া",
  Anemia: "রক্তস্বল্পতা (অ্যানিমিয়া)",
  "Sickle Cell Disease": "সিকল সেল ডিজিজ",
  Polycythemia: "পলিসাইথেমিয়া",
  Leukopenia: "লিউকোপেনিয়া",
  Leukocytosis: "লিউকোসাইটোসিস",
  Leukemia: "লিউকেমিয়া (রক্ত ক্যান্সার)",
  Lymphoma: "লিম্ফোমা",
  "Multiple Myeloma": "মাল্টিপল মায়েলোমা",
  Hemophilia: "হিমোফিলিয়া",
  "Von Willebrand Disease": "ভন উইলেব্র্যান্ড ডিজিজ",
  Thrombocytopenia: "থ্রম্বোসাইটোপেনিয়া",
  Thrombophilia: "থ্রম্বোফিলিয়া",
};

// How each category should be explained + what it means for eligibility.
const CATEGORY_INFO = {
  "Infectious Screening": {
    verb: "tested positive for",
    reasonEn: (names) =>
      `Any blood donation with a positive result for an infectious marker (${names}) is strictly prohibited, because the pathogen can be transmitted to the recipient through transfusion.`,
    reasonBn: (namesBn) =>
      `সংক্রামক চিহ্নিতকারীতে (${namesBn}) পজিটিভ ফলাফল থাকলে রক্তদান সম্পূর্ণ নিষিদ্ধ, কারণ সংক্রমণ রক্ত সঞ্চালনের মাধ্যমে গ্রহীতার মধ্যে ছড়িয়ে পড়তে পারে।`,
    recs: [
      "The donor must be immediately disqualified from donating blood.",
      "The donor is strongly advised to consult a healthcare professional for confirmatory testing and medical guidance.",
      "Follow standard medical protocols for handling potentially infectious biological samples.",
    ],
  },
  "Red Blood Cell Disorders": {
    verb: "shows findings consistent with",
    reasonEn: (names) =>
      `A red blood cell disorder (${names}) was found. Donating blood can worsen the donor's own condition (e.g. dangerously low red cell counts), and the unit's oxygen-carrying quality may not meet transfusion standards.`,
    reasonBn: (namesBn) =>
      `দাতার রক্তে লোহিত রক্তকণিকার সমস্যা (${namesBn}) পাওয়া গেছে। রক্ত দিলে দাতার নিজের অবস্থার অবনতি হতে পারে এবং সংগৃহীত রক্তের মান সঞ্চালনের মানদণ্ড পূরণ নাও করতে পারে।`,
    recs: [
      "The donor should be deferred from donating until a physician confirms it's safe.",
      "Refer the donor for haematology follow-up before any future donation attempt.",
    ],
  },
  "White Blood Cell Disorders": {
    verb: "shows findings consistent with",
    reasonEn: (names) =>
      `A white blood cell disorder (${names}) was found, including possible blood cancer markers. Donors with these conditions are permanently deferred, both for their own safety and because the donated blood is not considered safe for transfusion.`,
    reasonBn: (namesBn) =>
      `দাতার শ্বেত রক্তকণিকাজনিত সমস্যা (${namesBn}) পাওয়া গেছে, যার মধ্যে রক্ত ক্যান্সারের সম্ভাব্য লক্ষণও থাকতে পারে। এই অবস্থায় দাতাকে স্থায়ীভাবে রক্তদান থেকে বিরত রাখা হয়, কারণ এটি দাতার নিরাপত্তা ও গ্রহীতার জন্য রক্তের মান উভয়ের জন্যই গুরুত্বপূর্ণ।`,
    recs: [
      "The donor must be permanently deferred from donating blood.",
      "Refer the donor to an oncologist or haematologist for full diagnostic work-up as soon as possible.",
    ],
  },
  "Platelet & Clotting Disorders": {
    verb: "shows findings consistent with",
    reasonEn: (names) =>
      `A platelet or clotting disorder (${names}) was found. This can put the donor at risk of excessive bleeding or clotting during and after donation, and may affect how safely the collected unit can be used.`,
    reasonBn: (namesBn) =>
      `দাতার রক্তে প্লাটিলেট বা রক্ত জমাট বাঁধার সমস্যা (${namesBn}) পাওয়া গেছে। এতে দান করার সময় বা পরে দাতার অতিরিক্ত রক্তক্ষরণ বা জমাট বাঁধার ঝুঁকি থাকতে পারে।`,
    recs: [
      "The donor should be deferred from donating until cleared by a haematologist.",
      "Advise the donor to seek medical evaluation for their clotting/platelet levels.",
    ],
  },
};

/**
 * Runs a local, rule-based safety assessment for a donor -> recipient
 * blood exchange using the donor's uploaded test reports. This mirrors
 * what a backend-hosted LLM call would return, but runs entirely
 * client-side so no API key is ever exposed in the frontend bundle.
 */
export function assessBloodExchange({ donor, recipient, donorReports }) {
  const groupsCompatible = isCompatible(donor.bloodGroup, recipient.bloodGroup);
  const positiveReports = donorReports.filter((r) => r.result === "Positive");
  const pendingReports = donorReports.filter((r) => r.result === "Pending");
  const hasReports = donorReports.length > 0;

  const safe = groupsCompatible && positiveReports.length === 0;

  const sections = [];
  const recommendations = [];

  if (!groupsCompatible) {
    sections.push({
      en: `The blood groups themselves are not compatible: ${donor.bloodGroup} cannot safely be transfused into a recipient with ${recipient.bloodGroup}. Transfusing incompatible ABO/Rh groups can trigger a severe, potentially fatal immune reaction.`,
      bn: `রক্তের গ্রুপ নিজেই সামঞ্জস্যপূর্ণ নয়: ${donor.bloodGroup} গ্রুপ ${recipient.bloodGroup} গ্রুপের গ্রহীতাকে নিরাপদে দেওয়া যাবে না। বেমানান গ্রুপ সঞ্চালন করলে মারাত্মক প্রতিক্রিয়া হতে পারে।`,
    });
    recommendations.push("Do not proceed with this donor-recipient pairing.");
    recommendations.push("Search for a donor whose blood group is compatible with the recipient.");
  }

  if (positiveReports.length > 0) {
    // Group positive findings by category so the explanation reads naturally
    // even when a donor has issues across multiple categories.
    const byCategory = {};
    positiveReports.forEach((r) => {
      const cat = testCategoryOf(r.testType);
      byCategory[cat] = byCategory[cat] || [];
      byCategory[cat].push(r.testType);
    });

    Object.entries(byCategory).forEach(([cat, tests]) => {
      const info = CATEGORY_INFO[cat];
      if (!info) return;
      const names = tests.join(", ");
      const namesBn = tests.map((t) => DISEASE_BN[t] || t).join(", ");
      sections.push({ en: info.reasonEn(names), bn: info.reasonBn(namesBn) });
      info.recs.forEach((rec) => {
        if (!recommendations.includes(rec)) recommendations.push(rec);
      });
    });
  }

  if (sections.length === 0) {
    sections.push({
      en: "The blood groups are compatible and no positive findings were found across infectious screening or blood disorder panels in the donor's uploaded reports.",
      bn: "রক্তের গ্রুপ সামঞ্জস্যপূর্ণ এবং দাতার আপলোড করা রিপোর্টে সংক্রামক স্ক্রিনিং বা রক্তের রোগ সংক্রান্ত কোনো পজিটিভ ফলাফল পাওয়া যায়নি।",
    });
    recommendations.push("Proceed with standard pre-donation screening at the time of transfusion.");
  }

  if (pendingReports.length > 0) {
    recommendations.push(
      `Results for ${pendingReports.map((r) => r.testType).join(", ")} are still pending — confirm before finalizing.`
    );
  }

  const headline = sections.map((s) => s.en).join(" ");
  const headlineBn = sections.map((s) => s.bn).join(" ");

  return {
    groupsCompatible,
    safe,
    hasReports,
    positiveReports,
    pendingReports,
    headline,
    headlineBn,
    recommendations,
    needsCaution: !hasReports,
  };
}
