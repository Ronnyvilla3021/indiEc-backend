const { AlbumService } = require('../services/servicios_faltantes');
const logger = require('../config/logger');

class AlbumController {
    constructor() {
        this.albumService = new AlbumService();
    }

    // Crear nuevo álbum
    crearAlbum = async (req, res) => {
        try {
            const {
                titulo,
                artista_id,
                año,
                genero_id,
                fecha_lanzamiento,
                precio,
                descripcion_extendida,
                creditos,
                enlaces_streaming
            } = req.body;

            const datosBasicos = {
                titulo,
                artista_id,
                año,
                genero_id,
                fecha_lanzamiento,
                precio
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
            const {
                titulo,
                artista_id,
                año,
                genero_id,
                fecha_lanzamiento,
                precio,
                descripcion_extendida,
                creditos,
                enlaces_streaming
            } = req.body;

            const datosActualizados = {
                titulo,
                artista_id,
                año,
                genero_id,
                fecha_lanzamiento,
                precio,
                descripcion_extendida,
                creditos,
                enlaces_streaming
            };

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

module.exports = AlbumController;
