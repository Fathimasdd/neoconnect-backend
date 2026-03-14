const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

// On Render (cloud), use /tmp for uploads since the filesystem is ephemeral anyway.
// Locally, use the configured UPLOAD_DIR relative to project root.
const uploadDir = process.env.NODE_ENV === "production"
  ? path.join(os.tmpdir(), "neoconnect-uploads")
  : path.join(__dirname, "../../", process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, uploadDir); },
  filename: function(req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext    = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const fileFilter = function(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed"), false);
  }
};

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "5", 10);

const upload = multer({
  storage:    storage,
  fileFilter: fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024, files: 3 },
});

module.exports = upload;
