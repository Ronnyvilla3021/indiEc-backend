const { CancionService } = require('../services/servicios_faltantes');
const logger = require('../config/logger');

class CancionController {
    constructor() {
        this.cancionService = new CancionService();
    }

    crearCancion = async (req, res) => {
        try {
            const {
                titulo,
                album,
                duracion,
                año,
                genero,
                letra
            } = req.body;

            const datosBasicos = {
                titulo,
                album,
                duracion,
                año,
                genero,
                user_id: req.user?.id || req.user?.id_usuario
            };

            const datosContenido = {
                letra
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

    buscarCanciones = async (req, res) => {
        try {
            const { q, page = 1, limit = 10 } = req.query;

            const resultado = await this.cancionService.buscarCanciones(q, {}, { page: parseInt(page), limit: parseInt(limit) });

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

    listarCanciones = async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;

            const resultado = await this.cancionService.listarCanciones({}, { page: parseInt(page), limit: parseInt(limit) });

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

    actualizarEstadisticas = async (req, res) => {
        try {
            const cancionId = req.params.id;
            const { reproducciones, likes, shares } = req.body;

            const estadisticas = {
                reproducciones,
                likes,
                shares
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

module.exports = CancionController;