const express = require('express');
const logger = require('../config/logger');

const router = express.Router();

// GET /api/catalogos/estados
router.get('/estados', async (req, res) => {
  try {
    // Datos mock hasta que las asociaciones funcionen
    const estados = [
      { id: 1, nombre: 'Activo', descripcion: 'Registro activo y disponible' },
      { id: 2, nombre: 'Inactivo', descripcion: 'Registro inactivo temporalmente' },
      { id: 3, nombre: 'Eliminado', descripcion: 'Registro marcado para eliminación' },
      { id: 4, nombre: 'Pendiente', descripcion: 'Registro pendiente de aprobación' },
      { id: 5, nombre: 'Suspendido', descripcion: 'Registro suspendido por políticas' }
    ];

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
    const roles = [
      { id: 1, nombre: 'Administrador', descripcion: 'Acceso completo al sistema' },
      { id: 2, nombre: 'Manager', descripcion: 'Gestión de artistas y eventos' },
      { id: 3, nombre: 'Artista', descripcion: 'Perfil de artista' },
      { id: 4, nombre: 'Cliente', descripcion: 'Usuario final consumidor' },
      { id: 5, nombre: 'Disquera', descripcion: 'Representante de disquera' }
    ];

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
    const generos = [
      { id: 1, nombre: 'Rock', descripcion: 'Música rock en todas sus variantes' },
      { id: 2, nombre: 'Pop', descripcion: 'Música popular contemporánea' },
      { id: 3, nombre: 'Jazz', descripcion: 'Jazz tradicional y contemporáneo' },
      { id: 4, nombre: 'Clásica', descripcion: 'Música clásica y orquestal' },
      { id: 5, nombre: 'Electrónica', descripción: 'Música electrónica y EDM' },
      { id: 6, nombre: 'Hip-Hop', descripcion: 'Hip-Hop y Rap' },
      { id: 7, nombre: 'Reggae', descripcion: 'Reggae y música caribeña' },
      { id: 8, nombre: 'Metal', descripcion: 'Heavy Metal y subgéneros' }
    ];

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
    const paises = [
      { id: 1, nombre: 'Colombia', codigo_iso: 'COL', codigo_telefono: '+57' },
      { id: 2, nombre: 'México', codigo_iso: 'MEX', codigo_telefono: '+52' },
      { id: 3, nombre: 'Argentina', codigo_iso: 'ARG', codigo_telefono: '+54' },
      { id: 4, nombre: 'España', codigo_iso: 'ESP', codigo_telefono: '+34' },
      { id: 5, nombre: 'Estados Unidos', codigo_iso: 'USA', codigo_telefono: '+1' }
    ];

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
    const sexos = [
      { id: 1, nombre: 'Masculino', descripcion: 'Género masculino' },
      { id: 2, nombre: 'Femenino', descripcion: 'Género femenino' },
      { id: 3, nombre: 'No binario', descripcion: 'Género no binario' },
      { id: 4, nombre: 'Prefiero no decir', descripcion: 'Prefiere no especificar' }
    ];

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