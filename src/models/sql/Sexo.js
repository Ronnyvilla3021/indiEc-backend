const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Sexo = sequelize.define("Sexo", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: true,
  }
}, {
  tableName: "sexos",
  timestamps: false,
});

module.exports = Sexo;