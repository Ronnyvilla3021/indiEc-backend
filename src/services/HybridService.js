// src/services/HybridService.js - VERSIÓN CORREGIDA
const { sequelize } = require('../config/database.sql');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class HybridService {
  constructor() {
    this.mongoConnection = mongoose.connection;
  }

  async executeHybridTransaction(mysqlOperations, mongoOperations) {
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Ejecutar operaciones MySQL en transacción
      const mysqlResults = {};
      for (const [key, operation] of Object.entries(mysqlOperations)) {
        mysqlResults[key] = await operation(transaction);
      }

      // 2. Ejecutar operaciones MongoDB
      const mongoResults = {};
      for (const [key, operation] of Object.entries(mongoOperations)) {
        mongoResults[key] = await operation(mysqlResults);
      }

      // 3. Confirmar transacción MySQL
      await transaction.commit();

      return { success: true, mysql: mysqlResults, mongo: mongoResults };
    } catch (error) {
      // Rollback MySQL
      await transaction.rollback();
      
      logger.error('Error en transacción híbrida:', error);
      throw error;
    }
  }

  async executeInTransaction(callback) {
    const transaction = await sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async paginar(modelo, opciones = {}) {
    const { page = 1, limit = 10, where = {}, include = [], order = [['created_at', 'DESC']] } = opciones;
    const offset = (page - 1) * limit;

    const { count, rows } = await modelo.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order
    });

    return {
      datos: rows,
      paginacion: {
        pagina: parseInt(page),
        limite: parseInt(limit),
        total: count,
        paginas: Math.ceil(count / limit)
      }
    };
  }
}

module.exports = HybridService;