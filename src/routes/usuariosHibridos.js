const express = require('express');
// CORREGIR LA IMPORTACIÓN - quitar las llaves
const UsuarioController = require('../controllers/UsuarioController'); // SIN llaves {}
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const upload = require('../utils/fileUpload');
const logger = require('../config/logger');

const router = express.Router();
const usuarioController = new UsuarioController(); // Ahora debería funcionar

// Validaciones
const validarUsuario = {
  crear: {
    body: {
      nombre: { type: 'string', required: true, min: 2, max: 100 },
      apellido: { type: 'string', required: true, min: 2, max: 100 },
      correo: { type: 'email', required: true },
      contraseña: { type: 'string', required: true, min: 6 },
      telefono: { type: 'string', optional: true },
      fecha_nacimiento: { type: 'date', optional: true },
      sexo_id: { type: 'number', optional: true },
      pais_id: { type: 'number', optional: true },
      profesion: { type: 'string', optional: true },
      redes_sociales: { type: 'object', optional: true },
      temas_favoritos: { type: 'array', optional: true }
    }
  }
};

// Middleware de validación simple
const validarDatos = (esquema) => {
  return (req, res, next) => {
    try {
      const errores = [];
      
      if (esquema.body) {
        for (const [campo, reglas] of Object.entries(esquema.body)) {
          const valor = req.body[campo];
          
          // Verificar si es requerido
          if (reglas.required && (!valor || valor === '')) {
            errores.push(`${campo} es requerido`);
            continue;
          }
          
          // Si es opcional y no está presente, continuar
          if (!reglas.required && (!valor || valor === '')) {
            continue;
          }
          
          // Validar tipo
          if (reglas.type === 'string' && typeof valor !== 'string') {
            errores.push(`${campo} debe ser una cadena de texto`);
          }
          
          if (reglas.type === 'number' && (typeof valor !== 'number' && !Number.isInteger(Number(valor)))) {
            errores.push(`${campo} debe ser un número`);
          }
          
          if (reglas.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
            errores.push(`${campo} debe ser un email válido`);
          }
          
          // Validar longitud para strings
          if (reglas.type === 'string' && typeof valor === 'string') {
            if (reglas.min && valor.length < reglas.min) {
              errores.push(`${campo} debe tener al menos ${reglas.min} caracteres`);
            }
            if (reglas.max && valor.length > reglas.max) {
              errores.push(`${campo} no puede tener más de ${reglas.max} caracteres`);
            }
          }
        }
      }
      
      if (errores.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errores
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error en validación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// RUTAS

// POST /api/usuarios-hibridos - Crear usuario
router.post('/', validarDatos(validarUsuario.crear), usuarioController.crearUsuario);

// GET /api/usuarios-hibridos/perfil - Obtener perfil propio
router.get('/perfil', authenticateToken, usuarioController.obtenerPerfil);

// PUT /api/usuarios-hibridos/perfil - Actualizar perfil propio
router.put('/perfil', authenticateToken, usuarioController.actualizarPerfil);

// GET /api/usuarios-hibridos/buscar - Buscar usuarios
router.get('/buscar', authenticateToken, usuarioController.buscarUsuarios);

// GET /api/usuarios-hibridos - Listar usuarios (admin)
router.get('/', authenticateToken, usuarioController.listarUsuarios);

// GET /api/usuarios-hibridos/:id - Obtener usuario específico
router.get('/:id', authenticateToken, usuarioController.obtenerPerfil);

// POST /api/usuarios-hibridos/perfil/foto - Subir foto de perfil
router.post('/perfil/foto', authenticateToken, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const fotoPath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: { foto_url: fotoPath }
    });
  } catch (error) {
    logger.error('Error al subir foto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;