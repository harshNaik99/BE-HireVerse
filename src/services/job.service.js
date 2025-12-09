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
const listJobs = async (req) => {
  try {
    // ------------------------------------
    // 1) Extract and normalize query params
    // ------------------------------------
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
      sort = "date",
      page = 1,
      limit = 10,
    } = req.query;

    // Lowercase params for consistency
    const norm = {
      q: q?.toLowerCase(),
      location: location?.toLowerCase(),
      skills,
      companyId,
      applyType: applyType?.toLowerCase(),
      jobType: jobType?.toLowerCase(),
      workMode: workMode?.toLowerCase(),
      experienceLevel: experienceLevel?.toLowerCase(),
      minSalary,
      maxSalary,
      sort,
    };

    // ------------------------------------
    // 2) Base filters: active & approved jobs
    // ------------------------------------
    const filters = {
      isActive: true,
      isApproved: true,
    };

    // ------------------------------------
    // 3) Text Search (q)
    // ------------------------------------
    if (norm.q) {
      filters.$or = [
        { title: { $regex: norm.q, $options: "i" } },
        { description: { $regex: norm.q, $options: "i" } },
        { companyName: { $regex: norm.q, $options: "i" } },
      ];
    }

    // ------------------------------------
    // 4) Location Search
    // ------------------------------------
    if (norm.location) {
      filters.location = { $regex: norm.location, $options: "i" };
    }

    // ------------------------------------
    // 5) Skills Search
    // ------------------------------------
    if (norm.skills) {
      const arr = Array.isArray(norm.skills)
        ? norm.skills
        : norm.skills.split(",");

      filters.skills = {
        $in: arr.map((s) => s.toLowerCase().trim()),
      };
    }

    // ------------------------------------
    // 6) Exact filters with case-insensitive matching
    // ------------------------------------
    const regexMatch = (val) =>
      ({ $regex: `^${val}$`, $options: "i" });

    if (norm.companyId) filters.companyId = norm.companyId;
    if (norm.applyType) filters.applyType = regexMatch(norm.applyType);
    if (norm.jobType) filters.jobType = regexMatch(norm.jobType);
    if (norm.workMode) filters.workMode = regexMatch(norm.workMode);
    if (norm.experienceLevel)
      filters.experienceLevel = regexMatch(norm.experienceLevel);

    // ------------------------------------
    // 7) Salary Filtering
    // ------------------------------------
    if (norm.minSalary || norm.maxSalary) {
      filters.minSalary = {};
      if (norm.minSalary) filters.minSalary.$gte = Number(norm.minSalary);
      if (norm.maxSalary) filters.minSalary.$lte = Number(norm.maxSalary);
    }

    // ------------------------------------
    // 8) Pagination
    // ------------------------------------
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Number(limit) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    // ------------------------------------
    // 9) Sorting
    // ------------------------------------
    let sortObj = { createdAt: -1 }; // default

    if (norm.sort === "salary") sortObj = { minSalary: -1 };
    if (norm.sort === "title") sortObj = { title: 1 };
    if (norm.sort === "recent") sortObj = { createdAt: -1 };

    // ------------------------------------
    // 10) DB Query + COUNT
    // ------------------------------------
    const [results, total] = await Promise.all([
      Job.find(filters)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate("companyId", "name logo")
        .populate("postedBy", "name"),
      Job.countDocuments(filters),
    ]);

    // ------------------------------------
    // 11) API Response
    // ------------------------------------
    return {
      success: true,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      results,
    };
  } catch (error) {
    console.error("JOB_LIST_ERROR:", error);
    throw new StringError("Failed to fetch job listings");
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

    // query params
    const {
      page = 1,
      limit = 10,
      q,
      status,
      isFeatured,
    } = req.query;

    const filter = {
      postedBy: userId, // only my jobs
    };

    // search by title keyword
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    // filter by featured
    if (isFeatured === "true") {
      filter.isFeatured = true;
    }
    if (isFeatured === "false") {
      filter.isFeatured = false;
    }

    // filter by job status:
    // active or expired
    if (status === "active") {
      filter.expiryDate = { $gte: new Date() };
      filter.isActive = true;
      filter.isApproved = true;
    }

    if (status === "expired") {
      filter.expiryDate = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("postedBy", "name email userType")
        .populate("companyId", "name logo website"),
      Job.countDocuments(filter),
    ]);

    return {
      success: true,
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    if (error instanceof StringError) throw error;
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

const deleteJob = async (req) => {
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

    // Only owner or admin can delete
    if (job.postedBy.toString() !== userId && req.user.userType !== "admin") {
      throw new StringError("You are not authorized to delete this job");
    }

    // Soft delete
    job.isActive = false;
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
  deleteJob,
  incrementJobView,
  getApplicantsCount,
  applyToJob,
  listApplicantsForJob
};


