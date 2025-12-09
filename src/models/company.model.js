import mongoose, { Schema } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String },
    website: { type: String },
    industry: { type: String },

    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },

    headquarters: { type: String },
    description: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // HR
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", CompanySchema);
