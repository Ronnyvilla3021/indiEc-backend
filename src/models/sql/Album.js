const { DataTypes } = require("sequelize")
const { sequelize } = require("../../config/database.sql")
const User = require("./UsuarioNuevo")

const Album = sequelize.define(
  "Album",
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
    artista: {
      type: DataTypes.STRING(255),
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


    ///id , usuario_id, estado, valor, detalle de compra 
  },
  {
    tableName: "albums",
    timestamps: true,
  },
)

Album.belongsTo(User, { foreignKey: "user_id", as: "user" })
User.hasMany(Album, { foreignKey: "user_id", as: "albums" })

module.exports = Album
