const { CancionNueva, AlbumNuevo } = require('../models/sql/associations');

class CancionService extends HybridService {
  
  async crearCancion(cancionData, contentData = {}) {
    return await this.executeHybridTransaction(
      {
        // Crear canción en MySQL
        cancion: async (transaction) => {
          return await CancionNueva.create({
            titulo: cancionData.titulo,
            album_id: cancionData.album_id,
            artista_id: cancionData.artista_id,
            duracion: cancionData.duracion,
            año: cancionData.año,
            genero_id: cancionData.genero_id,
            estado_id: cancionData.estado_id || 1,
            track_number: cancionData.track_number,
            precio: cancionData.precio || 0
          }, { transaction });
        }
      },
      {
        // Crear contenido en MongoDB
        contenido: async (mysqlResults) => {
          const cancion = mysqlResults.cancion;
          
          return await mongoose.connection.collection('canciones_content').insertOne({
            id_cancion: cancion.id,
            foto_url: contentData.foto_url || null,
            url_audio: contentData.url_audio || null,
            url_video: contentData.url_video || null,
            letra: {
              idioma: contentData.idioma_letra || 'es',
              contenido: contentData.letra || '',
              letra_sincronizada: contentData.letra_sincronizada || []
            },
            creditos_detallados: {
              compositores: contentData.compositores || [],
              letristas: contentData.letristas || [],
              productores: contentData.productores || [],
              musicos_session: contentData.musicos_session || []
            },
            informacion_tecnica: {
              bpm: contentData.bpm || null,
              tonalidad: contentData.tonalidad || null,
              formato_audio: contentData.formato_audio || 'MP3',
              bitrate: contentData.bitrate || '320kbps',
              sample_rate: contentData.sample_rate || '44.1kHz'
            },
            estadisticas_reproduccion: {
              reproducciones: 0,
              likes: 0,
              shares: 0,
              comentarios: 0
            },
            etiquetas: contentData.etiquetas || [],
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerCancionCompleta(cancionId) {
    try {
      const cancion = await CancionNueva.findByPk(cancionId, {
        include: [
          { model: AlbumNuevo, as: 'album' },
          { model: Artista, as: 'artista' },
          { model: GeneroMusical, as: 'genero' },
          { model: Estado, as: 'estado' }
        ]
      });

      if (!cancion) return null;

      const contenido = await mongoose.connection.collection('canciones_content')
        .findOne({ id_cancion: cancionId });

      return {
        ...cancion.toJSON(),
        contenido: contenido || {}
      };
    } catch (error) {
      logger.error('Error al obtener canción completa:', error);
      throw error;
    }
  }

  async buscarCanciones(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = { estado_id: 1 };

      if (query) {
        whereClause[require('sequelize').Op.like] = { titulo: `%${query}%` };
      }

      if (filtros.artista_id) whereClause.artista_id = filtros.artista_id;
      if (filtros.album_id) whereClause.album_id = filtros.album_id;
      if (filtros.genero_id) whereClause.genero_id = filtros.genero_id;

      const { count, rows } = await CancionNueva.findAndCountAll({
        where: whereClause,
        include: [
          { model: AlbumNuevo, as: 'album' },
          { model: Artista, as: 'artista' },
          { model: GeneroMusical, as: 'genero' }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      // Enriquecer con contenido de MongoDB
      const cancionesCompletas = await Promise.all(
        rows.map(async (cancion) => {
          const contenido = await mongoose.connection.collection('canciones_content')
            .findOne({ id_cancion: cancion.id });
          
          return {
            ...cancion.toJSON(),
            contenido: contenido || {}
          };
        })
      );

      return {
        canciones: cancionesCompletas,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar canciones:', error);
      throw error;
    }
  }

  async actualizarEstadisticasReproduccion(cancionId, nuevasEstadisticas) {
    try {
      return await mongoose.connection.collection('canciones_content')
        .findOneAndUpdate(
          { id_cancion: cancionId },
          { 
            $set: {
              estadisticas_reproduccion: nuevasEstadisticas,
              updated_at: new Date()
            }
          },
          { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
      logger.error('Error al actualizar estadísticas de reproducción:', error);
      throw error;
    }
  }

  async obtenerCancionesPorAlbum(albumId) {
    try {
      const canciones = await CancionNueva.findAll({
        where: { album_id: albumId, estado_id: 1 },
        order: [['track_number', 'ASC'], ['created_at', 'ASC']]
      });

      return canciones;
    } catch (error) {
      logger.error('Error al obtener canciones por álbum:', error);
      throw error;
    }
  }
}