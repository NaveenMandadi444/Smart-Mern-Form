import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getAmbiguities,
  resolveAmbiguity,
  deleteAmbiguity,
} from "../controllers/ambiguityController.js";

const router = express.Router();

router.get("/", authMiddleware, getAmbiguities);
router.put("/:ambiguityId/resolve", authMiddleware, resolveAmbiguity);
router.delete("/:ambiguityId", authMiddleware, deleteAmbiguity);

export default router;
