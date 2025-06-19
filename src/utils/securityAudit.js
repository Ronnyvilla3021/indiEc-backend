// src/utils/securityAudit.js - Utilidades para auditoría de seguridad
const SecurityAudit = require('../models/mongo/SecurityAudit')
const logger = require('../config/logger')

class SecurityAuditor {
  static async logAction(params) {
    try {
      const {
        userId,
        action,
        resourceType = null,
        resourceId = null,
        ipAddress,
        userAgent = null,
        details = {},
        riskLevel = 'LOW'
      } = params

      const auditEntry = await SecurityAudit.create({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        details,
        risk_level: riskLevel
      })

      // Log crítico para acciones de alto riesgo
      if (['HIGH', 'CRITICAL'].includes(riskLevel)) {
        logger.warn('Acción de seguridad de alto riesgo:', {
          auditId: auditEntry._id,
          userId,
          action,
          riskLevel,
          ipAddress
        })
      }

      return auditEntry
    } catch (error) {
      logger.error('Error al crear entrada de auditoría:', error)
      // No fallar la operación principal por un error de auditoría
      return null
    }
  }

  static async getAuditLog(userId, options = {}) {
    try {
      const {
        action = null,
        resourceType = null,
        riskLevel = null,
        startDate = null,
        endDate = null,
        limit = 100,
        page = 1
      } = options

      const query = { user_id: userId }
      
      if (action) query.action = action
      if (resourceType) query.resource_type = resourceType
      if (riskLevel) query.risk_level = riskLevel
      
      if (startDate || endDate) {
        query.timestamp = {}
        if (startDate) query.timestamp.$gte = new Date(startDate)
        if (endDate) query.timestamp.$lte = new Date(endDate)
      }

      const skip = (page - 1) * limit

      const [logs, total] = await Promise.all([
        SecurityAudit.find(query)
          .sort({ timestamp: -1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        SecurityAudit.countDocuments(query)
      ])

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      logger.error('Error al obtener log de auditoría:', error)
      return { logs: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } }
    }
  }

  static async detectSuspiciousActivity(userId, timeWindow = 3600000) { // 1 hora
    try {
      const since = new Date(Date.now() - timeWindow)
      
      const suspiciousActions = await SecurityAudit.aggregate([
        {
          $match: {
            user_id: userId,
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastOccurrence: { $max: '$timestamp' }
          }
        },
        {
          $match: {
            $or: [
              { '_id': 'LOGIN_FAILED_WRONG_PASSWORD', count: { $gte: 5 } },
              { '_id': 'UNAUTHORIZED_ACCESS_ATTEMPT', count: { $gte: 3 } },
              { '_id': 'ENCRYPTION_ERROR', count: { $gte: 10 } },
              { '_id': 'SENSITIVE_DATA_ACCESS', count: { $gte: 50 } }
            ]
          }
        }
      ])

      if (suspiciousActions.length > 0) {
        await this.logAction({
          userId,
          action: 'SUSPICIOUS_ACTIVITY_DETECTED',
          ipAddress: 'SYSTEM',
          details: { detectedActions: suspiciousActions },
          riskLevel: 'HIGH'
        })
      }

      return suspiciousActions
    } catch (error) {
      logger.error('Error al detectar actividad sospechosa:', error)
      return []
    }
  }

  static async getSecurityMetrics(timeWindow = 86400000) { // 24 horas
    try {
      const since = new Date(Date.now() - timeWindow)
      
      const metrics = await SecurityAudit.aggregate([
        {
          $match: {
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              action: '$action',
              risk_level: '$risk_level'
            },
            count: { $sum: 1 },
            lastOccurrence: { $max: '$timestamp' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])

      const riskSummary = await SecurityAudit.aggregate([
        {
          $match: {
            timestamp: { $gte: since }
          }
        },
        {
          $group: {
            _id: '$risk_level',
            count: { $sum: 1 }
          }
        }
      ])

      return {
        timeWindow: timeWindow,
        period: since,
        actionMetrics: metrics,
        riskSummary: riskSummary,
        totalEvents: metrics.reduce((sum, metric) => sum + metric.count, 0)
      }
    } catch (error) {
      logger.error('Error al obtener métricas de seguridad:', error)
      return {
        timeWindow,
        actionMetrics: [],
        riskSummary: [],
        totalEvents: 0
      }
    }
  }
}

// Middleware para auditoría automática
const auditMiddleware = (action, resourceType = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || null
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
      const userAgent = req.get('User-Agent') || 'unknown'
      
      let riskLevel = 'LOW'
      
      // Determinar nivel de riesgo basado en la acción
      if (['SENSITIVE_DATA_DELETE', 'PRIVACY_SETTINGS_CHANGE', 'PASSWORD_CHANGE'].includes(action)) {
        riskLevel = 'MEDIUM'
      }
      
      if (['UNAUTHORIZED_ACCESS_ATTEMPT', 'ENCRYPTION_ERROR', 'LOGIN_FAILED_WRONG_PASSWORD'].includes(action)) {
        riskLevel = 'HIGH'
      }

      // No bloquear la request si falla la auditoría
      SecurityAuditor.logAction({
        userId,
        action,
        resourceType,
        resourceId: req.params.id || null,
        ipAddress,
        userAgent,
        details: {
          method: req.method,
          url: req.url,
          params: req.params,
          timestamp: new Date()
        },
        riskLevel
      }).catch(error => {
        logger.error('Error en auditoría middleware:', error)
      })

      next()
    } catch (error) {
      logger.error('Error en middleware de auditoría:', error)
      next() // Continuar aunque falle la auditoría
    }
  }
}

module.exports = { SecurityAuditor, auditMiddleware }