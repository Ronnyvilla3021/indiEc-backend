const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const AlbumNuevo = sequelize.define("AlbumNuevo", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  artista_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'artistas',
      key: 'id'
    }
  },
  año: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  genero_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'generos_musicales',
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
  fecha_lanzamiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  }
}, {
  tableName: "albumes",
  timestamps: true,
  indexes: [
    {
      fields: ['artista_id', 'año']
    },
    {
      fields: ['genero_id']
    },
    {
      fields: ['titulo']
    }
  ]
});

module.exports = AlbumNuevo;