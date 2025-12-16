import mongoose, { Schema } from "mongoose";

const JobViewSchema = new Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    visitorKey: { type: String, required: true, index: true },

    // TTL: automatically remove after 3600s (1 hour)
    createdAt: { type: Date, default: Date.now, expires: 3600 },
  },
  { timestamps: false, versionKey: false }
);

// One view per visitorKey per job within TTL window
JobViewSchema.index({ jobId: 1, visitorKey: 1 }, { unique: true }); // [web:966]

export const JobView = mongoose.model("JobView", JobViewSchema);