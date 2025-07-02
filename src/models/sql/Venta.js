const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const Venta = sequelize.define("Venta", {
  id_venta: {
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
  monto_subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  impuestos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  descuentos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  monto_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  estado_pago: {
    type: DataTypes.ENUM('Pendiente', 'Pagado', 'Cancelado', 'Reembolsado'),
    defaultValue: 'Pendiente',
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  referencia_pago: {
    type: DataTypes.STRING(100),
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
  tableName: "ventas",
  timestamps: true,
  indexes: [
    {
      fields: ['id_usuario', 'created_at']
    },
    {
      fields: ['estado_pago']
    },
    {
      fields: ['created_at', 'monto_total']
    }
  ]
});

module.exports = Venta;