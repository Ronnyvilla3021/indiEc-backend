const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const User = require("./UsuarioNuevo")

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
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "events",
    timestamps: true,
  },
)

Event.belongsTo(User, { foreignKey: "user_id", as: "user" })
User.hasMany(Event, { foreignKey: "user_id", as: "events" })

module.exports = Event
