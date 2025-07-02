const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")

const Group = sequelize.define(
  "Group",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_grupo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    genero_musical: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    activo: {
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
    tableName: "groups",
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['genero_musical']
      },
      {
        fields: ['nombre_grupo']
      }
    ]
  },
)

module.exports = Group