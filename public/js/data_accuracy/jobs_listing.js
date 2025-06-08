import apiService from "/js/services/apiService.js";
import { authorizeUser } from "/js/auth.js";
import { DATA_ACCURACY } from "/js/config/endpoints.js";
const { bootstrap } = window;

class JobsListingManager {
  constructor() {
    this.jobs = [];
    this.currentPage = 1;
    this.itemsPerPage = 25;
    this.filteredJobs = [];
    this.currentUserEmail = null;
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.loadingText = document.getElementById("loadingText");
    this.errorModal = new bootstrap.Modal(
      document.getElementById("errorModal"),
    );
    this.initializeUser();
    this.initializeSourceSelect();
    this.initializeEventListeners();
    this.loadJobs();
  }

  async initializeUser() {
    this.currentUserEmail = await authorizeUser();
  }

  initializeSourceSelect() {
    const sourceSelect = $("#sourceId");
    sourceSelect.select2({
      placeholder: "Search for a source...",
      allowClear: true,
      minimumInputLength: 1,
      ajax: {
        url: "/data-accuracy/sources/search",
        dataType: "json",
        delay: 250,
        data: function (params) {
          return {
            query: params.term,
            page: params.page || 1,
          };
        },
        processResults: function (data) {
          return {
            results: data.sources.map((source) => ({
              id: source.source_id,
              text: `${source.source_id} | ${source.source_name} | ${source.source_long_name}`,
            })),
            pagination: {
              more: data.hasMore,
            },
          };
        },
        cache: true,
      },
    });

    // Handle clear event
    sourceSelect.on("select2:clear", () => {
      this.applyFilters();
    });
  }

  initializeEventListeners() {
    document.getElementById("filterForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.applyFilters();
    });

    document.getElementById("filterForm").addEventListener("reset", () => {
      $("#sourceId").val(null).trigger("change");
      setTimeout(() => this.applyFilters(), 0);
    });

    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadJobs();
    });

    document.getElementById("pageSize").addEventListener("change", (e) => {
      this.itemsPerPage = parseInt(e.target.value);
      this.currentPage = 1;
      this.renderJobs();
    });

    document
      .getElementById("jobsTableBody")
      .addEventListener("click", async (e) => {
        const row = e.target.closest("tr");
        if (row) {
          const jobId = row.dataset.jobId;
          const isLocked = row.dataset.locked === "true";
          const lockedBy = row.dataset.lockedBy || "Unknown";

          if (isLocked) {
            document.getElementById("lockToastMessage").innerHTML =
              `This job is locked by <strong>${lockedBy}</strong>`;
            const toast = new bootstrap.Toast(
              document.getElementById("lockToast"),
            );
            toast.show();
            return;
          }

          // Try to lock the job before navigating
          await this.lockJob(jobId, row);
        }
      });
  }

  showLoading() {
    this.loadingText.textContent = "Loading Jobs...";
    this.loadingOverlay.classList.remove("hidden");
  }

  hideLoading() {
    this.loadingOverlay.classList.add("hidden");
  }

  showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    this.errorModal.show();
  }

  async loadJobs() {
    try {
      this.showLoading();
      const data = await apiService.fetchData(DATA_ACCURACY.JOBS.ALL);
      this.jobs = data.jobs;
      this.applyFilters();
    } catch (error) {
      console.error("Error loading jobs:", error);
      this.hideLoading();
      this.showError("Failed to load records. Please try again later.");
    } finally {
      this.hideLoading();
    }
  }

  applyFilters() {
    const sourceId = $("#sourceId").val();
    const broadcastStartDate =
      document.getElementById("broadcastStartDate").value;
    const broadcastEndDate = document.getElementById("broadcastEndDate").value;
    const creationDate = document.getElementById("creationDate").value;

    this.filteredJobs = this.jobs.filter((job) => {
      if (sourceId && job.source_id !== parseInt(sourceId)) return false;

      if (
        broadcastStartDate &&
        job.broadcast_dates.start_date < broadcastStartDate
      )
        return false;
      if (broadcastEndDate && job.broadcast_dates.end_date > broadcastEndDate)
        return false;

      if (creationDate) {
        const jobDate = job.created_at.split("T")[0];
        if (jobDate !== creationDate) return false;
      }

      return true;
    });

    this.currentPage = 1;
    this.renderJobs();
  }

  async lockJob(jobId, row) {
    try {
      // Show loading state on the specific row
      row.classList.add("loading");

      await apiService.postData(DATA_ACCURACY.JOBS.LOCK, {
        job_id: jobId,
        reviewer_id: this.currentUserEmail,
      });

      // Update the UI to show the job is now locked
      row.dataset.locked = "true";
      row.dataset.lockedBy = this.currentUserEmail;
      row.classList.add("locked");
      const lockIcon = row.querySelector("td:last-child i");
      if (lockIcon) {
        lockIcon.className = "bi bi-lock-fill text-danger";
        lockIcon.title = `Locked by ${this.currentUserEmail}`;
      }

      // Open comparison page in new window
      const url = new URL("/data-accuracy/comparison", window.location.origin);
      url.searchParams.set("jobId", jobId);
      window.open(url.toString(), "_blank");
    } catch (error) {
      if (error.status === 400) {
        // Job is already locked by someone
        document.getElementById("lockToastMessage").innerHTML =
          `This job is locked by <strong>${error.details.reviewer_id}</strong>`;
        const toast = new bootstrap.Toast(document.getElementById("lockToast"));
        toast.show();

        // Update the UI to reflect the current lock state
        row.dataset.locked = "true";
        row.dataset.lockedBy = error.details.reviewer_id;
        row.classList.add("locked");
        const lockIcon = row.querySelector("td:last-child i");
        if (lockIcon) {
          lockIcon.className = "bi bi-lock-fill text-danger";
          lockIcon.title = `Locked by ${error.details.reviewer_id}`;
        }
      } else {
        // Other error occurred
        alert("Failed to lock job. Please try again later.");
      }
    } finally {
      row.classList.remove("loading");
    }
  }

  renderJobs() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedJobs = this.filteredJobs.slice(startIndex, endIndex);

    const tbody = document.getElementById("jobsTableBody");
    tbody.innerHTML = paginatedJobs
      .map(
        (job) => `
            <tr class="job-row ${job.locked ? "locked" : ""}" data-job-id="${job.job_id}" data-locked="${job.locked}" data-locked-by="${job.locked_by || ""}">
                <td>${job.job_id}</td>
                <td>${job.source_id}</td>
                <td>${job.broadcast_dates.start_date} ${job.broadcast_dates.start_time}</td>
                <td>${job.broadcast_dates.end_date} ${job.broadcast_dates.end_time}</td>
                <td><span class="badge bg-${job.status === "pending" ? "warning" : "success"}">${job.status}</span></td>
                <td>${new Date(job.created_at).toLocaleString()}</td>
                <td><i class="bi ${job.locked ? "bi-lock-fill text-danger" : "bi-unlock-fill text-success"}" title="${job.locked ? `Locked by ${job.locked_by || "Unknown"}` : "Unlocked"}"></i></td>
            </tr>
        `,
      )
      .join("");

    this.updatePagination();
    this.updatePaginationInfo(startIndex, endIndex);
  }

  createNavigationButton(page, text, isDisabled = false) {
    return `
      <li class="page-item ${isDisabled ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${page}">${text}</a>
      </li>
    `;
  }

  createPageNumberButton(pageNum, isActive = false) {
    return `
      <li class="page-item ${isActive ? "active" : ""}">
        <a class="page-link" href="#" data-page="${pageNum}">${pageNum}</a>
      </li>
    `;
  }

  createEllipsisButton() {
    return `
      <li class="page-item disabled">
        <span class="page-link">...</span>
      </li>
    `;
  }

  shouldShowPageNumber(pageNum, totalPages) {
    return (
      pageNum === 1 ||
      pageNum === totalPages ||
      (pageNum >= this.currentPage - 2 && pageNum <= this.currentPage + 2)
    );
  }

  generatePaginationButtons(totalPages) {
    let buttons = [];

    // Previous button
    buttons.push(
      this.createNavigationButton(
        this.currentPage - 1,
        "Previous",
        this.currentPage === 1,
      ),
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (this.shouldShowPageNumber(i, totalPages)) {
        buttons.push(this.createPageNumberButton(i, i === this.currentPage));
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        buttons.push(this.createEllipsisButton());
      }
    }

    // Next button
    buttons.push(
      this.createNavigationButton(
        this.currentPage + 1,
        "Next",
        this.currentPage === totalPages,
      ),
    );

    return buttons.join("");
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredJobs.length / this.itemsPerPage);
    const pagination = document.getElementById("pagination");

    pagination.innerHTML = this.generatePaginationButtons(totalPages);

    // Add click event listeners to pagination items
    pagination.querySelectorAll(".page-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page);
        if (!isNaN(page) && page !== this.currentPage) {
          this.currentPage = page;
          this.renderJobs();
        }
      });
    });
  }

  updatePaginationInfo(startIndex, endIndex) {
    document.getElementById("startRange").textContent = this.filteredJobs.length
      ? startIndex + 1
      : 0;
    document.getElementById("endRange").textContent = Math.min(
      endIndex,
      this.filteredJobs.length,
    );
    document.getElementById("totalItems").textContent =
      this.filteredJobs.length;
  }
}

// Initialize the manager when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new JobsListingManager();
});
