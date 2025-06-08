import { getConfig } from "../config.js";

class ApiService {
  constructor() {
    this.config = null;
  }

  async ensureConfig() {
    if (!this.config) {
      this.config = await getConfig();
    }
    return this.config;
  }

  async fetchData(endpoint, timeout = 15000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const config = await this.ensureConfig();
      const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        headers: {
          Accept: "application/json; charset=utf-8",
          Authorization: `Bearer ${config.apiToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear timeout if request completes

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      console.error("API request failed:", error);
      throw error;
    }
  }

  async postData(endpoint, data) {
    try {
      const config = await this.ensureConfig();
      const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json; charset=utf-8",
          Authorization: `Bearer ${config.apiToken}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw { status: response.status, ...responseData };
      }

      return responseData;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new ApiService();
