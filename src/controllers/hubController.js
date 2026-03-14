const ImpactEntry    = require("../models/ImpactEntry");
const MeetingMinutes = require("../models/MeetingMinutes");
const path           = require("path");

// ── Impact Entries ────────────────────────────────────────

// GET /api/hub/impact
const getImpactEntries = async (req, res) => {
  const { quarter, category } = req.query;
  const filter = {};
  if (quarter)  filter.quarter  = quarter;
  if (category) filter.category = category;

  const entries = await ImpactEntry.find(filter)
    .populate("publishedBy", "name")
    .populate("linkedCase",  "trackingId title")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: entries });
};

// POST /api/hub/impact  — secretariat/admin only
const createImpactEntry = async (req, res) => {
  const { raised, action, changed, quarter, category, linkedCase } = req.body;

  if (!raised || !action || !changed || !quarter || !category) {
    return res.status(400).json({ success: false, message: "raised, action, changed, quarter and category are all required" });
  }

  const entry = await ImpactEntry.create({
    raised, action, changed, quarter, category,
    linkedCase:  linkedCase || null,
    publishedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: entry });
};

// DELETE /api/hub/impact/:id  — admin only
const deleteImpactEntry = async (req, res) => {
  const entry = await ImpactEntry.findByIdAndDelete(req.params.id);
  if (!entry) return res.status(404).json({ success: false, message: "Impact entry not found" });
  res.json({ success: true, message: "Entry deleted" });
};

// ── Meeting Minutes ───────────────────────────────────────

// GET /api/hub/minutes
const getMinutes = async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) filter.title = { $regex: search, $options: "i" };

  const minutes = await MeetingMinutes.find(filter)
    .populate("uploadedBy", "name")
    .sort({ date: -1 });

  res.json({ success: true, data: minutes });
};

// POST /api/hub/minutes  — secretariat/admin only (with PDF upload)
const uploadMinutes = async (req, res) => {
  const { title, date, pages } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: "Title and date are required" });
  }

  const docData = {
    title: title.trim(),
    date:  new Date(date),
    pages: parseInt(pages) || 0,
    uploadedBy: req.user._id,
  };

  if (req.file) {
    docData.filename     = req.file.filename;
    docData.originalName = req.file.originalname;
    docData.url          = `/uploads/${req.file.filename}`;
  }

  const doc = await MeetingMinutes.create(docData);
  res.status(201).json({ success: true, data: doc });
};

// DELETE /api/hub/minutes/:id  — admin only
const deleteMinutes = async (req, res) => {
  const doc = await MeetingMinutes.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
  res.json({ success: true, message: "Document deleted" });
};

module.exports = {
  getImpactEntries, createImpactEntry, deleteImpactEntry,
  getMinutes, uploadMinutes, deleteMinutes,
};
