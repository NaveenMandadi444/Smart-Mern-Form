import { verifyToken } from "../config/auth.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};

export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  // In development, allow all localhost ports. In production, use FRONTEND_URL from env
  if (process.env.NODE_ENV === "development") {
    res.header("Access-Control-Allow-Origin", origin || "*");
  } else {
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    if (origin === allowedOrigin) {
      res.header("Access-Control-Allow-Origin", allowedOrigin);
    }
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
};
