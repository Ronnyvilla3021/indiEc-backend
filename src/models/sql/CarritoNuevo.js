const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Carrito = sequelize.define("Carrito", {
  id_carrito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Abandonado', 'Procesado'),
    defaultValue: 'Activo',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_modificacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "carritos",
  timestamps: true,
  indexes: [
    {
      fields: ['id_usuario', 'estado']
    }
  ]
});

module.exports = Carrito;
