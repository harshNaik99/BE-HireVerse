import mongoose, { Schema } from "mongoose";

const normalizeLowerTrim = (v) =>
  typeof v === "string" ? v.toLowerCase().trim() : v;

// Simple URL validator (production should use a more robust regex or library)
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 120,
      index: true,
    },

    logo: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
      validate: {
        validator: function (v) {
          if (!v) return true; // allow null/empty
          return isValidUrl(v);
        },
        message: "Invalid logo URL",
      },
    },

    website: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      maxlength: 300,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return isValidUrl(v);
        },
        message: "Invalid website URL",
      },
    },

    industry: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 100,
      default: null,
      index: true,
    },

    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: null,
    },

    headquarters: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: null,
    },

    description: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 2000,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Indexes (performance + uniqueness)
 */

// Option 1: Global unique company name (one company record across all HRs)
// CompanySchema.index({ name: 1 }, { unique: true });

// Option 2: One company per HR (HR can create their own "Google" entry)
// CompanySchema.index({ createdBy: 1, name: 1 }, { unique: true }); // compound unique index [web:893]

// Recommendation: use Option 1 for real hiring apps (shared company directory)
CompanySchema.index({ name: 1 }, { unique: true });

// Text search for autocomplete/search
CompanySchema.index({
  name: "text",
  industry: "text",
  description: "text",
}); // text index supports fast search [web:893]

// Common queries
CompanySchema.index({ createdBy: 1, createdAt: -1 });

export const Company = mongoose.model("Company", CompanySchema);
