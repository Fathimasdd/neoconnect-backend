const User = require("../models/User");

// GET /api/users  — admin only
const getUsers = async (req, res) => {
  const { search, role, active } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name:       { $regex: search, $options: "i" } },
      { email:      { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }
  if (role)   filter.role   = role;
  if (active !== undefined) filter.active = active === "true";

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

// GET /api/users/:id  — admin only
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
};

// POST /api/users  — admin only
const createUser = async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const user = await User.create({
    name, email, password,
    role:       role       || "staff",
    department: department || "",
  });

  res.status(201).json({ success: true, data: user });
};

// PATCH /api/users/:id  — admin only
const updateUser = async (req, res) => {
  const allowed = ["name", "email", "role", "department", "active"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  // Don't allow updating password through this route
  delete updates.password;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  res.json({ success: true, data: user });
};

// PATCH /api/users/:id/toggle-active  — admin only
const toggleActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
  }

  user.active = !user.active;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: user, message: `User ${user.active ? "activated" : "deactivated"}` });
};

// DELETE /api/users/:id  — admin only
const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account" });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, message: "User deleted" });
};

// GET /api/users/case-managers  — secretariat needs this list for assignment
const getCaseManagers = async (req, res) => {
  const managers = await User.find({ role: "case_manager", active: true }).select("name email department");
  res.json({ success: true, data: managers });
};

// PATCH /api/users/me  — any authenticated user updates their own profile
const updateMe = async (req, res) => {
  const allowed = {};
  if (req.body.name)       allowed.name       = req.body.name.trim();
  if (req.body.department) allowed.department = req.body.department;

  const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true });
  res.json({ success: true, data: user });
};

// PATCH /api/users/me/password  — any authenticated user changes their own password
const changeMyPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "oldPassword and newPassword are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(oldPassword))) {
    return res.status(401).json({ success: false, message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated successfully" });
};

module.exports = { getUsers, getUserById, createUser, updateUser, toggleActive, deleteUser, getCaseManagers, updateMe, changeMyPassword };
