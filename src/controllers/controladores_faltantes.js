// ============================================
// CONTROLADORES FALTANTES COMPLETOS
// src/controllers/controladores_faltantes.js
// ============================================

const { AlbumService, CancionService, CarritoService, ContratoService } = require('../services/servicios_faltantes');
const logger = require('../config/logger');

// ============================================
// ALBUM CONTROLLER
// ============================================

class AlbumController {
    constructor() {
        this.albumService = new AlbumService();
    }

    // Crear nuevo álbum
    crearAlbum = async (req, res) => {
        try {
            const {
                titulo,
                artista,
                año,
                genero,
                descripcion_extendida,
                creditos,
                enlaces_streaming
            } = req.body;

            const datosBasicos = {
                titulo,
                artista: artista || 'Artista Desconocido',
                año: año || new Date().getFullYear(),
                genero: genero || 'Rock',
                user_id: req.user?.id || req.user?.id_usuario || 1
            };

            const datosContenido = {
                descripcion_extendida,
                creditos,
                enlaces_streaming
            };

            const resultado = await this.albumService.crearAlbum(datosBasicos, datosContenido);

            res.status(201).json({
                success: true,
                message: 'Álbum creado exitosamente',
                data: {
                    id: resultado.mysql.album.id,
                    titulo: resultado.mysql.album.titulo
                }
            });
        } catch (error) {
            logger.error('Error al crear álbum:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Obtener álbum completo
    obtenerAlbum = async (req, res) => {
        try {
            const albumId = req.params.id;

            const album = await this.albumService.obtenerAlbumCompleto(albumId);

            if (!album) {
                return res.status(404).json({
                    success: false,
                    message: 'Álbum no encontrado'
                });
            }

            res.json({
                success: true,
                data: album
            });
        } catch (error) {
            logger.error('Error al obtener álbum:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Buscar álbumes
    buscarAlbumes = async (req, res) => {
        try {
            const { q, artista_id, genero_id, año, page = 1, limit = 10 } = req.query;

            const filtros = {};
            if (artista_id) filtros.artista_id = artista_id;
            if (genero_id) filtros.genero_id = genero_id;
            if (año) filtros.año = año;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.albumService.buscarAlbumes(q, filtros, opciones);

            res.json({
                success: true,
                data: resultado.albumes,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al buscar álbumes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Listar álbumes
    listarAlbumes = async (req, res) => {
        try {
            const { page = 1, limit = 20, artista_id, genero_id } = req.query;

            const filtros = {};
            if (artista_id) filtros.artista_id = artista_id;
            if (genero_id) filtros.genero_id = genero_id;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.albumService.listarAlbumes(filtros, opciones);

            res.json({
                success: true,
                data: resultado.albumes,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al listar álbumes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Actualizar álbum
    actualizarAlbum = async (req, res) => {
        try {
            const albumId = req.params.id;
            const datosActualizados = req.body;

            const resultado = await this.albumService.actualizarAlbum(albumId, datosActualizados);

            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Álbum no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Álbum actualizado exitosamente',
                data: resultado
            });
        } catch (error) {
            logger.error('Error al actualizar álbum:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Eliminar álbum
    eliminarAlbum = async (req, res) => {
        try {
            const albumId = req.params.id;

            const resultado = await this.albumService.eliminarAlbum(albumId);

            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Álbum no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Álbum eliminado exitosamente'
            });
        } catch (error) {
            logger.error('Error al eliminar álbum:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

// ============================================
// CANCION CONTROLLER
// ============================================

class CancionController {
    constructor() {
        this.cancionService = new CancionService();
    }

    // Crear nueva canción
    crearCancion = async (req, res) => {
        try {
            const {
                titulo,
                album,
                duracion,
                año,
                genero,
                letra,
                url_audio
            } = req.body;

            const datosBasicos = {
                titulo,
                album: album || 'Single',
                duracion: duracion || '3:00',
                año: año || new Date().getFullYear(),
                genero: genero || 'Rock',
                user_id: req.user?.id || req.user?.id_usuario || 1
            };

            const datosContenido = {
                letra,
                url_audio
            };

            const resultado = await this.cancionService.crearCancion(datosBasicos, datosContenido);

            res.status(201).json({
                success: true,
                message: 'Canción creada exitosamente',
                data: {
                    id: resultado.mysql.cancion.id,
                    titulo: resultado.mysql.cancion.titulo
                }
            });
        } catch (error) {
            logger.error('Error al crear canción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Obtener canción completa
    obtenerCancion = async (req, res) => {
        try {
            const cancionId = req.params.id;

            const cancion = await this.cancionService.obtenerCancion(cancionId);

            if (!cancion) {
                return res.status(404).json({
                    success: false,
                    message: 'Canción no encontrada'
                });
            }

            res.json({
                success: true,
                data: cancion
            });
        } catch (error) {
            logger.error('Error al obtener canción:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Buscar canciones
    buscarCanciones = async (req, res) => {
        try {
            const { q, album_id, artista_id, genero, page = 1, limit = 10 } = req.query;

            const filtros = {};
            if (album_id) filtros.album_id = album_id;
            if (artista_id) filtros.artista_id = artista_id;
            if (genero) filtros.genero = genero;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.cancionService.buscarCanciones(q, filtros, opciones);

            res.json({
                success: true,
                data: resultado.canciones,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al buscar canciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Listar canciones
    listarCanciones = async (req, res) => {
        try {
            const { page = 1, limit = 20, genero, año } = req.query;

            const filtros = {};
            if (genero) filtros.genero = genero;
            if (año) filtros.año = año;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.cancionService.listarCanciones(filtros, opciones);

            res.json({
                success: true,
                data: resultado.canciones,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al listar canciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Actualizar estadísticas de reproducción
    actualizarEstadisticas = async (req, res) => {
        try {
            const cancionId = req.params.id;
            const { reproducciones, likes, shares, comentarios } = req.body;

            const estadisticas = {
                reproducciones: reproducciones || 0,
                likes: likes || 0,
                shares: shares || 0,
                comentarios: comentarios || 0,
                ultima_actualizacion: new Date()
            };

            await this.cancionService.actualizarEstadisticas(cancionId, estadisticas);

            res.json({
                success: true,
                message: 'Estadísticas actualizadas exitosamente'
            });
        } catch (error) {
            logger.error('Error al actualizar estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Obtener canciones por álbum
    obtenerCancionesPorAlbum = async (req, res) => {
        try {
            const albumId = req.params.album_id;

            const canciones = await this.cancionService.obtenerCancionesPorAlbum(albumId);

            res.json({
                success: true,
                data: canciones
            });
        } catch (error) {
            logger.error('Error al obtener canciones por álbum:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

// ============================================
// CARRITO CONTROLLER
// ============================================

class CarritoController {
    constructor() {
        this.carritoService = new CarritoService();
    }

    // Obtener carrito del usuario
    obtenerCarrito = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;

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

    // Agregar producto al carrito
    agregarProducto = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;
            const { id_producto, tipo_producto, cantidad, precio_unitario } = req.body;

            if (!id_producto || !tipo_producto || !precio_unitario) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del producto, tipo y precio son requeridos'
                });
            }

            const productoData = {
                id_producto: parseInt(id_producto),
                tipo_producto,
                cantidad: parseInt(cantidad) || 1,
                precio_unitario: parseFloat(precio_unitario)
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

    // Eliminar producto del carrito
    eliminarProducto = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;
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

    // Actualizar cantidad de producto
    actualizarCantidad = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;
            const productoId = req.params.producto_id;
            const { cantidad } = req.body;

            if (!cantidad || cantidad < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cantidad debe ser mayor a 0'
                });
            }

            await this.carritoService.actualizarCantidad(usuarioId, productoId, parseInt(cantidad));

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

    // Vaciar carrito
    vaciarCarrito = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;

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

    // Procesar carrito (convertir a venta)
    procesarCarrito = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;
            const { metodo_pago, direccion_envio } = req.body;

            const productos = await this.carritoService.procesarCarrito(usuarioId);

            if (!productos || productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El carrito está vacío'
                });
            }

            // Calcular total
            const total = productos.reduce((sum, producto) => {
                return sum + (producto.cantidad * producto.precio_unitario);
            }, 0);

            res.json({
                success: true,
                message: 'Carrito procesado exitosamente',
                data: {
                    productos: productos.length,
                    total: total,
                    metodo_pago: metodo_pago || 'Por definir',
                    estado: 'Procesado'
                }
            });
        } catch (error) {
            logger.error('Error al procesar carrito:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Calcular total del carrito
    calcularTotal = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;

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

// ============================================
// CONTRATO CONTROLLER
// ============================================

class ContratoController {
    constructor() {
        this.contratoService = new ContratoService();
    }

    // Crear nuevo contrato
    crearContrato = async (req, res) => {
        try {
            const {
                tipo_accion,
                artista_info,
                fecha_adquisicion,
                fecha_fin_adquisicion,
                monto_costo,
                clausulas_especiales,
                porcentaje_royalties
            } = req.body;

            if (!tipo_accion || !artista_info || !fecha_adquisicion || !monto_costo) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de acción, información del artista, fecha y monto son requeridos'
                });
            }

            const contratoData = {
                tipo_accion,
                artista_info,
                fecha_adquisicion,
                fecha_fin_adquisicion,
                monto_costo: parseFloat(monto_costo),
                usuario_gestor_id: req.user?.id_usuario || req.user?.id
            };

            const documentosData = {
                clausulas_especiales,
                porcentaje_royalties: porcentaje_royalties || 0
            };

            const resultado = await this.contratoService.crearContrato(contratoData, documentosData);

            res.status(201).json({
                success: true,
                message: 'Contrato creado exitosamente',
                data: {
                    id: resultado.insertedId
                }
            });
        } catch (error) {
            logger.error('Error al crear contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Listar contratos
    listarContratos = async (req, res) => {
        try {
            const { page = 1, limit = 10, estado, tipo_accion } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (tipo_accion) filtros.tipo_accion = tipo_accion;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.contratoService.listarContratos(filtros, opciones);

            res.json({
                success: true,
                data: resultado.contratos,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al listar contratos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Obtener contrato específico
    obtenerContrato = async (req, res) => {
        try {
            const contratoId = req.params.id;

            const contrato = await this.contratoService.obtenerContrato(contratoId);

            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            res.json({
                success: true,
                data: contrato
            });
        } catch (error) {
            logger.error('Error al obtener contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Obtener mis contratos (como gestor)
    obtenerMisContratos = async (req, res) => {
        try {
            const usuarioId = req.user?.id_usuario || req.user?.id;
            const { page = 1, limit = 10 } = req.query;

            const opciones = { page: parseInt(page), limit: parseInt(limit) };

            const resultado = await this.contratoService.obtenerMisContratos(usuarioId, opciones);

            res.json({
                success: true,
                data: resultado.contratos,
                pagination: resultado.pagination
            });
        } catch (error) {
            logger.error('Error al obtener mis contratos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Contratos próximos a vencer
    obtenerContratosProximosVencer = async (req, res) => {
        try {
            const { dias = 30 } = req.query;

            const contratos = await this.contratoService.obtenerContratosProximosVencer(parseInt(dias));

            res.json({
                success: true,
                data: contratos,
                mensaje: `Contratos que vencen en los próximos ${dias} días`
            });
        } catch (error) {
            logger.error('Error al obtener contratos próximos a vencer:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

    // Actualizar contrato
    actualizarContrato = async (req, res) => {
        try {
            const contratoId = req.params.id;
            const datosActualizados = req.body;

            const resultado = await this.contratoService.actualizarContrato(contratoId, datosActualizados);

            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Contrato actualizado exitosamente'
            });
        } catch (error) {
            logger.error('Error al actualizar contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
}

// ============================================
// EXPORTAR TODOS LOS CONTROLADORES
// ============================================

module.exports = {
    AlbumController,
    CancionController,
    CarritoController,
    ContratoController
};