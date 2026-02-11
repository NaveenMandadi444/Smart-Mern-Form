import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  intelligentAutoFill,
  autoFillSingleField,
  autoFillWithSourceSelection,
  getFieldVariants,
  userSelectsVariant,
  getFormSources,
  suggestAutofill,
  getAlternativeSources,
  getLearnedFieldsForAutofill,
  copyFieldWithFormat,
  debugVaultStatus,
} from "../controllers/autofillController.js";

const router = express.Router();

// 🔍 DEBUG: Check vault status
router.get("/debug/vault-status", authMiddleware, debugVaultStatus);

// 🎯 Intelligent Auto-fill (Multi-Source Aware) - NO USER POPUPS
router.post("/intelligent", authMiddleware, intelligentAutoFill);
router.post("/intelligent-single", authMiddleware, autoFillSingleField);

// 🎯 NEW: Auto-Fill WITH SOURCE SELECTION - User can change source
router.post("/with-selection", authMiddleware, autoFillWithSourceSelection);
router.post("/get-variants", authMiddleware, getFieldVariants);
router.post("/select-variant", authMiddleware, userSelectsVariant);
router.post("/form-sources", authMiddleware, getFormSources);

// Legacy endpoints (kept for backward compatibility)
router.post("/suggest", authMiddleware, suggestAutofill);
router.post("/alternatives", authMiddleware, getAlternativeSources);
router.get("/learned-fields", authMiddleware, getLearnedFieldsForAutofill);
router.post("/format", authMiddleware, copyFieldWithFormat);

export default router;

