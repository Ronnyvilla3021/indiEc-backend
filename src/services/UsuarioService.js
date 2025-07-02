// src/services/UsuarioService.js - VERSIÓN COMPLETA
const { UsuarioNuevo, Estado, Rol, Sexo, Pais } = require('../models/sql/associations');
const { hashPassword } = require('../utils/encryption');
const HybridService = require('./HybridService');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class UsuarioService extends HybridService {
  
  async crearUsuario(userData, profileData = {}) {
    return await this.executeHybridTransaction(
      {
        usuario: async (transaction) => {
          return await UsuarioNuevo.create({
            nombre: userData.nombre,
            apellido: userData.apellido,
            correo: userData.correo,
            contraseña: userData.contraseña, // Se hashea en el hook
            telefono: userData.telefono,
            fecha_nacimiento: userData.fecha_nacimiento,
            estado_id: userData.estado_id || 1,
            rol_id: userData.rol_id || 4,
            sexo_id: userData.sexo_id,
            pais_id: userData.pais_id,
            verificado_email: false,
            verificado_telefono: false
          }, { transaction });
        }
      },
      {
        perfil: async (mysqlResults) => {
          const usuario = mysqlResults.usuario;
          
          return await mongoose.connection.collection('usuarios_profile').insertOne({
            id_usuario: usuario.id_usuario,
            profesion: profileData.profesion || null,
            foto_perfil_url: profileData.foto_perfil_url || null,
            redes_sociales: profileData.redes_sociales || {},
            temas_favoritos: profileData.temas_favoritos || [],
            preferencias: {
              generos_musicales: profileData.generos_favoritos || [],
              notificaciones: {
                email: true,
                push: true,
                sms: false
              },
              idioma: 'es',
              tema_interfaz: 'light'
            },
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerUsuarioCompleto(usuarioId) {
    try {
      const usuario = await UsuarioNuevo.findByPk(usuarioId, {
        include: [
          { model: Estado, as: 'estado' },
          { model: Rol, as: 'rol' },
          { model: Sexo, as: 'sexo' },
          { model: Pais, as: 'pais' }
        ]
      });

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
      const whereClause = { estado_id: 1 };

      if (query) {
        whereClause[sequelize.Op.or] = [
          { nombre: { [sequelize.Op.like]: `%${query}%` } },
          { apellido: { [sequelize.Op.like]: `%${query}%` } }
        ];
      }

      if (filtros.pais_id) whereClause.pais_id = filtros.pais_id;
      if (filtros.rol_id) whereClause.rol_id = filtros.rol_id;

      return await this.paginar(UsuarioNuevo, {
        ...opciones,
        where: whereClause,
        include: [
          { model: Estado, as: 'estado' },
          { model: Rol, as: 'rol' },
          { model: Pais, as: 'pais' }
        ]
      });
    } catch (error) {
      logger.error('Error al buscar usuarios:', error);
      throw error;
    }
  }

  async actualizarPerfil(usuarioId, datosBasicos = {}, datosExtendidos = {}) {
    return await this.executeHybridTransaction(
      {
        usuario: async (transaction) => {
          const updateData = {};
          
          if (datosBasicos.nombre) updateData.nombre = datosBasicos.nombre;
          if (datosBasicos.apellido) updateData.apellido = datosBasicos.apellido;
          if (datosBasicos.telefono) updateData.telefono = datosBasicos.telefono;
          if (datosBasicos.sexo_id) updateData.sexo_id = datosBasicos.sexo_id;
          if (datosBasicos.pais_id) updateData.pais_id = datosBasicos.pais_id;

          if (Object.keys(updateData).length > 0) {
            await UsuarioNuevo.update(updateData, {
              where: { id_usuario: usuarioId },
              transaction
            });
          }

          return updateData;
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

  async verificarCredenciales(correo, contraseña) {
    try {
      const usuario = await UsuarioNuevo.findOne({
        where: { correo, estado_id: 1 }
      });

      if (!usuario) return null;

      const esValida = await usuario.verificarContraseña(contraseña);
      return esValida ? usuario : null;
    } catch (error) {
      logger.error('Error al verificar credenciales:', error);
      throw error;
    }
  }
}

module.exports = UsuarioService;