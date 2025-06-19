// src/models/mongo/SecurityAudit.js - Modelo para auditoría de seguridad
const mongoose = require("mongoose")

const securityAuditSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: false, // Puede ser null para acciones del sistema
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Acciones de autenticación
      'LOGIN_SUCCESS',
      'LOGIN_FAILED_USER_NOT_FOUND',
      'LOGIN_FAILED_WRONG_PASSWORD', 
      'LOGIN_FAILED_USER_INACTIVE',
      'LOGIN_ERROR',
      'USER_REGISTERED',
      'REGISTRATION_FAILED_EMAIL_EXISTS',
      'REGISTRATION_ERROR',
      'PASSWORD_CHANGED',
      'PASSWORD_CHANGE_FAILED',
      'TOKEN_REFRESH',
      
      // Acciones de datos sensibles
      'SENSITIVE_DATA_ACCESS',
      'SENSITIVE_DATA_UPDATE', 
      'SENSITIVE_DATA_UPDATE_ERROR',
      'SENSITIVE_DATA_DELETE',
      
      // Errores de encriptación
      'ENCRYPTION_ERROR',
      'DECRYPTION_ERROR',
      
      // Acciones de usuario
      'USER_SEARCH',
      'PRIVACY_SETTINGS_CHANGE',
      'DATA_EXPORT',
      
      // Acciones de seguridad
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'SUSPICIOUS_ACTIVITY_DETECTED',
      
      // Acciones del sistema
      'SYSTEM_BACKUP',
      'SYSTEM_MAINTENANCE'
    ]
  },
  resource_type: {
    type: String,
    enum: ['USER', 'MUSIC', 'ALBUM', 'GROUP', 'EVENT', 'FILE', 'SYSTEM'],
    default: null
  },
  resource_id: {
    type: String,
    default: null
  },
  ip_address: {
    type: String,
    required: true
  },
  user_agent: {
    type: String,
    default: null
  },
  details: {
    type: Object,
    default: {}
  },
  risk_level: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'securityaudits' // Nombre explícito de la colección
})

// Índices para búsquedas eficientes
securityAuditSchema.index({ user_id: 1, timestamp: -1 })
securityAuditSchema.index({ action: 1, timestamp: -1 })
securityAuditSchema.index({ risk_level: 1, timestamp: -1 })
securityAuditSchema.index({ ip_address: 1, timestamp: -1 })
securityAuditSchema.index({ timestamp: -1 }) // Para limpieza automática

// TTL index para limpieza automática después de 90 días
securityAuditSchema.index(
  { timestamp: 1 }, 
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 días en segundos
    name: 'audit_ttl_index'
  }
)

// Método estático para limpiar entradas antiguas manualmente
securityAuditSchema.statics.cleanOldEntries = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000))
  
  try {
    const result = await this.deleteMany({
      timestamp: { $lt: cutoffDate }
    })
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Método estático para obtener estadísticas
securityAuditSchema.statics.getStats = async function(timeWindow = 86400000) { // 24 horas
  const since = new Date(Date.now() - timeWindow)
  
  try {
    const stats = await this.aggregate([
      {
        $match: {
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            risk_level: '$risk_level',
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.risk_level',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ])
    
    return stats
  } catch (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`)
  }
}

// Middleware para logging automático
securityAuditSchema.pre('save', function(next) {
  // Validar que el IP address no esté vacío
  if (!this.ip_address || this.ip_address.trim() === '') {
    this.ip_address = 'unknown'
  }
  
  next()
})

module.exports = mongoose.model("SecurityAudit", securityAuditSchema)