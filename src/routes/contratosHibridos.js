const express = require('express');
const { ContratoController } = require('../controllers/controladores_faltantes');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../utils/fileUpload');

const router = express.Router();
const contratoController = new ContratoController();

// Middleware de validación para contratos
const validarContrato = (req, res, next) => {
  const errores = [];
  const { id_artista, tipo_accion, fecha_adquisicion, monto_costo } = req.body;

  if (!id_artista || !Number.isInteger(Number(id_artista))) {
    errores.push('ID del artista es requerido y debe ser un número');
  }
  
  if (!tipo_accion || !['Contrato', 'Licencia', 'Exclusivo', 'Colaboracion'].includes(tipo_accion)) {
    errores.push('Tipo de acción inválido. Debe ser: Contrato, Licencia, Exclusivo o Colaboracion');
  }
  
  if (!fecha_adquisicion) {
    errores.push('Fecha de adquisición es requerida');
  }
  
  if (!monto_costo || monto_costo < 0) {
    errores.push('Monto del costo es requerido y debe ser mayor o igual a 0');
  }

  // Validar fechas
  if (fecha_adquisicion && req.body.fecha_fin_adquisicion) {
    const fechaInicio = new Date(fecha_adquisicion);
    const fechaFin = new Date(req.body.fecha_fin_adquisicion);
    
    if (fechaFin <= fechaInicio) {
      errores.push('Fecha de fin debe ser posterior a la fecha de adquisición');
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

// POST /api/v2/contratos - Crear contrato
router.post('/', authenticateToken, validarContrato, contratoController.crearContrato);

// GET /api/v2/contratos - Listar contratos
router.get('/', authenticateToken, contratoController.listarContratos);

// GET /api/v2/contratos/mis-contratos - Obtener mis contratos (como gestor)
router.get('/mis-contratos', authenticateToken, contratoController.obtenerMisContratos);

// GET /api/v2/contratos/proximos-vencer - Contratos próximos a vencer
router.get('/proximos-vencer', authenticateToken, contratoController.obtenerContratosProximosVencer);

// GET /api/v2/contratos/:id - Obtener contrato específico
router.get('/:id', authenticateToken, contratoController.obtenerContrato);

// PUT /api/v2/contratos/:id - Actualizar contrato
router.put('/:id', authenticateToken, contratoController.actualizarContrato);

// POST /api/v2/contratos/:id/documento - Subir documento del contrato
router.post('/:id/documento', authenticateToken, upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const documentoPath = `/uploads/${req.file.filename}`;
    const contratoId = req.params.id;

    // Actualizar URL del documento en MongoDB
    const { ContratoService } = require('../services/servicios_faltantes');
    const contratoService = new ContratoService();
    
    await contratoService.actualizarContrato(contratoId, {}, { 
      url_contrato: documentoPath,
      usuario_modificador: req.user.id_usuario
    });

    res.json({
      success: true,
      message: 'Documento del contrato subido exitosamente',
      data: { url_documento: documentoPath }
    });
  } catch (error) {
    logger.error('Error al subir documento del contrato:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;