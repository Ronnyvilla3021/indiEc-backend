const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")

const Music = sequelize.define(
  "Music",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    album: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    duracion: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    año: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    genero: {
      type: DataTypes.ENUM("Rock", "Pop", "Jazz", "Clásica", "Electrónica", "Hip-Hop", "Reggae", "Metal"),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("Activo", "Inactivo"),
      defaultValue: "Activo",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios', // Nombre de la tabla, no del modelo
        key: 'id_usuario'   // Clave primaria correcta
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
  },
  {
    tableName: "music",
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['genero', 'año']
      },
      {
        fields: ['titulo']
      }
    ]
  },
)

module.exports = Music