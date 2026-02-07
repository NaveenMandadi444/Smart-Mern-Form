import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import {
  uploadDocument,
  processDocument,
  getDocument,
  getDocuments,
} from "../controllers/documentController.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  uploadDocument,
);
router.post("/process", authMiddleware, processDocument);
router.get("/:documentId", authMiddleware, getDocument);
router.get("/", authMiddleware, getDocuments);

export default router;
