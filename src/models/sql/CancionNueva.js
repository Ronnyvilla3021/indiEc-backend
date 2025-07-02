const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const CancionNueva = sequelize.define("CancionNueva", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  album_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'albumes',
      key: 'id'
    }
  },
  artista_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'artistas',
      key: 'id'
    }
  },
  duracion: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  año: {
    type: DataTypes.INTEGER,
    allowNull: true,
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
  track_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  }
}, {
  tableName: "canciones",
  timestamps: true,
  indexes: [
    {
      fields: ['album_id', 'track_number']
    },
    {
      fields: ['artista_id', 'año']
    },
    {
      fields: ['titulo']
    }
  ]
});

module.exports = CancionNueva;
