const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Estado = sequelize.define("Estado", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: "estados",
  timestamps: true,
});

module.exports = Estado;