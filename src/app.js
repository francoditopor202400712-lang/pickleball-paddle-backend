
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

// Request parsing MUST happen before API routes
app.use(express.json({ limit: "1mb" }));

// HTTP request logging
app.use(morgan("dev"));

// Gemini AI endpoint
app.use("/api/v1/ai", aiRoutes);

// Existing API endpoints
app.use("/api/v1", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "API endpoint not found."
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Express error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong."
    }
  });
});

export default app;
