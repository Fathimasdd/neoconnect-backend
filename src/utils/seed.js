require("dotenv").config();
const mongoose       = require("mongoose");
const User           = require("../models/User");
const Case           = require("../models/Case");
const Poll           = require("../models/Poll");
const ImpactEntry    = require("../models/ImpactEntry");
const MeetingMinutes = require("../models/MeetingMinutes");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Case.deleteMany({}),
      Poll.deleteMany({}),
      ImpactEntry.deleteMany({}),
      MeetingMinutes.deleteMany({}),
    ]);
    console.log("🧹 Cleared existing data");

    // ── Users ─────────────────────────────────────────────
    const users = await User.create([
      { name: "Alex Rivera",       email: "staff@neo.com",       password: "password", role: "staff",        department: "Engineering" },
      { name: "Jordan Chen",       email: "secretariat@neo.com", password: "password", role: "secretariat",  department: "Management"  },
      { name: "Sam Okonkwo",       email: "manager@neo.com",     password: "password", role: "case_manager", department: "HR"          },
      { name: "Taylor Blackwood",  email: "admin@neo.com",       password: "password", role: "admin",        department: "IT"          },
      { name: "Priya Mehta",       email: "priya@neo.com",       password: "password", role: "staff",        department: "Finance"     },
      { name: "David Osei",        email: "david@neo.com",       password: "password", role: "staff",        department: "Operations", active: false },
    ]);
    const [staff, secretariat, manager, admin] = users;
    console.log(`👥 Created ${users.length} users`);

    // ── Cases ─────────────────────────────────────────────
    const caseData = [
      {
        title:       "Broken fire exit on Floor 3",
        description: "The emergency exit door on the 3rd floor has been stuck for two weeks. This is a serious safety hazard and needs immediate attention from Facilities.",
        category:    "Safety",
        department:  "Facilities",
        location:    "Building A, Floor 3",
        severity:    "high",
        status:      "escalated",
        anonymous:   false,
        submittedBy: staff._id,
        assignedTo:  manager._id,
        assignedAt:  new Date(Date.now() - 12 * 86400000),
        escalatedAt: new Date(Date.now() - 1  * 86400000),
        escalationSent: true,
        createdAt:   new Date(Date.now() - 14 * 86400000),
      },
      {
        title:       "Inconsistent overtime compensation policy",
        description: "Staff in different teams are being paid different rates for overtime. The policy document on the intranet has not been updated since 2022.",
        category:    "Policy",
        department:  "HR",
        location:    "Head Office",
        severity:    "medium",
        status:      "in_progress",
        anonymous:   false,
        submittedBy: staff._id,
        assignedTo:  manager._id,
        assignedAt:  new Date(Date.now() - 5 * 86400000),
        createdAt:   new Date(Date.now() - 6 * 86400000),
      },
      {
        title:       "Air conditioning not working in open plan office",
        description: "The A/C in the main open plan area has been intermittently failing for the past month, particularly in the afternoons.",
        category:    "Facilities",
        department:  "Operations",
        location:    "Building B, Ground Floor",
        severity:    "medium",
        status:      "resolved",
        anonymous:   true,
        submittedBy: null,
        assignedTo:  manager._id,
        assignedAt:  new Date(Date.now() - 18 * 86400000),
        resolvedAt:  new Date(Date.now() - 3  * 86400000),
        createdAt:   new Date(Date.now() - 20 * 86400000),
        notes: [{
          author:     manager._id,
          authorName: "Sam Okonkwo",
          text:       "Engineer attended on 15th. Replaced faulty compressor unit. Issue fully resolved.",
        }],
      },
      {
        title:       "Insufficient mental health support resources",
        description: "Following recent company restructuring, several staff members have expressed concerns about the lack of accessible mental health support.",
        category:    "HR",
        department:  "HR",
        location:    "All Sites",
        severity:    "high",
        status:      "assigned",
        anonymous:   false,
        submittedBy: staff._id,
        assignedTo:  manager._id,
        assignedAt:  new Date(Date.now() - 2 * 86400000),
        createdAt:   new Date(Date.now() - 3 * 86400000),
      },
      {
        title:       "Parking allocation seems unfair",
        description: "Junior staff have been removed from the parking allocation to make space for new hires, with no notice or alternative offered.",
        category:    "Policy",
        department:  "Operations",
        location:    "Car Park Level 1",
        severity:    "low",
        status:      "new",
        anonymous:   false,
        submittedBy: staff._id,
        createdAt:   new Date(Date.now() - 1 * 86400000),
      },
      {
        title:       "Noise levels in breakout rooms",
        description: "The new open breakout rooms are too loud for focused work. Staff using them for calls are disrupting adjacent desks.",
        category:    "Facilities",
        department:  "Engineering",
        location:    "Building A, Floor 2",
        severity:    "low",
        status:      "pending",
        anonymous:   true,
        submittedBy: null,
        assignedTo:  manager._id,
        assignedAt:  new Date(Date.now() - 6 * 86400000),
        createdAt:   new Date(Date.now() - 8 * 86400000),
      },
    ];

    for (const data of caseData) {
      const kase = new Case(data);
      // Override auto-generated trackingId with sequential ones
      await kase.save();
    }
    console.log(`📋 Created ${caseData.length} cases`);

    // ── Polls ─────────────────────────────────────────────
    await Poll.create([
      {
        question:  "Which wellbeing benefit would you prioritise for next year?",
        options: [
          { text: "Private health insurance",  votes: 42 },
          { text: "Additional annual leave",   votes: 38 },
          { text: "Gym membership subsidy",    votes: 21 },
          { text: "Mental health days",        votes: 55 },
        ],
        createdBy: secretariat._id,
        closesAt:  new Date(Date.now() + 7 * 86400000),
        active:    true,
      },
      {
        question:  "How would you rate the new hybrid working policy?",
        options: [
          { text: "Excellent — works well for me",   votes: 30 },
          { text: "Good, with minor issues",          votes: 47 },
          { text: "Needs significant improvement",    votes: 18 },
          { text: "Not working at all",               votes: 8  },
        ],
        createdBy: secretariat._id,
        closesAt:  new Date(Date.now() - 2 * 86400000),
        active:    false,
      },
    ]);
    console.log("📊 Created 2 polls");

    // ── Impact entries ────────────────────────────────────
    await ImpactEntry.create([
      { raised: "Broken fire exit on Floor 3",            action: "Emergency contractor appointed within 24h; door replaced",       changed: "Monthly fire safety inspections now scheduled for all floors", quarter: "Q2 2025", category: "Safety",    publishedBy: secretariat._id },
      { raised: "Lack of standing desks causing back pain", action: "Ergonomic assessment conducted across all departments",          changed: "40 standing desks procured and distributed",                    quarter: "Q1 2025", category: "Facilities", publishedBy: secretariat._id },
      { raised: "Unclear promotion criteria",              action: "HR reviewed and rewrote the career framework",                   changed: "New transparent banding document published on intranet",         quarter: "Q1 2025", category: "HR",        publishedBy: secretariat._id },
      { raised: "Inadequate onboarding for remote staff",  action: "L&D team created a dedicated remote onboarding programme",      changed: "New starter satisfaction scores up 34% this quarter",           quarter: "Q2 2025", category: "Policy",    publishedBy: secretariat._id },
    ]);
    console.log("✨ Created 4 impact entries");

    // ── Meeting minutes ───────────────────────────────────
    await MeetingMinutes.create([
      { title: "JCC Meeting — May 2025",      date: new Date("2025-05-14"), pages: 8,  uploadedBy: secretariat._id },
      { title: "JCC Meeting — April 2025",    date: new Date("2025-04-09"), pages: 6,  uploadedBy: secretariat._id },
      { title: "JCC Meeting — March 2025",    date: new Date("2025-03-12"), pages: 11, uploadedBy: secretariat._id },
      { title: "Q1 Townhall Notes — 2025",    date: new Date("2025-03-28"), pages: 14, uploadedBy: secretariat._id },
      { title: "JCC Meeting — February 2025", date: new Date("2025-02-11"), pages: 7,  uploadedBy: secretariat._id },
    ]);
    console.log("📁 Created 5 meeting minutes");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Demo login credentials:");
    console.log("   staff@neo.com        → password  (Staff)");
    console.log("   secretariat@neo.com  → password  (Secretariat)");
    console.log("   manager@neo.com      → password  (Case Manager)");
    console.log("   admin@neo.com        → password  (Admin)");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
