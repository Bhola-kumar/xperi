/**
 * API Endpoints configuration
 * Centralized location for all API endpoints used in the application
 */
export const DATA_ACCURACY = {
  JOBS: {
    ALL: "/data-accuracy/jobs/all",
    GET: (jobId) => `/data-accuracy/jobs/${jobId}`,
    COMPLETE: "/data-accuracy/jobs/complete",
    LOCK: "/data-accuracy/jobs/lock",
    UNLOCK: "/data-accuracy/jobs/unlock",
    UPDATE_STATUS: "/data-accuracy/jobs/update_status",
  },
  SOURCES: {
    SEARCH: "/data-accuracy/sources/search",
  },
};

// Export all endpoint configurations
export default {
  DATA_ACCURACY,
};
