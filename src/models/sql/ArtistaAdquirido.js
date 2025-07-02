const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");

const ArtistaAdquirido = sequelize.define("ArtistaAdquirido", {
  id_adquisicion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_artista: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'artistas',
      key: 'id'
    }
  },
  tipo_accion: {
    type: DataTypes.ENUM('Contrato', 'Licencia', 'Exclusivo', 'Colaboracion'),
    allowNull: false,
  },
  fecha_adquisicion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin_adquisicion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  monto_costo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'estados',
      key: 'id'
    }
  },
  usuario_gestor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  }
}, {
  tableName: "artistas_adquiridos",
  timestamps: true,
  indexes: [
    {
      fields: ['id_artista', 'fecha_adquisicion']
    },
    {
      fields: ['fecha_fin_adquisicion']
    },
    {
      fields: ['tipo_accion', 'estado_id']
    }
  ]
});

module.exports = ArtistaAdquirido;