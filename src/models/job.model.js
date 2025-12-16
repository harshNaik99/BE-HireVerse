import mongoose, { Schema } from "mongoose";

const normalizeLowerTrim = (v) =>
  typeof v === "string" ? v.toLowerCase().trim() : v;

const normalizeStringArray = (arr) =>
  Array.isArray(arr)
    ? [...new Set(
        arr
          .filter((x) => typeof x === "string")
          .map((s) => s.toLowerCase().trim())
          .filter(Boolean)
      )]
    : [];

const isValidUrl = (url) => {
  if (!url) return true;
  try {
    const u = new URL(url);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
};

const JobSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 120,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 20,
      maxlength: 8000,
    },

    responsibilities: {
      type: [String],
      default: [],
      set: normalizeStringArray,
    },
    requirements: {
      type: [String],
      default: [],
      set: normalizeStringArray,
    },
    skills: {
      type: [String],
      default: [],
      set: normalizeStringArray,
      index: true,
    },

    experienceLevel: {
      type: String,
      enum: ["0-1", "1-3", "3-5", "5-8", "8+"],
      lowercase: true,
      index: true,
    },

    jobType: {
      type: String,
      enum: ["full_time", "part_time", "freelance", "temporary", "internship", "apprenticeship"],
      default: "full_time",
      lowercase: true,
      trim: true,
      index: true,
    },

    location: {
      type: String,
      required: true,
      set: normalizeLowerTrim,
      minlength: 2,
      maxlength: 120,
      index: true,
    },

    minSalary: { type: Number, min: 0 },
    maxSalary: { type: Number, min: 0 },
    salaryCurrency: { type: String, default: "inr", lowercase: true, trim: true },

    workMode: {
      type: String,
      enum: ["onsite", "remote", "hybrid", "work from home", "field work"],
      default: "onsite",
      lowercase: true,
      trim: true,
      index: true,
    },

    slug: { type: String, trim: true, lowercase: true },

    applyType: {
      type: String,
      enum: ["internal", "external"],
      default: "internal",
      lowercase: true,
      trim: true,
      index: true,
    },
    applyUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
      validate: {
        validator: isValidUrl,
        message: "Invalid applyUrl",
      }, // custom validators are supported by Mongoose [web:944]
    },

    companyName: {
      type: String,
      set: normalizeLowerTrim,
      default: null,
      maxlength: 120,
      index: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      index: true,
      default: null,
    },

    // Optional explicit status for FE filtering while keeping your flags
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "published",
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
    isApproved: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    closedAt: { type: Date, default: null, index: true },
archivedAt: { type: Date, default: null, index: true },

    expiryDate: { type: Date, default: null, index: true },

    totalViews: { type: Number, default: 0, min: 0 },
    totalApplications: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/**
 * Schema-level validations
 */

// maxSalary must be >= minSalary (if both exist)
JobSchema.pre("validate", function (next) {
  if (
    this.minSalary != null &&
    this.maxSalary != null &&
    this.maxSalary < this.minSalary
  ) {
    return next(new Error("maxSalary must be >= minSalary"));
  }
  return next();
});

// If applyType is external then applyUrl is required; if internal, encourage null
JobSchema.pre("validate", function (next) {
  if (this.applyType === "external" && !this.applyUrl) {
    return next(new Error("applyUrl is required when applyType is external"));
  }
  return next();
});

// Optional: auto-generate slug if not provided (simple; replace with robust slugger if needed)
JobSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  next();
});

/**
 * Indexes (performance + uniqueness)
 */

// Unique slug per HR (sparse allows documents with no slug)
JobSchema.index({ postedBy: 1, slug: 1 }, { unique: true, sparse: true }); // compound unique index [web:893]

// Core feed queries
JobSchema.index({ isActive: 1, isApproved: 1, createdAt: -1 });
JobSchema.index({ isFeatured: 1, isActive: 1, isApproved: 1, createdAt: -1 });
JobSchema.index({ companyId: 1, createdAt: -1 });
JobSchema.index({ postedBy: 1, createdAt: -1 });

// Optional salary helpers (usefulness depends on data sparsity)
JobSchema.index({ minSalary: 1 });
JobSchema.index({ maxSalary: 1 });

// Text search (supports suggest/search endpoints)
JobSchema.index({
  title: "text",
  description: "text",
  companyName: "text",
  skills: "text",
}); // schema-level text indexes are supported [web:893]

export const Job = mongoose.model("Job", JobSchema);
