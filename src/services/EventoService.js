class EventoService extends HybridService {
  
  async crearEvento(eventoData) {
    try {
      const evento = await mongoose.connection.collection('eventos').insertOne({
        nombre_evento: eventoData.nombre_evento,
        descripcion: eventoData.descripcion,
        ubicacion: {
          venue: eventoData.venue,
          direccion: eventoData.direccion,
          ciudad: eventoData.ciudad,
          pais: eventoData.pais,
          coordenadas: eventoData.coordenadas || null
        },
        fecha_evento: new Date(eventoData.fecha_evento),
        hora_evento: eventoData.hora_evento,
        capacidad: eventoData.capacidad,
        artistas: eventoData.artistas || [],
        contacto: eventoData.contacto || {},
        precios: eventoData.precios || [],
        requisitos: eventoData.requisitos || {},
        promocion: eventoData.promocion || {},
        estado: 'Planificado',
        created_at: new Date(),
        updated_at: new Date()
      });

      return { success: true, evento_id: evento.insertedId };
    } catch (error) {
      logger.error('Error al crear evento:', error);
      throw error;
    }
  }

  async obtenerEventos(filtros = {}, opciones = {}) {
    try {
      const { page = 1, limit = 10 } = opciones;
      const skip = (page - 1) * limit;

      // Construir filtros MongoDB
      const query = {};
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.ciudad) query['ubicacion.ciudad'] = new RegExp(filtros.ciudad, 'i');
      if (filtros.fecha_desde) query.fecha_evento = { $gte: new Date(filtros.fecha_desde) };
      if (filtros.fecha_hasta) {
        if (query.fecha_evento) {
          query.fecha_evento.$lte = new Date(filtros.fecha_hasta);
        } else {
          query.fecha_evento = { $lte: new Date(filtros.fecha_hasta) };
        }
      }

      const [eventos, total] = await Promise.all([
        mongoose.connection.collection('eventos')
          .find(query)
          .skip(skip)
          .limit(limit)
          .sort({ fecha_evento: 1 })
          .toArray(),
        mongoose.connection.collection('eventos').countDocuments(query)
      ]);

      return {
        eventos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener eventos:', error);
      throw error;
    }
  }

  async buscarEventosPorArtista(artistaId) {
    try {
      return await mongoose.connection.collection('eventos')
        .find({ 'artistas.id_artista': artistaId })
        .sort({ fecha_evento: 1 })
        .toArray();
    } catch (error) {
      logger.error('Error al buscar eventos por artista:', error);
      throw error;
    }
  }
}