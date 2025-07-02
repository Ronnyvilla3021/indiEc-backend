const express = require('express');
const { EventoController } = require('../controllers/controladores_hibridos');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const eventoController = new EventoController();

// Validación para eventos
const validarEvento = {
  crear: {
    body: {
      nombre_evento: { type: 'string', required: true, min: 3, max: 200 },
      descripcion: { type: 'string', required: true, max: 2000 },
      fecha_evento: { type: 'string', required: true },
      capacidad: { type: 'number', required: true },
      venue: { type: 'string', optional: true },
      direccion: { type: 'string', optional: true },
      ciudad: { type: 'string', optional: true },
      pais: { type: 'string', optional: true }
    }
  }
};

// RUTAS

// POST /api/eventos-hibridos - Crear evento
router.post('/', authenticateToken, validarDatos(validarEvento.crear), eventoController.crearEvento);

// GET /api/eventos-hibridos - Listar eventos
router.get('/', eventoController.listarEventos);

// GET /api/eventos-hibridos/artista/:artista_id - Eventos por artista
router.get('/artista/:artista_id', eventoController.buscarEventosPorArtista);

module.exports = router;