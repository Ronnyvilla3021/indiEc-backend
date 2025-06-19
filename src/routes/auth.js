const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/sql/User")
const UserDetails = require("../models/mongo/UserDetails")
const { hashPassword, comparePassword } = require("../utils/encryption")
const { validate, schemas } = require("../middleware/validation")
const logger = require("../config/logger")

const router = express.Router()

// Registro de usuario
router.post("/register", validate(schemas.register), async (req, res) => {
  try {
    const { email, password, nombres, apellidos, genero, fecha } = req.body

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El email ya está registrado",
      })
    }

    // Crear usuario en MySQL
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      nombres,
      apellidos,
      genero,
      fecha,
    })

    // Crear detalles del usuario en MongoDB
    await UserDetails.create({
      user_id: user.id,
    })

    logger.info(`Usuario registrado: ${email}`)

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id: user.id,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
      },
    })
  } catch (error) {
    logger.error("Error en registro:", error)
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

    // Buscar usuario
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      })
    }

    // Verificar que el usuario esté activo
    if (!user.estado) {
      return res.status(401).json({
        success: false,
        message: "Usuario inactivo",
      })
    }

    // Generar token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    logger.info(`Usuario logueado: ${email}`)

    res.json({
      success: true,
      message: "Login exitoso",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombres: user.nombres,
          apellidos: user.apellidos,
          genero: user.genero,
          fecha: user.fecha,
        },
      },
    })
  } catch (error) {
    logger.error("Error en login:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router
