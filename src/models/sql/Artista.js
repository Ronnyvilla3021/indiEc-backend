const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Artista = sequelize.define("Artista", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nombre_artistico: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  genero_principal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'generos_musicales',
      key: 'id'
    }
  },
  pais_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'paises',
      key: 'id'
    }
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'estados',
      key: 'id'
    }
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_registro: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  verificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: "artistas",
  timestamps: true,
  indexes: [
    {
      fields: ['nombre']
    },
    {
      fields: ['genero_principal_id', 'pais_id']
    },
    {
      fields: ['estado_id']
    }
  ]
});

module.exports = Artista;