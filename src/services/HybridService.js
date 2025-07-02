const { sequelize } = require('../config/database.sql');
const { connectMongoDB } = require('../config/database.orm');
const mongoose = require('mongoose');
const logger = require('../config/logger');

class HybridService {
  constructor() {
    this.mongoConnection = mongoose.connection;
  }

  // Ejecutar transacción híbrida
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
      
      // TODO: Implementar compensación para MongoDB si es necesario
      logger.error('Error en transacción híbrida:', error);
      throw error;
    }
  }
}