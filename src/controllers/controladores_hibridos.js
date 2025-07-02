const { UsuarioController, ArtistaController, VentaController, EventoController, AnalyticsController } = require('./controladores_hibridos');
const { AlbumController, CancionController, CarritoController, ContratoController } = require('./controladores_faltantes');

module.exports = {
  // Controladores originales
  UsuarioController,
  ArtistaController,
  VentaController,
  EventoController,
  AnalyticsController,
  
  // Controladores nuevos integrados
  AlbumController,
  CancionController,
  CarritoController,
  ContratoController
};