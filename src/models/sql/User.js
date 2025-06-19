// src/models/sql/User.js - Modelo User SIMPLIFICADO (temporal sin encriptación)
const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nombres: {
      type: DataTypes.STRING(100), // Mantener VARCHAR por ahora
      allowNull: false,
    },
    apellidos: {
      type: DataTypes.STRING(100), // Mantener VARCHAR por ahora
      allowNull: false,
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
    },
    // Campos para futuras búsquedas encriptadas (opcional)
    nombres_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    apellidos_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    }
  },
  {
    tableName: "users",
    timestamps: true,
    // SIN HOOKS POR AHORA - Los agregaremos después
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['estado']
      }
    ]
  }
)

// Función para obtener nombre completo
User.prototype.getFullName = function() {
  return `${this.nombres || ''} ${this.apellidos || ''}`.trim()
}

// Función para obtener datos públicos (sin información sensible)
User.prototype.getPublicData = function() {
  return {
    id: this.id,
    email: this.email,
    nombres_inicial: this.nombres ? this.nombres.charAt(0).toUpperCase() : '',
    apellidos_inicial: this.apellidos ? this.apellidos.charAt(0).toUpperCase() : '',
    genero: this.genero,
    created_at: this.created_at
  }
}

// Función de búsqueda simple por nombres
User.searchByName = async function(searchTerm, options = {}) {
  const { Op } = require('sequelize')
  
  try {
    return await this.findAll({
      where: {
        [Op.or]: [
          { nombres: { [Op.like]: `%${searchTerm}%` } },
          { apellidos: { [Op.like]: `%${searchTerm}%` } }
        ],
        estado: true
      },
      ...options
    })
  } catch (error) {
    console.error('Error en búsqueda por nombre:', error)
    return []
  }
}

module.exports = User