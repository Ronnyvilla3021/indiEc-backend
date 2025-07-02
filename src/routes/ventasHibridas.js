const express = require('express');
const { VentaController } = require('../controllers/controladores_hibridos');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const ventaController = new VentaController();

// Validación para ventas
const validarVenta = {
  crear: {
    body: {
      productos: { type: 'array', required: true },
      metodo_pago: { type: 'string', required: true },
      descuentos: { type: 'number', optional: true },
      porcentaje_impuestos: { type: 'number', optional: true },
      metadata: { type: 'object', optional: true }
    }
  },
  estado: {
    body: {
      estado_pago: { type: 'string', required: true },
      referencia_transaccion: { type: 'string', optional: true }
    }
  }
};

// RUTAS

// POST /api/ventas-hibridas - Crear venta
router.post('/', authenticateToken, validarDatos(validarVenta.crear), ventaController.crearVenta);

// GET /api/ventas-hibridas/mis-ventas - Obtener ventas del usuario
router.get('/mis-ventas', authenticateToken, ventaController.obtenerVentasUsuario);

// PUT /api/ventas-hibridas/:id/estado - Actualizar estado de pago
router.put('/:id/estado', authenticateToken, validarDatos(validarVenta.estado), ventaController.actualizarEstadoPago);

// GET /api/ventas-hibridas/reporte - Obtener reporte de ventas (admin)
router.get('/reporte', authenticateToken, ventaController.obtenerReporteVentas);

module.exports = router;