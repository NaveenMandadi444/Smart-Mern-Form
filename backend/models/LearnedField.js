import mongoose from "mongoose";

const learnedFieldSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fieldName: String,
    usageCount: {
      type: Number,
      default: 0,
    },
    extractedValues: [
      {
        value: String,
        frequency: Number,
      },
    ],
    isReusable: {
      type: Boolean,
      default: true,
    },
    lastUsed: Date,
    formTypes: [String],
  },
  { timestamps: true },
);

learnedFieldSchema.index({ userId: 1, usageCount: -1 });

export default mongoose.model("LearnedField", learnedFieldSchema);
