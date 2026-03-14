const mongoose = require("mongoose");

const minutesSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, "Title is required"],
      trim:      true,
      maxlength: 200,
    },
    date: {
      type:     Date,
      required: true,
    },
    filename:     { type: String },
    originalName: { type: String },
    url:          { type: String },
    pages:        { type: Number, default: 0 },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MeetingMinutes", minutesSchema);
