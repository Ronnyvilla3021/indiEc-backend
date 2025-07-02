const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Pais = sequelize.define("Pais", {
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
  codigo_iso: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  codigo_telefono: {
    type: DataTypes.STRING(10),
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
  tableName: "paises",
  timestamps: true,
});

module.exports = Pais;