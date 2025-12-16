// src/routes/job.routes.js
import express from "express";
import authenticateUser from "../../middlewares/authenticate.middleware.js";
import { requireHR } from "../../middlewares/requireHR.middleware.js";
import { createJob,createBulkJobs,getJobById,getJobBySlug,listJobs,suggestJobs,listFeaturedJobs,listMyJobs,updateJob,deleteJob,incrementJobView,getApplicantsCount,applyToJob,listApplicantsForJob, closeJob, deleteJobPermanent} from "../../controllers/job.controller.js";


const router = express.Router();

// POST /api/jobs
router.post("/create-jobs", authenticateUser, requireHR, createJob);

router.post("/create-bulkjobs", authenticateUser, requireHR, createBulkJobs);

router.get("/", listJobs); // PUBLIC

router.get("/search/suggest", suggestJobs);

router.get("/featured", listFeaturedJobs);

router.get("/my", authenticateUser, listMyJobs);
router.get("/:id/applicants-count", getApplicantsCount);
router.post("/:id/view", incrementJobView);
router.post("/:id/apply", authenticateUser, applyToJob);

router.get("/:id/applicants", authenticateUser, listApplicantsForJob)
router.get("/:id", getJobById); // PUBLIC

router.patch("/:id", authenticateUser, updateJob);

router.patch("/:id/close", authenticateUser, closeJob);

router.delete("/:id", authenticateUser, deleteJob);

router.delete("/:id/permanent", authenticateUser, deleteJobPermanent);

router.get("/slug/:slug", getJobBySlug);



export default router;
