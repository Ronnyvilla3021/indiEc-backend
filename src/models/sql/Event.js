const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_evento: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    genero_musical: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    contacto: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id_usuario'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
  },
  {
    tableName: "events",
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['fecha']
      },
      {
        fields: ['genero_musical']
      }
    ]
  },
)

module.exports = Event