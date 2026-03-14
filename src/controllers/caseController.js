const Case = require("../models/Case");
const path = require("path");

// GET /api/cases  — role-filtered list
const getCases = async (req, res) => {
  const { status, category, department, severity, page = 1, limit = 20 } = req.query;
  const filter = {};

  // Staff only see their own non-anonymous cases
  if (req.user.role === "staff") {
    filter.submittedBy = req.user._id;
  }
  // Case managers only see assigned cases
  if (req.user.role === "case_manager") {
    filter.assignedTo = req.user._id;
  }

  if (status)     filter.status     = status;
  if (category)   filter.category   = category;
  if (department) filter.department  = department;
  if (severity)   filter.severity   = severity;

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Case.countDocuments(filter);

  const cases = await Case.find(filter)
    .populate("submittedBy", "name email department")
    .populate("assignedTo",  "name email")
    .populate("notes.author","name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    total,
    page:    parseInt(page),
    pages:   Math.ceil(total / parseInt(limit)),
    data:    cases,
  });
};

// GET /api/cases/:id
const getCaseById = async (req, res) => {
  const kase = await Case.findById(req.params.id)
    .populate("submittedBy", "name email department")
    .populate("assignedTo",  "name email department")
    .populate("notes.author","name");

  if (!kase) return res.status(404).json({ success: false, message: "Case not found" });

  // Staff can only view their own cases
  if (req.user.role === "staff" && kase.submittedBy?._id?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorised to view this case" });
  }

  res.json({ success: true, data: kase });
};

// POST /api/cases  — create new case
const createCase = async (req, res) => {
  const { title, description, category, department, location, severity, anonymous } = req.body;

  const caseData = {
    title, description, category, department,
    location:    location || "",
    severity,
    anonymous:   anonymous === true || anonymous === "true",
    submittedBy: (anonymous === true || anonymous === "true") ? null : req.user._id,
  };

  // Handle file attachments
  if (req.files?.length) {
    caseData.attachments = req.files.map(f => ({
      filename:     f.filename,
      originalName: f.originalname,
      mimetype:     f.mimetype,
      size:         f.size,
      url:          `/uploads/${f.filename}`,
    }));
  }

  const kase = await Case.create(caseData);

  res.status(201).json({ success: true, data: kase });
};

// PATCH /api/cases/:id/assign  — secretariat assigns to a case manager
const assignCase = async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) return res.status(400).json({ success: false, message: "assignedTo (user ID) is required" });

  const kase = await Case.findById(req.params.id);
  if (!kase) return res.status(404).json({ success: false, message: "Case not found" });

  kase.assignedTo = assignedTo;
  kase.status     = "assigned";
  kase.assignedAt = new Date();
  await kase.save();

  const populated = await kase.populate("assignedTo", "name email");
  res.json({ success: true, data: populated });
};

// PATCH /api/cases/:id/status  — case manager updates status
const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["new", "assigned", "in_progress", "pending", "resolved", "escalated"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const kase = await Case.findById(req.params.id);
  if (!kase) return res.status(404).json({ success: false, message: "Case not found" });

  // Case managers can only update their assigned cases
  if (req.user.role === "case_manager" && kase.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only update cases assigned to you" });
  }

  kase.status = status;
  await kase.save();

  res.json({ success: true, data: kase });
};

// POST /api/cases/:id/notes  — add a note to a case
const addNote = async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: "Note text is required" });

  const kase = await Case.findById(req.params.id);
  if (!kase) return res.status(404).json({ success: false, message: "Case not found" });

  kase.notes.push({
    author:     req.user._id,
    authorName: req.user.name,
    text:       text.trim(),
  });
  await kase.save();

  const populated = await kase.populate("notes.author", "name");
  res.status(201).json({ success: true, data: populated });
};

// DELETE /api/cases/:id  — admin only
const deleteCase = async (req, res) => {
  const kase = await Case.findByIdAndDelete(req.params.id);
  if (!kase) return res.status(404).json({ success: false, message: "Case not found" });
  res.json({ success: true, message: "Case deleted" });
};

module.exports = { getCases, getCaseById, createCase, assignCase, updateStatus, addNote, deleteCase };
