// src/controllers/job.controller.js
import { handleServiceCall } from "./user.controller.js"; // re-use existing helper
import jobService from "../services/job.service.js";

export const createJob = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.createJob,
    successMessage: "Job created successfully",
  });

  export const createBulkJobs = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.createBulkJobs,
      successMessage: "Bulk jobs uploaded successfully"
    });
  
    export const getJobById = (req, res) =>
      handleServiceCall({
        req,
        res,
        serviceMethod: jobService.getJobById,
        successMessage: "Job fetched successfully",
      });

    export const getJobBySlug = (req, res) =>
      handleServiceCall({
        req,
        res,
        serviceMethod: jobService.getJobBySlug,
        successMessage: "Job fetched successfully",
    });

    export const listJobs = (req, res) =>
      handleServiceCall({
        req,
        res,
        serviceMethod: jobService.listJobs,
        successMessage: "Jobs fetched successfully",
      });

      export const suggestJobs = (req, res) =>
        handleServiceCall({
          req,
          res,
          serviceMethod: jobService.suggestJobs,
          successMessage: "Suggestions fetched successfully",
        });
      
export const listFeaturedJobs = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.listFeaturedJobs,
    successMessage: "Featured jobs fetched successfully",
});

export const listMyJobs = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.listMyJobs,
    successMessage: "My jobs fetched successfully",
});
    
export const updateJob = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.updateJob,
    successMessage: "Job updated successfully",
  });

  export const closeJob = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.closeJob,
      successMessage: "Job closed successfully",
    });
  
  // ARCHIVE (your current delete)
  export const deleteJob = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.deleteJob,
      successMessage: "Job archived successfully",
    });
  
  // PERMANENT DELETE (optional)
  export const deleteJobPermanent = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.deleteJobPermanent,
      successMessage: "Job permanently deleted",
    });

export const incrementJobView = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.incrementJobView,
    successMessage: "Job view incremented successfully",
});

export const getApplicantsCount = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: jobService.getApplicantsCount,
    successMessage: "Applicants count fetched successfully",
  });

  export const applyToJob = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.applyToJob,
      successMessage: "Job application submitted successfully",
    });

export const listApplicantsForJob = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: jobService.listApplicantsForJob,
      successMessage: "Applicants fetched successfully",
    });
  