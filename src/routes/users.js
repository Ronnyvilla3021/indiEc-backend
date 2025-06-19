// src/routes/users.js - Rutas de usuario actualizadas con encriptación completa
const express = require("express")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongo/UserDetails")
const { authenticateToken } = require("../middleware/auth")
const { encryptionMiddleware, decryptionMiddleware, encryptMongoData, decryptMongoData } = require("../middleware/encryption")
const { SecurityAuditor } = require("../utils/securityAudit")
const upload = require("../utils/fileUpload")
const logger = require("../config/logger")

const router = express.Router()

// Aplicar middleware de desencriptación a todas las rutas
router.use(decryptionMiddleware('USER'))

// Obtener perfil del usuario autenticado
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = req.user
    let userDetails = await UserDetails.findOne({ user_id: user.id })
    
    // Desencriptar detalles del usuario
    if (userDetails) {
      userDetails = decryptMongoData(userDetails.toObject(), 'USER')
    }

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
    const ipAddress = req.ip || req.connection.remoteAddress

    // Auditar acceso a actualización de perfil
    await SecurityAuditor.logAction({
      userId,
      action: 'SENSITIVE_DATA_UPDATE',
      resourceType: 'USER',
      resourceId: userId.toString(),
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: { 
        fields_updated: Object.keys(req.body),
        has_sensitive_mysql: !!(nombres || apellidos),
        has_sensitive_mongo: !!(telefono || ubicacion || bio)
      },
      riskLevel: 'MEDIUM'
    })

    // Actualizar datos en MySQL (nombres y apellidos se encriptarán automáticamente)
    if (nombres !== undefined || apellidos !== undefined || genero !== undefined) {
      const updateData = {}
      if (nombres !== undefined) updateData.nombres = nombres
      if (apellidos !== undefined) updateData.apellidos = apellidos
      if (genero !== undefined) updateData.genero = genero
      
      await User.update(updateData, { where: { id: userId } })
    }

    // Encriptar y actualizar datos sensibles en MongoDB
    if (telefono !== undefined || ubicacion !== undefined || bio !== undefined) {
      const sensitiveData = {}
      if (telefono !== undefined) sensitiveData.telefono = telefono
      if (ubicacion !== undefined) sensitiveData.ubicacion = ubicacion
      if (bio !== undefined) sensitiveData.bio = bio
      
      const encryptedData = encryptMongoData(sensitiveData, 'USER')

      await UserDetails.findOneAndUpdate(
        { user_id: userId }, 
        encryptedData, 
        { upsert: true, new: true }
      )
    }

    logger.info(`Perfil actualizado para usuario ID: ${userId}`)

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
    })
  } catch (error) {
    logger.error("Error al actualizar perfil:", error)
    
    // Auditar error en actualización
    await SecurityAuditor.logAction({
      userId: req.user?.id,
      action: 'SENSITIVE_DATA_UPDATE_ERROR',
      resourceType: 'USER',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      details: { error: error.message },
      riskLevel: 'MEDIUM'
    })

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

    // Crear metadata encriptada del archivo
    const fileMetadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
      userId: userId
    }

    const encryptedMetadata = encryptMongoData(fileMetadata, 'USER')

    // Actualizar ruta de la foto en MongoDB
    await UserDetails.findOneAndUpdate(
      { user_id: userId }, 
      { 
        foto: photoPath,
        file_metadata: encryptedMetadata
      }, 
      { upsert: true, new: true }
    )

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

// Nueva ruta: Obtener configuración de privacidad
router.get("/privacy", authenticateToken, async (req, res) => {
  try {
    let userDetails = await UserDetails.findOne({ user_id: req.user.id })
    
    if (userDetails) {
      userDetails = decryptMongoData(userDetails.toObject(), 'USER')
    }

    const privacySettings = userDetails?.preferences?.privacy || {
      showPhone: false,
      showLocation: false,
      showBio: true,
      allowMessages: true
    }

    res.json({
      success: true,
      data: { privacy: privacySettings }
    })
  } catch (error) {
    logger.error("Error al obtener configuración de privacidad:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Nueva ruta: Actualizar configuración de privacidad
router.put("/privacy", authenticateToken, async (req, res) => {
  try {
    const { showPhone, showLocation, showBio, allowMessages } = req.body
    const userId = req.user.id

    const privacySettings = {
      showPhone: Boolean(showPhone),
      showLocation: Boolean(showLocation),
      showBio: Boolean(showBio),
      allowMessages: Boolean(allowMessages)
    }

    // Encriptar las preferencias
    const encryptedPreferences = encryptMongoData(
      { privacy: privacySettings }, 
      'USER'
    )

    await UserDetails.findOneAndUpdate(
      { user_id: userId },
      { $set: { 'preferences.privacy': encryptedPreferences.privacy } },
      { upsert: true, new: true }
    )

    logger.info(`Configuración de privacidad actualizada para usuario ID: ${userId}`)

    res.json({
      success: true,
      message: "Configuración de privacidad actualizada",
    })
  } catch (error) {
    logger.error("Error al actualizar privacidad:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Nueva ruta: Eliminar datos sensibles
router.delete("/profile/sensitive-data", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    // Eliminar datos sensibles específicos
    await UserDetails.findOneAndUpdate(
      { user_id: userId },
      { 
        $unset: { 
          telefono: "",
          ubicacion: "",
          bio: "",
          file_metadata: ""
        }
      },
      { new: true }
    )

    logger.info(`Datos sensibles eliminados para usuario ID: ${userId}`)

    res.json({
      success: true,
      message: "Datos sensibles eliminados exitosamente",
    })
  } catch (error) {
    logger.error("Error al eliminar datos sensibles:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Nueva ruta: Buscar usuarios por nombre
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query
    const userId = req.user.id
    const ipAddress = req.ip || req.connection.remoteAddress

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda debe tener al menos 2 caracteres"
      })
    }

    // Auditar búsqueda de usuarios
    await SecurityAuditor.logAction({
      userId,
      action: 'USER_SEARCH',
      resourceType: 'USER',
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: { search_term: q },
      riskLevel: 'LOW'
    })

    // Usar la función de búsqueda personalizada del modelo
    const offset = (page - 1) * limit
    const users = await User.searchByName(q, {
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      attributes: ['id', 'email', 'nombres', 'apellidos', 'genero', 'created_at']
    })

    // Obtener datos públicos sin información sensible completa
    const publicUsers = users.map(user => user.getPublicData())

    res.json({
      success: true,
      data: publicUsers,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: publicUsers.length,
        has_more: publicUsers.length === Number.parseInt(limit)
      }
    })
  } catch (error) {
    logger.error("Error en búsqueda de usuarios:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Nueva ruta: Obtener datos de auditoría del usuario
router.get("/audit-log", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, startDate, endDate } = req.query
    const userId = req.user.id

    const auditData = await SecurityAuditor.getAuditLog(userId, {
      action,
      startDate,
      endDate,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit)
    })

    res.json({
      success: true,
      data: auditData.logs,
      pagination: auditData.pagination
    })
  } catch (error) {
    logger.error("Error al obtener log de auditoría:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router