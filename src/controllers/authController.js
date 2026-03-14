const User          = require("../models/User");
const generateToken = require("../utils/generateToken");

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!user.active) {
    return res.status(401).json({ success: false, message: "Your account has been deactivated. Contact IT." });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
    },
  });
};

// POST /api/auth/register  (admin only — or open during setup)
const register = async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const user  = await User.create({ name, email, password, role: role || "staff", department: department || "" });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
    },
  });
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};

// POST /api/auth/register-self  (public — always creates staff role)
const registerSelf = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const user  = await User.create({ name, email, password, role: "staff", department: department || "" });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
    },
  });
};

module.exports = { login, register, registerSelf, getMe };
