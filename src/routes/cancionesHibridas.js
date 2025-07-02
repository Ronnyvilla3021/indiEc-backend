const express = require('express');
const multer = require('multer'); // Import multer
const { CancionController } = require('../controllers/controladores_faltantes');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const cancionController = new CancionController();

  // Configure multer for file uploads
   const storage = multer.diskStorage({
       destination: (req, file, cb) => {
           cb(null, 'uploads/'); // Specify the destination folder
       },
       filename: (req, file, cb) => {
           cb(null, Date.now() + '-' + file.originalname); // Specify the filename
       }
   });
   const upload = multer({ storage: storage }); // Create the upload middleware

// Middleware de validación para canciones
const validarCancion = (req, res, next) => {
  const errores = [];
  const { titulo, artista_id } = req.body;

  if (!titulo || titulo.trim().length < 1) {
    errores.push('Título es requerido');
  }
  
  if (!artista_id || !Number.isInteger(Number(artista_id))) {
    errores.push('ID del artista es requerido y debe ser un número');
  }

  if (req.body.duracion) {
    const duracionRegex = /^([0-9]|[0-5][0-9]):([0-5][0-9])$/;
    if (!duracionRegex.test(req.body.duracion)) {
      errores.push('Duración debe tener formato MM:SS');
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
};

// RUTAS

// POST /api/v2/canciones-hibridas - Crear canción
router.post('/', authenticateToken, validarCancion, cancionController.crearCancion);

// GET /api/v2/canciones-hibridas - Listar canciones
router.get('/', cancionController.listarCanciones);

// GET /api/v2/canciones-hibridas/buscar - Buscar canciones
router.get('/buscar', cancionController.buscarCanciones);

// GET /api/v2/canciones-hibridas/:id - Obtener canción específica
router.get('/:id', cancionController.obtenerCancion);

// PUT /api/v2/canciones-hibridas/:id/estadisticas - Actualizar estadísticas
router.put('/:id/estadisticas', authenticateToken, cancionController.actualizarEstadisticas);

// GET /api/v2/canciones-hibridas/album/:album_id - Canciones por álbum
router.get('/album/:album_id', cancionController.obtenerCancionesPorAlbum);

// POST /api/v2/canciones-hibridas/:id/audio - Subir archivo de audio
router.post('/:id/audio', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const audioPath = `/uploads/${req.file.filename}`;
    const cancionId = req.params.id;

    // Actualizar URL del audio en MongoDB
    const { CancionService } = require('../services/servicios_faltantes');
    const cancionService = new CancionService();
    
    // Aquí deberías implementar el método para actualizar solo el contenido
    // await cancionService.actualizarContenido(cancionId, { url_audio: audioPath });

    res.json({
      success: true,
      message: 'Archivo de audio subido exitosamente',
      data: { url_audio: audioPath }
    });
  } catch (error) {
    logger.error('Error al subir audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;