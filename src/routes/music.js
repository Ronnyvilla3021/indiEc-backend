const express = require("express")
const Music = require("../models/sql/Music")
const MusicDetails = require("../models/mongo/MusicDetails")
const { authenticateToken } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const upload = require("../utils/fileUpload")
const logger = require("../config/logger")

const router = express.Router()

// Obtener todas las canciones del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { count, rows } = await Music.findAndCountAll({
      where: { user_id: req.user.id },
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["created_at", "DESC"]],
    })

    // Obtener detalles de MongoDB para cada canción
    const musicWithDetails = await Promise.all(
      rows.map(async (music) => {
        const details = await MusicDetails.findOne({ music_id: music.id })
        return {
          ...music.toJSON(),
          details: details || {},
        }
      }),
    )

    res.json({
      success: true,
      data: musicWithDetails,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    logger.error("Error al obtener música:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Crear nueva canción
router.post("/", authenticateToken, validate(schemas.music), async (req, res) => {
  try {
    const { titulo, album, duracion, año, genero } = req.body

    const music = await Music.create({
      titulo,
      album,
      duracion,
      año,
      genero,
      user_id: req.user.id,
    })

    // Crear detalles en MongoDB
    await MusicDetails.create({
      music_id: music.id,
    })

    logger.info(`Canción creada: ${titulo} por usuario ID: ${req.user.id}`)

    res.status(201).json({
      success: true,
      message: "Canción creada exitosamente",
      data: music,
    })
  } catch (error) {
    logger.error("Error al crear canción:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Obtener canción por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const music = await Music.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Canción no encontrada",
      })
    }

    const details = await MusicDetails.findOne({ music_id: music.id })

    res.json({
      success: true,
      data: {
        ...music.toJSON(),
        details: details || {},
      },
    })
  } catch (error) {
    logger.error("Error al obtener canción:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Actualizar canción
router.put("/:id", authenticateToken, validate(schemas.music), async (req, res) => {
  try {
    const { titulo, album, duracion, año, genero } = req.body

    const [updatedRows] = await Music.update(
      { titulo, album, duracion, año, genero },
      { where: { id: req.params.id, user_id: req.user.id } },
    )

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Canción no encontrada",
      })
    }

    logger.info(`Canción actualizada ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Canción actualizada exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar canción:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Eliminar canción
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedRows = await Music.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Canción no encontrada",
      })
    }

    // Eliminar detalles de MongoDB
    await MusicDetails.deleteOne({ music_id: req.params.id })

    logger.info(`Canción eliminada ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Canción eliminada exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar canción:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Subir imagen para canción
router.post("/:id/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      })
    }

    const music = await Music.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!music) {
      return res.status(404).json({
        success: false,
        message: "Canción no encontrada",
      })
    }

    const photoPath = `/uploads/${req.file.filename}`

    await MusicDetails.findOneAndUpdate({ music_id: req.params.id }, { foto: photoPath }, { upsert: true, new: true })

    logger.info(`Imagen actualizada para canción ID: ${req.params.id}`)

    res.json({
      success: true,
      message: "Imagen actualizada exitosamente",
      data: { photoPath },
    })
  } catch (error) {
    logger.error("Error al subir imagen:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router
