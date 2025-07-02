const express = require('express');
const { CarritoController } = require('../controllers/controladores_faltantes');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const carritoController = new CarritoController();

// Middleware de validación para productos del carrito
const validarProductoCarrito = (req, res, next) => {
  const errores = [];
  const { id_producto, tipo_producto, precio_unitario } = req.body;

  if (!id_producto || !Number.isInteger(Number(id_producto))) {
    errores.push('ID del producto es requerido y debe ser un número');
  }
  
  if (!tipo_producto || !['Album', 'Cancion', 'Merchandising'].includes(tipo_producto)) {
    errores.push('Tipo de producto inválido. Debe ser: Album, Cancion o Merchandising');
  }
  
  if (!precio_unitario || precio_unitario <= 0) {
    errores.push('Precio unitario es requerido y debe ser mayor a 0');
  }

  if (req.body.cantidad && req.body.cantidad <= 0) {
    errores.push('Cantidad debe ser mayor a 0');
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

// GET /api/v2/carrito - Obtener carrito del usuario
router.get('/', authenticateToken, carritoController.obtenerCarrito);

// POST /api/v2/carrito/productos - Agregar producto al carrito
router.post('/productos', authenticateToken, validarProductoCarrito, carritoController.agregarProducto);

// DELETE /api/v2/carrito/productos/:producto_id - Eliminar producto del carrito
router.delete('/productos/:producto_id', authenticateToken, carritoController.eliminarProducto);

// PUT /api/v2/carrito/productos/:producto_id - Actualizar cantidad de producto
router.put('/productos/:producto_id', authenticateToken, carritoController.actualizarCantidad);

// DELETE /api/v2/carrito - Vaciar carrito
router.delete('/', authenticateToken, carritoController.vaciarCarrito);

// POST /api/v2/carrito/procesar - Procesar carrito (convertir a venta)
router.post('/procesar', authenticateToken, carritoController.procesarCarrito);

// GET /api/v2/carrito/total - Calcular total del carrito
router.get('/total', authenticateToken, carritoController.calcularTotal);

module.exports = router