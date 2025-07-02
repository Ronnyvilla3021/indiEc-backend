const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const CarritoProducto = sequelize.define("CarritoProducto", {
  id_carrito_prod: {
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
  id_carrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carritos',
      key: 'id_carrito'
    }
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo_producto: {
    type: DataTypes.ENUM('Album', 'Cancion', 'Merchandising'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha_agregado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "carrito_productos",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['id_carrito', 'id_producto', 'tipo_producto'],
      name: 'unique_producto_carrito'
    },
    {
      fields: ['id_carrito', 'tipo_producto']
    }
  ]
});

module.exports = CarritoProducto;