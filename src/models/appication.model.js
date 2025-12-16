import mongoose, { Schema } from "mongoose";

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const ApplicationSchema = new Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    resumeUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
      validate: {
        validator: (v) => !!v && isValidUrl(v),
        message: "Invalid resumeUrl",
      }, // custom validator supported by Mongoose [web:944]
    },

    coverLetter: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null,
    },

    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected", "selected"],
      default: "applied",
      index: true,
    },

    hrNotes: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: null,
    },

    isViewedByHR: { type: Boolean, default: false, index: true },

    // Optional: keep only if you really need separate appliedAt from createdAt.
    appliedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate apply: one application per candidate per job
ApplicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true }); // compound unique index [web:887][web:893]

// Common HR dashboard query: applications for a job, newest first
ApplicationSchema.index({ jobId: 1, createdAt: -1 });

// Candidate "my applications" query
ApplicationSchema.index({ candidateId: 1, createdAt: -1 });

export const Application = mongoose.model("Application", ApplicationSchema);
