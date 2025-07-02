const { AlbumNuevo, Artista, GeneroMusical, Estado } = require('../models/sql/associations');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const { HybridService } = require('./servicios_hibridos');

class AlbumService extends HybridService {
  
  async crearAlbum(albumData, contentData = {}) {
    return await this.executeHybridTransaction(
      {
        // Crear álbum en MySQL
        album: async (transaction) => {
          return await AlbumNuevo.create({
            titulo: albumData.titulo,
            artista_id: albumData.artista_id,
            año: albumData.año,
            genero_id: albumData.genero_id,
            estado_id: albumData.estado_id || 1,
            fecha_lanzamiento: albumData.fecha_lanzamiento,
            precio: albumData.precio || 0
          }, { transaction });
        }
      },
      {
        // Crear contenido en MongoDB
        contenido: async (mysqlResults) => {
          const album = mysqlResults.album;
          
          return await mongoose.connection.collection('albumes_content').insertOne({
            id_album: album.id,
            foto_url: contentData.foto_url || null,
            descripcion_extendida: contentData.descripcion_extendida || '',
            notas_produccion: contentData.notas_produccion || '',
            creditos: contentData.creditos || {},
            enlaces_streaming: contentData.enlaces_streaming || {},
            metadata: {
              formato_original: contentData.formato_original || 'Digital',
              calidad_audio: contentData.calidad_audio || 'HD',
              idioma_principal: contentData.idioma_principal || 'es',
              etiquetas: contentData.etiquetas || []
            },
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    );
  }

  async obtenerAlbumCompleto(albumId) {
    try {
      const album = await AlbumNuevo.findByPk(albumId, {
        include: [
          { model: Artista, as: 'artista' },
          { model: GeneroMusical, as: 'genero' },
          { model: Estado, as: 'estado' }
        ]
      });

      if (!album) return null;

      const contenido = await mongoose.connection.collection('albumes_content')
        .findOne({ id_album: albumId });

      return {
        ...album.toJSON(),
        contenido: contenido || {}
      };
    } catch (error) {
      logger.error('Error al obtener álbum completo:', error);
      throw error;
    }
  }

  async buscarAlbumes(query, filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const offset = (page - 1) * limit;

      const whereClause = { estado_id: 1 };

      if (query) {
        whereClause[require('sequelize').Op.like] = { titulo: `%${query}%` };
      }

      if (filtros.artista_id) whereClause.artista_id = filtros.artista_id;
      if (filtros.genero_id) whereClause.genero_id = filtros.genero_id;
      if (filtros.año) whereClause.año = filtros.año;

      const { count, rows } = await AlbumNuevo.findAndCountAll({
        where: whereClause,
        include: [
          { model: Artista, as: 'artista' },
          { model: GeneroMusical, as: 'genero' }
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      // Enriquecer con contenido de MongoDB
      const albumesCompletos = await Promise.all(
        rows.map(async (album) => {
          const contenido = await mongoose.connection.collection('albumes_content')
            .findOne({ id_album: album.id });
          
          return {
            ...album.toJSON(),
            contenido: contenido || {}
          };
        })
      );

      return {
        albumes: albumesCompletos,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar álbumes:', error);
      throw error;
    }
  }

  async actualizarAlbum(albumId, datosBasicos = {}, datosContenido = {}) {
    return await this.executeHybridTransaction(
      {
        // Actualizar datos básicos en MySQL
        album: async (transaction) => {
          const updateData = {};
          
          if (datosBasicos.titulo) updateData.titulo = datosBasicos.titulo;
          if (datosBasicos.genero_id) updateData.genero_id = datosBasicos.genero_id;
          if (datosBasicos.precio !== undefined) updateData.precio = datosBasicos.precio;
          if (datosBasicos.fecha_lanzamiento) updateData.fecha_lanzamiento = datosBasicos.fecha_lanzamiento;

          if (Object.keys(updateData).length > 0) {
            await AlbumNuevo.update(updateData, {
              where: { id: albumId },
              transaction
            });
          }

          return updateData;
        }
      },
      {
        // Actualizar contenido en MongoDB
        contenido: async () => {
          if (Object.keys(datosContenido).length > 0) {
            return await mongoose.connection.collection('albumes_content')
              .findOneAndUpdate(
                { id_album: albumId },
                { 
                  $set: {
                    ...datosContenido,
                    updated_at: new Date()
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

  async eliminarAlbum(albumId) {
    return await this.executeHybridTransaction(
      {
        // Eliminar de MySQL
        album: async (transaction) => {
          return await AlbumNuevo.destroy({
            where: { id: albumId },
            transaction
          });
        }
      },
      {
        // Eliminar de MongoDB
        contenido: async () => {
          return await mongoose.connection.collection('albumes_content')
            .deleteOne({ id_album: albumId });
        }
      }
    );
  }
}
