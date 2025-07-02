const { UsuarioService } = require('../services/servicios_hibridos');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

class UsuarioController {
  constructor() {
    this.usuarioService = new UsuarioService();
  }

  // Crear nuevo usuario
  crearUsuario = async (req, res) => {
    try {
      const { nombre, apellido, correo, contraseña, telefono, fecha_nacimiento, sexo_id, pais_id } = req.body;
      const { profesion, redes_sociales, temas_favoritos } = req.body;

      const datosBasicos = {
        nombre,
        apellido,
        correo,
        contraseña,
        telefono,
        fecha_nacimiento,
        sexo_id,
        pais_id,
        rol_id: 4 // Cliente por defecto
      };

      const datosExtendidos = {
        profesion,
        redes_sociales,
        temas_favoritos
      };

      const resultado = await this.usuarioService.crearUsuario(datosBasicos, datosExtendidos);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          id: resultado.mysql.usuario.id_usuario,
          correo: resultado.mysql.usuario.correo
        }
      });
    } catch (error) {
      logger.error('Error en crear usuario:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'El correo ya está registrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener perfil completo
  obtenerPerfil = async (req, res) => {
    try {
      const usuarioId = req.user.id_usuario || req.params.id;
      
      const usuario = await this.usuarioService.obtenerUsuarioCompleto(usuarioId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Remover datos sensibles
      const { contraseña, ...usuarioSeguro } = usuario;

      res.json({
        success: true,
        data: usuarioSeguro
      });
    } catch (error) {
      logger.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Actualizar perfil
  actualizarPerfil = async (req, res) => {
    try {
      const usuarioId = req.user.id_usuario;
      const { nombre, apellido, telefono, sexo_id, pais_id, profesion, redes_sociales, temas_favoritos } = req.body;

      const datosBasicos = {
        nombre,
        apellido,
        telefono,
        sexo_id,
        pais_id
      };

      const datosExtendidos = {
        profesion,
        redes_sociales,
        temas_favoritos
      };

      await this.usuarioService.actualizarPerfil(usuarioId, datosBasicos, datosExtendidos);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Buscar usuarios
  buscarUsuarios = async (req, res) => {
    try {
      const { q, pais_id, rol_id, page = 1, limit = 10 } = req.query;

      const filtros = {};
      if (pais_id) filtros.pais_id = pais_id;
      if (rol_id) filtros.rol_id = rol_id;

      const opciones = { page: parseInt(page), limit: parseInt(limit) };

      const resultado = await this.usuarioService.buscarUsuarios(q, filtros, opciones);

      res.json({
        success: true,
        data: resultado.usuarios,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al buscar usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Listar usuarios con paginación
  listarUsuarios = async (req, res) => {
    try {
      const { page = 1, limit = 10, rol_id, estado_id = 1 } = req.query;

      const filtros = { estado_id };
      if (rol_id) filtros.rol_id = rol_id;

      const opciones = { page: parseInt(page), limit: parseInt(limit) };

      const resultado = await this.usuarioService.buscarUsuarios('', filtros, opciones);

      res.json({
        success: true,
        data: resultado.usuarios,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al listar usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
}
