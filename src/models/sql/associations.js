// src/models/sql/associations.js - VERSIÓN CORREGIDA
const Estado = require('./Estado');
const Rol = require('./Rol');
const GeneroMusical = require('./GeneroMusical');
const Pais = require('./Pais');
const Sexo = require('./Sexo');
const UsuarioNuevo = require('./UsuarioNuevo');
const Artista = require('./Artista');
const AlbumNuevo = require('./AlbumNuevo');
const CancionNueva = require('./CancionNueva');
const ArtistaAdquirido = require('./ArtistaAdquirido');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const Carrito = require('./CarritoNuevo');
const CarritoProducto = require('./CarritoProducto');

// Definir asociaciones después de cargar todos los modelos
function definirAsociaciones() {
  // Usuario
  UsuarioNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
  UsuarioNuevo.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
  UsuarioNuevo.belongsTo(Sexo, { foreignKey: 'sexo_id', as: 'sexo' });
  UsuarioNuevo.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });

  // Relaciones inversas
  Estado.hasMany(UsuarioNuevo, { foreignKey: 'estado_id', as: 'usuarios' });
  Rol.hasMany(UsuarioNuevo, { foreignKey: 'rol_id', as: 'usuarios' });
  Sexo.hasMany(UsuarioNuevo, { foreignKey: 'sexo_id', as: 'usuarios' });
  Pais.hasMany(UsuarioNuevo, { foreignKey: 'pais_id', as: 'usuarios' });

  // Artista
  Artista.belongsTo(GeneroMusical, { foreignKey: 'genero_principal_id', as: 'genero_principal' });
  Artista.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });
  Artista.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

  // Álbum
  AlbumNuevo.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
  AlbumNuevo.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
  AlbumNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

  // Canción
  CancionNueva.belongsTo(AlbumNuevo, { foreignKey: 'album_id', as: 'album' });
  CancionNueva.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
  CancionNueva.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
  CancionNueva.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

  // Ventas
  Venta.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
  Venta.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
  Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta', as: 'detalles' });

  DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });

  // Carrito
  Carrito.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
  Carrito.hasMany(CarritoProducto, { foreignKey: 'id_carrito', as: 'productos' });

  CarritoProducto.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
  CarritoProducto.belongsTo(Carrito, { foreignKey: 'id_carrito', as: 'carrito' });

  // Contratos
  ArtistaAdquirido.belongsTo(Artista, { foreignKey: 'id_artista', as: 'artista' });
  ArtistaAdquirido.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
  ArtistaAdquirido.belongsTo(UsuarioNuevo, { foreignKey: 'usuario_gestor_id', as: 'gestor' });
}

// Ejecutar asociaciones
definirAsociaciones();

module.exports = {
  Estado,
  Rol,
  GeneroMusical,
  Pais,
  Sexo,
  UsuarioNuevo,
  Artista,
  AlbumNuevo,
  CancionNueva,
  ArtistaAdquirido,
  Venta,
  DetalleVenta,
  Carrito,
  CarritoProducto,
  definirAsociaciones
};