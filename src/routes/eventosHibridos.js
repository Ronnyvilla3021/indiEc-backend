const express = require('express');
// CORREGIR LA IMPORTACIÓN - quitar las llaves
const EventoController = require('../controllers/EventoController'); // SIN llaves {}
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const eventoController = new EventoController();

// RUTAS

// POST /api/eventos-hibridos - Crear evento
router.post('/', authenticateToken, eventoController.crearEvento);

// GET /api/eventos-hibridos - Listar eventos
router.get('/', eventoController.listarEventos);

// GET /api/eventos-hibridos/artista/:artista_id - Eventos por artista
router.get('/artista/:artista_id', eventoController.buscarEventosPorArtista);

module.exports = router;
