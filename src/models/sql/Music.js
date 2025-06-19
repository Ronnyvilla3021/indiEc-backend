const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const User = require("./User")

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
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "music",
    timestamps: true,
  },
)

Music.belongsTo(User, { foreignKey: "user_id", as: "user" })
User.hasMany(Music, { foreignKey: "user_id", as: "music" })

module.exports = Music
