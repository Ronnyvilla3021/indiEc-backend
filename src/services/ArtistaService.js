const { Artista, GeneroMusical } = require('../models/sql/associations');

class ArtistaService extends HybridService {
  
  async crearArtista(artistaData, profileData = {}) {
    return await this.executeHybridTransaction(
      {
        // Crear artista en MySQL
        artista: async (transaction) => {
          return await Artista.create({
            nombre: artistaData.nombre,
            nombre_artistico: artistaData.nombre_artistico,
            genero_principal_id: artistaData.genero_principal_id,
            pais_id: artistaData.pais_id,
            estado_id: artistaData.estado_id || 1,
            manager_id: artistaData.manager_id,
            fecha_registro: new Date(),
            verificado: false
          }, { transaction });
        }
      },
      {
        // Crear perfil en MongoDB
        perfil: async (mysqlResults) => {
          const artista = mysqlResults.artista;
          
          return await mongoose.connection.collection('artistas_profile').insertOne({
            id_artista: artista.id,
            biografia: profileData.biografia || '',
            foto_url: profileData.foto_url || null,
            galeria_fotos: profileData.galeria_fotos || [],
            redes_sociales: profileData.redes_sociales || {},
            influencias_musicales: profileData.influencias_musicales || [],
            instrumentos: profileData.instrumentos || [],
            colaboraciones: profileData.colaboraciones || [],
            premios_reconocimientos: profileData.premios_reconocimientos || [],
            estadisticas: {
              reproducciones_totales: 0,
              seguidores: 0,
              ventas_digitales: 0,
              conciertos_realizados: 0
            },
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerArtistaCompleto(artistaId) {
    try {
      const artista = await Artista.findByPk(artistaId, {
        include: [
          { model: GeneroMusical, as: 'genero_principal' },
          { model: Pais, as: 'pais' },
          { model: Estado, as: 'estado' }
        ]
      });

      if (!artista) return null;

      const perfil = await mongoose.connection.collection('artistas_profile')
        .findOne({ id_artista: artistaId });

      return {
        ...artista.toJSON(),
        perfil: perfil || {}
      };
    } catch (error) {
      logger.error('Error al obtener artista completo:', error);
      throw error;
    }
  }

  async buscarArtistas(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = { estado_id: 1 };

      if (query) {
        whereClause[sequelize.Op.or] = [
          { nombre: { [sequelize.Op.like]: `%${query}%` } },
          { nombre_artistico: { [sequelize.Op.like]: `%${query}%` } }
        ];
      }

      if (filtros.genero_id) whereClause.genero_principal_id = filtros.genero_id;
      if (filtros.pais_id) whereClause.pais_id = filtros.pais_id;

      const { count, rows } = await Artista.findAndCountAll({
        where: whereClause,
        include: [
          { model: GeneroMusical, as: 'genero_principal' },
          { model: Pais, as: 'pais' }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        artistas: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar artistas:', error);
      throw error;
    }
  }

  async actualizarEstadisticas(artistaId, estadisticas) {
    try {
      return await mongoose.connection.collection('artistas_profile')
        .findOneAndUpdate(
          { id_artista: artistaId },
          { 
            $set: {
              estadisticas: estadisticas,
              updated_at: new Date()
            }
          },
          { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al actualizar estadísticas del artista:', error);
      throw error;
    }
  }
}
