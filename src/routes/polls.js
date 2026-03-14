const express = require("express");
const router  = express.Router();
const { getPolls, getPollById, createPoll, vote, closePoll } = require("../controllers/pollController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(getPolls)
  .post(restrictTo("secretariat", "admin"), createPoll);

router.route("/:id")
  .get(getPollById);

router.post("/:id/vote", vote);

router.patch("/:id/close", restrictTo("secretariat", "admin"), closePoll);

module.exports = router;
