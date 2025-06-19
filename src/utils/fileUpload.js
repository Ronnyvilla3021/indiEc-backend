const multer = require("multer")
const path = require("path")
const crypto = require("crypto")

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex")
    const extension = path.extname(file.originalname)
    cb(null, `${Date.now()}-${uniqueSuffix}${extension}`)
  },
})

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF."), false)
  }
}

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB por defecto
  },
  fileFilter: fileFilter,
})

module.exports = upload
