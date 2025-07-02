const express = require('express');
const { ArtistaController } = require('../controllers/controladores_hibridos');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const artistaController = new ArtistaController();

// Validación para artistas
const validarArtista = {
  crear: {
    body: {
      nombre: { type: 'string', required: true, min: 2, max: 100 },
      nombre_artistico: { type: 'string', optional: true, max: 100 },
      genero_principal_id: { type: 'number', optional: true },
      pais_id: { type: 'number', optional: true },
      biografia: { type: 'string', optional: true, max: 2000 },
      redes_sociales: { type: 'object', optional: true },
      influencias_musicales: { type: 'array', optional: true },
      instrumentos: { type: 'array', optional: true }
    }
  }
};

// RUTAS

// POST /api/artistas-hibridos - Crear artista
router.post('/', authenticateToken, validarDatos(validarArtista.crear), artistaController.crearArtista);

// GET /api/artistas-hibridos - Listar artistas
router.get('/', artistaController.listarArtistas);

// GET /api/artistas-hibridos/buscar - Buscar artistas
router.get('/buscar', artistaController.buscarArtistas);

// GET /api/artistas-hibridos/:id - Obtener artista específico
router.get('/:id', artistaController.obtenerArtista);

// PUT /api/artistas-hibridos/:id/estadisticas - Actualizar estadísticas
router.put('/:id/estadisticas', authenticateToken, artistaController.actualizarEstadisticas);

module.exports = router;