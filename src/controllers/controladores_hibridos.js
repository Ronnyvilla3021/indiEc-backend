// Importar TODOS los controladores SIN llaves
const UsuarioController = require('./UsuarioController');
const ArtistaController = require('./ArtistaController');
const VentaController = require('./VentaController');
const EventoController = require('./EventoController');
const AnalyticsController = require('./AnalyticsController');

// Importar controladores faltantes
const { AlbumController } = require('./AlbumController'); // ESTE mantiene llaves porque se exporta con llaves
const CancionController = require('./CancionController');
const CarritoController = require('./CarritoController');
const ContratoController = require('./ContratoController');

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
