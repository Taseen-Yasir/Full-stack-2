require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing.");
  process.exit(1);
}

// Keep local development working and allow configured production origins.
const configuredOrigins = (
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  ...configuredOrigins,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error("This frontend origin is not allowed.")
      );
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  return res.status(connected ? 200 : 503).json({
    success: connected,
    project: "ExamPro",
    message: connected
      ? "ExamPro API is running"
      : "Database is not connected",
    database: connected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Application routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/exams", require("./routes/exams"));
app.use("/api/attempts", require("./routes/attempts"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/admin", require("./routes/adminAnalytics"));
app.use("/api/learning", require("./routes/learning"));
// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body.",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  if (err.message === "This frontend origin is not allowed.") {
    return res.status(403).json({
      success: false,
      message: "This frontend origin is not allowed.",
    });
  }

  console.error("ExamPro server error:", err.message);

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
});

// Connect to MongoDB before accepting requests.
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log("ExamPro API is running");
      console.log(`Port: ${PORT}`);
      console.log("Health endpoint: /api/health");
    });
  } catch (error) {
    console.error(
      "Failed to start ExamPro:",
      error.message
    );

    process.exit(1);
  }
}

startServer();