const { UsuarioNuevo, Estado, Rol, Sexo, Pais } = require('../models/sql/associations');
const { hashPassword, comparePassword } = require('../utils/encryption');

class UsuarioService extends HybridService {
  
  async crearUsuario(userData, profileData = {}) {
    return await this.executeHybridTransaction(
      {
        // Operaciones MySQL
        usuario: async (transaction) => {
          const hashedPassword = await hashPassword(userData.contraseña);
          
          return await UsuarioNuevo.create({
            nombre: userData.nombre,
            apellido: userData.apellido,
            correo: userData.correo,
            contraseña: hashedPassword,
            telefono: userData.telefono,
            fecha_nacimiento: userData.fecha_nacimiento,
            estado_id: userData.estado_id || 1, // Activo por defecto
            rol_id: userData.rol_id || 4, // Cliente por defecto
            sexo_id: userData.sexo_id,
            pais_id: userData.pais_id,
            verificado_email: false,
            verificado_telefono: false
          }, { transaction });
        }
      },
      {
        // Operaciones MongoDB
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
      // 1. Obtener datos principales de MySQL
      const usuario = await UsuarioNuevo.findByPk(usuarioId, {
        include: [
          { model: Estado, as: 'estado' },
          { model: Rol, as: 'rol' },
          { model: Sexo, as: 'sexo' },
          { model: Pais, as: 'pais' }
        ]
      });

      if (!usuario) return null;

      // 2. Obtener perfil extendido de MongoDB
      const perfil = await mongoose.connection.collection('usuarios_profile')
        .findOne({ id_usuario: usuarioId });

      return {
        ...usuario.toJSON(),
        perfil: perfil || {}
      };
    } catch (error) {
      logger.error('Error al obtener usuario completo:', error);
      throw error;
    }
  }

  async actualizarPerfil(usuarioId, datosBasicos = {}, datosExtendidos = {}) {
    return await this.executeHybridTransaction(
      {
        // Actualizar datos básicos en MySQL
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
        // Actualizar datos extendidos en MongoDB
        perfil: async () => {
          if (Object.keys(datosExtendidos).length > 0) {
            return await mongoose.connection.collection('usuarios_profile')
              .findOneAndUpdate(
                { id_usuario: usuarioId },
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

  async buscarUsuarios(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = { estado_id: 1 }; // Solo usuarios activos

      // Agregar filtros
      if (query) {
        whereClause[sequelize.Op.or] = [
          { nombre: { [sequelize.Op.like]: `%${query}%` } },
          { apellido: { [sequelize.Op.like]: `%${query}%` } },
          { correo: { [sequelize.Op.like]: `%${query}%` } }
        ];
      }

      if (filtros.pais_id) whereClause.pais_id = filtros.pais_id;
      if (filtros.rol_id) whereClause.rol_id = filtros.rol_id;

      const { count, rows } = await UsuarioNuevo.findAndCountAll({
        where: whereClause,
        include: [
          { model: Estado, as: 'estado' },
          { model: Rol, as: 'rol' },
          { model: Pais, as: 'pais' }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        usuarios: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar usuarios:', error);
      throw error;
    }
  }
}
