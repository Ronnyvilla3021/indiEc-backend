// src/models/sql/User.js - Modelo User corregido con manejo de errores
const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const { encryptData, decryptData, generateHash } = require("../../utils/encryption")
const logger = require("../../config/logger")

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.TEXT, // TEXT para datos encriptados
      allowNull: false,
    },
    email_hash: {
      type: DataTypes.STRING(64), // Hash para búsquedas
      allowNull: true, // Temporal: cambiar a false después de migración
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nombres: {
      type: DataTypes.TEXT, // TEXT para datos encriptados
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.TEXT, // TEXT para datos encriptados
      allowNull: false,
    },
    nombres_hash: {
      type: DataTypes.STRING(64), // Hash para búsquedas
      allowNull: true, // Temporal: cambiar a false después de migración
    },
    apellidos_hash: {
      type: DataTypes.STRING(64), // Hash para búsquedas
      allowNull: true, // Temporal: cambiar a false después de migración
    },
    genero: {
      type: DataTypes.ENUM("Masculino", "Femenino", "Otro"),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      // ANTES DE CREAR
      beforeCreate: async (user) => {
        try {
          logger.info('Hook beforeCreate ejecutándose...')
          
          // Verificar si el sistema de encriptación está habilitado
          const encryptionEnabled = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
          
          if (!encryptionEnabled) {
            logger.warn('Encriptación deshabilitada: ENCRYPTION_KEY no configurada correctamente')
            return
          }
          
          // Encriptar email
          if (user.email) {
            try {
              const originalEmail = user.email
              user.email_hash = generateHash(originalEmail.toLowerCase())
              user.email = encryptData(originalEmail)
              logger.info(`Email encriptado para usuario: ${user.email_hash}`)
            } catch (error) {
              logger.error('Error encriptando email:', error)
              throw new Error('Error procesando email')
            }
          }
          
          // Encriptar nombres
          if (user.nombres) {
            try {
              const originalNombres = user.nombres
              user.nombres_hash = generateHash(originalNombres.toLowerCase())
              user.nombres = encryptData(originalNombres)
              logger.info('Nombres encriptados')
            } catch (error) {
              logger.error('Error encriptando nombres:', error)
              throw new Error('Error procesando nombres')
            }
          }
          
          // Encriptar apellidos
          if (user.apellidos) {
            try {
              const originalApellidos = user.apellidos
              user.apellidos_hash = generateHash(originalApellidos.toLowerCase())
              user.apellidos = encryptData(originalApellidos)
              logger.info('Apellidos encriptados')
            } catch (error) {
              logger.error('Error encriptando apellidos:', error)
              throw new Error('Error procesando apellidos')
            }
          }
          
          logger.info('Hook beforeCreate completado exitosamente')
        } catch (error) {
          logger.error('Error en hook beforeCreate:', error)
          throw error
        }
      },
      
      // ANTES DE ACTUALIZAR
      beforeUpdate: async (user) => {
        try {
          logger.info(`Hook beforeUpdate ejecutándose para usuario ID: ${user.id}`)
          
          // Verificar si el sistema de encriptación está habilitado
          const encryptionEnabled = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
          
          if (!encryptionEnabled) {
            logger.warn('Encriptación deshabilitada: ENCRYPTION_KEY no configurada correctamente')
            return
          }
          
          // Solo encriptar si el campo cambió
          if (user.changed('email')) {
            try {
              const originalEmail = user.email
              user.email_hash = generateHash(originalEmail.toLowerCase())
              user.email = encryptData(originalEmail)
              logger.info(`Email actualizado y encriptado para usuario ID: ${user.id}`)
            } catch (error) {
              logger.error('Error encriptando email en update:', error)
              throw new Error('Error procesando email en actualización')
            }
          }
          
          if (user.changed('nombres')) {
            try {
              const originalNombres = user.nombres
              user.nombres_hash = generateHash(originalNombres.toLowerCase())
              user.nombres = encryptData(originalNombres)
              logger.info(`Nombres actualizados para usuario ID: ${user.id}`)
            } catch (error) {
              logger.error('Error encriptando nombres en update:', error)
              throw new Error('Error procesando nombres en actualización')
            }
          }
          
          if (user.changed('apellidos')) {
            try {
              const originalApellidos = user.apellidos
              user.apellidos_hash = generateHash(originalApellidos.toLowerCase())
              user.apellidos = encryptData(originalApellidos)
              logger.info(`Apellidos actualizados para usuario ID: ${user.id}`)
            } catch (error) {
              logger.error('Error encriptando apellidos en update:', error)
              throw new Error('Error procesando apellidos en actualización')
            }
          }
          
          logger.info('Hook beforeUpdate completado exitosamente')
        } catch (error) {
          logger.error('Error en hook beforeUpdate:', error)
          throw error
        }
      },
      
      // DESPUÉS DE BUSCAR (desencriptar para uso)
      afterFind: (users) => {
        if (!users) return
        
        const decryptUser = (user) => {
          try {
            // Verificar si el sistema de encriptación está habilitado
            const encryptionEnabled = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
            
            if (!encryptionEnabled) {
              return // No desencriptar si no está habilitado
            }
            
            // Solo desencriptar si parece estar encriptado (contiene ':')
            if (user.email && typeof user.email === 'string' && user.email.includes(':')) {
              try {
                user.email = decryptData(user.email)
              } catch (error) {
                logger.warn(`Error desencriptando email del usuario ${user.id}:`, error.message)
              }
            }
            
            if (user.nombres && typeof user.nombres === 'string' && user.nombres.includes(':')) {
              try {
                user.nombres = decryptData(user.nombres)
              } catch (error) {
                logger.warn(`Error desencriptando nombres del usuario ${user.id}:`, error.message)
              }
            }
            
            if (user.apellidos && typeof user.apellidos === 'string' && user.apellidos.includes(':')) {
              try {
                user.apellidos = decryptData(user.apellidos)
              } catch (error) {
                logger.warn(`Error desencriptando apellidos del usuario ${user.id}:`, error.message)
              }
            }
          } catch (error) {
            logger.warn(`Error general desencriptando usuario ${user.id}:`, error.message)
          }
        }
        
        try {
          if (Array.isArray(users)) {
            users.forEach(decryptUser)
          } else {
            decryptUser(users)
          }
        } catch (error) {
          logger.error('Error en hook afterFind:', error)
        }
      }
    },
    indexes: [
      {
        fields: ['email_hash'],
        name: 'idx_email_hash'
      },
      {
        fields: ['nombres_hash'],
        name: 'idx_nombres_hash'
      },
      {
        fields: ['apellidos_hash'],
        name: 'idx_apellidos_hash'
      },
      {
        fields: ['estado'],
        name: 'idx_estado'
      }
    ]
  }
)

// Método estático para búsqueda por email encriptado
User.findByEmail = async function(email) {
  try {
    const emailHash = generateHash(email.toLowerCase())
    
    // Primero intentar buscar por hash (más eficiente)
    let user = await this.findOne({ 
      where: { email_hash: emailHash, estado: true }
    })
    
    // Si no se encuentra por hash, buscar por email directo (para usuarios no migrados)
    if (!user) {
      user = await this.findOne({
        where: { email: email, estado: true }
      })
    }
    
    return user
  } catch (error) {
    logger.error('Error en findByEmail:', error)
    return null
  }
}

// Método estático para búsqueda por nombres (usando hashes)
User.searchByName = async function(searchTerm, options = {}) {
  const { Op } = require('sequelize')
  
  try {
    const searchHash = generateHash(searchTerm.toLowerCase())
    
    return await this.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nombres_hash: searchHash },
              { apellidos_hash: searchHash }
            ]
          },
          { estado: true }
        ]
      },
      ...options
    })
  } catch (error) {
    logger.error('Error en búsqueda por nombre:', error)
    return []
  }
}

// Método estático para búsqueda avanzada
User.searchByNameAdvanced = async function(searchTerm, options = {}) {
  try {
    const allUsers = await this.findAll({
      where: { estado: true },
      ...options
    })
    
    const filtered = allUsers.filter(user => {
      const fullName = `${user.nombres} ${user.apellidos}`.toLowerCase()
      return fullName.includes(searchTerm.toLowerCase())
    })
    
    return filtered
  } catch (error) {
    logger.error('Error en búsqueda avanzada:', error)
    return []
  }
}

// Función para obtener nombre completo
User.prototype.getFullName = function() {
  return `${this.nombres || ''} ${this.apellidos || ''}`.trim()
}

// Función para obtener datos públicos (sin información sensible)
User.prototype.getPublicData = function() {
  return {
    id: this.id,
    nombres_inicial: this.nombres ? this.nombres.charAt(0).toUpperCase() : '',
    apellidos_inicial: this.apellidos ? this.apellidos.charAt(0).toUpperCase() : '',
    genero: this.genero,
    created_at: this.created_at
  }
}

// Función para obtener datos seguros (con algunos datos desencriptados)
User.prototype.getSafeData = function() {
  return {
    id: this.id,
    email: this.email, // Ya desencriptado por hook
    nombres: this.nombres, // Ya desencriptado por hook
    apellidos: this.apellidos, // Ya desencriptado por hook
    genero: this.genero,
    fecha: this.fecha,
    estado: this.estado,
    created_at: this.created_at,
    updated_at: this.updated_at
  }
}

// Método para actualizar datos sensibles de forma segura
User.prototype.updateSensitiveData = async function(newData) {
  try {
    const allowedFields = ['email', 'nombres', 'apellidos', 'genero', 'fecha']
    const updateData = {}
    
    // Solo incluir campos permitidos
    allowedFields.forEach(field => {
      if (newData[field] !== undefined) {
        updateData[field] = newData[field]
      }
    })
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay datos válidos para actualizar')
    }
    
    // La encriptación ocurre automáticamente en el hook beforeUpdate
    await this.update(updateData)
    
    return this
  } catch (error) {
    logger.error('Error actualizando datos sensibles:', error)
    throw error
  }
}

// Método para verificar si la encriptación está habilitada
User.isEncryptionEnabled = function() {
  return process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 32
}

module.exports = User