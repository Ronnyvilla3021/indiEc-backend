const { sequelize } = require('../config/database.sql');
const { connectMongoDB } = require('../config/database.orm');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Importar todos los servicios
const { HybridService, UsuarioService, ArtistaService, VentaService, EventoService, AnalyticsService } = require('./servicios_hibridos');
const { AlbumService, CancionService, CarritoService, ContratoService } = require('./servicios_faltantes');

module.exports = {
  // Servicios originales
  HybridService,
  UsuarioService,
  ArtistaService,
  VentaService,
  EventoService,
  AnalyticsService,
  
  // Servicios nuevos integrados
  AlbumService,
  CancionService,
  CarritoService,
  ContratoService
};