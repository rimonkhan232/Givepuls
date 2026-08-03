// Lightweight localStorage-backed "database" that mimics the base44 entity
// layer (User, DonorProfile, BloodBank, BloodRequest, Donation,
// BloodTestReport, Message, Review) so the whole app works fully offline.

const NS = "givepulse:v1:";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(NS + key, JSON.stringify(value));
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED = {
  users: [
    {
      id: "user_admin",
      fullName: "GivePulse Admin",
      email: "admin@givepulse.bd",
      password: "admin123",
      role: "admin",
      createdAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "user_miraz",
      fullName: "Miraz Khan",
      email: "miraz@example.com",
      password: "password",
      role: "user",
      createdAt: "2026-04-28T00:00:00.000Z",
    },
  ],
  donorProfiles: [
    {
      id: "dp_miraz",
      userId: "user_miraz",
      fullName: "Miraz Khan",
      bloodGroup: "O+",
      division: "Dhaka",
      address: "Khilkhet",
      phone: "01763348333",
      wants: "both", // donate | find | both
      lastDonationDate: "2026-07-28",
      about: "Nothing",
      available: false,
      rating: 4.8,
      totalDonations: 3,
    },
    {
      id: "dp_farah",
      userId: null,
      fullName: "Farah Rahman",
      bloodGroup: "A+",
      division: "Dhaka",
      address: "Dhanmondi",
      phone: "01711223344",
      wants: "donate",
      lastDonationDate: "2026-03-02",
      about: "Regular donor, happy to help nearby hospitals.",
      available: true,
      rating: 4.9,
      totalDonations: 9,
    },
    {
      id: "dp_tanvir",
      userId: null,
      fullName: "Tanvir Ahmed",
      bloodGroup: "B+",
      division: "Chittagong",
      address: "Agrabad",
      phone: "01911889900",
      wants: "donate",
      lastDonationDate: "2026-01-14",
      about: "Donated 12 times. Available on weekends.",
      available: true,
      rating: 5,
      totalDonations: 12,
    },
    {
      id: "dp_nusrat",
      userId: null,
      fullName: "Nusrat Jahan",
      bloodGroup: "O-",
      division: "Sylhet",
      address: "Zindabazar",
      phone: "01611002233",
      wants: "donate",
      lastDonationDate: null,
      about: "Universal donor, first-time volunteer.",
      available: true,
      rating: 4.6,
      totalDonations: 1,
    },
    {
      id: "dp_kabir",
      userId: null,
      fullName: "Kabir Hossain",
      bloodGroup: "AB+",
      division: "Khulna",
      address: "KDA Avenue",
      phone: "01511556677",
      wants: "both",
      lastDonationDate: "2025-12-20",
      about: "Works at a pharmacy, easy to reach on short notice.",
      available: true,
      rating: 4.7,
      totalDonations: 6,
    },
  ],
  bloodBanks: [
    {
      id: "bb_sandhani",
      name: "Sandhani Blood Bank - DMCH",
      address: "Dhaka Medical College Campus, Dhaka, Dhaka",
      phone: "+8801711111111",
      division: "Dhaka",
      stock: { "A+": 45, "A-": 12, "B+": 38, "B-": 8, "AB+": 15, "AB-": 5, "O+": 52, "O-": 18 },
    },
    {
      id: "bb_quantum",
      name: "Quantum Blood Bank",
      address: "Mirpur Road, Dhanmondi, Dhaka, Dhaka",
      phone: "+8801722222222",
      division: "Dhaka",
      stock: { "A+": 30, "A-": 7, "B+": 25, "B-": 4, "AB+": 10, "AB-": 3, "O+": 40, "O-": 15 },
    },
    {
      id: "bb_redcrescent",
      name: "Red Crescent Blood Center",
      address: "G.P.O. Box 612, Chittagong, Chittagong",
      phone: "+8801733333333",
      division: "Chittagong",
      stock: { "A+": 22, "A-": 5, "B+": 28, "B-": 6, "AB+": 8, "AB-": 2, "O+": 35, "O-": 10 },
    },
    {
      id: "bb_sylhet",
      name: "Sylhet MAG Osmani Blood Bank",
      address: "Medical College Road, Sylhet, Sylhet",
      phone: "+8801744444444",
      division: "Sylhet",
      stock: { "A+": 0, "A-": 0, "B+": 15, "B-": 3, "AB+": 5, "AB-": 0, "O+": 20, "O-": 8 },
    },
    {
      id: "bb_khulna",
      name: "Khulna City Blood Bank",
      address: "KDA Avenue, Khulna, Khulna",
      phone: "+8801755555555",
      division: "Khulna",
      stock: { "A+": 18, "A-": 4, "B+": 0, "B-": 0, "AB+": 6, "AB-": 1, "O+": 25, "O-": 7 },
    },
  ],
  bloodRequests: [
    {
      id: "req_1",
      requesterId: "user_miraz",
      requesterName: "Miraz Khan",
      bloodGroup: "O+",
      units: 1,
      location: "Khilkhet, Dhaka",
      urgency: "Urgent",
      neededBy: "As fast as possible",
      notes: "Needed for a surgery tomorrow morning.",
      status: "open",
      createdAt: "2026-07-29T09:00:00.000Z",
    },
  ],
  donations: [
    {
      id: "don_1",
      donorId: "dp_farah",
      donorName: "Farah Rahman",
      bloodGroup: "A+",
      location: "Square Hospital, Dhaka",
      createdAt: "2026-03-02T00:00:00.000Z",
    },
    {
      id: "don_2",
      donorId: "dp_tanvir",
      donorName: "Tanvir Ahmed",
      bloodGroup: "B+",
      location: "Chittagong Medical College Hospital",
      createdAt: "2026-01-14T00:00:00.000Z",
    },
    {
      id: "don_3",
      donorId: "dp_kabir",
      donorName: "Kabir Hossain",
      bloodGroup: "AB+",
      location: "Khulna City Blood Bank",
      createdAt: "2025-12-20T00:00:00.000Z",
    },
  ],
  bloodTestReports: [
    {
      id: "rep_farah_hiv",
      userId: null,
      donorProfileId: "dp_farah",
      testType: "HIV",
      result: "Negative",
      testDate: "2026-06-20",
      fileName: "farah_hiv_report.pdf",
      notes: "",
      createdAt: "2026-06-21T00:00:00.000Z",
    },
    {
      id: "rep_farah_hep",
      userId: null,
      donorProfileId: "dp_farah",
      testType: "Hepatitis B",
      result: "Negative",
      testDate: "2026-06-20",
      fileName: "farah_hepb_report.pdf",
      notes: "",
      createdAt: "2026-06-21T00:00:00.000Z",
    },
    {
      id: "rep_tanvir_hiv",
      userId: null,
      donorProfileId: "dp_tanvir",
      testType: "HIV",
      result: "Positive",
      testDate: "2026-01-10",
      fileName: "tanvir_hiv_report.pdf",
      notes: "Confirmatory retest recommended.",
      createdAt: "2026-01-11T00:00:00.000Z",
    },
    {
      id: "rep_kabir_vdrl",
      userId: null,
      donorProfileId: "dp_kabir",
      testType: "VDRL (Syphilis)",
      result: "Negative",
      testDate: "2025-12-15",
      fileName: "kabir_vdrl_report.pdf",
      notes: "",
      createdAt: "2025-12-16T00:00:00.000Z",
    },
    {
      id: "rep_nusrat_sickle",
      userId: null,
      donorProfileId: "dp_nusrat",
      testType: "Sickle Cell Disease",
      result: "Negative",
      testDate: "2026-05-02",
      fileName: "nusrat_sicklecell_report.pdf",
      notes: "",
      createdAt: "2026-05-03T00:00:00.000Z",
    },
    {
      id: "rep_kabir_thrombo",
      userId: null,
      donorProfileId: "dp_kabir",
      testType: "Thrombocytopenia",
      result: "Positive",
      testDate: "2025-12-15",
      fileName: "kabir_platelet_report.pdf",
      notes: "Platelet count below normal range on recheck.",
      createdAt: "2025-12-16T00:00:00.000Z",
    },
    {
      id: "rep_miraz_anemia",
      userId: "user_miraz",
      donorProfileId: "dp_miraz",
      testType: "Anemia",
      result: "Negative",
      testDate: "2026-07-28",
      fileName: "miraz_cbc_report.pdf",
      notes: "",
      createdAt: "2026-07-28T00:00:00.000Z",
    },
  ],
  messages: [],
  reviews: [],
  reservations: [],
};

function ensureSeeded() {
  Object.entries(SEED).forEach(([key, value]) => {
    if (read(key, null) === null) write(key, value);
  });
}

ensureSeeded();

function collection(key) {
  return {
    list: () => read(key, []),
    get: (id) => read(key, []).find((r) => r.id === id) || null,
    create: (data) => {
      const rows = read(key, []);
      const row = { id: uid(key), createdAt: new Date().toISOString(), ...data };
      rows.unshift(row);
      write(key, rows);
      return row;
    },
    update: (id, patch) => {
      const rows = read(key, []);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch };
      write(key, rows);
      return rows[idx];
    },
    remove: (id) => {
      const rows = read(key, []).filter((r) => r.id !== id);
      write(key, rows);
    },
    filter: (predicate) => read(key, []).filter(predicate),
  };
}

export const db = {
  users: collection("users"),
  donorProfiles: collection("donorProfiles"),
  bloodBanks: collection("bloodBanks"),
  bloodRequests: collection("bloodRequests"),
  donations: collection("donations"),
  bloodTestReports: collection("bloodTestReports"),
  messages: collection("messages"),
  reviews: collection("reviews"),
  reservations: collection("reservations"),
  reset: () => {
    Object.keys(SEED).forEach((key) => localStorage.removeItem(NS + key));
    ensureSeeded();
  },
};

/**
 * Resolve a stable "thread partner id" for a person the current user
 * wants to message. Prefers an existing donor profile id (so a
 * request-poster who is also a registered donor shares one thread),
 * falling back to their raw user id.
 */
export function resolveContactId({ userId, donorProfileId }) {
  if (donorProfileId) return donorProfileId;
  const profile = db.donorProfiles.list().find((p) => p.userId === userId);
  return profile ? profile.id : userId;
}

export const RESERVATION_HOURS = 3;

/**
 * A user's account is "onboarded" once they've filled in the required
 * profile fields AND uploaded at least one blood test report — this
 * gate applies to every user regardless of whether they intend to
 * donate, find blood, or both.
 */
export function getOnboardingStatus(userId) {
  const profile = db.donorProfiles.list().find((p) => p.userId === userId);
  const profileComplete = Boolean(
    profile &&
      profile.fullName?.trim() &&
      profile.bloodGroup &&
      profile.division &&
      profile.phone?.trim() &&
      profile.address?.trim() &&
      profile.nid?.trim() &&
      profile.wants
  );
  const hasReport = Boolean(
    profile && db.bloodTestReports.list().some((r) => r.donorProfileId === profile.id)
  );
  return {
    profile,
    profileComplete,
    hasReport,
    complete: profileComplete && hasReport,
  };
}

/**
 * Places a 3-hour hold on one unit of a blood group at a bank.
 * Decrements the bank's live stock immediately so it can't be
 * double-booked, and records a reservation with an expiry timestamp.
 */
export function reserveBloodUnit({ bankId, bloodGroup, userId, userName }) {
  const bank = db.bloodBanks.get(bankId);
  if (!bank || (bank.stock[bloodGroup] || 0) <= 0) {
    return { ok: false, error: "No units available to reserve." };
  }
  db.bloodBanks.update(bankId, {
    stock: { ...bank.stock, [bloodGroup]: bank.stock[bloodGroup] - 1 },
  });
  const now = Date.now();
  const reservation = db.reservations.create({
    bankId,
    bankName: bank.name,
    bloodGroup,
    userId,
    userName,
    status: "active",
    reservedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + RESERVATION_HOURS * 60 * 60 * 1000).toISOString(),
  });
  return { ok: true, reservation };
}

/** Releases a reservation early (manual cancel) and restores stock. */
export function releaseReservation(reservationId) {
  const reservation = db.reservations.get(reservationId);
  if (!reservation || reservation.status !== "active") return;
  const bank = db.bloodBanks.get(reservation.bankId);
  if (bank) {
    db.bloodBanks.update(bank.id, {
      stock: { ...bank.stock, [reservation.bloodGroup]: (bank.stock[reservation.bloodGroup] || 0) + 1 },
    });
  }
  db.reservations.update(reservationId, { status: "released" });
}

/**
 * Sweeps all active reservations and automatically releases (restores
 * stock for) any whose 3-hour hold has expired. Safe to call often —
 * it's a no-op when nothing has expired.
 */
export function releaseExpiredReservations() {
  const now = Date.now();
  const expired = db.reservations.filter(
    (r) => r.status === "active" && new Date(r.expiresAt).getTime() <= now
  );
  expired.forEach((r) => {
    const bank = db.bloodBanks.get(r.bankId);
    if (bank) {
      db.bloodBanks.update(bank.id, {
        stock: { ...bank.stock, [r.bloodGroup]: (bank.stock[r.bloodGroup] || 0) + 1 },
      });
    }
    db.reservations.update(r.id, { status: "expired" });
  });
  return expired.length;
}

/**
 * Builds the unified list of people the current user can message:
 * every other donor profile, plus anyone who has posted a blood
 * request who isn't already covered by a donor profile.
 */
export function getMessageContacts(currentUserId) {
  const donors = db.donorProfiles.list().filter((d) => d.userId !== currentUserId);
  const contacts = donors.map((d) => ({
    id: d.id,
    name: d.fullName,
    subtitle: `${d.bloodGroup} · ${d.division}`,
  }));

  const knownIds = new Set(contacts.map((c) => c.id));
  const knownUserIds = new Set(donors.map((d) => d.userId).filter(Boolean));

  db.bloodRequests.list().forEach((r) => {
    if (r.requesterId === currentUserId) return;
    if (knownUserIds.has(r.requesterId)) return;
    const id = r.requesterId;
    if (knownIds.has(id)) return;
    knownIds.add(id);
    contacts.push({ id, name: r.requesterName, subtitle: "Posted a blood request" });
  });

  return contacts;
}

export { uid };

/**
 * A recipient/blood-founder files a private rating + complaint against a
 * donor, with a required proof image. Visible only in the admin panel —
 * never surfaced to the donor or other users.
 */
export function submitDonorReport({ donorProfileId, reporterId, reporterName, rating, complaint, imageUrl }) {
  return db.reviews.create({
    donorProfileId,
    reporterId,
    reporterName,
    rating,
    complaint,
    imageUrl,
    status: "pending", // pending | dismissed | actioned
  });
}

/** Admin verifies a report, blocklists the donor's profile, and bans the linked account. */
export function blocklistDonorFromReport(reportId) {
  const report = db.reviews.get(reportId);
  if (!report) return null;
  const donor = db.donorProfiles.get(report.donorProfileId);
  if (donor) {
    db.donorProfiles.update(donor.id, { blocked: true, available: false });
    if (donor.userId) db.users.update(donor.userId, { banned: true });
  }
  db.reviews.update(reportId, { status: "actioned" });
  return donor;
}

/** Admin dismisses a report as unfounded, no action taken against the donor. */
export function dismissDonorReport(reportId) {
  return db.reviews.update(reportId, { status: "dismissed" });
}

/** Admin lifts a block/ban placed on a donor, restoring their account. */
export function unblockDonor(donorProfileId) {
  const donor = db.donorProfiles.get(donorProfileId);
  if (!donor) return null;
  db.donorProfiles.update(donor.id, { blocked: false });
  if (donor.userId) db.users.update(donor.userId, { banned: false });
  return donor;
}
