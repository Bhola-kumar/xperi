// Default configuration (will be overridden by server config)
const config = {
  development: {
    apiBaseUrl: null,
    apiToken: null,
  },
  uat: {
    apiBaseUrl: null,
    apiToken: null,
  },
  production: {
    apiBaseUrl: null,
    apiToken: null,
  },
};

// Determine current environment
console.log("Window ENV value:", window.ENV);
console.log("Hostname:", window.location.hostname);
const ENV =
  window.ENV ||
  (window.location.hostname === "localhost" ? "development" : "production");
console.log("Selected environment:", ENV);

// Fetch configuration from server
async function fetchConfig(token) {
  try {
    const response = await fetch("/api/auth/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load configuration");
    }
    const serverConfig = await response.json();
    return serverConfig;
  } catch (error) {
    console.error("Failed to fetch configuration:", error);
    throw error;
  }
}

// Export an async function that returns the configuration
export async function getConfig() {
  // First check authentication (reusing existing auth check)
  const { authorizeUser } = await import("/js/auth.js");
  const token = await authorizeUser();

  if (token) {
    // Get configuration from server using the token
    const serverConfig = await fetchConfig(token);
    // Update the environment config with server values
    config[ENV] = serverConfig;

    // Store config in global variable for access by other modules
    window.appConfig = config[ENV];

    return config[ENV];
  }
  throw new Error("User not authenticated");
}

// Export current environment for reference
export const currentEnv = ENV;
