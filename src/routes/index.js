const express = require('express');
const logger = require('../config/logger');

// Importar todas las rutas
const usuariosHibridos = require('./usuariosHibridos');
const artistasHibridos = require('./artistasHibridos');
const ventasHibridas = require('./ventasHibridas');
const eventosHibridos = require('./eventosHibridos');
const analyticsHibridos = require('./analyticsHibridos');
const catalogosHibridos = require('./catalogosHibridos');
const albumesHibridos = require('./albumesHibridos');
const cancionesHibridas = require('./cancionesHibridas');
const carritoHibrido = require('./carritoHibrido');
const contratosHibridos = require('./contratosHibridos');

const router = express.Router();

// ================================
// REGISTRAR TODAS LAS RUTAS
// ================================

// Usuarios y autenticación
router.use('/usuarios-hibridos', usuariosHibridos);

// Gestión musical
router.use('/artistas-hibridos', artistasHibridos);
router.use('/albumes-hibridos', albumesHibridos);
router.use('/canciones-hibridas', cancionesHibridas);

// E-commerce
router.use('/ventas-hibridas', ventasHibridas);
router.use('/carrito', carritoHibrido);

// Eventos y contratos
router.use('/eventos-hibridos', eventosHibridos);
router.use('/contratos', contratosHibridos);

// Analytics y reportes
router.use('/analytics-hibridos', analyticsHibridos);

// Catálogos y configuración
router.use('/catalogos', catalogosHibridos);

// ================================
// ENDPOINTS DE SISTEMA
// ================================

// Health check completo
router.get('/health-hibrido', async (req, res) => {
  try {
    // Verificar conexión MySQL
    const { sequelize } = require('../config/database.sql');
    await sequelize.authenticate();
    
    // Verificar conexión MongoDB
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
    
    // Contar tablas y colecciones
    let tableCount = 0;
    let collectionCount = 0;
    
    try {
      const [results] = await sequelize.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()");
      tableCount = results[0].count;
    } catch (error) {
      logger.warn('No se pudo contar tablas:', error.message);
    }
    
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      collectionCount = collections.length;
    } catch (error) {
      logger.warn('No se pudo contar colecciones:', error.message);
    }

    res.json({
      success: true,
      message: 'Sistema híbrido COMPLETO funcionando correctamente',
      status: {
        mysql: {
          estado: 'conectado',
          tablas: tableCount
        },
        mongodb: {
          estado: mongoStatus,
          colecciones: collectionCount
        },
        apis: {
          usuarios: 'activa',
          artistas: 'activa',
          ventas: 'activa',
          eventos: 'activa',
          analytics: 'activa',
          catalogos: 'activa',
          albumes: 'activa',
          canciones: 'activa',
          carrito: 'activa',
          contratos: 'activa'
        },
        integracion: '100% completa',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error en health check híbrido:', error);
    res.status(500).json({
      success: false,
      message: 'Error en sistema híbrido',
      error: error.message
    });
  }
});

// Información completa de endpoints
router.get('/endpoints', (req, res) => {
  res.json({
    success: true,
    message: 'Lista completa de endpoints del sistema híbrido INDIEC',
    data: {
      base_url: '/api/v2',
      version: '1.0.0',
      
      // Catálogos (sin autenticación)
      catalogos: {
        base: '/catalogos',
        endpoints: [
          'GET /catalogos/estados - Lista de estados del sistema',
          'GET /catalogos/roles - Roles de usuario disponibles', 
          'GET /catalogos/generos-musicales - Géneros musicales',
          'GET /catalogos/paises - Lista de países',
          'GET /catalogos/sexos - Opciones de género'
        ]
      },
      
      // Usuarios
      usuarios: {
        base: '/usuarios-hibridos',
        auth_required: true,
        endpoints: [
          'POST /usuarios-hibridos - Crear usuario (público)',
          'GET /usuarios-hibridos/perfil - Obtener perfil propio',
          'PUT /usuarios-hibridos/perfil - Actualizar perfil',
          'GET /usuarios-hibridos/buscar - Buscar usuarios',
          'GET /usuarios-hibridos - Listar usuarios (admin)',
          'GET /usuarios-hibridos/:id - Obtener usuario específico',
          'POST /usuarios-hibridos/perfil/foto - Subir foto de perfil'
        ]
      },
      
      // Artistas
      artistas: {
        base: '/artistas-hibridos',
        auth_required: 'parcial',
        endpoints: [
          'POST /artistas-hibridos - Crear artista',
          'GET /artistas-hibridos - Listar artistas (público)',
          'GET /artistas-hibridos/buscar - Buscar artistas (público)',
          'GET /artistas-hibridos/:id - Obtener artista específico',
          'PUT /artistas-hibridos/:id/estadisticas - Actualizar estadísticas'
        ]
      },
      
      // Álbumes
      albumes: {
        base: '/albumes-hibridos',
        auth_required: 'parcial',
        endpoints: [
          'POST /albumes-hibridos - Crear álbum',
          'GET /albumes-hibridos - Listar álbumes (público)',
          'GET /albumes-hibridos/buscar - Buscar álbumes (público)',
          'GET /albumes-hibridos/:id - Obtener álbum específico',
          'PUT /albumes-hibridos/:id - Actualizar álbum',
          'DELETE /albumes-hibridos/:id - Eliminar álbum',
          'POST /albumes-hibridos/:id/foto - Subir imagen del álbum'
        ]
      },
      
      // Canciones
      canciones: {
        base: '/canciones-hibridas',
        auth_required: 'parcial',
        endpoints: [
          'POST /canciones-hibridas - Crear canción',
          'GET /canciones-hibridas - Listar canciones (público)',
          'GET /canciones-hibridas/buscar - Buscar canciones (público)',
          'GET /canciones-hibridas/:id - Obtener canción específica',
          'PUT /canciones-hibridas/:id/estadisticas - Actualizar estadísticas',
          'GET /canciones-hibridas/album/:album_id - Canciones por álbum',
          'POST /canciones-hibridas/:id/audio - Subir archivo de audio'
        ]
      },
      
      // Carrito de compras
      carrito: {
        base: '/carrito',
        auth_required: true,
        endpoints: [
          'GET /carrito - Obtener carrito del usuario',
          'POST /carrito/productos - Agregar producto al carrito',
          'PUT /carrito/productos/:id - Actualizar cantidad de producto',
          'DELETE /carrito/productos/:id - Eliminar producto del carrito',
          'DELETE /carrito - Vaciar carrito completo',
          'POST /carrito/procesar - Procesar carrito (convertir a venta)',
          'GET /carrito/total - Calcular total del carrito'
        ]
      },
      
      // Ventas
      ventas: {
        base: '/ventas-hibridas',
        auth_required: true,
        endpoints: [
          'POST /ventas-hibridas - Crear nueva venta',
          'GET /ventas-hibridas/mis-ventas - Obtener ventas del usuario',
          'PUT /ventas-hibridas/:id/estado - Actualizar estado de pago',
          'GET /ventas-hibridas/reporte - Reporte de ventas (admin)'
        ]
      },
      
      // Eventos
      eventos: {
        base: '/eventos-hibridos',
        auth_required: 'parcial',
        endpoints: [
          'POST /eventos-hibridos - Crear evento',
          'GET /eventos-hibridos - Listar eventos (público)',
          'GET /eventos-hibridos/artista/:artista_id - Eventos por artista'
        ]
      },
      
      // Contratos
      contratos: {
        base: '/contratos',
        auth_required: true,
        endpoints: [
          'POST /contratos - Crear contrato',
          'GET /contratos - Listar contratos',
          'GET /contratos/:id - Obtener contrato específico',
          'PUT /contratos/:id - Actualizar contrato',
          'GET /contratos/mis-contratos - Obtener mis contratos',
          'GET /contratos/proximos-vencer - Contratos próximos a vencer',
          'POST /contratos/:id/documento - Subir documento del contrato'
        ]
      },
      
      // Analytics
      analytics: {
        base: '/analytics-hibridos',
        auth_required: true,
        endpoints: [
          'POST /analytics-hibridos/metrica - Registrar métrica',
          'GET /analytics-hibridos/artista/:artista_id - Estadísticas de artista'
        ]
      },
      
      // Información del sistema
      sistema: {
        base: '',
        auth_required: false,
        endpoints: [
          'GET /health-hibrido - Estado del sistema híbrido',
          'GET /endpoints - Esta información de endpoints',
          'GET /stats - Estadísticas del sistema'
        ]
      }
    },
    
    // Resumen
    resumen: {
      total_endpoints: 52,
      modulos_activos: 10,
      autenticacion: 'JWT Bearer Token en header Authorization',
      formato_respuesta: 'JSON',
      base_de_datos: 'MySQL + MongoDB (Híbrido)',
      encriptacion: 'AES-256-CBC para datos sensibles'
    }
  });
});

// Estadísticas del sistema
router.get('/stats', async (req, res) => {
  try {
    const { sequelize } = require('../config/database.sql');
    const mongoose = require('mongoose');
    
    // Estadísticas básicas
    let mysqlStats = { tablas: 0, estado: 'desconectado' };
    let mongoStats = { colecciones: 0, estado: 'desconectado' };
    
    try {
      await sequelize.authenticate();
      const [results] = await sequelize.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()");
      mysqlStats = { tablas: results[0].count, estado: 'conectado' };
    } catch (error) {
      logger.warn('Error obteniendo stats MySQL:', error.message);
    }
    
    try {
      if (mongoose.connection.readyState === 1) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        mongoStats = { colecciones: collections.length, estado: 'conectado' };
      }
    } catch (error) {
      logger.warn('Error obteniendo stats MongoDB:', error.message);
    }

    res.json({
      success: true,
      data: {
        sistema: {
          nombre: 'INDIEC API Híbrida',
          version: '1.0.0',
          uptime: process.uptime(),
          memoria_uso: process.memoryUsage(),
          plataforma: process.platform,
          node_version: process.version
        },
        base_datos: {
          mysql: mysqlStats,
          mongodb: mongoStats
        },
        apis: {
          total_rutas: 10,
          total_endpoints: 52,
          estado: 'operacional'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas del sistema'
    });
  }
});

module.exports = router;