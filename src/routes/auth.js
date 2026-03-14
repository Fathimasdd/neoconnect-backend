const express = require("express");
const router  = express.Router();
const { login, register, registerSelf, getMe } = require("../controllers/authController");
const { protect, restrictTo }                  = require("../middleware/authMiddleware");

router.post("/login",           login);
router.post("/register-self",   registerSelf);                           // public — staff only
router.post("/register",        protect, restrictTo("admin"), register); // admin creates any role
router.get("/me",               protect, getMe);

module.exports = router;
