import mongoose from "mongoose";

const formSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
    submittedDataList: [
      {
        label: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    // Smart Field Mapping Metadata
    fieldMappings: [
      {
        form_field: String,
        standard_field: String,
        value: mongoose.Schema.Types.Mixed,
        confidence: Number,  // 0.0 to 1.0
        status: String,      // 'filled', 'converted', 'missing'
        field_type: String,
      },
    ],
    mappingSummary: {
      total_fields: Number,
      mapped_count: Number,
      missing_count: Number,
      converted_count: Number,
      average_confidence: Number,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    submissionDate: {
      type: Date,
      required: true,
    },
    submissionMonth: {
      type: String, // Format: YYYY-MM
      required: true,
    },
    submissionYear: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },
    notes: String,
    attachments: [
      {
        fieldLabel: String,
        filePath: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
      },
    ],
  },
  { timestamps: true },
);

// Indexes for efficient querying
formSubmissionSchema.index({ userId: 1, submittedAt: -1 });
formSubmissionSchema.index({ formId: 1, submittedAt: -1 });
formSubmissionSchema.index({ userId: 1, submissionDate: -1 });
formSubmissionSchema.index({ userId: 1, submissionMonth: 1 });
formSubmissionSchema.index({ userId: 1, submissionYear: 1 });

export default mongoose.model("FormSubmission", formSubmissionSchema);
