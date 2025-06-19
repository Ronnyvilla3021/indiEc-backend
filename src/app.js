const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

// Importar configuraciones
const { connectMySQL } = require("./config/database.sql")
const { connectMongoDB } = require("./config/database.orm")
const logger = require("./config/logger")

// Importar middleware
const loggerMiddleware = require("./middleware/logger")
const errorHandler = require("./middleware/errorHandler")

// Importar rutas
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const musicRoutes = require("./routes/music")
const albumRoutes = require("./routes/albums")
const groupRoutes = require("./routes/groups")
const eventRoutes = require("./routes/events")

const app = express()

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: "Demasiadas peticiones, intenta de nuevo más tarde",
  },
})

// Middleware globales
app.use(helmet())
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
)
app.use(limiter)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(loggerMiddleware)

// Servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Rutas principales
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/music", musicRoutes)
app.use("/api/albums", albumRoutes)
app.use("/api/groups", groupRoutes)
app.use("/api/events", eventRoutes)

// Ruta de prueba
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "INDIEC API funcionando correctamente",
    timestamp: new Date().toISOString(),
  })
})

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  })
})

// Middleware de manejo de errores
app.use(errorHandler)

const PORT = process.env.PORT || 3000

// Inicializar conexiones y servidor
async function startServer() {
  try {
    // Conectar a las bases de datos
    await connectMySQL()
    await connectMongoDB()

    // Crear directorio de uploads si no existe
    const fs = require("fs")
    const uploadDir = path.join(__dirname, "../uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    app.listen(PORT, () => {
      logger.info(`Servidor INDIEC iniciado en puerto ${PORT}`)
      console.log(`🎵 INDIEC API corriendo en http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error("Error al iniciar el servidor:", error)
    process.exit(1)
  }
}

startServer()

module.exports = app
