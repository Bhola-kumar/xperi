import winston from "winston";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: join(__dirname, "../logs/error.log"),
      level: "error",
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: join(__dirname, "../logs/combined.log"),
    }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
