// src/models/sql/associations.js - VERSIÓN CORREGIDA
const Estado = require('./Estado');
const Rol = require('./Rol');
const GeneroMusical = require('./GeneroMusical');
const Pais = require('./Pais');
const Sexo = require('./Sexo');
const UsuarioNuevo = require('./UsuarioNuevo');

// Modelos originales
const Music = require('./Music');
const Album = require('./Album');
const Group = require('./Group');
const Event = require('./Event');

// Nuevos modelos híbridos
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
  try {
    // ================================
    // ASOCIACIONES BÁSICAS - CATÁLOGOS
    // ================================

    // Usuario con catálogos
    UsuarioNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
    UsuarioNuevo.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
    UsuarioNuevo.belongsTo(Sexo, { foreignKey: 'sexo_id', as: 'sexo' });
    UsuarioNuevo.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });

    // Relaciones inversas de catálogos
    Estado.hasMany(UsuarioNuevo, { foreignKey: 'estado_id', as: 'usuarios' });
    Rol.hasMany(UsuarioNuevo, { foreignKey: 'rol_id', as: 'usuarios' });
    Sexo.hasMany(UsuarioNuevo, { foreignKey: 'sexo_id', as: 'usuarios' });
    Pais.hasMany(UsuarioNuevo, { foreignKey: 'pais_id', as: 'usuarios' });

    // Géneros musicales con estado
    GeneroMusical.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
    Estado.hasMany(GeneroMusical, { foreignKey: 'estado_id', as: 'generos_musicales' });

    // Países con estado
    Pais.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
    Estado.hasMany(Pais, { foreignKey: 'estado_id', as: 'paises' });

    // ================================
    // ASOCIACIONES SISTEMA ORIGINAL
    // ================================

    // Music con Usuario
    Music.belongsTo(UsuarioNuevo, { 
      foreignKey: 'user_id', 
      targetKey: 'id_usuario',
      as: 'user' 
    });
    UsuarioNuevo.hasMany(Music, { 
      foreignKey: 'user_id', 
      sourceKey: 'id_usuario',
      as: 'music' 
    });

    // Album con Usuario
    Album.belongsTo(UsuarioNuevo, { 
      foreignKey: 'user_id', 
      targetKey: 'id_usuario',
      as: 'user' 
    });
    UsuarioNuevo.hasMany(Album, { 
      foreignKey: 'user_id', 
      sourceKey: 'id_usuario',
      as: 'albums' 
    });

    // Group con Usuario
    Group.belongsTo(UsuarioNuevo, { 
      foreignKey: 'user_id', 
      targetKey: 'id_usuario',
      as: 'user' 
    });
    UsuarioNuevo.hasMany(Group, { 
      foreignKey: 'user_id', 
      sourceKey: 'id_usuario',
      as: 'groups' 
    });

    // Event con Usuario
    Event.belongsTo(UsuarioNuevo, { 
      foreignKey: 'user_id', 
      targetKey: 'id_usuario',
      as: 'user' 
    });
    UsuarioNuevo.hasMany(Event, { 
      foreignKey: 'user_id', 
      sourceKey: 'id_usuario',
      as: 'events' 
    });

    // ================================
    // ASOCIACIONES SISTEMA HÍBRIDO
    // ================================

    // Artista con catálogos
    Artista.belongsTo(GeneroMusical, { foreignKey: 'genero_principal_id', as: 'genero_principal' });
    Artista.belongsTo(Pais, { foreignKey: 'pais_id', as: 'pais' });
    Artista.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

    // Relaciones inversas de artista
    GeneroMusical.hasMany(Artista, { foreignKey: 'genero_principal_id', as: 'artistas' });
    Pais.hasMany(Artista, { foreignKey: 'pais_id', as: 'artistas' });
    Estado.hasMany(Artista, { foreignKey: 'estado_id', as: 'artistas' });

    // Álbum Nuevo con referencias
    AlbumNuevo.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
    AlbumNuevo.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
    AlbumNuevo.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

    // Relaciones inversas de álbum
    Artista.hasMany(AlbumNuevo, { foreignKey: 'artista_id', as: 'albumes' });
    GeneroMusical.hasMany(AlbumNuevo, { foreignKey: 'genero_id', as: 'albumes' });
    Estado.hasMany(AlbumNuevo, { foreignKey: 'estado_id', as: 'albumes' });

    // Canción Nueva con referencias
    CancionNueva.belongsTo(AlbumNuevo, { foreignKey: 'album_id', as: 'album' });
    CancionNueva.belongsTo(Artista, { foreignKey: 'artista_id', as: 'artista' });
    CancionNueva.belongsTo(GeneroMusical, { foreignKey: 'genero_id', as: 'genero' });
    CancionNueva.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });

    // Relaciones inversas de canción
    AlbumNuevo.hasMany(CancionNueva, { foreignKey: 'album_id', as: 'canciones' });
    Artista.hasMany(CancionNueva, { foreignKey: 'artista_id', as: 'canciones' });
    GeneroMusical.hasMany(CancionNueva, { foreignKey: 'genero_id', as: 'canciones' });
    Estado.hasMany(CancionNueva, { foreignKey: 'estado_id', as: 'canciones' });

    // ================================
    // ASOCIACIONES DE VENTAS
    // ================================

    // Venta con Usuario y Estado
    Venta.belongsTo(UsuarioNuevo, { 
      foreignKey: 'id_usuario', 
      targetKey: 'id_usuario',
      as: 'usuario' 
    });
    Venta.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
    Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta', as: 'detalles' });

    // Relaciones inversas de venta
    UsuarioNuevo.hasMany(Venta, { 
      foreignKey: 'id_usuario', 
      sourceKey: 'id_usuario',
      as: 'ventas' 
    });
    Estado.hasMany(Venta, { foreignKey: 'estado_id', as: 'ventas' });

    // Detalle de venta
    DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });

    // ================================
    // ASOCIACIONES DE CARRITO
    // ================================

    // Carrito con Usuario
    Carrito.belongsTo(UsuarioNuevo, { 
      foreignKey: 'id_usuario', 
      targetKey: 'id_usuario',
      as: 'usuario' 
    });
    Carrito.hasMany(CarritoProducto, { foreignKey: 'id_carrito', as: 'productos' });

    // Relaciones inversas de carrito
    UsuarioNuevo.hasMany(Carrito, { 
      foreignKey: 'id_usuario', 
      sourceKey: 'id_usuario',
      as: 'carritos' 
    });

    // Carrito Producto
    CarritoProducto.belongsTo(UsuarioNuevo, { 
      foreignKey: 'id_usuario', 
      targetKey: 'id_usuario',
      as: 'usuario' 
    });
    CarritoProducto.belongsTo(Carrito, { foreignKey: 'id_carrito', as: 'carrito' });

    // ================================
    // ASOCIACIONES DE CONTRATOS
    // ================================

    // Artista Adquirido (Contratos)
    ArtistaAdquirido.belongsTo(Artista, { foreignKey: 'id_artista', as: 'artista' });
    ArtistaAdquirido.belongsTo(Estado, { foreignKey: 'estado_id', as: 'estado' });
    ArtistaAdquirido.belongsTo(UsuarioNuevo, { 
      foreignKey: 'usuario_gestor_id', 
      targetKey: 'id_usuario',
      as: 'gestor' 
    });

    // Relaciones inversas de contratos
    Artista.hasMany(ArtistaAdquirido, { foreignKey: 'id_artista', as: 'contratos' });
    Estado.hasMany(ArtistaAdquirido, { foreignKey: 'estado_id', as: 'contratos' });
    UsuarioNuevo.hasMany(ArtistaAdquirido, { 
      foreignKey: 'usuario_gestor_id', 
      sourceKey: 'id_usuario',
      as: 'contratos_gestionados' 
    });

    console.log('✅ Asociaciones configuradas correctamente');

  } catch (error) {
    console.error('❌ Error configurando asociaciones:', error);
    throw error;
  }
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
  Music,
  Album,
  Group,
  Event,
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