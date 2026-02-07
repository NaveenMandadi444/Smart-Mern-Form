import VaultAmbiguity from "../models/VaultAmbiguity.js";
import { resolveAmbiguity as resolveAmbiguityService } from "../services/deduplicationService.js";

export const getAmbiguities = async (req, res) => {
  try {
    const userId = req.userId;
    const { status = "PENDING" } = req.query;

    const ambiguities = await VaultAmbiguity.find({
      userId,
      resolutionStatus: status,
    });

    res.json({
      count: ambiguities.length,
      ambiguities,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get ambiguities", error: error.message });
  }
};

export const resolveAmbiguity = async (req, res) => {
  try {
    const userId = req.userId;
    const { ambiguityId } = req.params;
    const { resolvedValue, resolutionNotes } = req.body;

    const ambiguity = await VaultAmbiguity.findById(ambiguityId);
    if (!ambiguity || ambiguity.userId.toString() !== userId) {
      return res.status(404).json({ message: "Ambiguity not found" });
    }

    const resolved = await resolveAmbiguityService(
      ambiguityId,
      resolvedValue,
      resolutionNotes,
    );

    res.json({
      message: "Ambiguity resolved successfully",
      ambiguity: resolved,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to resolve ambiguity", error: error.message });
  }
};

export const deleteAmbiguity = async (req, res) => {
  try {
    const userId = req.userId;
    const { ambiguityId } = req.params;

    const ambiguity = await VaultAmbiguity.findByIdAndDelete(ambiguityId);

    if (!ambiguity || ambiguity.userId.toString() !== userId) {
      return res.status(404).json({ message: "Ambiguity not found" });
    }

    res.json({
      message: "Ambiguity deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete ambiguity", error: error.message });
  }
};
