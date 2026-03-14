const Case = require("../models/Case");

// Working days: Mon–Fri only
function addWorkingDays(date, days) {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;  // skip Sat/Sun
  }
  return d;
}

// Run this on a schedule (or call from routes) to check for overdue cases
const checkEscalations = async () => {
  try {
    const casesToCheck = await Case.find({
      status:    { $in: ["assigned", "in_progress", "pending"] },
      assignedAt: { $ne: null },
      escalationSent: false,
    });

    const now = new Date();
    let escalated = 0;

    for (const kase of casesToCheck) {
      const deadline = addWorkingDays(kase.assignedAt, 7);
      if (now > deadline) {
        kase.status         = "escalated";
        kase.escalatedAt    = now;
        kase.escalationSent = true;
        await kase.save();
        escalated++;
        console.log(`⚠ Escalated case ${kase.trackingId} — no response in 7 working days`);
      }
    }

    return escalated;
  } catch (err) {
    console.error("Escalation check error:", err.message);
    return 0;
  }
};

module.exports = { checkEscalations, addWorkingDays };
