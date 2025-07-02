const { sequelize } = require('../config/database.sql');
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Clase base
class HybridService {
  constructor() {
    this.mongoConnection = mongoose.connection;
  }

  async executeHybridTransaction(mysqlOperations, mongoOperations) {
    const transaction = await sequelize.transaction();
    
    try {
      const mysqlResults = {};
      for (const [key, operation] of Object.entries(mysqlOperations)) {
        mysqlResults[key] = await operation(transaction);
      }

      const mongoResults = {};
      for (const [key, operation] of Object.entries(mongoOperations)) {
        mongoResults[key] = await operation(mysqlResults);
      }

      await transaction.commit();
      return { success: true, mysql: mysqlResults, mongo: mongoResults };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error en transacción híbrida:', error);
      throw error;
    }
  }
}

// Servicio de Usuario
class UsuarioService extends HybridService {
  async crearUsuario(userData, profileData = {}) {
    return await this.executeHybridTransaction(
      {
        usuario: async (transaction) => {
          const UsuarioNuevo = require('../models/sql/UsuarioNuevo');
          return await UsuarioNuevo.create({
            nombre: userData.nombre,
            apellido: userData.apellido,
            correo: userData.correo,
            contraseña: userData.contraseña,
            telefono: userData.telefono,
            fecha_nacimiento: userData.fecha_nacimiento,
            estado_id: userData.estado_id || 1,
            rol_id: userData.rol_id || 4,
            sexo_id: userData.sexo_id,
            pais_id: userData.pais_id
          }, { transaction });
        }
      },
      {
        perfil: async (mysqlResults) => {
          const usuario = mysqlResults.usuario;
          return await mongoose.connection.collection('usuarios_profile').insertOne({
            id_usuario: usuario.id_usuario,
            profesion: profileData.profesion || null,
            redes_sociales: profileData.redes_sociales || {},
            temas_favoritos: profileData.temas_favoritos || [],
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerUsuarioCompleto(usuarioId) {
    try {
      const UsuarioNuevo = require('../models/sql/UsuarioNuevo');
      const usuario = await UsuarioNuevo.findByPk(usuarioId);
      
      if (!usuario) return null;

      const perfil = await mongoose.connection.collection('usuarios_profile')
        .findOne({ id_usuario: parseInt(usuarioId) });

      return {
        ...usuario.getDatosSeguros(),
        perfil: perfil || {}
      };
    } catch (error) {
      logger.error('Error al obtener usuario completo:', error);
      throw error;
    }
  }

  async buscarUsuarios(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const UsuarioNuevo = require('../models/sql/UsuarioNuevo');
      const whereClause = { estado_id: 1 };

      if (query) {
        whereClause[sequelize.Op.or] = [
          { nombre: { [sequelize.Op.like]: `%${query}%` } },
          { apellido: { [sequelize.Op.like]: `%${query}%` } }
        ];
      }

      const { count, rows } = await UsuarioNuevo.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        usuarios: rows.map(u => u.getDatosSeguros()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar usuarios:', error);
      throw error;
    }
  }

  async actualizarPerfil(usuarioId, datosBasicos = {}, datosExtendidos = {}) {
    return await this.executeHybridTransaction(
      {
        usuario: async (transaction) => {
          if (Object.keys(datosBasicos).length > 0) {
            const UsuarioNuevo = require('../models/sql/UsuarioNuevo');
            await UsuarioNuevo.update(datosBasicos, {
              where: { id_usuario: usuarioId },
              transaction
            });
          }
          return datosBasicos;
        }
      },
      {
        perfil: async () => {
          if (Object.keys(datosExtendidos).length > 0) {
            return await mongoose.connection.collection('usuarios_profile')
              .findOneAndUpdate(
                { id_usuario: parseInt(usuarioId) },
                { 
                  $set: {
                    ...datosExtendidos,
                    updated_at: new Date()
                  }
                },
                { upsert: true, returnDocument: 'after' }
              );
          }
          return null;
        }
      }
    );
  }
}

// Otros servicios básicos
class ArtistaService extends HybridService {
  async buscarArtistas(query, filtros = {}, opciones = {}) {
    return { artistas: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }
}

class VentaService extends HybridService {
  async crearVenta(ventaData, detalles, metadatos = {}) {
    return { success: true, mysql: { venta: { id_venta: 1 } }, mongo: {} };
  }
}

class EventoService extends HybridService {
  async crearEvento(eventoData) {
    return { success: true, evento_id: 1 };
  }
}

class AnalyticsService extends HybridService {
  async registrarMetrica(tipo, id, metricas, metadatos) {
    return { success: true };
  }
}

module.exports = {
  HybridService,
  UsuarioService,
  ArtistaService,
  VentaService,
  EventoService,
  AnalyticsService
};