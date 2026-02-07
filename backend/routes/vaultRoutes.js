import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  getVaultSections,
  getSectionDetails,
  getSectionFieldsBySectionId,
  addFieldToSection,
  updateField,
  deleteField,
  deleteSection,
} from "../controllers/vaultController.js";

const router = express.Router();

router.get("/sections", authMiddleware, getVaultSections);
router.get("/section/:sectionType", authMiddleware, getSectionDetails);
router.get("/fields/:sectionId", authMiddleware, getSectionFieldsBySectionId);
router.post("/fields", authMiddleware, addFieldToSection);
router.put("/fields/:fieldId", authMiddleware, updateField);
router.delete("/fields/:fieldId", authMiddleware, deleteField);
router.delete("/section/:sectionId", authMiddleware, deleteSection);

export default router;
