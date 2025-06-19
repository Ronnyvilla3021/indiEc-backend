const express = require("express");
const Event = require("../models/sql/Event");
const EventDetails = require("../models/mongo/EventDetails");
const { authenticateToken } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");
const upload = require("../utils/fileUpload");
const logger = require("../config/logger");

const router = express.Router();

// Obtener todos los eventos del usuario
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Event.findAndCountAll({
      where: { user_id: req.user.id },
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
      order: [["fecha", "ASC"]],
    });

    const eventsWithDetails = await Promise.all(
      rows.map(async (event) => {
        const details = await EventDetails.findOne({ event_id: event.id });
        return {
          ...event.toJSON(),
          details: details || {},
        };
      })
    );

    res.json({
      success: true,
      data: eventsWithDetails,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error("Error al obtener eventos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Crear nuevo evento
router.post("/", authenticateToken, validate(schemas.event), async (req, res) => {
  try {
    const { nombre_evento, genero_musical, fecha, contacto, capacidad } = req.body;

    const event = await Event.create({
      nombre_evento,
      genero_musical,
      fecha,
      contacto,
      capacidad,
      user_id: req.user.id,
    });

    await EventDetails.create({
      event_id: event.id,
    });

    logger.info(`Evento creado: ${nombre_evento} por usuario ID: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: "Evento creado exitosamente",
      data: event,
    });
  } catch (error) {
    logger.error("Error al crear evento:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Obtener evento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    const details = await EventDetails.findOne({ event_id: event.id });

    res.json({
      success: true,
      data: {
        ...event.toJSON(),
        details: details || {}
      }
    });
  } catch (error) {
    logger.error("Error al obtener evento por ID:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Actualizar evento
router.put('/:id', authenticateToken, validate(schemas.event), async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    const updatedEvent = await event.update(req.body);
    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: updatedEvent
    });
  } catch (error) {
    logger.error("Error al actualizar evento:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Eliminar evento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    await event.destroy();
    logger.info(`Evento eliminado: ${event.nombre_evento} por usuario ID: ${req.user.id}`);
    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    logger.error("Error al eliminar evento:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

// Obtener detalles de un evento
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const details = await EventDetails.findOne({
      where: { event_id: req.params.id }
    });

    if (!details) {
      return res.status(404).json({
        success: false,
        message: 'Detalles del evento no encontrados'
      });
    }

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    logger.error("Error al obtener detalles del evento:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

module.exports = router;
