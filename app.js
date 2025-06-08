import { config } from "dotenv";
import { resolve, dirname } from "path";
import express from "express";
import { fileURLToPath } from "url";
import comparisonRouter from "./routes/data_accuracy/comparison.js";
import jobsRouter from "./routes/data_accuracy/jobs.js";
import configRouter from "./routes/auth/config.js";
import sourcesRouter from "./routes/data_accuracy/sources.js";

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || "development";
config({
  path: resolve(process.cwd(), `.env.${env}`),
});

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("data"));
app.set("view engine", "ejs");
app.set("views", resolve(__dirname, "views"));

// Make current environment available to all templates
app.use((req, res, next) => {
  res.locals.currentEnv = env;
  next();
});

// Routes
app.get("/", (req, res) => {
  res.render("login");
});

app.get("/dashboard", (req, res) => {
  res.render("landing_page/main");
});

// Config route
app.use("/api/auth", configRouter);

// Not implemented middleware
const notImplementedHandler = (req, res) => {
  res.status(501).render("not_implemented", {
    title: "Not Implemented",
    message: "This feature is coming soon.",
    error: {},
    redirectUrl: "/dashboard",
    redirectDelay: 3000,
  });
};

// Data Accuracy routes
app.use("/data-accuracy/comparison", comparisonRouter);
app.use("/data-accuracy/jobs", jobsRouter);
app.use("/data-accuracy/sources", sourcesRouter);

app.get("/auth/logout", (req, res) => {
  res.render("login");
});

// Not implemented routes
app.get("/validation", notImplementedHandler);
app.get("/mail-management", notImplementedHandler);
app.get("/matching", notImplementedHandler);
app.get("/preprocessing", notImplementedHandler);
app.get("/virtual-assistant", notImplementedHandler);

// Handle 404 - show error page with redirection
app.use((req, res) => {
  res.status(404).render("partials/error", {
    title: "404 Not Found",
    message: "The page you're looking for doesn't exist.",
    error: {},
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).render("partials/error", {
    title: "Error",
    message: "Something went wrong. Please try again.",
    error: process.env.NODE_ENV === "development" ? err : {},
    redirectUrl: "/dashboard",
    redirectDelay: 3000,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
