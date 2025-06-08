import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).render("data_accuracy/jobs_listing/error", {
    message: "Something went wrong. Please try again.",
    error: process.env.NODE_ENV === "development" ? err : {},
    title: "Error",
  });
};

// Render the jobs listing page
router.get("/", (req, res, next) => {
  try {
    res.render("data_accuracy/jobs_listing/index", {
      title: "QA Jobs Listing",
    });
  } catch (err) {
    next(err);
  }
});

// Get all jobs
router.get("/all", async (req, res, next) => {
  try {
    // TODO: Replace with actual API call to fetch jobs
    const mockJobs = [
      {
        job_id: "JOB001",
        source_id: 12345,
        broadcast_dates: {
          start_date: "2025-03-05",
          start_time: "09:00:00",
          end_date: "2025-03-05",
          end_time: "10:00:00",
        },
        status: "completed",
        created_at: "2025-03-05T08:00:00Z",
      },
      {
        job_id: "JOB002",
        source_id: 12346,
        broadcast_dates: {
          start_date: "2025-03-05",
          start_time: "10:00:00",
          end_date: "2025-03-05",
          end_time: "11:00:00",
        },
        status: "pending",
        created_at: "2025-03-05T09:00:00Z",
      },
    ];

    res.json({ jobs: mockJobs });
  } catch (err) {
    next(err);
  }
});

// Handle 404
router.use((req, res) => {
  res.status(404).render("data_accuracy/jobs_listing/error", {
    message: "Page not found",
    error: {},
    title: "404 Not Found",
  });
});

// Apply error handler
router.use(errorHandler);

export default router;
