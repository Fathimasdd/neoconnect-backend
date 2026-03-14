const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema({
  text:  { type: String, required: true, trim: true, maxlength: 200 },
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type:      String,
      required:  [true, "Question is required"],
      trim:      true,
      maxlength: [300, "Question cannot exceed 300 characters"],
    },
    options: {
      type:     [optionSchema],
      validate: {
        validator: (v) => v.length >= 2 && v.length <= 6,
        message:  "A poll must have between 2 and 6 options",
      },
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    closesAt: {
      type:     Date,
      required: [true, "Closing date is required"],
    },
    active: {
      type:    Boolean,
      default: true,
    },
    // Store user IDs who have voted (prevents double voting)
    votedBy: [
      {
        userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        optionId: { type: mongoose.Schema.Types.ObjectId },
        votedAt:  { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Virtual: has the poll closed?
pollSchema.virtual("isClosed").get(function () {
  return !this.active || new Date() > this.closesAt;
});

// Virtual: total vote count
pollSchema.virtual("totalVotes").get(function () {
  return this.options.reduce((sum, o) => sum + o.votes, 0);
});

pollSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Poll", pollSchema);
