const Case = require("../models/Case");

// GET /api/analytics/overview
const getOverview = async (req, res) => {
  const [total, open, resolved, escalated, pending] = await Promise.all([
    Case.countDocuments({}),
    Case.countDocuments({ status: { $in: ["new", "assigned", "in_progress", "pending"] } }),
    Case.countDocuments({ status: "resolved" }),
    Case.countDocuments({ status: "escalated" }),
    Case.countDocuments({ status: "pending" }),
  ]);

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  res.json({
    success: true,
    data: { total, open, resolved, escalated, pending, resolutionRate },
  });
};

// GET /api/analytics/by-department
const getByDepartment = async (req, res) => {
  const results = await Case.aggregate([
    {
      $group: {
        _id:      "$department",
        total:    { $sum: 1 },
        open:     { $sum: { $cond: [{ $in: ["$status", ["new","assigned","in_progress","pending"]] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        escalated:{ $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id:      0,
        dept:     "$_id",
        total:    1,
        open:     1,
        resolved: 1,
        escalated:1,
      },
    },
  ]);

  res.json({ success: true, data: results });
};

// GET /api/analytics/by-status
const getByStatus = async (req, res) => {
  const results = await Case.aggregate([
    { $group: { _id: "$status", value: { $sum: 1 } } },
    { $project: { _id: 0, key: "$_id", name: "$_id", value: 1 } },
    { $sort: { value: -1 } },
  ]);

  res.json({ success: true, data: results });
};

// GET /api/analytics/by-category
const getByCategory = async (req, res) => {
  const results = await Case.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $project: { _id: 0, name: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: results });
};

// GET /api/analytics/hotspots
// Flags dept+category combos with 5+ open cases
const getHotspots = async (req, res) => {
  const THRESHOLD = parseInt(req.query.threshold) || 5;

  const results = await Case.aggregate([
    {
      $match: { status: { $in: ["new", "assigned", "in_progress", "pending", "escalated"] } },
    },
    {
      $group: {
        _id:   { dept: "$department", category: "$category" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id:      0,
        dept:     "$_id.dept",
        category: "$_id.category",
        count:    1,
        flag:     { $gte: ["$count", THRESHOLD] },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: results });
};

// GET /api/analytics/trend  — cases per week for last 8 weeks
const getTrend = async (req, res) => {
  const eightWeeksAgo = new Date(Date.now() - 56 * 86400000);

  const results = await Case.aggregate([
    { $match: { createdAt: { $gte: eightWeeksAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          week: { $isoWeek: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
    {
      $project: {
        _id:   0,
        year:  "$_id.year",
        week:  "$_id.week",
        count: 1,
        label: { $concat: ["W", { $toString: "$_id.week" }] },
      },
    },
  ]);

  res.json({ success: true, data: results });
};

module.exports = { getOverview, getByDepartment, getByStatus, getByCategory, getHotspots, getTrend };
