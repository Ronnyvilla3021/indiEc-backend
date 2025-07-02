const { VentaService, AnalyticsService } = require('../services/servicios_hibridos');

class VentaController {
  constructor() {
    this.ventaService = new VentaService();
    this.analyticsService = new AnalyticsService();
  }

  // Crear nueva venta
  crearVenta = async (req, res) => {
    try {
      const { 
        productos, 
        metodo_pago, 
        descuentos = 0, 
        porcentaje_impuestos = 0,
        metadata = {} 
      } = req.body;
      
      const usuarioId = req.user.id_usuario;

      // Validar productos
      if (!productos || productos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un producto'
        });
      }

      const ventaData = {
        id_usuario: usuarioId,
        metodo_pago,
        descuentos,
        porcentaje_impuestos
      };

      const detalles = productos.map(producto => ({
        id_producto: producto.id,
        tipo_producto: producto.tipo,
        cantidad: producto.cantidad || 1,
        precio_unitario: producto.precio
      }));

      const resultado = await this.ventaService.crearVenta(ventaData, detalles, metadata);

      res.status(201).json({
        success: true,
        message: 'Venta procesada exitosamente',
        data: {
          id_venta: resultado.mysql.venta.id_venta,
          monto_total: resultado.mysql.venta.monto_total,
          estado_pago: resultado.mysql.venta.estado_pago
        }
      });
    } catch (error) {
      logger.error('Error al crear venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la venta'
      });
    }
  };

  // Obtener ventas del usuario
  obtenerVentasUsuario = async (req, res) => {
    try {
      const usuarioId = req.user.id_usuario;
      const { page = 1, limit = 10, estado_pago } = req.query;

      const opciones = { 
        page: parseInt(page), 
        limit: parseInt(limit),
        estado_pago 
      };

      const resultado = await this.ventaService.obtenerVentasUsuario(usuarioId, opciones);

      res.json({
        success: true,
        data: resultado.ventas,
        pagination: resultado.pagination
      });
    } catch (error) {
      logger.error('Error al obtener ventas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Actualizar estado de pago
  actualizarEstadoPago = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado_pago, referencia_transaccion } = req.body;

      if (!['Pendiente', 'Pagado', 'Cancelado', 'Reembolsado'].includes(estado_pago)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de pago inválido'
        });
      }

      await this.ventaService.actualizarEstadoPago(id, estado_pago, referencia_transaccion);

      res.json({
        success: true,
        message: 'Estado de pago actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error al actualizar estado de pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };

  // Obtener reporte de ventas
  obtenerReporteVentas = async (req, res) => {
    try {
      const { fecha_desde, fecha_hasta } = req.query;

      const filtros = {};
      if (fecha_desde) filtros.fecha_desde = fecha_desde;
      if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;

      const reporte = await this.analyticsService.obtenerReporteVentas(filtros);

      res.json({
        success: true,
        data: reporte
      });
    } catch (error) {
      logger.error('Error al obtener reporte de ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
}

module.exports = VentaController;
