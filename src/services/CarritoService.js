const { Carrito, CarritoProducto, UsuarioNuevo } = require('../models/sql/associations');

class CarritoService extends HybridService {
  
  async obtenerCarritoUsuario(usuarioId) {
    try {
      let carrito = await Carrito.findOne({
        where: { 
          id_usuario: usuarioId, 
          estado: 'Activo' 
        },
        include: [
          { model: CarritoProducto, as: 'productos' }
        ]
      });

      // Si no existe carrito activo, crear uno
      if (!carrito) {
        carrito = await Carrito.create({
          id_usuario: usuarioId,
          estado: 'Activo'
        });
      }

      return carrito;
    } catch (error) {
      logger.error('Error al obtener carrito del usuario:', error);
      throw error;
    }
  }

  async agregarProducto(usuarioId, productoData) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      // Verificar si el producto ya existe en el carrito
      const productoExistente = await CarritoProducto.findOne({
        where: {
          id_carrito: carrito.id_carrito,
          id_producto: productoData.id_producto,
          tipo_producto: productoData.tipo_producto
        }
      });

      if (productoExistente) {
        // Actualizar cantidad
        await productoExistente.update({
          cantidad: productoExistente.cantidad + (productoData.cantidad || 1)
        });
        return productoExistente;
      } else {
        // Crear nuevo producto en carrito
        return await CarritoProducto.create({
          id_usuario: usuarioId,
          id_carrito: carrito.id_carrito,
          id_producto: productoData.id_producto,
          tipo_producto: productoData.tipo_producto,
          cantidad: productoData.cantidad || 1,
          precio_unitario: productoData.precio_unitario
        });
      }
    } catch (error) {
      logger.error('Error al agregar producto al carrito:', error);
      throw error;
    }
  }

  async eliminarProducto(usuarioId, carritoProductoId) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      return await CarritoProducto.destroy({
        where: {
          id_carrito_prod: carritoProductoId,
          id_carrito: carrito.id_carrito
        }
      });
    } catch (error) {
      logger.error('Error al eliminar producto del carrito:', error);
      throw error;
    }
  }

  async actualizarCantidad(usuarioId, carritoProductoId, nuevaCantidad) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      if (nuevaCantidad <= 0) {
        return await this.eliminarProducto(usuarioId, carritoProductoId);
      }

      return await CarritoProducto.update(
        { cantidad: nuevaCantidad },
        {
          where: {
            id_carrito_prod: carritoProductoId,
            id_carrito: carrito.id_carrito
          }
        }
      );
    } catch (error) {
      logger.error('Error al actualizar cantidad en carrito:', error);
      throw error;
    }
  }

  async vaciarCarrito(usuarioId) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      await CarritoProducto.destroy({
        where: { id_carrito: carrito.id_carrito }
      });

      return true;
    } catch (error) {
      logger.error('Error al vaciar carrito:', error);
      throw error;
    }
  }

  async procesarCarrito(usuarioId) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      // Marcar carrito como procesado
      await carrito.update({ estado: 'Procesado' });

      // Obtener productos para crear la venta
      const productos = await CarritoProducto.findAll({
        where: { id_carrito: carrito.id_carrito }
      });

      return productos;
    } catch (error) {
      logger.error('Error al procesar carrito:', error);
      throw error;
    }
  }

  async calcularTotal(usuarioId) {
    try {
      const carrito = await this.obtenerCarritoUsuario(usuarioId);

      const productos = await CarritoProducto.findAll({
        where: { id_carrito: carrito.id_carrito }
      });

      const total = productos.reduce((sum, producto) => {
        return sum + (producto.cantidad * producto.precio_unitario);
      }, 0);

      return {
        productos: productos.length,
        subtotal: total,
        impuestos: total * 0.19, // 19% IVA por defecto
        total: total * 1.19
      };
    } catch (error) {
      logger.error('Error al calcular total del carrito:', error);
      throw error;
    }
  }
}