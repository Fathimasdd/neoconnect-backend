const Poll = require("../models/Poll");

// GET /api/polls
const getPolls = async (req, res) => {
  const polls = await Poll.find()
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  // Don't expose who voted for what — just whether this user voted
  const withVoteStatus = polls.map(poll => {
    const obj       = poll.toJSON();
    obj.hasVoted    = poll.votedBy.some(v => v.userId?.toString() === req.user._id.toString());
    obj.votedBy     = undefined;  // hide voter list from response
    return obj;
  });

  res.json({ success: true, data: withVoteStatus });
};

// GET /api/polls/:id
const getPollById = async (req, res) => {
  const poll = await Poll.findById(req.params.id).populate("createdBy", "name");
  if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

  const obj       = poll.toJSON();
  obj.hasVoted    = poll.votedBy.some(v => v.userId?.toString() === req.user._id.toString());
  obj.votedBy     = undefined;

  res.json({ success: true, data: obj });
};

// POST /api/polls  — secretariat/admin only
const createPoll = async (req, res) => {
  const { question, options, closesAt } = req.body;

  if (!question?.trim())    return res.status(400).json({ success: false, message: "Question is required" });
  if (!options?.length)     return res.status(400).json({ success: false, message: "Options are required" });
  if (options.length < 2)   return res.status(400).json({ success: false, message: "At least 2 options required" });
  if (!closesAt)            return res.status(400).json({ success: false, message: "Closing date is required" });

  const poll = await Poll.create({
    question: question.trim(),
    options:  options.map(o => ({ text: typeof o === "string" ? o : o.text, votes: 0 })),
    createdBy: req.user._id,
    closesAt:  new Date(closesAt),
  });

  res.status(201).json({ success: true, data: poll });
};

// POST /api/polls/:id/vote
const vote = async (req, res) => {
  const { optionId } = req.body;
  if (!optionId) return res.status(400).json({ success: false, message: "optionId is required" });

  const poll = await Poll.findById(req.params.id);
  if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });

  if (!poll.active || new Date() > poll.closesAt) {
    return res.status(400).json({ success: false, message: "This poll is closed" });
  }

  const alreadyVoted = poll.votedBy.some(v => v.userId?.toString() === req.user._id.toString());
  if (alreadyVoted) {
    return res.status(400).json({ success: false, message: "You have already voted in this poll" });
  }

  const option = poll.options.id(optionId);
  if (!option) return res.status(404).json({ success: false, message: "Option not found" });

  option.votes += 1;
  poll.votedBy.push({ userId: req.user._id, optionId });
  await poll.save();

  const obj       = poll.toJSON();
  obj.hasVoted    = true;
  obj.votedBy     = undefined;

  res.json({ success: true, data: obj });
};

// PATCH /api/polls/:id/close  — secretariat/admin
const closePoll = async (req, res) => {
  const poll = await Poll.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!poll) return res.status(404).json({ success: false, message: "Poll not found" });
  res.json({ success: true, data: poll });
};

module.exports = { getPolls, getPollById, createPoll, vote, closePoll };
