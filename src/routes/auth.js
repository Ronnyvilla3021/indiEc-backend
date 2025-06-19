// src/routes/auth.js - Rutas de autenticación con encriptación completa
const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongo/UserDetails")
const { hashPassword, comparePassword } = require("../utils/encryption")
const { validate, schemas } = require("../middleware/validation")
const { SecurityAuditor } = require("../utils/securityAudit")
const logger = require("../config/logger")

const router = express.Router()

// Registro de usuario
router.post("/register", validate(schemas.register), async (req, res) => {
  try {
    const { email, password, nombres, apellidos, genero, fecha } = req.body
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'

    // Verificar si el usuario ya existe (usando búsqueda por hash)
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      await SecurityAuditor.logAction({
        userId: null,
        action: 'REGISTRATION_FAILED_EMAIL_EXISTS',
        resourceType: 'USER',
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: { 
          email_attempted: email,
          timestamp: new Date()
        },
        riskLevel: 'MEDIUM'
      })
      
      logger.warn(`Intento de registro con email existente: ${email}`)
      
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      })
    }

    // Crear usuario (la encriptación ocurre automáticamente por hooks)
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email, // Se encriptará automáticamente en beforeCreate
      password_hash: hashedPassword,
      nombres, // Se encriptará automáticamente
      apellidos, // Se encriptará automáticamente
      genero,
      fecha,
    })

    // Crear detalles del usuario en MongoDB
    await UserDetails.create({
      user_id: user.id,
    })

    // Auditar registro exitoso
    await SecurityAuditor.logAction({
      userId: user.id,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: user.id.toString(),
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: {
        email: email, // Email sin encriptar para auditoría
        registration_date: new Date()
      },
      riskLevel: 'LOW'
    })

    logger.info(`Usuario registrado exitosamente: ${email} (ID: ${user.id})`)

    // Devolver datos sin encriptar (ya desencriptados por hook afterFind)
    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id: user.id,
        email: user.email, // Ya desencriptado por hook
        nombres: user.nombres, // Ya desencriptado por hook
        apellidos: user.apellidos, // Ya desencriptado por hook
      },
    })
  } catch (error) {
    logger.error("Error en registro:", error)

    // Auditar error en registro
    await SecurityAuditor.logAction({
      userId: null,
      action: 'REGISTRATION_ERROR',
      resourceType: 'USER',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { 
        error: error.message,
        email_attempted: req.body.email
      },
      riskLevel: 'HIGH'
    })

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Login de usuario
router.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'

    // Buscar usuario por email encriptado
    const user = await User.findByEmail(email)
    if (!user) {
      await SecurityAuditor.logAction({
        userId: null,
        action: 'LOGIN_FAILED_USER_NOT_FOUND',
        resourceType: 'USER',
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: { 
          email_attempted: email,
          timestamp: new Date()
        },
        riskLevel: 'MEDIUM'
      })

      logger.warn(`Intento de login con usuario inexistente: ${email}`)

      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password_hash)
    if (!isValidPassword) {
      await SecurityAuditor.logAction({
        userId: user.id,
        action: 'LOGIN_FAILED_WRONG_PASSWORD',
        resourceType: 'USER',
        resourceId: user.id.toString(),
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: {
          email: email,
          timestamp: new Date()
        },
        riskLevel: 'HIGH'
      })

      logger.warn(`Login fallido por contraseña incorrecta: ${email} (ID: ${user.id})`)

      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Verificar que el usuario esté activo
    if (!user.estado) {
      await SecurityAuditor.logAction({
        userId: user.id,
        action: 'LOGIN_FAILED_USER_INACTIVE',
        resourceType: 'USER',
        resourceId: user.id.toString(),
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: {
          email: email,
          timestamp: new Date()
        },
        riskLevel: 'MEDIUM'
      })

      logger.warn(`Login fallido por usuario inactivo: ${email} (ID: ${user.id})`)

      return res.status(401).json({
        success: false,
        message: "Usuario inactivo",
      })
    }

    // Generar token JWT (usando email desencriptado)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email // Ya desencriptado por hook
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    )

    // Auditar login exitoso
    await SecurityAuditor.logAction({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id.toString(),
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: {
        email: user.email, // Email desencriptado para auditoría
        login_time: new Date()
      },
      riskLevel: 'LOW'
    })

    logger.info(`Usuario logueado exitosamente: ${user.email} (ID: ${user.id})`)

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: user.getSafeData() // Método que devuelve datos seguros
      },
    })
  } catch (error) {
    logger.error("Error en login:", error)

    // Auditar error en login
    await SecurityAuditor.logAction({
      userId: null,
      action: 'LOGIN_ERROR',
      resourceType: 'USER',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { 
        error: error.message,
        email_attempted: req.body.email
      },
      riskLevel: 'HIGH'
    })

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Verificar token
router.post("/verify-token", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token requerido",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)

    if (!user || !user.estado) {
      await SecurityAuditor.logAction({
        userId: decoded.userId || null,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'USER',
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: {
          reason: 'Invalid or inactive user in token verification',
          token_user_id: decoded.userId
        },
        riskLevel: 'HIGH'
      })

      return res.status(401).json({
        success: false,
        message: "Token inválido",
      })
    }

    // Auditar verificación de token exitosa
    await SecurityAuditor.logAction({
      userId: user.id,
      action: 'TOKEN_REFRESH',
      resourceType: 'USER',
      resourceId: user.id.toString(),
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: {
        verification_time: new Date()
      },
      riskLevel: 'LOW'
    })

    res.json({
      success: true,
      message: "Token válido",
      data: {
        user: user.getSafeData()
      },
    })
  } catch (error) {
    logger.error("Error en verificación de token:", error)

    let riskLevel = 'MEDIUM'
    let action = 'UNAUTHORIZED_ACCESS_ATTEMPT'

    if (error.name === "TokenExpiredError") {
      riskLevel = 'LOW'
      action = 'TOKEN_EXPIRED'
      
      await SecurityAuditor.logAction({
        userId: null,
        action,
        resourceType: 'USER',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent'),
        details: { error: 'Token expired' },
        riskLevel
      })

      return res.status(401).json({
        success: false,
        message: "Token expirado",
      })
    }

    await SecurityAuditor.logAction({
      userId: null,
      action,
      resourceType: 'USER',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { 
        error: error.message,
        error_type: error.name
      },
      riskLevel
    })

    return res.status(403).json({
      success: false,
      message: "Token inválido",
    })
  }
})

// Cambiar contraseña
router.post("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    const { currentPassword, newPassword } = req.body
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token requerido",
      })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual y nueva contraseña son requeridas",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)

    if (!user || !user.estado) {
      return res.status(401).json({
        success: false,
        message: "Usuario no válido",
      })
    }

    // Verificar contraseña actual
    const isValidPassword = await comparePassword(currentPassword, user.password_hash)
    if (!isValidPassword) {
      await SecurityAuditor.logAction({
        userId: user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        resourceType: 'USER',
        resourceId: user.id.toString(),
        ipAddress,
        userAgent: req.get('User-Agent'),
        details: {
          reason: 'Invalid current password',
          timestamp: new Date()
        },
        riskLevel: 'HIGH'
      })

      return res.status(401).json({
        success: false,
        message: "Contraseña actual incorrecta",
      })
    }

    // Actualizar contraseña
    const newHashedPassword = await hashPassword(newPassword)
    await user.update({ password_hash: newHashedPassword })

    // Auditar cambio de contraseña exitoso
    await SecurityAuditor.logAction({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      resourceType: 'USER',
      resourceId: user.id.toString(),
      ipAddress,
      userAgent: req.get('User-Agent'),
      details: {
        change_time: new Date()
      },
      riskLevel: 'MEDIUM'
    })

    logger.info(`Contraseña cambiada para usuario: ${user.email} (ID: ${user.id})`)

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    })
  } catch (error) {
    logger.error("Error en cambio de contraseña:", error)

    await SecurityAuditor.logAction({
      userId: null,
      action: 'PASSWORD_CHANGE_FAILED',
      resourceType: 'USER',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent'),
      details: { 
        error: error.message,
        error_type: error.name
      },
      riskLevel: 'HIGH'
    })

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router