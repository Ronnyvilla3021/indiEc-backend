// src/models/sql/UsuarioNuevo.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");
const { encryptData, decryptData, generateHash } = require("../../utils/encryption");
const logger = require("../../config/logger");
const config = require("../../../key");

const UsuarioNuevo = sequelize.define("UsuarioNuevo", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'estados',
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  sexo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sexos',
      key: 'id'
    }
  },
  pais_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'paises',
      key: 'id'
    }
  },
  fecha_ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verificado_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificado_telefono: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: "usuarios",
  timestamps: true,
  hooks: {
    // ANTES DE CREAR
    beforeCreate: async (usuario) => {
      try {
        logger.info('Hook beforeCreate ejecutándose...');

        // Verificar si el sistema de encriptación está habilitado
        const encryptionEnabled = config.ENCRYPTION_KEY && config.ENCRYPTION_KEY.length >= 32;

        if (!encryptionEnabled) {
          logger.warn('Encriptación deshabilitada: ENCRYPTION_KEY no configurada correctamente');
          return;
        }

        // Encriptar correo
        if (usuario.correo) {
          try {
            const originalCorreo = usuario.correo;
            usuario.correo = encryptData(originalCorreo);
            logger.info(`Correo encriptado para usuario: ${originalCorreo}`);
          } catch (error) {
            logger.error('Error encriptando correo:', error);
            throw new Error('Error procesando correo');
          }
        }

        logger.info('Hook beforeCreate completado exitosamente');
      } catch (error) {
        logger.error('Error en hook beforeCreate:', error);
        throw error;
      }
    },

    // ANTES DE ACTUALIZAR
    beforeUpdate: async (usuario) => {
      try {
        logger.info(`Hook beforeUpdate ejecutándose para usuario ID: ${usuario.id_usuario}`);

        // Verificar si el sistema de encriptación está habilitado
        const encryptionEnabled = config.ENCRYPTION_KEY && config.ENCRYPTION_KEY.length >= 32;

        if (!encryptionEnabled) {
          logger.warn('Encriptación deshabilitada: ENCRYPTION_KEY no configurada correctamente');
          return;
        }

        // Solo encriptar si el campo cambió
        if (usuario.changed('correo')) {
          try {
            const originalCorreo = usuario.correo;
            usuario.correo = encryptData(originalCorreo);
            logger.info(`Correo actualizado y encriptado para usuario ID: ${usuario.id_usuario}`);
          } catch (error) {
            logger.error('Error encriptando correo en update:', error);
            throw new Error('Error procesando correo en actualización');
          }
        }

        logger.info('Hook beforeUpdate completado exitosamente');
      } catch (error) {
        logger.error('Error en hook beforeUpdate:', error);
        throw error;
      }
    },

    // DESPUÉS DE BUSCAR (desencriptar para uso)
    afterFind: (usuarios) => {
      if (!usuarios) return;

      const decryptUsuario = (usuario) => {
        try {
          // Verificar si el sistema de encriptación está habilitado
          const encryptionEnabled = config.ENCRYPTION_KEY && config.ENCRYPTION_KEY.length >= 32;

          if (!encryptionEnabled) {
            return; // No desencriptar si no está habilitado
          }

          // Solo desencriptar si parece estar encriptado (contiene ':')
          if (usuario.correo && typeof usuario.correo === 'string' && usuario.correo.includes(':')) {
            try {
              usuario.correo = decryptData(usuario.correo);
            } catch (error) {
              logger.warn(`Error desencriptando correo del usuario ${usuario.id_usuario}:`, error.message);
            }
          }
        } catch (error) {
          logger.warn(`Error general desencriptando usuario ${usuario.id_usuario}:`, error.message);
        }
      };

      try {
        if (Array.isArray(usuarios)) {
          usuarios.forEach(decryptUsuario);
        } else {
          decryptUsuario(usuarios);
        }
      } catch (error) {
        logger.error('Error en hook afterFind:', error);
      }
    }
  },
  indexes: [
    {
      fields: ['correo'],
      name: 'idx_correo'
    },
    {
      fields: ['estado_id', 'rol_id'],
      name: 'idx_estado_rol'
    }
  ]
});

module.exports = UsuarioNuevo;
