// src/services/job.service.js
import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import {Application} from "../models/appication.model.js"
import { StringError } from "../errors/string.error.js";
import { slugify } from "../utils/slugify.util.js";

// -----------------------------
// Helper: Validate required fields
// -----------------------------
const validateJobFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) throw new StringError(`${key} is required`);
  }
};

// -----------------------------
// CREATE JOB
// -----------------------------
const createJob = async (req, res) => {
  try {
    const userId = req.user.id; // from authenticateUser middleware

    const {
      title,
      description,
      location,
      applyType = "internal",
      applyUrl,
      companyId,
      skills,
      responsibilities,
      requirements,
      experienceLevel,
      jobType,
      workMode,
      minSalary,
      maxSalary,
      salaryCurrency,
      expiryDate,
      isFeatured,
      companyName
    } = req.body;

    // 1) Validate required fields
    validateJobFields({ title, description, location });

    // 2) Validate apply type
    if (applyType === "external" && !applyUrl) {
      throw new StringError("applyUrl is required for external jobs");
    }

    // 3) Validate company if provided
    if (companyId) {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new StringError("Invalid companyId");
      }
    }

    // 4) Generate unique slug
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now()}`;

    // 5) Prepare payload
    const jobPayload = {
      title,
      description,
      location,
      skills,
      responsibilities,
      requirements,
      experienceLevel,
      jobType,
      workMode,
      minSalary,
      maxSalary,
      salaryCurrency,
      expiryDate,
      applyType,
      applyUrl: applyType === "internal" ? null : applyUrl,
      companyId: companyId || null,
      postedBy: userId,
      slug,
      isFeatured,
      companyName
    };

    const newJob = await Job.create(jobPayload);

    return {
      success: true,
      job: newJob,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("CREATE_JOB_ERROR:", error);
    throw new StringError("Something went wrong while creating job");
  }
};

// -----------------------------
// BULK CREATE JOBS
// -----------------------------
const createBulkJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobs = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new StringError("Request body must be a non-empty array");
    }

    const preparedJobs = [];

    for (const job of jobs) {
      const {
        title,
        description,
        location,
        applyType = "internal",
        applyUrl,
        companyId,
        skills,
        responsibilities,
        requirements,
        experienceLevel,
        jobType,
        workMode,
        minSalary,
        maxSalary,
        salaryCurrency,
        expiryDate,
        isFeatured,
        companyName
      } = job;

      // ⚠️ VALIDATIONS
      if (!title || !description || !location) {
        throw new StringError("title, description, and location are required");
      }

      if (applyType === "external" && !applyUrl) {
        throw new StringError(
          `applyUrl is required for external job: ${title}`
        );
      }

      // validate company if present
      if (companyId) {
        const company = await Company.findById(companyId);
        if (!company) {
          throw new StringError(`Invalid companyId for job: ${title}`);
        }
      }

      // generate slug
      const baseSlug = slugify(title);
      const slug = `${baseSlug}-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`;

      preparedJobs.push({
        title,
        description,
        location,
        skills,
        responsibilities,
        requirements,
        experienceLevel,
        jobType,
        workMode,
        minSalary,
        maxSalary,
        salaryCurrency,
        expiryDate,
        applyType,
        applyUrl: applyType === "internal" ? null : applyUrl,
        companyId: companyId || null,
        postedBy: userId,
        slug,
        isFeatured,
        companyName
      });
    }

    // ⚡ FASTEST INSERT
    const result = await Job.insertMany(preparedJobs);

    return {
      success: true,
      count: result.length,
      jobs: result
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("BULK_JOB_ERROR:", error);
    throw new StringError("Failed to upload bulk jobs");
  }
};

// -----------------------------
// GET /jobs/:id
// -----------------------------
const getJobById = async (req) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findById(jobId)
      .populate("companyId", "name logo website industry")
      .populate("postedBy", "name email userType");

    if (!job) throw new StringError("Job not found");

    let isApplied = false;

    // if user is logged in & is a candidate — OPTIONAL feature
    if (req.user && req.user.userType === "Candidate") {
      const existing = await Application.findOne({
        jobId,
        candidateId: req.user.id,
      });
      isApplied = !!existing;
    }

    return {
      success: true,
      job,
      isApplied,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("GET_JOB_ERROR:", error);
    throw new StringError("Failed to fetch job details");
  }
};

// -----------------------------
// GET /jobs/slug/:slug
// -----------------------------
const getJobBySlug = async (req) => {
  try {
    const { slug } = req.params;

    const job = await Job.findOne({ slug })
      .populate("companyId", "name logo website industry")
      .populate("postedBy", "name email userType");

    if (!job) throw new StringError("Job not found");

    let isApplied = false;

    // optional: detect candidate’s application
    if (req.user && req.user.userType === "Candidate") {
      const existing = await Application.findOne({
        jobId: job._id,
        candidateId: req.user.id,
      });
      isApplied = !!existing;
    }

    return {
      success: true,
      job,
      isApplied,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("JOB_SLUG_ERROR:", error);
    throw new StringError("Failed to fetch job by slug");
  }
};

// -----------------------------
// GET /jobs (search / filter / pagination)
// -----------------------------
const toInt = (v, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

const bool = (v) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
};

const normString = (v) => (typeof v === "string" ? v.trim().toLowerCase() : undefined);

const normStringArray = (v) => {
  if (!v) return undefined;
  if (Array.isArray(v)) {
    return v.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
  }
  // comma-separated
  return String(v)
    .split(",")
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);
};

const ALLOWED_SORTS = {
  // public-safe sorting keys
  date: { createdAt: -1 },
  recent: { createdAt: -1 },
  title: { title: 1 },
  salary: { minSalary: -1 }, // sorts by lower bound desc
};

export const listJobs = async (req) => {
  try {
    // 1) Extract and normalize query params
    const {
      q,
      skills,
      location,
      companyId,
      applyType,
      jobType,
      workMode,
      experienceLevel,
      minSalary,
      maxSalary,
      isFeatured,
      page = 1,
      limit = 10,
      sort = "date",
    } = req.query || {};

    const norm = {
      q: normString(q),
      location: normString(location),
      skills: normStringArray(skills),
      companyId: companyId && mongoose.isValidObjectId(companyId) ? companyId : undefined,
      applyType: normString(applyType),
      jobType: normString(jobType),
      workMode: normString(workMode),
      experienceLevel: normString(experienceLevel),
      minSalary: minSalary !== undefined ? toInt(minSalary, undefined) : undefined,
      maxSalary: maxSalary !== undefined ? toInt(maxSalary, undefined) : undefined,
      isFeatured: bool(isFeatured),
      pageNum: Math.max(toInt(page, 1), 1),
      limitNum: Math.min(Math.max(toInt(limit, 10), 1), 50),
      sortKey: typeof sort === "string" ? sort.toLowerCase().trim() : "date",
    };

    // 2) Base filters: only active & approved jobs for public listing
    const filters = {
      isActive: true,
      isApproved: true,
    };

    // Optional featured filter
    if (norm.isFeatured !== undefined) {
      filters.isFeatured = norm.isFeatured;
    }

    // 3) Text search (q)
    // Prefer a text index when available for better performance; fallback to regex.
    if (norm.q) {
      // If you created a text index on title/description/companyName/skills:
      // filters.$text = { $search: norm.q }
      // Otherwise use regex OR:
      filters.$or = [
        { title: { $regex: norm.q, $options: "i" } },
        { description: { $regex: norm.q, $options: "i" } },
        { companyName: { $regex: norm.q, $options: "i" } },
      ];
    }

    // 4) Location filter (case-insensitive contains)
    if (norm.location) {
      filters.location = { $regex: norm.location, $options: "i" };
    }

    // 5) Skills filter: any overlap with provided skills
    if (norm.skills && norm.skills.length) {
      filters.skills = { $in: norm.skills };
    }

    // 6) Exact filters using case-insensitive match on enums
    const regexEq = (val) => ({ $regex: `^${val}$`, $options: "i" });
    if (norm.companyId) filters.companyId = norm.companyId;
    if (norm.applyType) filters.applyType = regexEq(norm.applyType);
    if (norm.jobType) filters.jobType = regexEq(norm.jobType);
    if (norm.workMode) filters.workMode = regexEq(norm.workMode);
    if (norm.experienceLevel) filters.experienceLevel = regexEq(norm.experienceLevel);

    // 7) Salary overlap filtering
    // Show jobs where the job’s [minSalary, maxSalary] overlaps the user’s desired [minSalary, maxSalary].
    // If only min is provided: job.maxSalary >= min
    // If only max is provided: job.minSalary <= max
    // If both: (job.max >= min) AND (job.min <= max)
    const andClauses = [];
    if (Number.isFinite(norm.minSalary) && !Number.isFinite(norm.maxSalary)) {
      andClauses.push({ $or: [{ maxSalary: null }, { maxSalary: { $gte: norm.minSalary } }] });
    } else if (!Number.isFinite(norm.minSalary) && Number.isFinite(norm.maxSalary)) {
      andClauses.push({ $or: [{ minSalary: null }, { minSalary: { $lte: norm.maxSalary } }] });
    } else if (Number.isFinite(norm.minSalary) && Number.isFinite(norm.maxSalary)) {
      andClauses.push({ $or: [{ maxSalary: null }, { maxSalary: { $gte: norm.minSalary } }] });
      andClauses.push({ $or: [{ minSalary: null }, { minSalary: { $lte: norm.maxSalary } }] });
    }
    if (andClauses.length) {
      filters.$and = andClauses;
    }

    // 8) Pagination
    const skip = (norm.pageNum - 1) * norm.limitNum;

    // 9) Sorting (safe allowlist)
    const sortObj = ALLOWED_SORTS[norm.sortKey] || ALLOWED_SORTS.date;

    // 10) Projection
    // ✅ return all fields from Job documents (no projection)
    const projection = undefined;

    // 11) DB Query + COUNT (use lean for speed)
    const [results, total] = await Promise.all([
      Job.find(filters, projection)
        .sort(sortObj)
        .skip(skip)
        .limit(norm.limitNum)
        .lean()
        .populate("companyId", "name logo")
        .populate("postedBy", "name"),
      Job.countDocuments(filters),
    ]);

    // 12) Response
    return {
      success: true,
      page: norm.pageNum,
      limit: norm.limitNum,
      total,
      pages: Math.ceil(total / norm.limitNum),
      results,
    };
  } catch (error) {
    console.error("JOB_LIST_ERROR:", error);
    throw new Error("Failed to fetch job listings");
  }
};


// -----------------------------
// GET /jobs/search/suggest?q=
// -----------------------------
const suggestJobs = async (req) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return { success: true, suggestions: { titles: [], skills: [] } };
    }

    const jobs = await Job.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } }
      ]
    })
      .select("title skills")
      .limit(10);

    const titles = [...new Set(jobs.map((j) => j.title))];
    const skills = [
      ...new Set(
        jobs.flatMap((j) =>
          Array.isArray(j.skills) ? j.skills : []
        ).filter(Boolean)
      )
    ];

    return {
      success: true,
      suggestions: {
        titles,
        skills,
      },
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("JOB_SUGGEST_ERROR:", error);
    throw new StringError("Failed to fetch suggestions");
  }
};

// -----------------------------
// GET /jobs/featured
// -----------------------------
const listFeaturedJobs = async (req) => {
  try {
    const { limit = 6 } = req.query;

    const jobs = await Job.find({
      isActive: true,
      isApproved: true,
      isFeatured: true,
      expiryDate: { $gte: new Date() } // do not show expired featured jobs
    })
      .sort({ createdAt: -1 })     // newest first
      .limit(Number(limit))
      .populate("postedBy", "name email userType");

    return {
      success: true,
      featured: jobs,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("FEATURED_JOB_ERROR:", error);
    throw new StringError("Failed to fetch featured jobs");
  }
};


const listMyJobs = async (req) => {
  try {
    const userId = req.user.id;

    const {
      page = 1,
      limit = 10,
      q,
      status,     // active/expired (date-based)
      isFeatured,
      jobStatus,  // ✅ NEW: published/draft/closed/archived
    } = req.query;

    const postedById = new mongoose.Types.ObjectId(userId);

    const filter = { postedBy: postedById };

    if (q) filter.title = { $regex: q, $options: "i" };

    if (isFeatured === "true") filter.isFeatured = true;
    if (isFeatured === "false") filter.isFeatured = false;

    // ✅ NEW: server-side tab filter
    if (jobStatus && jobStatus !== "all") {
      filter.status = jobStatus; // must match your Job.status values
    }

    // existing active/expired filter
    if (status === "active") {
      filter.expiryDate = { $gte: new Date() };
      filter.isActive = true;
      filter.isApproved = true;
    }

    if (status === "expired") {
      filter.expiryDate = { $lt: new Date() };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(5000, Math.max(1, Number(limit) || 10)); // allow "fetch all"
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total, statsAgg] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("postedBy", "name email userType")
        .populate("companyId", "name logo website"),

      Job.countDocuments(filter),

      Job.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
            archived: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
            views: { $sum: { $ifNull: ["$totalViews", 0] } },
            apps: { $sum: { $ifNull: ["$totalApplications", 0] } },
          },
        },
        { $project: { _id: 0 } },
      ]),
    ]);

    const stats =
      statsAgg?.[0] ?? { total: 0, published: 0, draft: 0, closed: 0, archived: 0, views: 0, apps: 0 };

    return {
      success: true,
      jobs,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  } catch (error) {
    console.error("MY_JOBS_FETCH_ERROR:", error);
    throw new StringError("Failed to fetch HR posted jobs");
  }
};

const updateJob = async (req) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new StringError("Invalid job id");
    }

    const job = await Job.findById(jobId);

    if (!job) {
      throw new StringError("Job not found");
    }

    // Ownership check
    if (job.postedBy.toString() !== userId.toString() && req.user.userType !== "admin") {
      throw new StringError("You are not authorized to update this job");
    }

    const allowedUpdates = [
      "title",
      "description",
      "responsibilities",
      "requirements",
      "skills",
      "experienceLevel",
      "jobType",
      "workMode",
      "location",
      "minSalary",
      "maxSalary",
      "salaryCurrency",
      "applyType",
      "applyUrl",
      "isFeatured",
      "expiryDate",
      "isActive"
    ];

    const updates = req.body;

    // block unexpected fields
    Object.keys(updates).forEach(field => {
      if (!allowedUpdates.includes(field)) {
        delete updates[field];
      }
    });

    // Validate apply type rules
    if (updates.applyType === "external" && !updates.applyUrl) {
      throw new StringError("applyUrl is required for external jobs");
    }

    // Convert expiryDate to real Date
    if (updates.expiryDate) {
      updates.expiryDate = new Date(updates.expiryDate);
    }

    // Perform update
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $set: updates },
      { new: true }
    )
      .populate("companyId", "name logo website")
      .populate("postedBy", "name email");

    return {
      success: true,
      job: updatedJob,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("UPDATE_JOB_ERROR:", error);
    throw new StringError("Failed to update job");
  }
};

const assertValidObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new StringError("Invalid job id");
  }
};

const assertOwnerOrAdmin = (job, req) => {
  const userId = req.user.id;
  const isOwner = job.postedBy?.toString?.() === userId;
  const isAdmin = req.user.userType === "admin";

  if (!isOwner && !isAdmin) {
    throw new StringError("You are not authorized");
  }
};

/**
 * CLOSE JOB (business action)
 * - status: closed
 * - isActive: false (remove from active feed)
 * - closedAt: timestamp
 */
const closeJob = async (req) => {
  try {
    const jobId = req.params.id;
    assertValidObjectId(jobId);

    const job = await Job.findById(jobId);
    if (!job) throw new StringError("Job not found");

    assertOwnerOrAdmin(job, req);

    // If already archived, don't allow close (optional rule)
    if (job.status === "archived") {
      throw new StringError("Archived job cannot be closed");
    }

    job.status = "closed";
    job.isActive = false;
    job.closedAt = new Date();

    await job.save();

    return {
      success: true,
      message: "Job closed successfully",
      jobId,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("CLOSE_JOB_ERROR:", error);
    throw new StringError("Failed to close job");
  }
};

const deleteJob = async (req) => {
  try {
    const jobId = req.params.id;
    assertValidObjectId(jobId);

    const job = await Job.findById(jobId);
    if (!job) throw new StringError("Job not found");

    assertOwnerOrAdmin(job, req);

    job.status = "archived";
    job.isActive = false;
    job.archivedAt = new Date();

    await job.save();

    return {
      success: true,
      message: "Job archived successfully",
      jobId,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("DELETE_JOB_ERROR:", error);
    throw new StringError("Failed to delete job");
  }
};

const deleteJobPermanent = async (req) => {
  try {
    const jobId = req.params.id;
    assertValidObjectId(jobId);

    if (req.user.userType !== "admin") {
      throw new StringError("Only admin can permanently delete jobs");
    }

    const job = await Job.findById(jobId);
    if (!job) throw new StringError("Job not found");

    await Job.deleteOne({ _id: jobId });

    return {
      success: true,
      message: "Job permanently deleted",
      jobId,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("DELETE_JOB_PERMANENT_ERROR:", error);
    throw new StringError("Failed to permanently delete job");
  }
};


const incrementJobView = async (req) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new StringError("Invalid job id");
    }

    await Job.findByIdAndUpdate(
      jobId,
      { $inc: { totalViews: 1 } }, // increment counter
      { new: false }
    );

    return {
      success: true,
      jobId,
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("INCREMENT_JOB_VIEW_ERROR:", error);
    throw new StringError("Failed to increment job view");
  }
};


const getApplicantsCount = async (req) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new StringError("Invalid job id");
    }

    // Count total applications for this job
    const count = await Application.countDocuments({
      jobId,
    });

    return {
      success: true,
      jobId,
      applicantsCount: count,
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("GET_APPLICANTS_COUNT_ERROR:", error);
    throw new StringError("Failed to fetch applicants count");
  }
};


const applyToJob = async (req) => {
  try {
    const jobId = req.params.id;
    const candidateId = req.user.id;
    const userType = req.user.userType;

    const { resumeUrl, coverLetter } = req.body;

    // Validate job id format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new StringError("Invalid job id");
    }

    // Only candidate can apply
    if (userType !== "candidate") {
      throw new StringError("Only candidates can apply");
    }

    // Resume required
    if (!resumeUrl) {
      throw new StringError("Resume URL is required");
    }

    // Validate job availability
    const job = await Job.findById(jobId);

    if (!job || !job.isActive || !job.isApproved) {
      throw new StringError("Job is not available to apply");
    }

    // Expiry check
    if (job.expiryDate && job.expiryDate < new Date()) {
      throw new StringError("Job has expired");
    }

    // Prevent duplicate application
    const existing = await Application.findOne({
      jobId,
      candidateId,
    });

    if (existing) {
      throw new StringError("You have already applied to this job");
    }

    // Create application
    const newApp = await Application.create({
      jobId,
      candidateId,
      resumeUrl,
      coverLetter,
    });

    // Increment job stats
    await Job.findByIdAndUpdate(jobId, {
      $inc: { totalApplications: 1 },
    });

    return {
      success: true,
      application: {
        id: newApp._id,
        status: newApp.status,
        appliedAt: newApp.appliedAt,
      },
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("APPLY_JOB_ERROR:", error);
    throw new StringError("Failed to submit job application");
  }
};

const listApplicantsForJob = async (req) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;
    const userType = req.user.userType;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new StringError("Invalid job id");
    }

    const job = await Job.findById(jobId);

    if (!job) {
      throw new StringError("Job not found");
    }

    // HR-only access or admin
    if (job.postedBy.toString() !== userId && userType !== "admin") {
      throw new StringError("You are not authorized to view applicants");
    }

    // Fetch applicants
    const applicants = await Application.find({ jobId })
      .populate("candidateId", "name email designation") // lightweight fields
      .sort({ appliedAt: -1 });

    return {
      success: true,
      applicants,
      totalApplicants: applicants.length,
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    console.error("GET_APPLICANTS_JOB_ERROR:", error);
    throw new StringError("Failed to fetch applicants for this job");
  }
};

export default {
  createJob,
  createBulkJobs,
  getJobById,
  getJobBySlug,
  listJobs,
  suggestJobs,
  listFeaturedJobs,
  listMyJobs,
  updateJob,
  closeJob,
  deleteJob,
  deleteJobPermanent,
  incrementJobView,
  getApplicantsCount,
  applyToJob,
  listApplicantsForJob
};


