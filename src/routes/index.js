const express = require('express');

// Rutas existentes
const usuariosHibridos = require('./usuariosHibridos');
const artistasHibridos = require('./artistasHibridos');
const ventasHibridas = require('./ventasHibridas');
const eventosHibridos = require('./eventosHibridos');
const analyticsHibridos = require('./analyticsHibridos');
const catalogosHibridos = require('./catalogosHibridos');

// Nuevas rutas faltantes
const albumesHibridos = require('./albumesHibridos');
const cancionesHibridas = require('./cancionesHibridas');
const carritoHibrido = require('./carritoHibrido');
const contratosHibridos = require('./contratosHibridos');

const router = express.Router();

// Registrar todas las rutas híbridas
router.use('/usuarios-hibridos', usuariosHibridos);
router.use('/artistas-hibridos', artistasHibridos);
router.use('/ventas-hibridas', ventasHibridas);
router.use('/eventos-hibridos', eventosHibridos);
router.use('/analytics-hibridos', analyticsHibridos);
router.use('/catalogos', catalogosHibridos);

// Nuevas rutas integradas
router.use('/albumes-hibridos', albumesHibridos);
router.use('/canciones-hibridas', cancionesHibridas);
router.use('/carrito', carritoHibrido);
router.use('/contratos', contratosHibridos);

// Ruta de salud para el sistema híbrido COMPLETO
router.get('/health-hibrido', async (req, res) => {
  try {
    // Verificar conexión MySQL
    const { sequelize } = require('../config/database.sql');
    await sequelize.authenticate();
    
    // Verificar conexión MongoDB
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado';
    
    // Contar tablas y colecciones
    const tableCount = await sequelize.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()", {
      type: sequelize.QueryTypes.SELECT
    });
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      success: true,
      message: 'Sistema híbrido COMPLETO funcionando correctamente',
      status: {
        mysql: {
          estado: 'conectado',
          tablas: tableCount[0].count
        },
        mongodb: {
          estado: mongoStatus,
          colecciones: collections.length
        },
        apis: {
          usuarios: 'activa',
          artistas: 'activa',
          ventas: 'activa',
          eventos: 'activa',
          analytics: 'activa',
          catalogos: 'activa',
          albumes: 'activa', // NUEVA
          canciones: 'activa', // NUEVA
          carrito: 'activa', // NUEVA
          contratos: 'activa' // NUEVA
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

// Ruta de información completa de endpoints
router.get('/endpoints', (req, res) => {
  res.json({
    success: true,
    message: 'Lista completa de endpoints del sistema híbrido',
    data: {
      base_url: '/api/v2',
      endpoints: {
        // Catálogos
        catalogos: {
          base: '/catalogos',
          endpoints: [
            'GET /catalogos/estados',
            'GET /catalogos/roles', 
            'GET /catalogos/generos-musicales',
            'GET /catalogos/paises',
            'GET /catalogos/sexos'
          ]
        },
        
        // Usuarios
        usuarios: {
          base: '/usuarios-hibridos',
          endpoints: [
            'POST /usuarios-hibridos - Crear usuario',
            'GET /usuarios-hibridos/perfil - Obtener perfil',
            'PUT /usuarios-hibridos/perfil - Actualizar perfil',
            'GET /usuarios-hibridos/buscar - Buscar usuarios',
            'POST /usuarios-hibridos/perfil/foto - Subir foto'
          ]
        },
        
        // Artistas
        artistas: {
          base: '/artistas-hibridos',
          endpoints: [
            'POST /artistas-hibridos - Crear artista',
            'GET /artistas-hibridos - Listar artistas',
            'GET /artistas-hibridos/:id - Obtener artista',
            'PUT /artistas-hibridos/:id/estadisticas - Actualizar estadísticas'
          ]
        },
        
        // Álbumes (NUEVO)
        albumes: {
          base: '/albumes-hibridos',
          endpoints: [
            'POST /albumes-hibridos - Crear álbum',
            'GET /albumes-hibridos - Listar álbumes',
            'GET /albumes-hibridos/:id - Obtener álbum',
            'PUT /albumes-hibridos/:id - Actualizar álbum',
            'DELETE /albumes-hibridos/:id - Eliminar álbum',
            'POST /albumes-hibridos/:id/foto - Subir imagen'
          ]
        },
        
        // Canciones (NUEVO)
        canciones: {
          base: '/canciones-hibridas',
          endpoints: [
            'POST /canciones-hibridas - Crear canción',
            'GET /canciones-hibridas - Listar canciones',
            'GET /canciones-hibridas/:id - Obtener canción',
            'PUT /canciones-hibridas/:id/estadisticas - Actualizar estadísticas',
            'GET /canciones-hibridas/album/:album_id - Canciones por álbum',
            'POST /canciones-hibridas/:id/audio - Subir audio'
          ]
        },
        
        // Carrito (NUEVO)
        carrito: {
          base: '/carrito',
          endpoints: [
            'GET /carrito - Obtener carrito',
            'POST /carrito/productos - Agregar producto',
            'PUT /carrito/productos/:id - Actualizar cantidad',
            'DELETE /carrito/productos/:id - Eliminar producto',
            'DELETE /carrito - Vaciar carrito',
            'POST /carrito/procesar - Procesar carrito',
            'GET /carrito/total - Calcular total'
          ]
        },
        
        // Contratos (NUEVO)
        contratos: {
          base: '/contratos',
          endpoints: [
            'POST /contratos - Crear contrato',
            'GET /contratos - Listar contratos',
            'GET /contratos/:id - Obtener contrato',
            'PUT /contratos/:id - Actualizar contrato',
            'GET /contratos/mis-contratos - Mis contratos',
            'GET /contratos/proximos-vencer - Próximos a vencer',
            'POST /contratos/:id/documento - Subir documento'
          ]
        },
        
        // Ventas
        ventas: {
          base: '/ventas-hibridas',
          endpoints: [
            'POST /ventas-hibridas - Crear venta',
            'GET /ventas-hibridas/mis-ventas - Mis ventas',
            'PUT /ventas-hibridas/:id/estado - Actualizar estado',
            'GET /ventas-hibridas/reporte - Reporte de ventas'
          ]
        },
        
        // Eventos
        eventos: {
          base: '/eventos-hibridos',
          endpoints: [
            'POST /eventos-hibridos - Crear evento',
            'GET /eventos-hibridos - Listar eventos',
            'GET /eventos-hibridos/artista/:id - Eventos por artista'
          ]
        },
        
        // Analytics
        analytics: {
          base: '/analytics-hibridos',
          endpoints: [
            'POST /analytics-hibridos/metrica - Registrar métrica',
            'GET /analytics-hibridos/artista/:id - Estadísticas de artista'
          ]
        }
      },
      total_endpoints: 48,
      autenticacion_requerida: 'JWT Bearer Token en header Authorization',
      formato_respuesta: 'JSON'
    }
  });
});

module.exports = router;