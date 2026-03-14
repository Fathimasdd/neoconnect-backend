const express = require("express");
const router  = express.Router();
const {
  getUsers, getUserById, createUser,
  updateUser, toggleActive, deleteUser, getCaseManagers,
  updateMe, changeMyPassword,
} = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.use(protect);

// Self-service routes — any authenticated user
router.patch("/me",          updateMe);
router.patch("/me/password", changeMyPassword);

// Secretariat needs case managers list for assignment dropdown
router.get("/case-managers", restrictTo("secretariat", "admin"), getCaseManagers);

// Admin-only routes below
router.use(restrictTo("admin"));

router.route("/")
  .get(getUsers)
  .post(createUser);

router.route("/:id")
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

router.patch("/:id/toggle-active", toggleActive);

module.exports = router;
