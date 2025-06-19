const logger = require("../config/logger")

const loggerMiddleware = (req, res, next) => {
  const start = Date.now()

  // Log de la petición
  logger.info("Petición HTTP", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: req.method !== "GET" ? sanitizeBody(req.body) : undefined,
  })

  // Interceptar la respuesta
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start

    logger.info("Respuesta HTTP", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })

    originalSend.call(this, data)
  }

  next()
}

// Función para sanitizar el body (remover passwords)
const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body

  const sanitized = { ...body }
  const sensitiveFields = ["password", "password_hash", "token"]

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]"
    }
  })

  return sanitized
}

module.exports = loggerMiddleware
