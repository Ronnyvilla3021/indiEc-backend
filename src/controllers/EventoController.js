const { EventoService } = require('../services/servicios_hibridos');

class EventoController {
  constructor() {
    this.eventoService = new EventoService();
  }

  // Crear nuevo evento
  crearEvento = async (req, res) => {
    try {
      const eventoData = req.body;

      // Validaciones básicas
      if (!eventoData.nombre_evento || !eventoData.fecha_evento) {
        return res.status(400).json({
          success: false,
          message: 'Nombre del evento y fecha son requeridos'
        });
      }

      const resultado = await this.eventoService.crearEvento(eventoData);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: {
          id: resultado.evento_id
        }
      });
    } catch (error) {
      logger.error('Error al crear evento:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Listar eventos
  listarEventos = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        ciudad, 
        fecha_desde, 
        fecha_hasta 
      } = req.query;

      const filtros = {};
      if (estado) filtros.estado = estado;
      if (ciudad) filtros.ciudad = ciudad;
      if (fecha_desde) filtros.fecha_desde = fecha_desde;
      if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

      const opciones = { page: parseInt(page), limit: parseInt(limit) };

      const resultado = await this.eventoService.obtenerEventos(filtros, opciones);

      res.json({
        success: true,
        data: resultado.eventos,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al listar eventos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Buscar eventos por artista
  buscarEventosPorArtista = async (req, res) => {
    try {
      const { artista_id } = req.params;

      const eventos = await this.eventoService.buscarEventosPorArtista(parseInt(artista_id));

      res.json({
        success: true,
        data: eventos
      });
    } catch (error) {
      logger.error('Error al buscar eventos por artista:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
}