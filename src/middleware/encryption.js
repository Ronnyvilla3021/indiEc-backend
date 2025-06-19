// src/middleware/encryption.js - Middleware para encriptación automática
const { encryptObject, decryptObject, SENSITIVE_FIELDS } = require('../utils/encryption')
const logger = require('../config/logger')

// Middleware para encriptar datos antes de guardar
const encryptionMiddleware = (modelType) => {
  return (req, res, next) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return next()
      }

      const fieldsToEncrypt = SENSITIVE_FIELDS[modelType] || []
      
      if (fieldsToEncrypt.length > 0) {
        req.body = encryptObject(req.body, fieldsToEncrypt)
        logger.info(`Datos encriptados para ${modelType}:`, fieldsToEncrypt)
      }
      
      next()
    } catch (error) {
      logger.error('Error en middleware de encriptación:', error)
      res.status(500).json({
        success: false,
        message: 'Error al procesar los datos sensibles'
      })
    }
  }
}

// Middleware para desencriptar datos en respuestas
const decryptionMiddleware = (modelType) => {
  return (req, res, next) => {
    const originalSend = res.send
    
    res.send = function(data) {
      try {
        if (data && typeof data === 'string') {
          const parsedData = JSON.parse(data)
          
          if (parsedData.success && parsedData.data) {
            const fieldsToDecrypt = SENSITIVE_FIELDS[modelType] || []
            
            if (Array.isArray(parsedData.data)) {
              // Múltiples registros
              parsedData.data = parsedData.data.map(item => {
                if (item.details) {
                  item.details = decryptObject(item.details, fieldsToDecrypt)
                }
                return item
              })
            } else if (parsedData.data.details) {
              // Un solo registro
              parsedData.data.details = decryptObject(parsedData.data.details, fieldsToDecrypt)
            }
            
            data = JSON.stringify(parsedData)
          }
        }
      } catch (error) {
        logger.warn('Error al desencriptar respuesta:', error)
        // Continuar con los datos originales si hay error
      }
      
      originalSend.call(this, data)
    }
    
    next()
  }
}

// Función para encriptar datos de MongoDB manualmente
const encryptMongoData = (data, modelType) => {
  const fieldsToEncrypt = SENSITIVE_FIELDS[modelType] || []
  return encryptObject(data, fieldsToEncrypt)
}

// Función para desencriptar datos de MongoDB manualmente
const decryptMongoData = (data, modelType) => {
  const fieldsToDecrypt = SENSITIVE_FIELDS[modelType] || []
  return decryptObject(data, fieldsToDecrypt)
}

// Middleware específico para archivos sensibles
const encryptFileMetadata = (req, res, next) => {
  if (req.file) {
    // Encriptar metadata del archivo si es necesario
    const originalName = req.file.originalname
    const sensitiveData = {
      originalName,
      uploadTime: new Date().toISOString(),
      userId: req.user?.id
    }
    
    req.file.encryptedMetadata = encryptObject(sensitiveData, ['originalName'])
  }
  next()
}

// Middleware para logging de accesos a datos sensibles
const logSensitiveAccess = (modelType) => {
  return (req, res, next) => {
    const originalSend = res.send
    
    res.send = function(data) {
      try {
        // Log cuando se accede a datos sensibles exitosamente
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logger.info('Acceso a datos sensibles:', {
            userId: req.user?.id,
            modelType,
            method: req.method,
            url: req.url,
            ip: req.ip,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        logger.warn('Error en logging de acceso sensible:', error)
      }
      
      originalSend.call(this, data)
    }
    
    next()
  }
}

module.exports = {
  encryptionMiddleware,
  decryptionMiddleware,
  encryptMongoData,
  decryptMongoData,
  encryptFileMetadata,
  logSensitiveAccess
}