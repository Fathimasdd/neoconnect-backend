const express = require("express");
const router  = express.Router();
const {
  getImpactEntries, createImpactEntry, deleteImpactEntry,
  getMinutes, uploadMinutes, deleteMinutes,
} = require("../controllers/hubController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.use(protect);

// Impact tracker
router.route("/impact")
  .get(getImpactEntries)
  .post(restrictTo("secretariat", "admin"), createImpactEntry);

router.delete("/impact/:id", restrictTo("admin"), deleteImpactEntry);

// Meeting minutes
router.route("/minutes")
  .get(getMinutes)
  .post(
    restrictTo("secretariat", "admin"),
    upload.single("document"),
    uploadMinutes
  );

router.delete("/minutes/:id", restrictTo("admin"), deleteMinutes);

module.exports = router;
