const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const GeneroMusical = sequelize.define("GeneroMusical", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'estados',
      key: 'id'
    }
  }
}, {
  tableName: "generos_musicales",
  timestamps: true,
});

module.exports = GeneroMusical;