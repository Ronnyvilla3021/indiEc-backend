const express = require('express');
// CORREGIR LA IMPORTACIÓN - quitar las llaves
const AnalyticsController = require('../controllers/AnalyticsController'); // SIN llaves {}
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const analyticsController = new AnalyticsController();

// RUTAS

// POST /api/analytics-hibridos/metrica - Registrar métrica
router.post('/metrica', authenticateToken, analyticsController.registrarMetrica);

// GET /api/analytics-hibridos/artista/:artista_id - Estadísticas de artista
router.get('/artista/:artista_id', authenticateToken, analyticsController.obtenerEstadisticasArtista);

module.exports = router;