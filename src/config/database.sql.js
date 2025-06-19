const { Sequelize } = require("sequelize")
const logger = require("./logger")

const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_HOST,
  dialect: "mysql",
  logging: (msg) => logger.info(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
})

const connectMySQL = async () => {
  try {
    await sequelize.authenticate()
    logger.info("Conexión a MySQL establecida correctamente")

    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true })
      logger.info("Modelos sincronizados con la base de datos")
    }
  } catch (error) {
    logger.error("Error al conectar con MySQL:", error)
    throw error
  }
}

module.exports = { sequelize, connectMySQL }
