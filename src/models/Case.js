const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      required: true,
    },
    authorName: { type: String },  // cached so anonymous cases still show name
    text:       { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const caseSchema = new mongoose.Schema(
  {
    trackingId: {
      type:   String,
      unique: true,
    },
    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type:      String,
      required:  [true, "Description is required"],
      trim:      true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    category: {
      type:     String,
      required: [true, "Category is required"],
      enum:     ["Safety", "Policy", "Facilities", "HR", "Other"],
    },
    department: {
      type:     String,
      required: [true, "Department is required"],
      trim:     true,
    },
    location: {
      type:  String,
      trim:  true,
      default: "",
    },
    severity: {
      type:     String,
      required: [true, "Severity is required"],
      enum:     ["low", "medium", "high"],
    },
    status: {
      type:    String,
      enum:    ["new", "assigned", "in_progress", "pending", "resolved", "escalated"],
      default: "new",
    },
    anonymous: {
      type:    Boolean,
      default: false,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      // null when anonymous
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
      default: null,
    },
    assignedAt: {
      type:    Date,
      default: null,
    },
    resolvedAt: {
      type:    Date,
      default: null,
    },
    escalatedAt: {
      type:    Date,
      default: null,
    },
    // Tracks whether escalation reminder has been sent
    escalationSent: {
      type:    Boolean,
      default: false,
    },
    attachments: [
      {
        filename:     String,
        originalName: String,
        mimetype:     String,
        size:         Number,
        url:          String,
      },
    ],
    notes: [noteSchema],
  },
  { timestamps: true }
);

// Auto-generate tracking ID before save
caseSchema.pre("save", async function (next) {
  if (this.trackingId) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model("Case").countDocuments();
  this.trackingId = `NEO-${year}-${String(count + 1).padStart(3, "0")}`;
  next();
});

// Set resolvedAt timestamp when status becomes resolved
caseSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "resolved"  && !this.resolvedAt)  this.resolvedAt  = new Date();
    if (this.status === "escalated" && !this.escalatedAt) this.escalatedAt = new Date();
    if (this.status === "assigned"  && !this.assignedAt)  this.assignedAt  = new Date();
  }
  next();
});

// Index for common queries
caseSchema.index({ status: 1 });
caseSchema.index({ department: 1 });
caseSchema.index({ category: 1 });
caseSchema.index({ submittedBy: 1 });
caseSchema.index({ assignedTo: 1 });
caseSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Case", caseSchema);
