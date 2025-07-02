const jwt = require("jsonwebtoken")
const UsuarioNuevo = require("../models/sql/UsuarioNuevo") // VERIFICAR QUE ESTE ARCHIVO EXISTA
const logger = require("../config/logger")
const config = require("../../key")

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      })
    }

    const decoded = jwt.verify(token, config.JWT.SECRET)
    const user = await UsuarioNuevo.findByPk(decoded.userId)

    if (!user || user.estado_id !== 1) { // VERIFICAR CAMPO estado_id
      return res.status(401).json({
        success: false,
        message: "Usuario no válido o inactivo",
      })
    }

    req.user = user
    next()
  } catch (error) {
    logger.error("Error en autenticación:", error)

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      })
    }

    return res.status(403).json({
      success: false,
      message: "Token inválido",
    })
  }
}

module.exports = { authenticateToken }