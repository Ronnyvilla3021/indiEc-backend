const { ArtistaService } = require('../services/servicios_hibridos');

class ArtistaController {
  constructor() {
    this.artistaService = new ArtistaService();
  }

  // Crear nuevo artista
  crearArtista = async (req, res) => {
    try {
      const { 
        nombre, 
        nombre_artistico, 
        genero_principal_id, 
        pais_id,
        biografia,
        redes_sociales,
        influencias_musicales,
        instrumentos
      } = req.body;

      const datosBasicos = {
        nombre,
        nombre_artistico,
        genero_principal_id,
        pais_id,
        estado_id: 1 // Activo por defecto
      };

      const datosExtendidos = {
        biografia,
        redes_sociales,
        influencias_musicales,
        instrumentos
      };

      const resultado = await this.artistaService.crearArtista(datosBasicos, datosExtendidos);

      res.status(201).json({
        success: true,
        message: 'Artista creado exitosamente',
        data: {
          id: resultado.mysql.artista.id,
          nombre: resultado.mysql.artista.nombre
        }
      });
    } catch (error) {
      logger.error('Error al crear artista:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener artista completo
  obtenerArtista = async (req, res) => {
    try {
      const artistaId = req.params.id;
      
      const artista = await this.artistaService.obtenerArtistaCompleto(artistaId);

      if (!artista) {
        return res.status(404).json({
          success: false,
          message: 'Artista no encontrado'
        });
      }

      res.json({
        success: true,
        data: artista
      });
    } catch (error) {
      logger.error('Error al obtener artista:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Buscar artistas
  buscarArtistas = async (req, res) => {
    try {
      const { q, genero_id, pais_id, page = 1, limit = 10 } = req.query;

      const filtros = {};
      if (genero_id) filtros.genero_id = genero_id;
      if (pais_id) filtros.pais_id = pais_id;

      const opciones = { page: parseInt(page), limit: parseInt(limit) };

      const resultado = await this.artistaService.buscarArtistas(q, filtros, opciones);

      res.json({
        success: true,
        data: resultado.artistas,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al buscar artistas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Actualizar estadísticas
  actualizarEstadisticas = async (req, res) => {
    try {
      const artistaId = req.params.id;
      const { reproducciones_totales, seguidores, ventas_digitales, conciertos_realizados } = req.body;

      const estadisticas = {
        reproducciones_totales,
        seguidores,
        ventas_digitales,
        conciertos_realizados
      };

      await this.artistaService.actualizarEstadisticas(artistaId, estadisticas);

      res.json({
        success: true,
        message: 'Estadísticas actualizadas exitosamente'
      });
    } catch (error) {
      logger.error('Error al actualizar estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Listar artistas
  listarArtistas = async (req, res) => {
    try {
      const { page = 1, limit = 20, genero_id } = req.query;

      const filtros = {};
      if (genero_id) filtros.genero_id = genero_id;

      const opciones = { page: parseInt(page), limit: parseInt(limit) };

      const resultado = await this.artistaService.buscarArtistas('', filtros, opciones);

      res.json({
        success: true,
        data: resultado.artistas,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al listar artistas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
}