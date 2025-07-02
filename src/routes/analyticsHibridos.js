const express = require('express');
const { AnalyticsController } = require('../controllers/controladores_hibridos');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const analyticsController = new AnalyticsController();

// Validación para analytics
const validarAnalytics = {
  metrica: {
    body: {
      tipo_entidad: { type: 'string', required: true },
      id_entidad: { type: 'number', required: true },
      metricas: { type: 'object', required: true },
      metadatos: { type: 'object', optional: true }
    }
  }
};

// RUTAS

// POST /api/analytics-hibridos/metrica - Registrar métrica
router.post('/metrica', authenticateToken, validarDatos(validarAnalytics.metrica), analyticsController.registrarMetrica);

// GET /api/analytics-hibridos/artista/:artista_id - Estadísticas de artista
router.get('/artista/:artista_id', authenticateToken, analyticsController.obtenerEstadisticasArtista);

module.exports = router;