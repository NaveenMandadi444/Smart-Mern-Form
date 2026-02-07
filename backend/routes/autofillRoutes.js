import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  suggestAutofill,
  getAlternativeSources,
  getLearnedFieldsForAutofill,
  copyFieldWithFormat,
} from "../controllers/autofillController.js";

const router = express.Router();

router.post("/suggest", authMiddleware, suggestAutofill);
router.post("/alternatives", authMiddleware, getAlternativeSources);
router.get("/learned-fields", authMiddleware, getLearnedFieldsForAutofill);
router.post("/format", authMiddleware, copyFieldWithFormat);

export default router;
