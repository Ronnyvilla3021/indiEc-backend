const express = require('express');
// CORREGIR LA IMPORTACIÓN - quitar las llaves
const ArtistaController = require('../controllers/ArtistaController'); // SIN llaves {}
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const artistaController = new ArtistaController();

// RUTAS

// POST /api/artistas-hibridos - Crear artista
router.post('/', authenticateToken, artistaController.crearArtista);

// GET /api/artistas-hibridos - Listar artistas
router.get('/', artistaController.listarArtistas);

// GET /api/artistas-hibridos/buscar - Buscar artistas
router.get('/buscar', artistaController.buscarArtistas);

// GET /api/artistas-hibridos/:id - Obtener artista específico
router.get('/:id', artistaController.obtenerArtista);

// PUT /api/artistas-hibridos/:id/estadisticas - Actualizar estadísticas
router.put('/:id/estadisticas', authenticateToken, artistaController.actualizarEstadisticas);

module.exports = router;
