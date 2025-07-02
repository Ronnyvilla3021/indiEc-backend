const { CarritoService } = require('../services/servicios_faltantes');
const logger = require('../config/logger');

class CarritoController {
    constructor() {
        this.carritoService = new CarritoService();
    }

    obtenerCarrito = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;

            const carrito = await this.carritoService.obtenerCarrito(usuarioId);

            res.json({
                success: true,
                data: carrito
            });
        } catch (error) {
            logger.error('Error al obtener carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    agregarProducto = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;
            const { id_producto, tipo_producto, cantidad, precio_unitario } = req.body;

            const productoData = {
                id_producto,
                tipo_producto,
                cantidad,
                precio_unitario
            };

            const resultado = await this.carritoService.agregarProducto(usuarioId, productoData);

            res.status(201).json({
                success: true,
                message: 'Producto agregado al carrito',
                data: resultado
            });
        } catch (error) {
            logger.error('Error al agregar producto al carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    eliminarProducto = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;
            const productoId = req.params.producto_id;

            await this.carritoService.eliminarProducto(usuarioId, productoId);

            res.json({
                success: true,
                message: 'Producto eliminado del carrito'
            });
        } catch (error) {
            logger.error('Error al eliminar producto del carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    actualizarCantidad = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;
            const productoId = req.params.producto_id;
            const { cantidad } = req.body;

            await this.carritoService.actualizarCantidad(usuarioId, productoId, cantidad);

            res.json({
                success: true,
                message: 'Cantidad actualizada'
            });
        } catch (error) {
            logger.error('Error al actualizar cantidad:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    vaciarCarrito = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;

            await this.carritoService.vaciarCarrito(usuarioId);

            res.json({
                success: true,
                message: 'Carrito vaciado exitosamente'
            });
        } catch (error) {
            logger.error('Error al vaciar carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    procesarCarrito = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;

            const productos = await this.carritoService.procesarCarrito(usuarioId);

            res.json({
                success: true,
                message: 'Carrito procesado exitosamente',
                data: { productos }
            });
        } catch (error) {
            logger.error('Error al procesar carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    calcularTotal = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;

            const total = await this.carritoService.calcularTotal(usuarioId);

            res.json({
                success: true,
                data: total
            });
        } catch (error) {
            logger.error('Error al calcular total:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

module.exports = CarritoController;