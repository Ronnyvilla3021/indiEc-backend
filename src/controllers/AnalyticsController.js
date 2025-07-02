class AnalyticsController {
  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // Registrar métrica
  registrarMetrica = async (req, res) => {
    try {
      const { tipo_entidad, id_entidad, metricas, metadatos } = req.body;

      if (!tipo_entidad || !id_entidad || !metricas) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de entidad, ID y métricas son requeridos'
        });
      }

      await this.analyticsService.registrarMetrica(tipo_entidad, id_entidad, metricas, metadatos);

      res.json({
        success: true,
        message: 'Métrica registrada exitosamente'
      });
    } catch (error) {
      logger.error('Error al registrar métrica:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener estadísticas de artista
  obtenerEstadisticasArtista = async (req, res) => {
    try {
      const { artista_id } = req.params;
      const { dias = 30 } = req.query;

      const estadisticas = await this.analyticsService.obtenerEstadisticasArtista(
        parseInt(artista_id), 
        parseInt(dias)
      );

      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      logger.error('Error al obtener estadísticas del artista:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
}

module.exports = {
  UsuarioController,
  ArtistaController,
  VentaController,
  EventoController,
  AnalyticsController
};