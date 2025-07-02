const { sequelize } = require('../config/database.sql');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Clase base para servicios híbridos
class HybridService {
  constructor() {
    this.mongoConnection = mongoose.connection;
  }

  async executeHybridTransaction(mysqlOperations, mongoOperations) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Ejecutar operaciones MySQL en transacción
      const mysqlResults = {};
      for (const [key, operation] of Object.entries(mysqlOperations)) {
        mysqlResults[key] = await operation(transaction);
      }

      // 2. Ejecutar operaciones MongoDB
      const mongoResults = {};
      for (const [key, operation] of Object.entries(mongoOperations)) {
        mongoResults[key] = await operation(mysqlResults);
      }

      // 3. Confirmar transacción MySQL
      await transaction.commit();

      return { success: true, mysql: mysqlResults, mongo: mongoResults };
    } catch (error) {
      // Rollback MySQL
      await transaction.rollback();
      
      logger.error('Error en transacción híbrida:', error);
      throw error;
    }
  }
}

// Servicio de Álbumes
class AlbumService extends HybridService {
  async crearAlbum(albumData, contentData = {}) {
    return await this.executeHybridTransaction(
      {
        album: async (transaction) => {
          // Por ahora usamos el modelo original Album
          const Album = require('../models/sql/Album');
          return await Album.create({
            titulo: albumData.titulo,
            artista: albumData.artista || 'Artista Desconocido',
            año: albumData.año || new Date().getFullYear(),
            genero: albumData.genero || 'Rock',
            user_id: albumData.user_id
          }, { transaction });
        }
      },
      {
        contenido: async (mysqlResults) => {
          const album = mysqlResults.album;
          
          return await mongoose.connection.collection('albumes_content').insertOne({
            id_album: album.id,
            foto_url: contentData.foto_url || null,
            descripcion_extendida: contentData.descripcion_extendida || '',
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerAlbumCompleto(albumId) {
    try {
      const Album = require('../models/sql/Album');
      const album = await Album.findByPk(albumId);
      
      if (!album) return null;

      const contenido = await mongoose.connection.collection('albumes_content')
        .findOne({ id_album: parseInt(albumId) });

      return {
        ...album.toJSON(),
        contenido: contenido || {}
      };
    } catch (error) {
      logger.error('Error al obtener álbum completo:', error);
      throw error;
    }
  }

  async buscarAlbumes(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const Album = require('../models/sql/Album');
      const whereClause = {};

      if (query) {
        whereClause.titulo = { [sequelize.Op.like]: `%${query}%` };
      }

      const { count, rows } = await Album.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        albumes: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar álbumes:', error);
      throw error;
    }
  }

  async listarAlbumes(filtros = {}, opciones = {}) {
    return await this.buscarAlbumes('', filtros, opciones);
  }

  async actualizarAlbum(albumId, datosActualizados) {
    try {
      const Album = require('../models/sql/Album');
      const album = await Album.findByPk(albumId);
      
      if (!album) return null;

      await album.update(datosActualizados);
      return album;
    } catch (error) {
      logger.error('Error al actualizar álbum:', error);
      throw error;
    }
  }

  async eliminarAlbum(albumId) {
    try {
      const Album = require('../models/sql/Album');
      const resultado = await Album.destroy({
        where: { id: albumId }
      });

      if (resultado > 0) {
        // También eliminar de MongoDB
        await mongoose.connection.collection('albumes_content')
          .deleteOne({ id_album: parseInt(albumId) });
      }

      return resultado > 0;
    } catch (error) {
      logger.error('Error al eliminar álbum:', error);
      throw error;
    }
  }
}

// Servicio de Canciones
class CancionService extends HybridService {
  async crearCancion(cancionData, contentData = {}) {
    return await this.executeHybridTransaction(
      {
        cancion: async (transaction) => {
          const Music = require('../models/sql/Music');
          return await Music.create({
            titulo: cancionData.titulo,
            album: cancionData.album || 'Single',
            duracion: cancionData.duracion || '3:00',
            año: cancionData.año || new Date().getFullYear(),
            genero: cancionData.genero || 'Rock',
            user_id: cancionData.user_id
          }, { transaction });
        }
      },
      {
        contenido: async (mysqlResults) => {
          const cancion = mysqlResults.cancion;
          
          return await mongoose.connection.collection('canciones_content').insertOne({
            id_cancion: cancion.id,
            letra: contentData.letra || '',
            url_audio: contentData.url_audio || null,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerCancion(cancionId) {
    try {
      const Music = require('../models/sql/Music');
      const cancion = await Music.findByPk(cancionId);
      
      if (!cancion) return null;

      const contenido = await mongoose.connection.collection('canciones_content')
        .findOne({ id_cancion: parseInt(cancionId) });

      return {
        ...cancion.toJSON(),
        contenido: contenido || {}
      };
    } catch (error) {
      logger.error('Error al obtener canción:', error);
      throw error;
    }
  }

  async buscarCanciones(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const Music = require('../models/sql/Music');
      const whereClause = {};

      if (query) {
        whereClause.titulo = { [sequelize.Op.like]: `%${query}%` };
      }

      const { count, rows } = await Music.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        canciones: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar canciones:', error);
      throw error;
    }
  }

  async listarCanciones(filtros = {}, opciones = {}) {
    return await this.buscarCanciones('', filtros, opciones);
  }

  async actualizarEstadisticas(cancionId, estadisticas) {
    try {
      return await mongoose.connection.collection('canciones_content')
        .findOneAndUpdate(
          { id_cancion: parseInt(cancionId) },
          { 
            $set: {
              estadisticas: estadisticas,
              updated_at: new Date()
            }
          },
          { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al actualizar estadísticas:', error);
      throw error;
    }
  }

  async obtenerCancionesPorAlbum(albumId) {
    try {
      const Music = require('../models/sql/Music');
      return await Music.findAll({
        where: { album: albumId },
        order: [['created_at', 'ASC']]
      });
    } catch (error) {
      logger.error('Error al obtener canciones por álbum:', error);
      throw error;
    }
  }
}

// Servicio de Carrito
class CarritoService extends HybridService {
  async obtenerCarrito(usuarioId) {
    try {
      // Por simplicidad, usar MongoDB para el carrito
      let carrito = await mongoose.connection.collection('carritos')
        .findOne({ id_usuario: usuarioId, estado: 'Activo' });

      if (!carrito) {
        const resultado = await mongoose.connection.collection('carritos').insertOne({
          id_usuario: usuarioId,
          estado: 'Activo',
          productos: [],
          created_at: new Date(),
          updated_at: new Date()
        });
        carrito = { _id: resultado.insertedId, id_usuario: usuarioId, productos: [] };
      }

      return carrito;
    } catch (error) {
      logger.error('Error al obtener carrito:', error);
      throw error;
    }
  }

  async agregarProducto(usuarioId, productoData) {
    try {
      const producto = {
        id_producto: productoData.id_producto,
        tipo_producto: productoData.tipo_producto,
        cantidad: productoData.cantidad || 1,
        precio_unitario: productoData.precio_unitario,
        fecha_agregado: new Date()
      };

      return await mongoose.connection.collection('carritos')
        .findOneAndUpdate(
          { id_usuario: usuarioId, estado: 'Activo' },
          { 
            $push: { productos: producto },
            $set: { updated_at: new Date() }
          },
          { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al agregar producto:', error);
      throw error;
    }
  }

  async eliminarProducto(usuarioId, productoId) {
    try {
      return await mongoose.connection.collection('carritos')
        .findOneAndUpdate(
          { id_usuario: usuarioId, estado: 'Activo' },
          { 
            $pull: { productos: { id_producto: parseInt(productoId) } },
            $set: { updated_at: new Date() }
          },
          { returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al eliminar producto:', error);
      throw error;
    }
  }

  async actualizarCantidad(usuarioId, productoId, nuevaCantidad) {
    try {
      if (nuevaCantidad <= 0) {
        return await this.eliminarProducto(usuarioId, productoId);
      }

      return await mongoose.connection.collection('carritos')
        .findOneAndUpdate(
          { 
            id_usuario: usuarioId, 
            estado: 'Activo',
            'productos.id_producto': parseInt(productoId)
          },
          { 
            $set: { 
              'productos.$.cantidad': nuevaCantidad,
              updated_at: new Date()
            }
          },
          { returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al actualizar cantidad:', error);
      throw error;
    }
  }

  async vaciarCarrito(usuarioId) {
    try {
      return await mongoose.connection.collection('carritos')
        .findOneAndUpdate(
          { id_usuario: usuarioId, estado: 'Activo' },
          { 
            $set: { 
              productos: [],
              updated_at: new Date()
            }
          },
          { returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al vaciar carrito:', error);
      throw error;
    }
  }

  async procesarCarrito(usuarioId) {
    try {
      const carrito = await this.obtenerCarrito(usuarioId);
      
      // Marcar como procesado
      await mongoose.connection.collection('carritos')
        .updateOne(
          { _id: carrito._id },
          { 
            $set: { 
              estado: 'Procesado',
              fecha_procesado: new Date(),
              updated_at: new Date()
            }
          }
        );

      return carrito.productos || [];
    } catch (error) {
      logger.error('Error al procesar carrito:', error);
      throw error;
    }
  }

  async calcularTotal(usuarioId) {
    try {
      const carrito = await this.obtenerCarrito(usuarioId);
      const productos = carrito.productos || [];

      const subtotal = productos.reduce((sum, producto) => {
        return sum + (producto.cantidad * producto.precio_unitario);
      }, 0);

      return {
        productos: productos.length,
        subtotal: subtotal,
        impuestos: subtotal * 0.19,
        total: subtotal * 1.19
      };
    } catch (error) {
      logger.error('Error al calcular total:', error);
      throw error;
    }
  }
}

// Servicio de Contratos
class ContratoService extends HybridService {
  async crearContrato(contratoData, documentosData = {}) {
    try {
      return await mongoose.connection.collection('contratos').insertOne({
        tipo_contrato: contratoData.tipo_accion || 'Contrato',
        artista_info: contratoData.artista_info || {},
        fecha_inicio: contratoData.fecha_adquisicion || new Date(),
        fecha_fin: contratoData.fecha_fin_adquisicion || null,
        monto: contratoData.monto_costo || 0,
        documentos: documentosData,
        estado: 'Activo',
        usuario_gestor: contratoData.usuario_gestor_id || null,
        created_at: new Date(),
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Error al crear contrato:', error);
      throw error;
    }
  }

  async obtenerContrato(contratoId) {
    try {
      return await mongoose.connection.collection('contratos')
        .findOne({ _id: new mongoose.Types.ObjectId(contratoId) });
    } catch (error) {
      logger.error('Error al obtener contrato:', error);
      throw error;
    }
  }

  async listarContratos(filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const skip = (page - 1) * limit;

      const query = {};
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.usuario_gestor_id) query.usuario_gestor = filtros.usuario_gestor_id;

      const [contratos, total] = await Promise.all([
        mongoose.connection.collection('contratos')
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 })
          .toArray(),
        mongoose.connection.collection('contratos').countDocuments(query)
      ]);

      return {
        contratos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error al listar contratos:', error);
      throw error;
    }
  }

  async obtenerMisContratos(usuarioId, opciones = {}) {
    return await this.listarContratos({ usuario_gestor_id: usuarioId }, opciones);
  }

  async obtenerContratosProximosVencer(dias = 30) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + dias);

      return await mongoose.connection.collection('contratos')
        .find({
          fecha_fin: { 
            $lte: fechaLimite,
            $gte: new Date()
          },
          estado: 'Activo'
        })
        .sort({ fecha_fin: 1 })
        .toArray();
    } catch (error) {
      logger.error('Error al obtener contratos próximos a vencer:', error);
      throw error;
    }
  }

  async actualizarContrato(contratoId, datosBasicos = {}, datosDocumento = {}) {
    try {
      const updateData = {
        ...datosBasicos,
        ...datosDocumento,
        updated_at: new Date()
      };

      return await mongoose.connection.collection('contratos')
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(contratoId) },
          { $set: updateData },
          { returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al actualizar contrato:', error);
      throw error;
    }
  }
}

module.exports = {
  HybridService,
  AlbumService,
  CancionService,
  CarritoService,
  ContratoService
};
