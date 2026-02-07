import mongoose from "mongoose";

const vaultAmbiguitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fieldName: String,
    values: [
      {
        value: String,
        source: String,
        confidence: Number,
      },
    ],
    resolutionStatus: {
      type: String,
      enum: ["PENDING", "RESOLVED", "IGNORED"],
      default: "PENDING",
    },
    resolvedValue: String,
    resolutionNotes: String,
  },
  { timestamps: true },
);

vaultAmbiguitySchema.index({ userId: 1, resolutionStatus: 1 });

export default mongoose.model("VaultAmbiguity", vaultAmbiguitySchema);
