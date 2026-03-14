// 404 handler
const notFound = function(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Route not found: " + req.method + " " + req.originalUrl,
  });
};

// Global error handler
const errorHandler = function(err, req, res, next) {
  // Fix: correct operator precedence with explicit parentheses
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message    = err.message || "Internal server error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message    = "Invalid ID: " + err.value;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message    = field.charAt(0).toUpperCase() + field.slice(1) + " already exists";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message    = Object.values(err.errors).map(function(e) { return e.message; }).join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError")  { statusCode = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError")  { statusCode = 401; message = "Token expired"; }

  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
