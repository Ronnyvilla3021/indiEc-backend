const { Sequelize } = require("sequelize")
const mysql = require("mysql2/promise")
const logger = require("./logger")
const config = require("../../key")

const sequelize = new Sequelize(config.MYSQL.DATABASE, config.MYSQL.USER, config.MYSQL.PASSWORD, {
  host: config.MYSQL.HOST,
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
    // 1. Verificar/crear base de datos si no existe
    await createDatabaseIfNotExists()
    
    // 2. Autenticar conexión
    await sequelize.authenticate()
    logger.info("Conexión a MySQL establecida correctamente")

    // 3. Sincronizar modelos en orden correcto
    await syncModelsInOrder()
    
  } catch (error) {
    logger.error("Error al conectar con MySQL:", error)
    throw error
  }
}

const createDatabaseIfNotExists = async () => {
  try {
    logger.info("🔍 Verificando si la base de datos existe...")
    
    // Crear conexión sin especificar base de datos
    const connection = await mysql.createConnection({
      host: config.MYSQL.HOST,
      user: config.MYSQL.USER,
      password: config.MYSQL.PASSWORD,
    })

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.MYSQL.DATABASE}\``)
    logger.info(`✅ Base de datos '${config.MYSQL.DATABASE}' verificada/creada`)
    
    await connection.end()
  } catch (error) {
    logger.error("Error al crear base de datos:", error)
    throw error
  }
}

const syncModelsInOrder = async () => {
  try {
    const forceSync = process.env.FORCE_SYNC === 'true'
    const isDev = config.NODE_ENV === "development"
    
    if (forceSync) {
      logger.warn("⚠️  FORZANDO recreación de todas las tablas...")
      await syncWithForce()
    } else if (isDev) {
      logger.info("🔄 Sincronizando modelos en modo desarrollo...")
      await syncWithAlter()
    } else {
      logger.info("🔄 Sincronizando modelos en modo producción...")
      await syncSafely()
    }
  } catch (error) {
    logger.error("❌ Error al sincronizar modelos:", error)
    throw error
  }
}

const syncWithForce = async () => {
  try {
    // Cargar asociaciones
    require("../models/sql/associations")
    
    // Forzar recreación de todas las tablas
    await sequelize.sync({ force: true })
    logger.info("✅ Todas las tablas recreadas con force: true")
  } catch (error) {
    logger.error("Error en sync con force:", error)
    throw error
  }
}

const syncWithAlter = async () => {
  try {
    // En desarrollo, sincronizar en orden específico para evitar problemas de FK
    await syncTablesInOrder(true)
    logger.info("✅ Modelos sincronizados con alter: true")
  } catch (error) {
    logger.error("Error en sync con alter:", error)
    throw error
  }
}

const syncSafely = async () => {
  try {
    // En producción, solo crear tablas que no existen
    await syncTablesInOrder(false)
    logger.info("✅ Modelos sincronizados sin alteraciones")
  } catch (error) {
    logger.error("Error en sync seguro:", error)
    throw error
  }
}

const syncTablesInOrder = async (alter = false) => {
  try {
    // Orden de sincronización: primero tablas independientes, luego las dependientes
    const syncOrder = [
      // 1. Tablas de catálogos (sin dependencias)
      'Estado',
      'Rol', 
      'Sexo',
      'GeneroMusical',
      'Pais',
      
      // 2. Tabla de usuarios (depende de catálogos)
      'UsuarioNuevo',
      
      // 3. Tablas que dependen de usuarios (sistema original)
      'Music',
      'Album',
      'Group', 
      'Event',
      
      // 4. Nuevas tablas híbridas
      'Artista',
      'AlbumNuevo',
      'CancionNueva',
      'Venta',
      'DetalleVenta',
      'Carrito',
      'CarritoProducto',
      'ArtistaAdquirido'
    ]

    logger.info(`🔄 Sincronizando ${syncOrder.length} modelos en orden...`)

    for (const modelName of syncOrder) {
      try {
        const model = getModelByName(modelName)
        if (model) {
          logger.info(`  📝 Sincronizando ${modelName}...`)
          await model.sync({ alter })
          logger.info(`  ✅ ${modelName} sincronizado`)
        } else {
          logger.warn(`  ⚠️  Modelo ${modelName} no encontrado, saltando...`)
        }
      } catch (error) {
        logger.error(`  ❌ Error sincronizando ${modelName}:`, error.message)
        // Continuar con el siguiente modelo en lugar de fallar completamente
      }
    }

    // Configurar asociaciones después de que todas las tablas existan
    logger.info("🔗 Configurando asociaciones...")
    require("../models/sql/associations")
    logger.info("✅ Asociaciones configuradas")

  } catch (error) {
    logger.error("Error en sincronización ordenada:", error)
    throw error
  }
}

const getModelByName = (modelName) => {
  try {
    switch (modelName) {
      case 'Estado':
        return require("../models/sql/Estado")
      case 'Rol':
        return require("../models/sql/Rol")
      case 'Sexo':
        return require("../models/sql/Sexo")
      case 'GeneroMusical':
        return require("../models/sql/GeneroMusical")
      case 'Pais':
        return require("../models/sql/Pais")
      case 'UsuarioNuevo':
        return require("../models/sql/UsuarioNuevo")
      case 'Music':
        return require("../models/sql/Music")
      case 'Album':
        return require("../models/sql/Album")
      case 'Group':
        return require("../models/sql/Group")
      case 'Event':
        return require("../models/sql/Event")
      case 'Artista':
        return require("../models/sql/Artista")
      case 'AlbumNuevo':
        return require("../models/sql/AlbumNuevo")
      case 'CancionNueva':
        return require("../models/sql/CancionNueva")
      case 'Venta':
        return require("../models/sql/Venta")
      case 'DetalleVenta':
        return require("../models/sql/DetalleVenta")
      case 'Carrito':
        return require("../models/sql/CarritoNuevo")
      case 'CarritoProducto':
        return require("../models/sql/CarritoProducto")
      case 'ArtistaAdquirido':
        return require("../models/sql/ArtistaAdquirido")
      default:
        logger.warn(`Modelo ${modelName} no reconocido`)
        return null
    }
  } catch (error) {
    logger.error(`Error cargando modelo ${modelName}:`, error.message)
    return null
  }
}

const checkTablesExist = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = '${config.MYSQL.DATABASE}'
    `)
    
    const tableCount = results[0].count
    logger.info(`📊 Base de datos contiene ${tableCount} tablas`)
    return tableCount
  } catch (error) {
    logger.error("Error al verificar tablas:", error)
    return 0
  }
}

const listTables = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${config.MYSQL.DATABASE}'
      ORDER BY table_name
    `)
    
    const tables = results.map(row => row.table_name || row.TABLE_NAME)
    logger.info(`📋 Tablas en la base de datos: ${tables.join(', ')}`)
    return tables
  } catch (error) {
    logger.error("Error al listar tablas:", error)
    return []
  }
}

const forceSyncModels = async () => {
  try {
    logger.warn("⚠️  FORZANDO recreación de todas las tablas...")
    await syncWithForce()
  } catch (error) {
    logger.error("❌ Error al forzar sincronización:", error)
    throw error
  }
}

module.exports = { 
  sequelize, 
  connectMySQL, 
  syncModelsInOrder,
  syncTablesInOrder,
  forceSyncModels,
  checkTablesExist,
  listTables,
  createDatabaseIfNotExists
}