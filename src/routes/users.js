const express = require("express")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongo/UserDetails")
const { authenticateToken } = require("../middleware/auth")
const upload = require("../utils/fileUpload")
const logger = require("../config/logger")

const router = express.Router()

// Obtener perfil del usuario autenticado
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user
    const userDetails = await UserDetails.findOne({ user_id: user.id })

    res.json({
      success: true,
      data: {
        ...user.toJSON(),
        details: userDetails || {},
      },
    })
  } catch (error) {
    logger.error("Error al obtener perfil:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Actualizar perfil del usuario
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { nombres, apellidos, genero, telefono, ubicacion, bio } = req.body
    const userId = req.user.id

    // Actualizar datos en MySQL
    await User.update({ nombres, apellidos, genero }, { where: { id: userId } })

    // Actualizar detalles en MongoDB
    await UserDetails.findOneAndUpdate({ user_id: userId }, { telefono, ubicacion, bio }, { upsert: true, new: true })

    logger.info(`Perfil actualizado para usuario ID: ${userId}`)

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar perfil:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Subir foto de perfil
router.post("/profile/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      })
    }

    const userId = req.user.id
    const photoPath = `/uploads/${req.file.filename}`

    // Actualizar ruta de la foto en MongoDB
    await UserDetails.findOneAndUpdate({ user_id: userId }, { foto: photoPath }, { upsert: true, new: true })

    logger.info(`Foto de perfil actualizada para usuario ID: ${userId}`)

    res.json({
      success: true,
      message: "Foto de perfil actualizada exitosamente",
      data: { photoPath },
    })
  } catch (error) {
    logger.error("Error al subir foto:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router
