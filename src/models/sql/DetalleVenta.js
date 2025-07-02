const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const DetalleVenta = sequelize.define("DetalleVenta", {
  id_detalle: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'id_venta'
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
    allowNull: false,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  monto_linea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  tableName: "detalle_ventas",
  timestamps: false,
  indexes: [
    {
      fields: ['id_venta', 'tipo_producto']
    },
    {
      fields: ['id_producto', 'tipo_producto']
    }
  ]
});

module.exports = DetalleVenta;