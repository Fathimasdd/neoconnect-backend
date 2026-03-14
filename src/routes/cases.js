const express  = require("express");
const router   = express.Router();
const {
  getCases, getCaseById, createCase,
  assignCase, updateStatus, addNote, deleteCase,
} = require("../controllers/caseController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All case routes require authentication
router.use(protect);

router.route("/")
  .get(getCases)
  .post(upload.array("attachments", 3), createCase);

router.route("/:id")
  .get(getCaseById)
  .delete(restrictTo("admin"), deleteCase);

router.patch("/:id/assign",
  restrictTo("secretariat", "admin"),
  assignCase
);

router.patch("/:id/status",
  restrictTo("case_manager", "secretariat", "admin"),
  updateStatus
);

router.post("/:id/notes",
  restrictTo("case_manager", "secretariat", "admin"),
  addNote
);

module.exports = router;
