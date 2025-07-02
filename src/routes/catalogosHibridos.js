const express = require('express');
const { Estado, Rol, GeneroMusical, Pais, Sexo } = require('../models/sql/associations');

const router = express.Router();

// GET /api/catalogos/estados
router.get('/estados', async (req, res) => {
  try {
    const estados = await Estado.findAll({
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: estados
    });
  } catch (error) {
    logger.error('Error al obtener estados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/catalogos/roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/catalogos/generos-musicales
router.get('/generos-musicales', async (req, res) => {
  try {
    const generos = await GeneroMusical.findAll({
      where: { estado_id: 1 }, // Solo activos
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: generos
    });
  } catch (error) {
    logger.error('Error al obtener géneros musicales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/catalogos/paises
router.get('/paises', async (req, res) => {
  try {
    const paises = await Pais.findAll({
      where: { estado_id: 1 }, // Solo activos
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: paises
    });
  } catch (error) {
    logger.error('Error al obtener países:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/catalogos/sexos
router.get('/sexos', async (req, res) => {
  try {
    const sexos = await Sexo.findAll({
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: sexos
    });
  } catch (error) {
    logger.error('Error al obtener sexos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;