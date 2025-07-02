const { Venta, DetalleVenta } = require('../models/sql/associations');

class VentaService extends HybridService {
  
  async crearVenta(ventaData, detalles, metadatos = {}) {
    return await this.executeHybridTransaction(
      {
        // Crear venta y detalles en MySQL
        venta: async (transaction) => {
          // Calcular totales
          const subtotal = detalles.reduce((sum, det) => sum + (det.cantidad * det.precio_unitario), 0);
          const impuestos = subtotal * (ventaData.porcentaje_impuestos || 0) / 100;
          const total = subtotal + impuestos - (ventaData.descuentos || 0);

          const venta = await Venta.create({
            id_usuario: ventaData.id_usuario,
            monto_subtotal: subtotal,
            impuestos: impuestos,
            descuentos: ventaData.descuentos || 0,
            monto_total: total,
            estado_pago: 'Pendiente',
            metodo_pago: ventaData.metodo_pago,
            referencia_pago: ventaData.referencia_pago,
            estado_id: 1
          }, { transaction });

          // Crear detalles
          for (const detalle of detalles) {
            await DetalleVenta.create({
              id_venta: venta.id_venta,
              id_producto: detalle.id_producto,
              tipo_producto: detalle.tipo_producto,
              cantidad: detalle.cantidad,
              precio_unitario: detalle.precio_unitario,
              monto_linea: detalle.cantidad * detalle.precio_unitario
            }, { transaction });
          }

          return venta;
        }
      },
      {
        // Guardar metadata en MongoDB (analytics)
        analytics: async (mysqlResults) => {
          const venta = mysqlResults.venta;
          
          return await mongoose.connection.collection('analytics').insertOne({
            tipo_entidad: 'Venta',
            id_entidad: venta.id_venta,
            fecha: new Date(),
            metricas: {
              ingresos: venta.monto_total,
              productos_vendidos: detalles.reduce((sum, det) => sum + det.cantidad, 0),
              metodo_pago: ventaData.metodo_pago
            },
            datos_demograficos: metadatos.demografia || {},
            plataformas: metadatos.plataforma || {},
            created_at: new Date()
          });
        }
      }
    );
  }

  async obtenerVentasUsuario(usuarioId, opciones = {}) {
    try {
      const { page = 1, limit = 10, estado_pago } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = { id_usuario: usuarioId };
      if (estado_pago) whereClause.estado_pago = estado_pago;

      const { count, rows } = await Venta.findAndCountAll({
        where: whereClause,
        include: [
          { 
            model: DetalleVenta, 
            as: 'detalles'
          },
          { model: Estado, as: 'estado' }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        ventas: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener ventas del usuario:', error);
      throw error;
    }
  }

  async actualizarEstadoPago(ventaId, nuevoEstado, referenciaTransaccion) {
    try {
      return await Venta.update({
        estado_pago: nuevoEstado,
        referencia_pago: referenciaTransaccion,
        updated_at: new Date()
      }, {
        where: { id_venta: ventaId }
      });
    } catch (error) {
      logger.error('Error al actualizar estado de pago:', error);
      throw error;
    }
  }
}