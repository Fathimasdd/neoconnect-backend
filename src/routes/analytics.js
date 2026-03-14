const express = require("express");
const router  = express.Router();
const {
  getOverview, getByDepartment, getByStatus,
  getByCategory, getHotspots, getTrend,
} = require("../controllers/analyticsController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);
router.use(restrictTo("secretariat", "admin"));

router.get("/overview",       getOverview);
router.get("/by-department",  getByDepartment);
router.get("/by-status",      getByStatus);
router.get("/by-category",    getByCategory);
router.get("/hotspots",       getHotspots);
router.get("/trend",          getTrend);

module.exports = router;
