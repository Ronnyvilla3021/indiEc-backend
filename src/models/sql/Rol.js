const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Rol = sequelize.define("Rol", {
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
  },
  permisos: {
    type: DataTypes.JSON,
    defaultValue: {},
  }
}, {
  tableName: "roles",
  timestamps: true,
});

module.exports = Rol;