const winston = require("winston");
const path = require("path");
const fs = require("fs");
const config = require("../../key");

const logDir = path.join(__dirname, "../../logs");

// Crear el directorio de logs si no existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Función para formatear la fecha y hora local (ej: "04/07/2025 10:28:20")
const timezoned = () => {
  const date = new Date();
  return date.toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

// Formato personalizado para los logs
const customFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return JSON.stringify({
    level,
    message,
    timestamp: timezoned(),
    ...(stack && { stack })
  });
});

// Crear el logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "api.log"),
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// Mostrar en consola si estamos en desarrollo
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
