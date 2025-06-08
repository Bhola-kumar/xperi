const AUTH_TIMEOUT_MS = 5000; // 5 second timeout

export async function authorizeUser() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

    const response = await fetch("https://llmfoundry.straive.com/token", {
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const { email, token } = await response.json();

    if (!token) {
      console.log("User not logged in...");
      redirectToLogin();
      return null;
    }

    console.log(email);
    return email;
  } catch (error) {
    console.error("Error authorizing user:", error);

    // Handle specific error types
    if (error.name === "AbortError") {
      console.error("Authorization request timed out");
      showAuthError(
        "Authorization service is currently unavailable. Please try again later.",
      );
    } else if (
      error.name === "TypeError" &&
      error.message.includes("Failed to fetch")
    ) {
      console.error("Authorization service is offline");
      showAuthError(
        "Unable to connect to the authorization service. Please check your connection and try again.",
      );
    } else {
      showAuthError(
        "An error occurred during authorization. Please try again later.",
      );
    }

    return null;
  }
}

function redirectToLogin() {
  try {
    // Try to get the frontend base URL from global config if available
    let BASE_URL;

    // Check if we have a global config with frontendBaseUrl
    if (window.appConfig && window.appConfig.frontendBaseUrl) {
      BASE_URL = window.appConfig.frontendBaseUrl;
    } else {
      // Fallback to window.location.origin if config is not available
      BASE_URL = window.location.origin;
      console.log("Using fallback BASE_URL:", BASE_URL);
    }

    const defaultRedirect = `${BASE_URL}/dashboard`;
    const loginUrl = new URL("https://llmfoundry.straive.com/login");
    loginUrl.search = new URLSearchParams({ next: defaultRedirect }).toString();
    window.location.href = loginUrl.toString();
  } catch (error) {
    console.error("Error redirecting to login:", error);
    // Fallback redirect
    window.location.href = "https://llmfoundry.straive.com/login";
  }
}

function showAuthError(message) {
  // Create error modal if it doesn't exist
  let errorModal = document.getElementById("authErrorModal");
  if (!errorModal) {
    const modalHtml = `
      <div class="modal fade" id="authErrorModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Authorization Error</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p id="authErrorMessage"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" onclick="location.reload()">Retry</button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    errorModal = document.getElementById("authErrorModal");
  }

  // Set error message and show modal
  document.getElementById("authErrorMessage").textContent = message;
  const bsModal = new window.bootstrap.Modal(errorModal);
  bsModal.show();
}
