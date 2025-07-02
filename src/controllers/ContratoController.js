const { ContratoService } = require('../services/servicios_faltantes');
const logger = require('../config/logger');

class ContratoController {
    constructor() {
        this.contratoService = new ContratoService();
    }

    crearContrato = async (req, res) => {
        try {
            const {
                tipo_accion,
                artista_info,
                fecha_adquisicion,
                fecha_fin_adquisicion,
                monto_costo,
                clausulas_especiales
            } = req.body;

            const contratoData = {
                tipo_accion,
                artista_info,
                fecha_adquisicion,
                fecha_fin_adquisicion,
                monto_costo,
                usuario_gestor_id: req.user.id_usuario || req.user.id
            };

            const documentosData = {
                clausulas_especiales
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

    listarContratos = async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;

            const resultado = await this.contratoService.listarContratos({}, { page: parseInt(page), limit: parseInt(limit) });

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

    obtenerMisContratos = async (req, res) => {
        try {
            const usuarioId = req.user.id_usuario || req.user.id;
            const { page = 1, limit = 10 } = req.query;

            const resultado = await this.contratoService.obtenerMisContratos(usuarioId, { page: parseInt(page), limit: parseInt(limit) });

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

    obtenerContratosProximosVencer = async (req, res) => {
        try {
            const { dias = 30 } = req.query;

            const contratos = await this.contratoService.obtenerContratosProximosVencer(parseInt(dias));

            res.json({
                success: true,
                data: contratos
            });
        } catch (error) {
            logger.error('Error al obtener contratos próximos a vencer:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };

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

module.exports = ContratoController;