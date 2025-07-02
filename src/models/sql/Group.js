const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const User = require("./UsuarioNuevo")

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
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "groups",
    timestamps: true,
  },
)

Group.belongsTo(User, { foreignKey: "user_id", as: "user" })
User.hasMany(Group, { foreignKey: "user_id", as: "groups" })

module.exports = Group
