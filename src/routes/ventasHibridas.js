const express = require('express');
// CORREGIR LA IMPORTACIÓN - quitar las llaves
const VentaController = require('../controllers/VentaController'); // SIN llaves {}
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const ventaController = new VentaController();

// RUTAS

// POST /api/ventas-hibridas - Crear venta
router.post('/', authenticateToken, ventaController.crearVenta);

// GET /api/ventas-hibridas/mis-ventas - Obtener ventas del usuario
router.get('/mis-ventas', authenticateToken, ventaController.obtenerVentasUsuario);

// PUT /api/ventas-hibridas/:id/estado - Actualizar estado de pago
router.put('/:id/estado', authenticateToken, ventaController.actualizarEstadoPago);

// GET /api/ventas-hibridas/reporte - Obtener reporte de ventas (admin)
router.get('/reporte', authenticateToken, ventaController.obtenerReporteVentas);

module.exports = router;