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

// NUEVOS MODELOS AGREGADOS
const Carrito = require('./CarritoNuevo');
const CarritoProducto = require('./CarritoProducto');

// ================================
// RELACIONES EXISTENTES
// ================================

// Relaciones de Usuario
UsuarioNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
UsuarioNuevo.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
UsuarioNuevo.belongsTo(Sexo, { foreignKey: 'sexo_id', as: 'sexo' });
UsuarioNuevo.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });

Estado.hasMany(UsuarioNuevo, { foreignKey: 'estado_id', as: 'usuarios' });
Rol.hasMany(UsuarioNuevo, { foreignKey: 'rol_id', as: 'usuarios' });
Sexo.hasMany(UsuarioNuevo, { foreignKey: 'sexo_id', as: 'usuarios' });
Pais.hasMany(UsuarioNuevo, { foreignKey: 'pais_id', as: 'usuarios' });

// Relaciones de Artista
Artista.belongsTo(GeneroMusical, { foreignKey: 'genero_principal_id', as: 'genero_principal' });
Artista.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });
Artista.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

GeneroMusical.hasMany(Artista, { foreignKey: 'genero_principal_id', as: 'artistas' });
Pais.hasMany(Artista, { foreignKey: 'pais_id', as: 'artistas' });
Estado.hasMany(Artista, { foreignKey: 'estado_id', as: 'artistas' });

// Relaciones de Álbum
AlbumNuevo.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
AlbumNuevo.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
AlbumNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

Artista.hasMany(AlbumNuevo, { foreignKey: 'artista_id', as: 'albumes' });
GeneroMusical.hasMany(AlbumNuevo, { foreignKey: 'genero_id', as: 'albumes' });
Estado.hasMany(AlbumNuevo, { foreignKey: 'estado_id', as: 'albumes' });

// Relaciones de Canción
CancionNueva.belongsTo(AlbumNuevo, { foreignKey: 'album_id', as: 'album' });
CancionNueva.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
CancionNueva.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
CancionNueva.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

AlbumNuevo.hasMany(CancionNueva, { foreignKey: 'album_id', as: 'canciones' });
Artista.hasMany(CancionNueva, { foreignKey: 'artista_id', as: 'canciones' });
GeneroMusical.hasMany(CancionNueva, { foreignKey: 'genero_id', as: 'canciones' });
Estado.hasMany(CancionNueva, { foreignKey: 'estado_id', as: 'canciones' });

// Relaciones de Artistas Adquiridos
ArtistaAdquirido.belongsTo(Artista, { foreignKey: 'id_artista', as: 'artista' });
ArtistaAdquirido.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
ArtistaAdquirido.belongsTo(UsuarioNuevo, { foreignKey: 'usuario_gestor_id', as: 'gestor' });

Artista.hasMany(ArtistaAdquirido, { foreignKey: 'id_artista', as: 'adquisiciones' });
Estado.hasMany(ArtistaAdquirido, { foreignKey: 'estado_id', as: 'adquisiciones' });
UsuarioNuevo.hasMany(ArtistaAdquirido, { foreignKey: 'usuario_gestor_id', as: 'adquisiciones_gestionadas' });

// Relaciones de Ventas
Venta.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
Venta.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

UsuarioNuevo.hasMany(Venta, { foreignKey: 'id_usuario', as: 'ventas' });
Estado.hasMany(Venta, { foreignKey: 'estado_id', as: 'ventas' });

// Relaciones de Detalle de Ventas
DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta', as: 'detalles' });

// ================================
// NUEVAS RELACIONES DE CARRITO
// ================================

// Relaciones de Carrito
Carrito.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
UsuarioNuevo.hasMany(Carrito, { foreignKey: 'id_usuario', as: 'carritos' });

// Relaciones de CarritoProducto
CarritoProducto.belongsTo(UsuarioNuevo, { foreignKey: 'id_usuario', as: 'usuario' });
CarritoProducto.belongsTo(Carrito, { foreignKey: 'id_carrito', as: 'carrito' });

UsuarioNuevo.hasMany(CarritoProducto, { foreignKey: 'id_usuario', as: 'productos_carrito' });
Carrito.hasMany(CarritoProducto, { foreignKey: 'id_carrito', as: 'productos' });

// Relaciones de Géneros Musicales con Estado
GeneroMusical.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
Estado.hasMany(GeneroMusical, { foreignKey: 'estado_id', as: 'generos_musicales' });

// Relaciones de País con Estado
Pais.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
Estado.hasMany(Pais, { foreignKey: 'estado_id', as: 'paises' });

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
  CarritoProducto
};