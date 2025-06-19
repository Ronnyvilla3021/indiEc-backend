const express = require("express")
const Album = require("../models/sql/Album")
const AlbumDetails = require("../models/mongo/AlbumDetails")
const { authenticateToken } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const upload = require("../utils/fileUpload")
const logger = require("../config/logger")

const router = express.Router()

// Obtener todos los álbumes del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { count, rows } = await Album.findAndCountAll({
      where: { user_id: req.user.id },
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["created_at", "DESC"]],
    })

    const albumsWithDetails = await Promise.all(
      rows.map(async (album) => {
        const details = await AlbumDetails.findOne({ album_id: album.id })
        return {
          ...album.toJSON(),
          details: details || {},
        }
      }),
    )

    res.json({
      success: true,
      data: albumsWithDetails,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    logger.error("Error al obtener álbumes:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Crear nuevo álbum
router.post("/", authenticateToken, validate(schemas.album), async (req, res) => {
  try {
    const { titulo, artista, año, genero } = req.body

    const album = await Album.create({
      titulo,
      artista,
      año,
      genero,
      user_id: req.user.id,
    })

    await AlbumDetails.create({
      album_id: album.id,
    })

    logger.info(`Álbum creado: ${titulo} por usuario ID: ${req.user.id}`)

    res.status(201).json({
      success: true,
      message: "Álbum creado exitosamente",
      data: album,
    })
  } catch (error) {
    logger.error("Error al crear álbum:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Obtener álbum por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const album = await Album.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Álbum no encontrado",
      })
    }

    const details = await AlbumDetails.findOne({ album_id: album.id })

    res.json({
      success: true,
      data: {
        ...album.toJSON(),
        details: details || {},
      },
    })
  } catch (error) {
    logger.error("Error al obtener álbum:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Actualizar álbum
router.put("/:id", authenticateToken, validate(schemas.album), async (req, res) => {
  try {
    const { titulo, artista, año, genero } = req.body

    const [updatedRows] = await Album.update(
      { titulo, artista, año, genero },
      { where: { id: req.params.id, user_id: req.user.id } },
    )

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Álbum no encontrado",
      })
    }

    logger.info(`Álbum actualizado ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Álbum actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar álbum:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Eliminar álbum
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedRows = await Album.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Álbum no encontrado",
      })
    }

    await AlbumDetails.deleteOne({ album_id: req.params.id })

    logger.info(`Álbum eliminado ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Álbum eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar álbum:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Subir imagen para álbum
router.post("/:id/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      })
    }

    const album = await Album.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Álbum no encontrado",
      })
    }

    const photoPath = `/uploads/${req.file.filename}`

    await AlbumDetails.findOneAndUpdate({ album_id: req.params.id }, { foto: photoPath }, { upsert: true, new: true })

    logger.info(`Imagen actualizada para álbum ID: ${req.params.id}`)

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
