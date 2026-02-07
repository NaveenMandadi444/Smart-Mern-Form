import mongoose from "mongoose";

const vaultDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      enum: ["AADHAAR", "PAN", "PASSPORT", "TENTH", "INTER", "DEGREE"],
      required: true,
    },
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    extractedFieldsCount: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    processingError: String,
    imageUrl: String,
    previewUrl: String,
  },
  { timestamps: true },
);

vaultDocumentSchema.index({ userId: 1, documentType: 1 });

export default mongoose.model("VaultDocument", vaultDocumentSchema);
