const { d3, bootstrap } = window;

// Constants
let SIMILARITY_THRESHOLDS = {
  IDENTICAL: 0.85, // Default values, will be updated from configuration
  ALMOST_IDENTICAL: 0.65,
};

// State
let records = [];
let currentUserEmail = null;
let jobData = null; // Store job data for access to current status

// Global variables
let elements = {};
let configModal;
let completeJobModal;
let lockModal;
let unlockModal;
let commentModal; // Global comment modal instance
let jobConfigurationQAJobScores;
let jobConfigurationComparisonConfiguration;
let jobConfigurationBroadcastDates;
let errorModal;
let loadingOverlay;
let loadingText;

// Chart colors and labels
const COLOR_MAPPING = {
  match: "#28a745",
  almost_identical_match: "#ffc107",
  mismatch: "#dc3545",
  deleted: "#6c757d",
  added: "#17a2b8",
};

const LABEL_MAPPING = {
  match: "Match",
  almost_identical_match: "Almost Identical Match",
  mismatch: "Mismatch",
  deleted: "Deleted",
  added: "Added",
};

import apiService from "/js/services/apiService.js";
import { authorizeUser } from "/js/auth.js";
import { DATA_ACCURACY } from "/js/config/endpoints.js";

function showLoading() {
  loadingText.textContent = "Loading Data Accuracy Analysis...";
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

// Initialize modals and event listeners
export function initializeComparison() {
  // Initialize user first to ensure we have the email before loading data
  authorizeUser().then((email) => {
    currentUserEmail = email;
    if (email) {
      document.getElementById("welcomeMessage").textContent =
        `Welcome, ${email}`;
      loadRecords(); // Only load records after we have the user email
    }
  });

  // Initialize loading overlay
  loadingOverlay = document.getElementById("loadingOverlay");
  loadingText = document.getElementById("loadingText");

  // Initialize error modal
  errorModal = new bootstrap.Modal(document.getElementById("errorModal"));

  // Initialize complete job modal
  completeJobModal = new bootstrap.Modal(
    document.getElementById("completeJobModal"),
  );

  // Initialize lock modal
  lockModal = new bootstrap.Modal(document.getElementById("lockModal"));

  // Initialize unlock modal
  unlockModal = new bootstrap.Modal(document.getElementById("unlockModal"));

  // Initialize comment modal
  const commentModalElement = document.getElementById("commentModal");
  commentModal = new bootstrap.Modal(commentModalElement, {
    backdrop: "static",
  });

  // Move the comment modal to the records column when shown
  commentModalElement.addEventListener("show.bs.modal", function () {
    const recordsColumn = document.querySelector(".records-column");
    if (recordsColumn && !recordsColumn.contains(commentModalElement)) {
      recordsColumn.appendChild(commentModalElement);
    }
  });

  // Initialize configuration modal
  const configModalElement = document.getElementById("configModal");
  configModal = new bootstrap.Modal(configModalElement);

  // Add click handler for complete job button
  document.getElementById("completeJobBtn")?.addEventListener("click", () => {
    completeJobModal.show();
  });

  // Add click handler for confirm complete button
  document
    .getElementById("confirmCompleteBtn")
    ?.addEventListener("click", async () => {
      // Store button references and content outside try block
      const confirmBtn = document.getElementById("confirmCompleteBtn");
      const completeBtn = document.getElementById("completeJobBtn");
      const originalContent = confirmBtn.innerHTML;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get("jobId");

        if (!jobId) {
          throw new Error("No job ID found");
        }

        // Show loading state on the button
        confirmBtn.disabled = true;
        confirmBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Completing...';

        // Call the update status API
        const response = await updateJobStatus(
          jobId,
          jobData.status,
          "completed",
          currentUserEmail,
        );

        // Close the modal
        completeJobModal.hide();

        // Redirect to jobs listing page
        window.location.href = "/data-accuracy/jobs";
      } catch (error) {
        console.error("Error completing job:", error);
        // Close the modal on error
        completeJobModal.hide();

        // Show error message from API or fallback
        const errorMessage =
          error.message ||
          (error.details
            ? `Failed to complete job: ${error.details.error}`
            : "Failed to complete job. Please try again.");

        showError(errorMessage);

        // Reset button state on error
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalContent;
      }
    });

  // Add click handler for config button
  document.getElementById("viewConfig")?.addEventListener("click", () => {
    console.log("Config button clicked");

    if (!jobConfigurationQAJobScores) {
      showError(
        "Configuration data is not available yet. Please wait for data to load.",
      );
      return;
    }

    try {
      // Function to format and highlight JSON
      const formatAndHighlightJSON = (jsonData) => {
        // Format the configuration data for better readability
        const formattedConfig = JSON.stringify(jsonData, null, 4);
        return (
          formattedConfig
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Add syntax highlighting
            .replace(/"([^"]+)"(?=:)/g, '<span class="key">"$1"</span>') // Keys
            .replace(
              /: ([0-9.-]+)([,\n\r]|$)/g,
              ': <span class="number">$1</span>$2',
            ) // Numbers (including negative)
            .replace(
              /: "(.*?)"([,\n\r]|$)/g,
              ': <span class="string">"$1"</span>$2',
            ) // Strings
            .replace(
              /: (true|false)([,\n\r]|$)/g,
              ': <span class="boolean">$1</span>$2',
            ) // Booleans
            .replace(
              /"([^"]+)"(?!:)([,\n\r]|$)/g,
              '<span class="string">"$1"</span>$2',
            )
        ); // Array string items
      };

      // 1. QA Score Calculation Configuration
      const configElementQAScoreCalc = document.getElementById(
        "configDataQAScoreCalc",
      );
      if (configElementQAScoreCalc) {
        // Parse the configuration if it's a string
        const configDataQAScoreCalc =
          typeof jobConfigurationQAJobScores === "string"
            ? JSON.parse(jobConfigurationQAJobScores)
            : jobConfigurationQAJobScores;

        // Format and highlight
        const highlightedConfigQAScoreCalc = formatAndHighlightJSON(
          configDataQAScoreCalc,
        );
        configElementQAScoreCalc.innerHTML = highlightedConfigQAScoreCalc;
      }

      // 2. Comparison Configuration
      const configElementComparisonConfig = document.getElementById(
        "configDataComparisonConfiguration",
      );
      if (configElementComparisonConfig) {
        // Format and highlight
        const highlightedComparisonConfig = formatAndHighlightJSON(
          jobConfigurationComparisonConfiguration,
        );
        configElementComparisonConfig.innerHTML = highlightedComparisonConfig;
      }

      // 3. QA Date Range
      const configElementQADateRange = document.getElementById(
        "configDataQADateRange",
      );
      if (configElementQADateRange) {
        // Format and highlight
        const highlightedQADateRange = formatAndHighlightJSON(
          jobConfigurationBroadcastDates,
        );
        configElementQADateRange.innerHTML = highlightedQADateRange;
      }

      // Initialize copy button
      const copyButton = document.getElementById("copyConfig");
      const handleCopy = async () => {
        try {
          // Get the active tab content
          const activeTabId = document.querySelector(".tab-pane.active").id;
          let textToCopy;

          if (activeTabId === "accuracy-content") {
            textToCopy = JSON.stringify(
              JSON.parse(jobConfigurationQAJobScores),
              null,
              4,
            );
          } else if (activeTabId === "comparison-content") {
            textToCopy = JSON.stringify(
              jobConfigurationComparisonConfiguration,
              null,
              4,
            );
          } else if (activeTabId === "date-range-content") {
            textToCopy = JSON.stringify(
              jobConfigurationBroadcastDates,
              null,
              4,
            );
          }

          await navigator.clipboard.writeText(textToCopy);
          copyButton.classList.add("copied");
          copyButton.innerHTML =
            '<i class="bi bi-clipboard-check"></i><span class="ms-1">Copied!</span>';
          setTimeout(() => {
            copyButton.classList.remove("copied");
            copyButton.innerHTML =
              '<i class="bi bi-clipboard"></i><span class="ms-1">Copy to Clipboard</span>';
          }, 2000);
        } catch (error) {
          console.error("Failed to copy configuration:", error);
          showError("Failed to copy configuration to clipboard");
        }
      };

      // Remove old event listener if exists
      copyButton?.removeEventListener("click", handleCopy);
      // Add new event listener
      copyButton?.addEventListener("click", handleCopy);

      console.log("Showing config modal");
      configModal.show();
    } catch (error) {
      console.error("Error showing configuration:", error);
      showError("Failed to display configuration. Please try again.");
    }
  });

  // Add click handler for unlock job button
  document.getElementById("unlockJobBtn")?.addEventListener("click", () => {
    unlockModal.show();
  });

  // Add click handler for confirm unlock button
  document
    .getElementById("confirmUnlockBtn")
    ?.addEventListener("click", async () => {
      // Store button references and content outside try block
      const confirmBtn = document.getElementById("confirmUnlockBtn");
      const unlockBtn = document.getElementById("unlockJobBtn");
      const originalContent = confirmBtn.innerHTML;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get("jobId");

        if (!jobId) {
          throw new Error("No job ID found");
        }

        // Show loading state on the button
        confirmBtn.disabled = true;
        confirmBtn.innerHTML =
          '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Unlocking...';

        // Call the unlock job API
        const response = await unlockJob(jobId, currentUserEmail);

        // Close the modal
        unlockModal.hide();

        // Show success message with redirect
        const toastElement = document.createElement("div");
        toastElement.className =
          "toast align-items-center text-white bg-success border-0 position-fixed top-0 start-50 translate-middle-x mt-3";
        toastElement.setAttribute("role", "alert");
        toastElement.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-check-circle me-2"></i>${response.message || "Job unlocked successfully"}. Redirecting...
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
        document.body.appendChild(toastElement);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Update the unlock button
        unlockBtn.disabled = true;
        unlockBtn.innerHTML =
          '<i class="bi bi-unlock-fill me-1"></i>Job Unlocked';
        unlockBtn.classList.remove("btn-warning");
        unlockBtn.classList.add("btn-secondary");

        // Show loading overlay with redirect message
        showLoading();
        loadingText.textContent = "Redirecting to View QA Jobs...";

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "/data-accuracy/jobs";
        }, 1000);
      } catch (error) {
        console.error("Error unlocking job:", error);
        // Close the modal on error
        unlockModal.hide();

        // Show error message from API or fallback
        const errorMessage =
          error.message ||
          (error.details
            ? `Failed to unlock job: ${error.details.error}`
            : "Failed to unlock job. Please try again.");

        showError(errorMessage);

        // Reset button state on error
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalContent;

        // Hide loading overlay if visible
        hideLoading();
      }
    });

  // Initialize D3 charts
  const originalChart = d3
    .select("#originalPieChart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 200 200")
    .append("g")
    .attr("transform", "translate(100, 100)");

  const updatedChart = d3
    .select("#updatedPieChart")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 200 200")
    .append("g")
    .attr("transform", "translate(100, 100)");

  // Initialize filters
  initializeFilters();

  // Initialize chart elements
  elements = {
    charts: {
      original: originalChart,
      updated: updatedChart,
    },
    stats: {
      total: document.getElementById("totalRecords"),
      identical: document.getElementById("identicalRecords"),
      almost: document.getElementById("almostIdenticalRecords"),
      unmatched: document.getElementById("unmatchedRecords"),
      added: document.getElementById("addedRecords"),
      deleted: document.getElementById("deletedRecords"),
    },
  };
}

// Helper functions for getRecordStatus
function getStatusFromLabel(label) {
  return {
    class: `record-${label}`,
    type: label,
  };
}

function getStatusFromRecordState(record) {
  if (
    !record.provider_record ||
    Object.keys(record.provider_record || {}).length === 0
  ) {
    return getStatusFromLabel("deleted");
  }
  if (
    !record.cosmo_record ||
    Object.keys(record.cosmo_record || {}).length === 0
  ) {
    return getStatusFromLabel("added");
  }
  return getStatusFromSimilarityIndex(record.similarity_index);
}

function getStatusFromSimilarityIndex(similarityIndex) {
  if (similarityIndex >= SIMILARITY_THRESHOLDS.IDENTICAL) {
    return getStatusFromLabel("match");
  }
  if (similarityIndex >= SIMILARITY_THRESHOLDS.ALMOST_IDENTICAL) {
    return getStatusFromLabel("almost_identical_match");
  }
  return getStatusFromLabel("mismatch");
}

// Record Status
function getRecordStatus(record) {
  const label = record.updated_label || record.original_label;
  return label ? getStatusFromLabel(label) : getStatusFromRecordState(record);
}

// Helper functions for updateSimilarityBadge
function getColorForRecord(label, similarityIndex) {
  if (label === "deleted" || label === "added") {
    return "#6c757d"; // gray for deleted/added
  }
  if (label === "match" || similarityIndex >= SIMILARITY_THRESHOLDS.IDENTICAL) {
    return "#28a745"; // green for match
  }
  if (
    label === "almost_identical_match" ||
    similarityIndex >= SIMILARITY_THRESHOLDS.ALMOST_IDENTICAL
  ) {
    return "#ffc107"; // yellow for almost identical
  }
  return "#dc3545"; // red for mismatch
}

function getBadgeClass(label) {
  const classMap = {
    deleted: "bg-secondary",
    added: "bg-info",
    match: "bg-success",
    almost_identical_match: "bg-warning",
    mismatch: "bg-danger",
  };
  return classMap[label] || "bg-danger";
}

function updateBadge(badge, label) {
  if (badge) {
    const badgeClass = getBadgeClass(label);
    badge.innerHTML = `<span class="badge ${badgeClass}">${LABEL_MAPPING[label] || label}</span>`;
  }
}

function updateSimilarityInfo(qaReview, color, record) {
  if (!qaReview) return;

  const similarityIndexSpan = qaReview.querySelector(".similarity-index");
  if (similarityIndexSpan) {
    similarityIndexSpan.style.color = color;
    similarityIndexSpan.textContent = record.similarity_index
      ? record.similarity_index.toFixed(2)
      : "0.00";
  }

  const similarityReason = qaReview.querySelector(".similarity-reason");
  if (similarityReason) {
    similarityReason.textContent = record.similarity_reason || "";
  }
}

function handleQAReviewState(qaReview, label) {
  if (!qaReview) return;

  const isDisabled = label === "deleted" || label === "added";
  if (isDisabled) {
    qaReview.classList.add("disabled", "opacity-50");
    const buttons = qaReview.querySelectorAll("button");
    buttons.forEach((button) => (button.disabled = true));
  }
}

function updateSimilarityBadge(card, record) {
  const badge = card.querySelector(".similarity-badge");
  const qaReview = card.querySelector(".qa-review");
  const label = record.updated_label || record.original_label;

  const color = getColorForRecord(label, record.similarity_index);

  updateBadge(badge, label);
  updateSimilarityInfo(qaReview, color, record);
  handleQAReviewState(qaReview, label);
}

// Update pie chart with new data
function updatePieChart(data, chartElement) {
  // Filter out properties with 0 values and qa_score first
  const filteredData = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value > 0 && key !== "qa_score") {
      filteredData[key] = value;
      console.log(`${key}: ${value} records`);
    }
  });

  // Calculate total only from filtered data
  const total = Object.values(filteredData).reduce((acc, val) => acc + val, 0);
  console.log("Total records for pie chart:", total);

  // Convert data to pie chart format
  const chartData = Object.entries(filteredData).map(([label, count]) => {
    const mappedLabel = LABEL_MAPPING[label] || label;
    const percentage = ((count / total) * 100).toFixed(1);
    console.log(`${mappedLabel}: ${count} (${percentage}%)`);
    return {
      label: mappedLabel,
      originalLabel: label,
      value: count,
      percentage: percentage,
    };
  });

  // Color scale
  const color = d3
    .scaleOrdinal()
    .domain(["match", "almost_identical_match", "mismatch", "deleted", "added"])
    .range([
      COLOR_MAPPING.match,
      COLOR_MAPPING.almost_identical_match,
      COLOR_MAPPING.mismatch,
      COLOR_MAPPING.deleted,
      COLOR_MAPPING.added,
    ]);

  // Create pie chart data
  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  const arc = d3.arc().innerRadius(0).outerRadius(60);

  // Arc for label positioning
  const labelArc = d3.arc().innerRadius(65).outerRadius(65);

  // Clear existing chart
  chartElement.selectAll("*").remove();

  // Draw pie segments
  const segments = chartElement
    .selectAll("path")
    .data(pie(chartData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.originalLabel))
    .attr("stroke", "white")
    .style("stroke-width", "2px");

  // Add labels
  const labels = chartElement
    .selectAll("text")
    .data(pie(chartData))
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "8px")
    .style("fill", "#4A5568");

  // Add multiline label text
  labels.each(function (d) {
    const text = d3.select(this);
    text.append("tspan").attr("x", 0).attr("dy", "-0.6em").text(d.data.label);
    text
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em")
      .text(`${d.data.value} (${d.data.percentage}%)`);
  });
}

// Update record counts based on label
function updateRecordCounts(record, stats, forQAScore = false) {
  switch (record.original_label) {
    case "match":
      stats.match++;
      return 1;
    case "almost_identical_match":
      stats.almost_identical_match++;
      return forQAScore ? 0.5 : 1; // Only use 0.5 for QA score calculation
    case "mismatch":
      stats.mismatch++;
      return 0;
    case "added":
      stats.added++;
      return 0;
    case "deleted":
      stats.deleted++;
      return 0;
    default:
      return 0;
  }
}

// Process data for charts
function processDataForCharts(data) {
  const stats = {
    match: 0,
    almost_identical_match: 0,
    mismatch: 0,
    added: 0,
    deleted: 0,
    qa_score: 0,
  };

  if (!data?.qa_results?.length) {
    return stats;
  }

  console.log("Processing data for charts...");
  console.log("Total QA results:", data.qa_results.length);

  const totalRecords = data.qa_results.length;
  let qaScore = 0;

  // First pass: Count records for visualization
  data.qa_results.forEach((record) => {
    updateRecordCounts(record, stats, false);
  });

  // Second pass: Calculate QA score separately
  qaScore = data.qa_results.reduce((total, record) => {
    const increment =
      record.original_label === "match"
        ? 1
        : record.original_label === "almost_identical_match"
          ? 0.5
          : 0;
    return total + increment;
  }, 0);

  // Calculate QA score percentage
  stats.qa_score =
    totalRecords > 0 ? ((qaScore / totalRecords) * 100).toFixed(2) : 0;

  console.log("Final visualization stats:", stats);
  console.log("QA Score:", stats.qa_score);

  updateUIElements(stats, totalRecords);
  return stats;
}

// Update UI elements with stats
function updateUIElements(stats, totalRecords) {
  // Update QA score display
  const originalScoreElement = document.getElementById("originalQAScore");
  const updatedScoreElement = document.getElementById("updatedQAScore");
  const qaScore = stats.qa_score + "%";

  if (originalScoreElement) originalScoreElement.textContent = qaScore;
  if (updatedScoreElement) updatedScoreElement.textContent = qaScore;

  // Update filter badges with counts
  const filterLabels = {
    match: document.querySelector('label[for="filterMatch"] .badge'),
    almost_identical_match: document.querySelector(
      'label[for="filterAlmostMatch"] .badge',
    ),
    mismatch: document.querySelector('label[for="filterMismatch"] .badge'),
    added: document.querySelector('label[for="filterAdded"] .badge'),
    deleted: document.querySelector('label[for="filterDeleted"] .badge'),
  };

  // Update each badge with its count
  Object.entries(filterLabels).forEach(([type, element]) => {
    if (element) {
      const count = stats[type];
      const label = LABEL_MAPPING[type] || type;
      element.textContent = `${label} (${count})`;
    }
  });

  // Update stats display
  if (elements?.stats) {
    const { stats: statElements } = elements;
    const updates = {
      total: totalRecords,
      identical: stats.match,
      almost: stats.almost_identical_match,
      unmatched: stats.mismatch,
      added: stats.added,
      deleted: stats.deleted,
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (statElements[key]) statElements[key].textContent = value;
    });
  }
}

// Load and process data
async function loadRecords() {
  try {
    showLoading(); // Show loading overlay when starting to load

    // Get job ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get("jobId");

    if (!jobId) {
      throw new Error("No job ID provided");
    }

    // Load job data first
    jobData = await loadJobData(jobId);
    console.log("API Response:", jobData);

    // Check if job is not locked (nobody is viewing it)
    if (jobData.locked === false) {
      hideLoading(); // Hide loading overlay before showing modal

      // Show error message with redirect notice
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.innerHTML = `
        <div class="text-center mb-3">
          <i class="bi bi-exclamation-circle text-danger fs-1"></i>
        </div>
        <p class="text-center mb-3">This job is not currently locked. Please lock the job first to start reviewing.</p>
        <p class="text-center text-muted">You will be redirected to View QA Jobs in 3 seconds...</p>
      `;
      errorModal.show();

      // Redirect after showing error
      setTimeout(() => {
        errorModal.hide();
        showLoading();
        loadingText.textContent = "Redirecting to View QA Jobs...";

        setTimeout(() => {
          window.location.href = "/data-accuracy/jobs";
        }, 1000);
      }, 3000);
      return;
    }

    // Check if job is locked by another user
    if (jobData.locked_by && jobData.locked_by !== currentUserEmail) {
      hideLoading(); // Hide loading overlay before showing modal

      // Show error message with redirect notice
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.innerHTML = `
        <div class="text-center mb-3">
          <i class="bi bi-lock-fill text-warning fs-1"></i>
        </div>
        <p class="text-center mb-3">This job is currently locked by <strong>${jobData.locked_by}</strong>.</p>
        <p class="text-center text-muted">You will be redirected to View QA Jobs in 3 seconds...</p>
      `;
      errorModal.show();

      // Redirect after showing error
      setTimeout(() => {
        errorModal.hide();
        showLoading();
        loadingText.textContent = "Redirecting to View QA Jobs...";

        setTimeout(() => {
          window.location.href = "/data-accuracy/jobs";
        }, 1000);
      }, 3000);
      return;
    }

    // Store configuration for modal display
    if (!jobData.qa_job_scores?.configuration) {
      console.error("Configuration data not found in API response");
      showError("Configuration data is not available in the API response.");
      return;
    }

    jobConfigurationQAJobScores = jobData.qa_job_scores.configuration;
    jobConfigurationComparisonConfiguration = jobData.comparison_settings;
    jobConfigurationBroadcastDates = jobData.broadcast_dates;

    console.log("Stored job configuration:", jobConfigurationQAJobScores);
    console.log(
      "Stored comparison configuration:",
      jobConfigurationComparisonConfiguration,
    );
    console.log("Stored broadcast dates:", jobConfigurationBroadcastDates);

    // Update thresholds from configuration
    SIMILARITY_THRESHOLDS = {
      IDENTICAL: jobConfigurationComparisonConfiguration.identical_threshold,
      ALMOST_IDENTICAL:
        jobConfigurationComparisonConfiguration.almost_identical_threshold,
    };

    // Update source ID in header
    const sourceIdElement = document.getElementById("sourceId");
    sourceIdElement.innerHTML = `<strong>Source ID:</strong> ${jobData.source_id || "N/A"}`;

    // Process the data
    const stats = processDataForCharts(jobData);
    console.log("Processed Stats:", stats);

    // Update pie charts
    updatePieChart(stats, elements.charts.original);
    updatePieChart(stats, elements.charts.updated);

    // Display records
    displayRecords(jobData);

    // Disable complete, unlock, and actions buttons if job is already completed
    if (jobData.status === "completed") {
      const completeBtn = document.getElementById("completeJobBtn");
      const unlockJobBtn = document.getElementById("unlockJobBtn");
      const qaReviewBtns = document.querySelectorAll("#qa_review button");

      completeBtn.disabled = true;
      unlockJobBtn.disabled = true;
      qaReviewBtns.forEach((btn) => btn.classList.add("disabled"));
    }
    hideLoading(); // Hide loading overlay when done
  } catch (error) {
    console.error("Error loading records:", error);
    hideLoading(); // Hide loading overlay if there's an error
    showError("Failed to load records. Please try again later.");
  }
}

async function loadJobData(jobId) {
  try {
    const data = await apiService.fetchData(DATA_ACCURACY.JOBS.GET(jobId));
    return data;
  } catch (error) {
    console.error("Error loading job data:", error);
    throw error;
  }
}

// Update job status
async function updateJobStatus(jobId, oldStatus, newStatus, reviewerId) {
  try {
    const response = await apiService.postData(
      DATA_ACCURACY.JOBS.UPDATE_STATUS,
      {
        job_id: jobId,
        old_status: oldStatus,
        new_status: newStatus,
        reviewer_id: reviewerId,
      },
    );
    return response;
  } catch (error) {
    console.error("Error updating job status:", error);
    throw error;
  }
}

async function completeJob(jobId, reviewerId) {
  showLoading();
  loadingText.textContent = "Completing job...";

  try {
    const response = await apiService.postData(DATA_ACCURACY.JOBS.COMPLETE, {
      job_id: jobId,
      reviewer_id: reviewerId,
    });
    return response;
  } catch (error) {
    console.error("Error completing job:", error);
    throw error;
  } finally {
    hideLoading();
  }
}

async function unlockJob(jobId, reviewerId) {
  showLoading();
  loadingText.textContent = "Unlocking job...";

  try {
    const response = await apiService.postData(DATA_ACCURACY.JOBS.UNLOCK, {
      job_id: jobId,
      reviewer_id: reviewerId,
    });
    return response;
  } catch (error) {
    console.error("Error unlocking job:", error);
    throw error;
  } finally {
    hideLoading();
  }
}

// Display Records
function displayRecords(data) {
  try {
    if (!data || !Array.isArray(data.qa_results)) {
      console.error("Invalid data format:", data);
      showError("Invalid data format received");
      return;
    }
    records = data.qa_results;
    const container = document.getElementById("recordsContainer");
    if (!container) {
      console.error("Records container not found");
      return;
    }

    // Clear existing records
    container.innerHTML = "";

    // Display each record
    records.forEach((record, index) => {
      const element = createRecordElement(record, index);
      if (element) {
        container.appendChild(element);
      } else {
        console.error(`Failed to create element for record at index ${index}`);
      }
    });

    // Initialize navigation after records are displayed
    initializeNavigation();

    // Update filter counts
    updateFilterCounts(data);

    // Apply initial filters
    applyFilters();
  } catch (error) {
    console.error("Error displaying records:", error);
    showError("Failed to display records. Please try again.");
  }
}

// Error handling
function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;

  errorModal.show();
}

// Filter functionality
let activeFilters = new Set([
  "match",
  "almost_identical_match",
  "mismatch",
  "added",
  "deleted",
]);
let filterCounts = {
  match: 0,
  almost_identical_match: 0,
  mismatch: 0,
  added: 0,
  deleted: 0,
};

// Initialize filter functionality
function initializeFilters() {
  const toggleButton = document.getElementById("toggleFilters");
  const resetButton = document.getElementById("resetFilters");
  const filterBody = document.getElementById("filterBody");
  const filterInputs = document.querySelectorAll(
    '.filter-options input[type="checkbox"]',
  );

  // Toggle filter visibility
  toggleButton.addEventListener("click", () => {
    const isCollapsed = filterBody.classList.contains("show");
    filterBody.classList.toggle("show");
    toggleButton.querySelector("span").textContent = isCollapsed
      ? "Show Filters"
      : "Hide Filters";
  });

  // Reset filters
  resetButton.addEventListener("click", () => {
    filterInputs.forEach((input) => {
      if (!input.disabled) {
        input.checked = true;
        activeFilters.add(input.value);
      }
    });
    applyFilters();
  });

  // Handle filter changes
  filterInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        activeFilters.add(input.value);
      } else {
        activeFilters.delete(input.value);
      }
      applyFilters();
    });
  });
}

// Update filter counts and disable empty filters
function updateFilterCounts(data) {
  // Reset counts
  Object.keys(filterCounts).forEach((key) => (filterCounts[key] = 0));

  // Count records by type
  data.qa_results.forEach((record) => {
    const label = record.original_label;
    if (filterCounts.hasOwnProperty(label)) {
      filterCounts[label]++;
    }
  });

  // Update filter checkboxes
  Object.entries(filterCounts).forEach(([type, count]) => {
    const checkbox = document.getElementById(
      `filter${type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")}`,
    );
    if (checkbox) {
      checkbox.disabled = count === 0;
      const label = checkbox.nextElementSibling;
      if (label) {
        const badge = label.querySelector(".badge");
        if (badge) {
          badge.textContent = `${LABEL_MAPPING[type]} (${count})`;
        }
      }
    }
  });
}

// Apply filters to records
function applyFilters() {
  const records = document.querySelectorAll(".comparison-card");
  let visibleCount = 0;

  records.forEach((record, index) => {
    let status = record.classList.toString().match(/record-(\w+(-\w+)*)/)?.[1];
    if (status) {
      // Convert status to filter value
      status = status.replace(/-/g, "_");

      const isVisible = activeFilters.has(status);
      record.style.display = isVisible ? "" : "none";

      if (isVisible) {
        visibleCount++;
        // Update record count
        const header = record.querySelector("h6.mb-0");
        if (header) {
          const text = header.innerHTML;
          header.innerHTML = text.replace(
            /Record \d+/,
            `Record ${visibleCount}`,
          );
        }
      }
    }
  });

  // Update total count in all visible headers
  const headers = document.querySelectorAll(
    '.comparison-card:not([style*="display: none"]) h6.mb-0',
  );
  headers.forEach((header) => {
    const text = header.innerHTML;
    header.innerHTML = text.replace(/of \d+/, `of ${visibleCount}`);
  });
}

function initializeNavigation() {
  let navigationInitialized = false;
  if (navigationInitialized) return;
  navigationInitialized = true;

  // Set filter height CSS variable
  const updateFilterHeight = () => {
    const filterContainer = document.querySelector(".filter-container");
    if (filterContainer) {
      document.documentElement.style.setProperty(
        "--filter-height",
        `${filterContainer.offsetHeight}px`,
      );
    }
  };

  // Update navigation button states
  const updateNavigationButtons = (currentCard) => {
    const visibleCards = Array.from(
      document.querySelectorAll(
        '.comparison-card:not([style*="display: none"])',
      ),
    );
    const currentIndex = visibleCards.indexOf(currentCard);

    // Get all navigation buttons for the current card
    const buttons = currentCard.querySelectorAll("[data-action]");
    buttons.forEach((btn) => {
      const action = btn.dataset.action;
      switch (action) {
        case "first":
        case "prev":
          btn.disabled = currentIndex === 0;
          btn.classList.toggle("disabled", currentIndex === 0);
          break;
        case "next":
        case "last":
          btn.disabled = currentIndex === visibleCards.length - 1;
          btn.classList.toggle(
            "disabled",
            currentIndex === visibleCards.length - 1,
          );
          break;
      }
    });
  };

  // Navigate to target card
  const navigateToCard = (targetCard, currentCard) => {
    if (targetCard && targetCard !== currentCard) {
      console.log("Scrolling to target card");
      targetCard.scrollIntoView({ block: "start", behavior: "smooth" });

      // Ensure proper spacing after scroll
      updateFilterHeight();

      // Update button states for both current and target cards
      updateNavigationButtons(targetCard);
    }
  };

  // Get current visible card
  const getCurrentCard = () => {
    const visibleCards = Array.from(
      document.querySelectorAll(
        '.comparison-card:not([style*="display: none"])',
      ),
    );

    // Find the card closest to the viewport top
    let minDistance = Infinity;
    let currentCard = null;

    visibleCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.top);
      if (distance < minDistance) {
        minDistance = distance;
        currentCard = card;
      }
    });

    return { currentCard, visibleCards };
  };

  // Handle keyboard navigation
  document.addEventListener("keydown", (e) => {
    // Only handle if not in an input field
    if (e.target.matches("input, textarea, select")) return;

    const { currentCard, visibleCards } = getCurrentCard();
    if (!currentCard) return;

    const currentIndex = visibleCards.indexOf(currentCard);
    let targetCard = null;

    switch (e.key) {
      case "ArrowLeft":
        if (currentIndex > 0) {
          targetCard = visibleCards[currentIndex - 1];
        }
        break;
      case "ArrowRight":
        if (currentIndex < visibleCards.length - 1) {
          targetCard = visibleCards[currentIndex + 1];
        }
        break;
    }

    if (targetCard) {
      e.preventDefault(); // Prevent default scroll
      navigateToCard(targetCard, currentCard);
    }
  });

  // Update on initial load and when filters are toggled
  updateFilterHeight();
  const toggleFiltersBtn = document.querySelector("#toggleFilters");
  if (toggleFiltersBtn) {
    toggleFiltersBtn.addEventListener("click", () => {
      setTimeout(updateFilterHeight, 300);
    });
  }

  // Initialize button states for all cards
  const allCards = document.querySelectorAll(".comparison-card");
  allCards.forEach((card) => updateNavigationButtons(card));

  // Handle click navigation
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button || button.disabled) return;

    const card = button.closest(".comparison-card");
    if (!card) return;

    const action = button.dataset.action;
    console.log("Navigation action:", action);

    const visibleCards = Array.from(
      document.querySelectorAll(
        '.comparison-card:not([style*="display: none"])',
      ),
    );
    console.log("Total visible cards:", visibleCards.length);

    const currentIndex = visibleCards.indexOf(card);
    console.log("Current index:", currentIndex);

    let targetCard;

    switch (action) {
      case "first":
        targetCard = visibleCards[0];
        break;
      case "prev":
        targetCard = visibleCards[Math.max(0, currentIndex - 1)];
        break;
      case "next":
        targetCard =
          visibleCards[Math.min(visibleCards.length - 1, currentIndex + 1)];
        break;
      case "last":
        targetCard = visibleCards[visibleCards.length - 1];
        break;
      default:
        return;
    }

    if (targetCard) {
      navigateToCard(targetCard, card);
    }
  });
}

// Format Record Details
function formatRecord(record, discrepancies = {}) {
  if (!record || Object.keys(record).length === 0) {
    return '<p class="text-muted">No record available</p>';
  }

  const fields = [
    "air_date",
    "air_time",
    "program_title",
    "episode_title",
    "season_number",
    "episode_number",
    "year",
    "program_type",
    "description",
    "airing_type",
    "tv_rating",
    "director",
  ];

  return fields
    .map((field) => {
      const value = record[field];
      let displayValue =
        value ?? '<span class="text-muted">Not available</span>';

      // Handle special characters
      if (typeof displayValue === "string") {
        // Replace non-breaking spaces
        displayValue = displayValue.replace(/\u00a0/g, " ");

        // Only sanitize user-provided data, not our own HTML
        if (
          value !== null &&
          !displayValue.includes('<span class="text-muted">')
        ) {
          // Sanitize output to prevent XSS
          displayValue = displayValue
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
      }

      // Check if field has discrepancy
      const hasDiscrepancy = discrepancies && field in discrepancies;
      const fieldClass = hasDiscrepancy ? 'class="field-discrepancy"' : "";

      return `
                <div class="mb-2">
                    <strong>${field}:</strong> 
                    <span ${fieldClass}>${displayValue}</span>
                </div>
            `;
    })
    .join("");
}

// Format broadcast datetime
function formatBroadcastDateTime(datetimeKey) {
  if (!datetimeKey) return "N/A";
  const [datePart, timePart] = datetimeKey.split("_");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const date = new Date(year, month - 1, day, hour, minute);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

// Create Record Element
function createRecordElement(record, index) {
  const template = document.querySelector("#recordTemplate");
  if (!template) {
    console.error("Record template not found");
    return null;
  }

  const recordElement = template.content.cloneNode(true);
  const container = recordElement.querySelector(".comparison-card");

  // Set record ID and similarity reason
  container.dataset.recordId = record.record_id;
  container.dataset.similarityReason = record.similarity_reason || "";

  // Update header with index and broadcast datetime
  const header = recordElement.querySelector(".card-header h6");
  header.innerHTML = header.innerHTML
    .replace("{index}", index + 1)
    .replace("{total}", records.length)
    .replace(
      "{broadcast_datetime}",
      formatBroadcastDateTime(record.broadcast_datetime_key),
    );

  const status = getRecordStatus(record);

  // Add styling based on status
  container.classList.add(status.class);

  // Update similarity badge and index
  updateSimilarityBadge(container, record);

  // Add record details with discrepancies highlighting
  recordElement.querySelector(".provider-record").innerHTML = formatRecord(
    record.provider_record,
    record.discrepancies,
  );
  recordElement.querySelector(".cosmo-record").innerHTML = formatRecord(
    record.cosmo_record,
  );

  // Setup rating controls
  setupRating(recordElement, record.id);

  return recordElement;
}

// Setup Rating Controls
function setupRating(element, recordId) {
  const commentModalElement = document.getElementById("commentModal");
  // Use the global commentModal instance instead of creating a new one
  const thumbsUp = element.querySelector(".thumbs-up");
  const thumbsDown = element.querySelector(".thumbs-down");
  let currentComment = "";
  let pendingAction = null;

  const modalCommentBox = document
    .getElementById("commentModal")
    .querySelector(".comment-box");
  const modalCharCount = document
    .getElementById("commentModal")
    .querySelector(".character-count");
  const saveCommentBtn = document
    .getElementById("commentModal")
    .querySelector(".save-comment");

  // Load existing rating
  try {
    const savedRating = localStorage.getItem(`rating_${recordId}`);
    if (savedRating) {
      const rating = JSON.parse(savedRating);
      if (rating.thumbs_up) thumbsUp.classList.add("active");
      if (rating.thumbs_down) thumbsDown.classList.add("active");

      // Handle the comment - it may be sanitized HTML entities
      currentComment = rating.comment || "";

      // Create a temporary element to decode HTML entities if needed
      if (
        currentComment.includes("&lt;") ||
        currentComment.includes("&gt;") ||
        currentComment.includes("&amp;") ||
        currentComment.includes("&quot;")
      ) {
        const tempElement = document.createElement("textarea");
        tempElement.innerHTML = currentComment;
        currentComment = tempElement.value;
      }
    }
  } catch (error) {
    console.error("Error loading rating:", error);
  }

  function updateCharCount(textArea, counter) {
    const count = textArea.value.length;
    counter.textContent = `${count}/300`;
  }

  function sanitizeInput(input) {
    // Basic sanitization to prevent XSS
    if (!input) return "";
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveRating(action) {
    try {
      // Sanitize comment before storing
      const sanitizedComment = sanitizeInput(currentComment);

      const rating = {
        record_id: recordId,
        thumbs_up: action === "accept",
        thumbs_down: action === "reject",
        comment: sanitizedComment,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`rating_${recordId}`, JSON.stringify(rating));

      // Update UI
      thumbsUp.classList.toggle("active", action === "accept");
      thumbsDown.classList.toggle("active", action === "reject");
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  }

  function showCommentModal(action) {
    pendingAction = action;
    modalCommentBox.value = currentComment;
    updateCharCount(modalCommentBox, modalCharCount);
    commentModal.show(); // Using global commentModal instance
  }

  // Event Listeners for thumbs up/down
  thumbsUp.addEventListener("click", () => {
    showCommentModal("accept");
  });

  thumbsDown.addEventListener("click", () => {
    showCommentModal("reject");
  });

  // Comment modal event listeners
  modalCommentBox.addEventListener("input", () => {
    updateCharCount(modalCommentBox, modalCharCount);
  });

  saveCommentBtn.addEventListener("click", () => {
    const comment = modalCommentBox.value.trim();
    if (!comment) {
      // Remove any existing validation message
      const existingFeedback =
        commentModalElement.querySelector(".invalid-feedback");
      if (existingFeedback) {
        existingFeedback.remove();
      }

      // Add validation styling to the textarea
      modalCommentBox.classList.add("is-invalid");

      // Create and append validation message
      const feedbackElement = document.createElement("div");
      feedbackElement.className = "invalid-feedback";
      feedbackElement.style.display = "block"; // Ensure it's visible
      feedbackElement.textContent = "Please add a comment before proceeding.";
      modalCommentBox.parentNode.appendChild(feedbackElement);

      // Remove validation styling when user starts typing
      const removeValidation = () => {
        modalCommentBox.classList.remove("is-invalid");
        const feedback = commentModalElement.querySelector(".invalid-feedback");
        if (feedback) {
          feedback.remove();
        }
        modalCommentBox.removeEventListener("input", removeValidation);
      };

      modalCommentBox.addEventListener("input", removeValidation);
      return;
    }
    // Additional validation for maximum length
    if (comment.length > 300) {
      // Show validation message for exceeding max length
      const existingFeedback =
        commentModalElement.querySelector(".invalid-feedback");
      if (existingFeedback) {
        existingFeedback.remove();
      }

      modalCommentBox.classList.add("is-invalid");

      const feedbackElement = document.createElement("div");
      feedbackElement.className = "invalid-feedback";
      feedbackElement.style.display = "block";
      feedbackElement.textContent =
        "Comment exceeds maximum length of 300 characters.";
      modalCommentBox.parentNode.appendChild(feedbackElement);
      return;
    }

    currentComment = comment;
    saveRating(pendingAction);
    commentModal.hide(); // Using global commentModal instance
  });

  // Handle modal close
  document
    .getElementById("commentModal")
    .addEventListener("hidden.bs.modal", () => {
      if (!currentComment) {
        // Reset buttons if no comment was saved
        thumbsUp.classList.remove("active");
        thumbsDown.classList.remove("active");
      }
    });
}
