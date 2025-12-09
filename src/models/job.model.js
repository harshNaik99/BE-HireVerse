import mongoose, { Schema } from "mongoose";

const JobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, lowercase: true },

    responsibilities: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    skills: {
      type: [String],
      default: [],
      set: (arr) => arr.map((s) => s.toLowerCase().trim()),
    },

    experienceLevel: {
      type: String,
      enum: ["0-1", "1-3", "3-5", "5-8", "8+"],
      lowercase: true,
    },

    jobType: {
      type: String,
      enum: ["full_time", "part_time", "freelance", "temporary", "internship", "apprenticeship"],
      default: "full_time",
      lowercase: true,
      trim: true,
    },

    location: { type: String, required: true, lowercase: true, trim: true },

    minSalary: Number,
    maxSalary: Number,
    salaryCurrency: { type: String, default: "inr", lowercase: true },

    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid", "work from home", "field work"],
      default: "onsite",
      lowercase: true,
      trim: true,
    },

    slug: { type: String, trim: true, lowercase: true },

    applyType: {
      type: String,
      enum: ["internal", "external"],
      default: "internal",
      lowercase: true,
      trim: true,
    },

    applyUrl: {
      type: String,
      required: false,
      trim: true,
    },

    companyName: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },

    expiryDate: Date,

    totalViews: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", JobSchema);
