// src/routes/albumesHibridos.js
const express = require('express');
const { AlbumController } = require('../controllers/controladores_faltantes');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../utils/fileUpload');
const logger = require('../config/logger');

const router = express.Router();
const albumController = new AlbumController();

// Middleware de validación para álbumes
const validarAlbum = (req, res, next) => {
  const errores = [];
  const { titulo, artista_id, año } = req.body;

  if (!titulo || titulo.trim().length < 2) {
    errores.push('Título es requerido y debe tener al menos 2 caracteres');
  }
  
  if (!artista_id || !Number.isInteger(Number(artista_id))) {
    errores.push('ID del artista es requerido y debe ser un número');
  }
  
  if (!año || año < 1900 || año > new Date().getFullYear() + 1) {
    errores.push('Año inválido');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errores
    });
  }

  next();
};

// RUTAS

// POST /api/v2/albumes-hibridos - Crear álbum
router.post('/', authenticateToken, validarAlbum, albumController.crearAlbum);

// GET /api/v2/albumes-hibridos - Listar álbumes
router.get('/', albumController.listarAlbumes);

// GET /api/v2/albumes-hibridos/buscar - Buscar álbumes
router.get('/buscar', albumController.buscarAlbumes);

// GET /api/v2/albumes-hibridos/:id - Obtener álbum específico
router.get('/:id', albumController.obtenerAlbum);

// PUT /api/v2/albumes-hibridos/:id - Actualizar álbum
router.put('/:id', authenticateToken, albumController.actualizarAlbum);

// DELETE /api/v2/albumes-hibridos/:id - Eliminar álbum
router.delete('/:id', authenticateToken, albumController.eliminarAlbum);

// POST /api/v2/albumes-hibridos/:id/foto - Subir imagen del álbum
router.post('/:id/foto', authenticateToken, upload.single('foto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const fotoPath = `/uploads/${req.file.filename}`;
    const albumId = req.params.id;

    // Actualizar URL de la foto en MongoDB
    const { AlbumService } = require('../services/servicios_faltantes');
    const albumService = new AlbumService();
    
    await albumService.actualizarAlbum(albumId, {}, { foto_url: fotoPath });

    res.json({
      success: true,
      message: 'Imagen del álbum actualizada exitosamente',
      data: { foto_url: fotoPath }
    });
  } catch (error) {
    logger.error('Error al subir imagen del álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;