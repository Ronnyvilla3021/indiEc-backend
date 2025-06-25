const winston = require("winston");
const path = require("path");
const config = require("../../key");

const logDir = path.join(__dirname, "../../logs");

// Asegúrate de que el directorio de logs exista
const fs = require("fs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "api.log"),
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// En desarrollo, también mostrar logs en consola
if (config.NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;
