import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).render("data_accuracy/comparison/error", {
    message: "Something went wrong. Please try again.",
    error: process.env.NODE_ENV === "development" ? err : {},
    title: "Error",
  });
};

// Render the comparison page
router.get("/", (req, res, next) => {
  try {
    const jobId = req.query.jobId;
    if (!jobId) {
      return res.redirect("/data-accuracy/jobs");
    }

    res.render("data_accuracy/comparison/index", {
      title: "Data Accuracy Comparison",
      jobId: jobId,
    });
  } catch (err) {
    next(err);
  }
});

// Handle 404
router.use((req, res) => {
  res.status(404).render("data_accuracy/comparison/error", {
    message: "Page not found",
    error: {},
    title: "404 Not Found",
  });
});

// Apply error handler
router.use(errorHandler);

export default router;
