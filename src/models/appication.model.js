import mongoose, { Schema } from "mongoose";

const ApplicationSchema = new Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resumeUrl: { type: String, required: true },
    coverLetter: String,

    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected", "selected"],
      default: "applied",
    },

    hrNotes: String,
    isViewedByHR: { type: Boolean, default: false },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", ApplicationSchema);
