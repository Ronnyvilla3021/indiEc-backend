const express = require("express")
const Group = require("../models/sql/Group")
const GroupDetails = require("../models/mongo/GroupDetails")
const { authenticateToken } = require("../middleware/auth")
const { validate, schemas } = require("../middleware/validation")
const upload = require("../utils/fileUpload")
const logger = require("../config/logger")

const router = express.Router()

// Obtener todos los grupos del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { count, rows } = await Group.findAndCountAll({
      where: { user_id: req.user.id },
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["created_at", "DESC"]],
    })

    const groupsWithDetails = await Promise.all(
      rows.map(async (group) => {
        const details = await GroupDetails.findOne({ group_id: group.id })
        return {
          ...group.toJSON(),
          details: details || {},
        }
      }),
    )

    res.json({
      success: true,
      data: groupsWithDetails,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    logger.error("Error al obtener grupos:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Crear nuevo grupo
router.post("/", authenticateToken, validate(schemas.group), async (req, res) => {
  try {
    const { nombre_grupo, genero_musical } = req.body

    const group = await Group.create({
      nombre_grupo,
      genero_musical,
      user_id: req.user.id,
    })

    await GroupDetails.create({
      group_id: group.id,
    })

    logger.info(`Grupo creado: ${nombre_grupo} por usuario ID: ${req.user.id}`)

    res.status(201).json({
      success: true,
      message: "Grupo creado exitosamente",
      data: group,
    })
  } catch (error) {
    logger.error("Error al crear grupo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Obtener grupo por ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const group = await Group.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      })
    }

    const details = await GroupDetails.findOne({ group_id: group.id })

    res.json({
      success: true,
      data: {
        ...group.toJSON(),
        details: details || {},
      },
    })
  } catch (error) {
    logger.error("Error al obtener grupo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Actualizar grupo
router.put("/:id", authenticateToken, validate(schemas.group), async (req, res) => {
  try {
    const { nombre_grupo, genero_musical } = req.body

    const [updatedRows] = await Group.update(
      { nombre_grupo, genero_musical },
      { where: { id: req.params.id, user_id: req.user.id } },
    )

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      })
    }

    logger.info(`Grupo actualizado ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Grupo actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar grupo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Eliminar grupo
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedRows = await Group.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      })
    }

    await GroupDetails.deleteOne({ group_id: req.params.id })

    logger.info(`Grupo eliminado ID: ${req.params.id} por usuario ID: ${req.user.id}`)

    res.json({
      success: true,
      message: "Grupo eliminado exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar grupo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Subir imagen para grupo
router.post("/:id/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo",
      })
    }

    const group = await Group.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Grupo no encontrado",
      })
    }

    const photoPath = `/uploads/${req.file.filename}`

    await GroupDetails.findOneAndUpdate({ group_id: req.params.id }, { foto: photoPath }, { upsert: true, new: true })

    logger.info(`Imagen actualizada para grupo ID: ${req.params.id}`)

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
