const logger = require("../config/logger")

const errorHandler = (err, req, res, next) => {
  logger.error("Error no manejado:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Error de validación de Sequelize
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors: err.errors.map((error) => ({
        field: error.path,
        message: error.message,
      })),
    })
  }

  // Error de clave única de Sequelize
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "El recurso ya existe",
      field: err.errors[0]?.path,
    })
  }

  // Error de MongoDB
  if (err.name === "MongoError" || err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de base de datos",
      error: err.message,
    })
  }

  // Error por defecto
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  })
}

module.exports = errorHandler
