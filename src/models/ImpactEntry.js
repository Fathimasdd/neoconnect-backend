const mongoose = require("mongoose");

const impactSchema = new mongoose.Schema(
  {
    raised:   { type: String, required: true, trim: true, maxlength: 300 },
    action:   { type: String, required: true, trim: true, maxlength: 500 },
    changed:  { type: String, required: true, trim: true, maxlength: 500 },
    quarter:  { type: String, required: true, trim: true },  // e.g. "Q2 2025"
    category: {
      type: String,
      enum: ["Safety", "Policy", "Facilities", "HR", "Other"],
      required: true,
    },
    linkedCase: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     "Case",
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImpactEntry", impactSchema);
