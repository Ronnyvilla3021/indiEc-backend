const { ArtistaAdquirido } = require('../models/sql/associations');

class ContratoService extends HybridService {
  
  async crearContrato(contratoData, documentosData = {}) {
    return await this.executeHybridTransaction(
      {
        // Crear adquisición en MySQL
        adquisicion: async (transaction) => {
          return await ArtistaAdquirido.create({
            id_artista: contratoData.id_artista,
            tipo_accion: contratoData.tipo_accion,
            fecha_adquisicion: contratoData.fecha_adquisicion,
            fecha_fin_adquisicion: contratoData.fecha_fin_adquisicion,
            monto_costo: contratoData.monto_costo,
            estado_id: contratoData.estado_id || 1,
            usuario_gestor_id: contratoData.usuario_gestor_id
          }, { transaction });
        }
      },
      {
        // Crear documentos en MongoDB
        contrato: async (mysqlResults) => {
          const adquisicion = mysqlResults.adquisicion;
          
          return await mongoose.connection.collection('contratos').insertOne({
            id_adquisicion: adquisicion.id_adquisicion,
            tipo_contrato: contratoData.tipo_accion,
            url_contrato: documentosData.url_contrato || null,
            clausulas_especiales: documentosData.clausulas_especiales || [],
            terminos_financieros: {
              porcentaje_royalties: documentosData.porcentaje_royalties || 0,
              anticipos: documentosData.anticipos || 0,
              bonificaciones: documentosData.bonificaciones || []
            },
            obligaciones_artista: documentosData.obligaciones_artista || [],
            obligaciones_disquera: documentosData.obligaciones_disquera || [],
            derechos_territoriales: documentosData.derechos_territoriales || [],
            renovaciones: {
              automatica: documentosData.renovacion_automatica || false,
              condiciones: documentosData.condiciones_renovacion || '',
              opciones_renovacion: documentosData.opciones_renovacion || 0
            },
            documentos_adjuntos: documentosData.documentos_adjuntos || [],
            historial_modificaciones: [],
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerContratoCompleto(adquisicionId) {
    try {
      const adquisicion = await ArtistaAdquirido.findByPk(adquisicionId, {
        include: [
          { model: Artista, as: 'artista' },
          { model: Estado, as: 'estado' },
          { model: UsuarioNuevo, as: 'gestor' }
        ]
      });

      if (!adquisicion) return null;

      const contrato = await mongoose.connection.collection('contratos')
        .findOne({ id_adquisicion: adquisicionId });

      return {
        ...adquisicion.toJSON(),
        contrato: contrato || {}
      };
    } catch (error) {
      logger.error('Error al obtener contrato completo:', error);
      throw error;
    }
  }

  async listarContratos(filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (filtros.artista_id) whereClause.id_artista = filtros.artista_id;
      if (filtros.tipo_accion) whereClause.tipo_accion = filtros.tipo_accion;
      if (filtros.estado_id) whereClause.estado_id = filtros.estado_id;
      if (filtros.usuario_gestor_id) whereClause.usuario_gestor_id = filtros.usuario_gestor_id;

      const { count, rows } = await ArtistaAdquirido.findAndCountAll({
        where: whereClause,
        include: [
          { model: Artista, as: 'artista' },
          { model: Estado, as: 'estado' },
          { model: UsuarioNuevo, as: 'gestor' }
        ],
        limit,
        offset,
        order: [['fecha_adquisicion', 'DESC']]
      });

      return {
        contratos: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al listar contratos:', error);
      throw error;
    }
  }

  async actualizarContrato(adquisicionId, datosBasicos = {}, datosDocumento = {}) {
    return await this.executeHybridTransaction(
      {
        // Actualizar datos básicos en MySQL
        adquisicion: async (transaction) => {
          const updateData = {};
          
          if (datosBasicos.fecha_fin_adquisicion) updateData.fecha_fin_adquisicion = datosBasicos.fecha_fin_adquisicion;
          if (datosBasicos.monto_costo) updateData.monto_costo = datosBasicos.monto_costo;
          if (datosBasicos.estado_id) updateData.estado_id = datosBasicos.estado_id;

          if (Object.keys(updateData).length > 0) {
            await ArtistaAdquirido.update(updateData, {
              where: { id_adquisicion: adquisicionId },
              transaction
            });
          }

          return updateData;
        }
      },
      {
        // Actualizar documento en MongoDB
        contrato: async () => {
          if (Object.keys(datosDocumento).length > 0) {
            // Agregar al historial de modificaciones
            const historialEntry = {
              fecha: new Date(),
              usuario: datosDocumento.usuario_modificador || 'Sistema',
              cambios: JSON.stringify(datosDocumento),
              version: `v${Date.now()}`
            };

            return await mongoose.connection.collection('contratos')
              .findOneAndUpdate(
                { id_adquisicion: adquisicionId },
                { 
                  $set: {
                    ...datosDocumento,
                    updated_at: new Date()
                  },
                  $push: {
                    historial_modificaciones: historialEntry
                  }
                },
                { upsert: true, returnDocument: 'after' }
              );
          }
          return null;
        }
      }
    );
  }

  async obtenerContratosVencenProximamente(diasAnticipacion = 30) {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

      return await ArtistaAdquirido.findAll({
        where: {
          fecha_fin_adquisicion: {
            [require('sequelize').Op.lte]: fechaLimite,
            [require('sequelize').Op.gte]: new Date()
          },
          estado_id: 1 // Solo activos
        },
        include: [
          { model: Artista, as: 'artista' },
          { model: UsuarioNuevo, as: 'gestor' }
        ],
        order: [['fecha_fin_adquisicion', 'ASC']]
      });
    } catch (error) {
      logger.error('Error al obtener contratos próximos a vencer:', error);
      throw error;
    }
  }
}

module.exports = {
  AlbumService,
  CancionService,
  CarritoService,
  ContratoService
};