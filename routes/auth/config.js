import express from "express";

const router = express.Router();

router.get("/config", async (req, res) => {
  // Get token from request headers
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // If we have a token, return the config
  res.json({
    apiBaseUrl: process.env.API_BASE_URL,
    apiToken: process.env.API_TOKEN,
    frontendBaseUrl: process.env.FRONTEND_BASE_URL,
  });
});

export default router;
