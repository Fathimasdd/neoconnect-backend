require("dotenv").config();
require("express-async-errors");

const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const path       = require("path");
const fs         = require("fs");

const authRoutes      = require("./routes/auth");
const caseRoutes      = require("./routes/cases");
const pollRoutes      = require("./routes/polls");
const hubRoutes       = require("./routes/hub");
const analyticsRoutes = require("./routes/analytics");
const userRoutes      = require("./routes/users");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

// ─── Startup safety check ─────────────────────────────────
if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI environment variable is not set.");
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_this_to_a_long_random_secret_string") {
  console.error("FATAL: JWT_SECRET is not set or is still the default placeholder.");
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure uploads directory exists ─────────────────────
const uploadDir = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Security middleware ──────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Support multiple allowed origins (comma-separated in CLIENT_URL)
const rawOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map(function(o) { return o.trim(); })
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (rawOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS: origin " + origin + " not allowed"));
  },
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { success: false, message: "Too many login attempts, please try again later." },
});
app.use("/api/auth", authLimiter);

// ─── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ─────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Static file serving ─────────────────────────────────
app.use("/uploads", express.static(uploadDir));

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", function(req, res) {
  res.json({
    success:     true,
    message:     "NeoConnect API is running",
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/cases",     caseRoutes);
app.use("/api/polls",     pollRoutes);
app.use("/api/hub",       hubRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users",     userRoutes);

// ─── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Database + start ─────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(function() {
    console.log("MongoDB connected:", mongoose.connection.host);
    app.listen(PORT, function() {
      console.log("NeoConnect API running on port " + PORT);
      console.log("Environment: " + process.env.NODE_ENV);
      console.log("Allowed origins: " + rawOrigins.join(", "));
    });
  })
  .catch(function(err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;
