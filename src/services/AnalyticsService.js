// ================================
// ANALYTICS SERVICE COMPLETO
// ================================

const mongoose = require('mongoose');
const { sequelize } = require('../config/database.sql');
const { HybridService } = require('./servicios_hibridos');
const logger = require('../config/logger');

class AnalyticsService extends HybridService {

    // ================================
    // REGISTRO DE MÉTRICAS BÁSICAS
    // ================================

    async registrarMetrica(tipoEntidad, idEntidad, metricas, metadatos = {}) {
        try {
            const documento = {
                tipo_entidad: tipoEntidad,
                id_entidad: idEntidad,
                fecha: new Date(),
                metricas: metricas,
                datos_demograficos: metadatos.demografia || {},
                plataformas: metadatos.plataforma || {},
                ubicacion: metadatos.ubicacion || {},
                dispositivo: metadatos.dispositivo || {},
                session_id: metadatos.session_id || null,
                user_id: metadatos.user_id || null,
                created_at: new Date()
            };

            const resultado = await mongoose.connection.collection('analytics').insertOne(documento);

            // Actualizar estadísticas en tiempo real si es necesario
            await this.actualizarEstadisticasEnTiempoReal(tipoEntidad, idEntidad, metricas);

            return { success: true, id: resultado.insertedId };
        } catch (error) {
            logger.error('Error al registrar métrica:', error);
            throw error;
        }
    }

    // ================================
    // MÉTRICAS ESPECÍFICAS POR ENTIDAD
    // ================================

    // Registro para reproducción de canción
    async registrarReproduccion(cancionId, usuarioId = null, metadatos = {}) {
        return await this.registrarMetrica('Cancion', cancionId, {
            reproducciones: 1,
            duracion_reproducida: metadatos.duracion_reproducida || 0,
            porcentaje_completado: metadatos.porcentaje_completado || 0,
            calidad_audio: metadatos.calidad_audio || 'standard',
            fuente_reproduccion: metadatos.fuente_reproduccion || 'web'
        }, {
            user_id: usuarioId,
            plataforma: metadatos.plataforma || 'web',
            ubicacion: metadatos.ubicacion,
            dispositivo: metadatos.dispositivo,
            session_id: metadatos.session_id
        });
    }

    // Registro para descarga
    async registrarDescarga(tipoProducto, idProducto, usuarioId, metadatos = {}) {
        return await this.registrarMetrica(tipoProducto, idProducto, {
            descargas: 1,
            formato_descarga: metadatos.formato || 'mp3',
            calidad_descarga: metadatos.calidad || 'high',
            tamaño_archivo: metadatos.tamaño || 0
        }, {
            user_id: usuarioId,
            plataforma: metadatos.plataforma,
            ubicacion: metadatos.ubicacion
        });
    }

    // Registro para interacciones sociales
    async registrarInteraccionSocial(tipoEntidad, idEntidad, tipoInteraccion, usuarioId = null, metadatos = {}) {
        const metricas = {};
        metricas[tipoInteraccion.toLowerCase()] = 1; // likes, shares, comentarios, etc.

        return await this.registrarMetrica(tipoEntidad, idEntidad, metricas, {
            user_id: usuarioId,
            tipo_interaccion: tipoInteraccion,
            contenido_compartido: metadatos.contenido,
            red_social: metadatos.red_social,
            session_id: metadatos.session_id
        });
    }

    // Registro para ventas
    async registrarVenta(ventaId, detallesVenta, metadatos = {}) {
        const metricas = {
            ingresos: detallesVenta.monto_total,
            productos_vendidos: detallesVenta.cantidad_total,
            metodo_pago: detallesVenta.metodo_pago,
            valor_ticket_promedio: detallesVenta.monto_total / (detallesVenta.productos?.length || 1)
        };

        return await this.registrarMetrica('Venta', ventaId, metricas, {
            user_id: detallesVenta.usuario_id,
            productos: detallesVenta.productos,
            promociones: detallesVenta.promociones,
            ubicacion: metadatos.ubicacion,
            plataforma: metadatos.plataforma
        });
    }

    // ================================
    // ESTADÍSTICAS POR ENTIDAD
    // ================================

    async obtenerEstadisticasArtista(artistaId, ventanaTiempo = 30) {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - ventanaTiempo);

            const pipeline = [
                {
                    $match: {
                        tipo_entidad: { $in: ['Artista', 'Cancion', 'Album'] },
                        $or: [
                            { id_entidad: artistaId, tipo_entidad: 'Artista' },
                            { 'metadatos.artista_id': artistaId }
                        ],
                        fecha: { $gte: fechaDesde }
                    }
                },
                {
                    $group: {
                        _id: '$tipo_entidad',
                        total_reproducciones: { $sum: '$metricas.reproducciones' },
                        total_descargas: { $sum: '$metricas.descargas' },
                        total_likes: { $sum: '$metricas.likes' },
                        total_shares: { $sum: '$metricas.shares' },
                        total_comentarios: { $sum: '$metricas.comentarios' },
                        total_ingresos: { $sum: '$metricas.ingresos' },
                        usuarios_unicos: { $addToSet: '$user_id' },
                        plataformas: { $addToSet: '$plataformas' },
                        paises: { $addToSet: '$ubicacion.pais' }
                    }
                },
                {
                    $project: {
                        tipo_entidad: '$_id',
                        total_reproducciones: 1,
                        total_descargas: 1,
                        total_likes: 1,
                        total_shares: 1,
                        total_comentarios: 1,
                        total_ingresos: 1,
                        usuarios_unicos_count: { $size: '$usuarios_unicos' },
                        plataformas_activas: { $size: '$plataformas' },
                        alcance_paises: { $size: '$paises' }
                    }
                }
            ];

            const resultados = await mongoose.connection.collection('analytics')
                .aggregate(pipeline)
                .toArray();

            // Combinar resultados de diferentes tipos de entidad
            const estadisticas = {
                resumen: {
                    total_reproducciones: 0,
                    total_descargas: 0,
                    total_likes: 0,
                    total_shares: 0,
                    total_comentarios: 0,
                    total_ingresos: 0,
                    usuarios_unicos: 0,
                    alcance_global: 0
                },
                por_tipo: {}
            };

            resultados.forEach(resultado => {
                estadisticas.por_tipo[resultado.tipo_entidad] = resultado;
                estadisticas.resumen.total_reproducciones += resultado.total_reproducciones || 0;
                estadisticas.resumen.total_descargas += resultado.total_descargas || 0;
                estadisticas.resumen.total_likes += resultado.total_likes || 0;
                estadisticas.resumen.total_shares += resultado.total_shares || 0;
                estadisticas.resumen.total_comentarios += resultado.total_comentarios || 0;
                estadisticas.resumen.total_ingresos += resultado.total_ingresos || 0;
            });

            return estadisticas;
        } catch (error) {
            logger.error('Error al obtener estadísticas del artista:', error);
            throw error;
        }
    }

    async obtenerEstadisticasCancion(cancionId, ventanaTiempo = 30) {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - ventanaTiempo);

            const [estadisticas, tendencias, demografia] = await Promise.all([
                // Estadísticas generales
                mongoose.connection.collection('analytics').aggregate([
                    {
                        $match: {
                            tipo_entidad: 'Cancion',
                            id_entidad: cancionId,
                            fecha: { $gte: fechaDesde }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total_reproducciones: { $sum: '$metricas.reproducciones' },
                            total_descargas: { $sum: '$metricas.descargas' },
                            total_likes: { $sum: '$metricas.likes' },
                            total_shares: { $sum: '$metricas.shares' },
                            duracion_promedio: { $avg: '$metricas.duracion_reproducida' },
                            completitud_promedio: { $avg: '$metricas.porcentaje_completado' },
                            usuarios_unicos: { $addToSet: '$user_id' },
                            primera_reproduccion: { $min: '$fecha' },
                            ultima_reproduccion: { $max: '$fecha' }
                        }
                    }
                ]).toArray(),

                // Tendencias por día
                this.obtenerTendenciasDiarias('Cancion', cancionId, ventanaTiempo),

                // Datos demográficos
                this.obtenerDemografia('Cancion', cancionId, ventanaTiempo)
            ]);

            return {
                estadisticas_generales: estadisticas[0] || {},
                tendencias_diarias: tendencias,
                demografia: demografia,
                periodo: {
                    inicio: fechaDesde,
                    fin: new Date(),
                    dias: ventanaTiempo
                }
            };
        } catch (error) {
            logger.error('Error al obtener estadísticas de canción:', error);
            throw error;
        }
    }

    // ================================
    // ANÁLISIS DEMOGRÁFICO
    // ================================

    async obtenerDemografia(tipoEntidad, idEntidad, ventanaTiempo = 30) {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - ventanaTiempo);

            const pipeline = [
                {
                    $match: {
                        tipo_entidad: tipoEntidad,
                        id_entidad: idEntidad,
                        fecha: { $gte: fechaDesde }
                    }
                },
                {
                    $group: {
                        _id: {
                            pais: '$ubicacion.pais',
                            edad_grupo: '$datos_demograficos.grupo_edad',
                            genero: '$datos_demograficos.genero',
                            plataforma: '$plataformas.nombre'
                        },
                        total_interacciones: { $sum: 1 },
                        reproducciones: { $sum: '$metricas.reproducciones' },
                        usuarios_unicos: { $addToSet: '$user_id' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        por_pais: {
                            $push: {
                                pais: '$_id.pais',
                                interacciones: '$total_interacciones',
                                usuarios: { $size: '$usuarios_unicos' }
                            }
                        },
                        por_edad: {
                            $push: {
                                grupo: '$_id.edad_grupo',
                                interacciones: '$total_interacciones',
                                usuarios: { $size: '$usuarios_unicos' }
                            }
                        },
                        por_genero: {
                            $push: {
                                genero: '$_id.genero',
                                interacciones: '$total_interacciones',
                                usuarios: { $size: '$usuarios_unicos' }
                            }
                        },
                        por_plataforma: {
                            $push: {
                                plataforma: '$_id.plataforma',
                                interacciones: '$total_interacciones',
                                usuarios: { $size: '$usuarios_unicos' }
                            }
                        }
                    }
                }
            ];

            const resultado = await mongoose.connection.collection('analytics')
                .aggregate(pipeline)
                .toArray();

            return resultado[0] || {
                por_pais: [],
                por_edad: [],
                por_genero: [],
                por_plataforma: []
            };
        } catch (error) {
            logger.error('Error al obtener demografía:', error);
            throw error;
        }
    }

    // ================================
    // TENDENCIAS Y ANÁLISIS TEMPORAL
    // ================================

    async obtenerTendenciasDiarias(tipoEntidad, idEntidad, dias = 30) {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - dias);

            const pipeline = [
                {
                    $match: {
                        tipo_entidad: tipoEntidad,
                        id_entidad: idEntidad,
                        fecha: { $gte: fechaDesde }
                    }
                },
                {
                    $group: {
                        _id: {
                            año: { $year: '$fecha' },
                            mes: { $month: '$fecha' },
                            dia: { $dayOfMonth: '$fecha' }
                        },
                        reproducciones: { $sum: '$metricas.reproducciones' },
                        descargas: { $sum: '$metricas.descargas' },
                        likes: { $sum: '$metricas.likes' },
                        shares: { $sum: '$metricas.shares' },
                        usuarios_unicos: { $addToSet: '$user_id' },
                        ingresos: { $sum: '$metricas.ingresos' }
                    }
                },
                {
                    $project: {
                        fecha: {
                            $dateFromParts: {
                                year: '$_id.año',
                                month: '$_id.mes',
                                day: '$_id.dia'
                            }
                        },
                        reproducciones: 1,
                        descargas: 1,
                        likes: 1,
                        shares: 1,
                        usuarios_unicos: { $size: '$usuarios_unicos' },
                        ingresos: 1
                    }
                },
                {
                    $sort: { fecha: 1 }
                }
            ];

            return await mongoose.connection.collection('analytics')
                .aggregate(pipeline)
                .toArray();
        } catch (error) {
            logger.error('Error al obtener tendencias diarias:', error);
            throw error;
        }
    }

    async obtenerTendenciasHorarias(tipoEntidad, idEntidad, dias = 7) {
        try {
            const fechaDesde = new Date();
            fechaDesde.setDate(fechaDesde.getDate() - dias);

            const pipeline = [
                {
                    $match: {
                        tipo_entidad: tipoEntidad,
                        id_entidad: idEntidad,
                        fecha: { $gte: fechaDesde }
                    }
                },
                {
                    $group: {
                        _id: {
                            hora: { $hour: '$fecha' }
                        },
                        total_interacciones: { $sum: 1 },
                        reproducciones: { $sum: '$metricas.reproducciones' },
                        usuarios_unicos: { $addToSet: '$user_id' }
                    }
                },
                {
                    $project: {
                        hora: '$_id.hora',
                        total_interacciones: 1,
                        reproducciones: 1,
                        usuarios_unicos: { $size: '$usuarios_unicos' }
                    }
                },
                {
                    $sort: { hora: 1 }
                }
            ];

            return await mongoose.connection.collection('analytics')
                .aggregate(pipeline)
                .toArray();
        } catch (error) {
            logger.error('Error al obtener tendencias horarias:', error);
            throw error;
        }
    }

    // ================================
    // REPORTES AVANZADOS
    // ================================

    async obtenerReporteVentas(filtros = {}) {
        try {
            const fechaDesde = filtros.fecha_desde ? new Date(filtros.fecha_desde) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const fechaHasta = filtros.fecha_hasta ? new Date(filtros.fecha_hasta) : new Date();

            // Datos de MySQL (transacciones)
            const ventasSQL = await sequelize.query(`
        SELECT 
          DATE(v.created_at) as fecha,
          COUNT(*) as total_ventas,
          SUM(v.monto_total) as ingresos_totales,
          AVG(v.monto_total) as ticket_promedio,
          COUNT(DISTINCT v.id_usuario) as clientes_unicos,
          v.metodo_pago,
          COUNT(CASE WHEN v.estado_pago = 'Pagado' THEN 1 END) as ventas_completadas,
          COUNT(CASE WHEN v.estado_pago = 'Pendiente' THEN 1 END) as ventas_pendientes,
          COUNT(CASE WHEN v.estado_pago = 'Cancelado' THEN 1 END) as ventas_canceladas
        FROM ventas v 
        WHERE v.created_at BETWEEN :fechaDesde AND :fechaHasta
        GROUP BY DATE(v.created_at), v.metodo_pago
        ORDER BY fecha DESC
      `, {
                replacements: { fechaDesde, fechaHasta },
                type: sequelize.QueryTypes.SELECT
            });

            // Datos de MongoDB (comportamiento)
            const ventasMongo = await mongoose.connection.collection('analytics')
                .aggregate([
                    {
                        $match: {
                            tipo_entidad: 'Venta',
                            fecha: { $gte: fechaDesde, $lte: fechaHasta }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                fecha: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
                                metodo_pago: '$metricas.metodo_pago'
                            },
                            productos_vendidos: { $sum: '$metricas.productos_vendidos' },
                            ingresos_analytics: { $sum: '$metricas.ingresos' },
                            tickets_promedio: { $avg: '$metricas.valor_ticket_promedio' },
                            conversion_rate: {
                                $avg: {
                                    $cond: [{ $gt: ['$metricas.productos_vendidos', 0] }, 1, 0]
                                }
                            }
                        }
                    },
                    {
                        $sort: { '_id.fecha': -1 }
                    }
                ])
                .toArray();

            // Análisis de productos más vendidos
            const productosPopulares = await this.obtenerProductosMasVendidos(fechaDesde, fechaHasta);

            // Análisis de embudo de conversión
            const embudoConversion = await this.obtenerEmbudoConversion(fechaDesde, fechaHasta);

            return {
                resumen_ventas: ventasSQL,
                comportamiento_ventas: ventasMongo,
                productos_populares: productosPopulares,
                embudo_conversion: embudoConversion,
                periodo: {
                    inicio: fechaDesde,
                    fin: fechaHasta
                }
            };
        } catch (error) {
            logger.error('Error al obtener reporte de ventas:', error);
            throw error;
        }
    }

    async obtenerProductosMasVendidos(fechaDesde, fechaHasta, limite = 10) {
        try {
            return await mongoose.connection.collection('analytics')
                .aggregate([
                    {
                        $match: {
                            tipo_entidad: 'Venta',
                            fecha: { $gte: fechaDesde, $lte: fechaHasta }
                        }
                    },
                    {
                        $unwind: '$metadatos.productos'
                    },
                    {
                        $group: {
                            _id: {
                                producto_id: '$metadatos.productos.id',
                                tipo_producto: '$metadatos.productos.tipo',
                                nombre: '$metadatos.productos.nombre'
                            },
                            total_vendido: { $sum: '$metadatos.productos.cantidad' },
                            ingresos_generados: { $sum: '$metadatos.productos.total' },
                            numero_transacciones: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { total_vendido: -1 }
                    },
                    {
                        $limit: limite
                    }
                ])
                .toArray();
        } catch (error) {
            logger.error('Error al obtener productos más vendidos:', error);
            throw error;
        }
    }

    // ================================
    // ANÁLISIS DE RENDIMIENTO
    // ================================

    async obtenerMetricasRendimiento(filtros = {}) {
        try {
            const fechaDesde = filtros.fecha_desde ? new Date(filtros.fecha_desde) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const fechaHasta = filtros.fecha_hasta ? new Date(filtros.fecha_hasta) : new Date();

            const metricas = await mongoose.connection.collection('analytics')
                .aggregate([
                    {
                        $match: {
                            fecha: { $gte: fechaDesde, $lte: fechaHasta }
                        }
                    },
                    {
                        $group: {
                            _id: '$tipo_entidad',
                            total_eventos: { $sum: 1 },
                            usuarios_unicos: { $addToSet: '$user_id' },
                            plataformas_activas: { $addToSet: '$plataformas.nombre' },
                            paises_alcanzados: { $addToSet: '$ubicacion.pais' },
                            total_reproducciones: { $sum: '$metricas.reproducciones' },
                            total_ingresos: { $sum: '$metricas.ingresos' },
                            engagement_promedio: {
                                $avg: {
                                    $add: [
                                        { $ifNull: ['$metricas.likes', 0] },
                                        { $ifNull: ['$metricas.shares', 0] },
                                        { $ifNull: ['$metricas.comentarios', 0] }
                                    ]
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            tipo_entidad: '$_id',
                            total_eventos: 1,
                            usuarios_unicos: { $size: '$usuarios_unicos' },
                            plataformas_activas: { $size: '$plataformas_activas' },
                            alcance_global: { $size: '$paises_alcanzados' },
                            total_reproducciones: 1,
                            total_ingresos: 1,
                            engagement_promedio: 1,
                            eventos_por_usuario: {
                                $divide: ['$total_eventos', { $size: '$usuarios_unicos' }]
                            }
                        }
                    }
                ])
                .toArray();

            return {
                metricas_por_entidad: metricas,
                resumen_global: this.calcularResumenGlobal(metricas),
                periodo: {
                    inicio: fechaDesde,
                    fin: fechaHasta
                }
            };
        } catch (error) {
            logger.error('Error al obtener métricas de rendimiento:', error);
            throw error;
        }
    }

    // ================================
    // ANÁLISIS PREDICTIVO
    // ================================

    async obtenerPrediccionTendencias(tipoEntidad, idEntidad, diasHistoricos = 30, diasPrediccion = 7) {
        try {
            // Obtener datos históricos
            const datosHistoricos = await this.obtenerTendenciasDiarias(tipoEntidad, idEntidad, diasHistoricos);

            if (datosHistoricos.length < 7) {
                throw new Error('Insuficientes datos históricos para predicción');
            }

            // Análisis de tendencia simple (regresión lineal básica)
            const predicciones = this.calcularTendenciaLineal(datosHistoricos, diasPrediccion);

            // Calcular métricas de confianza
            const confianza = this.calcularConfianzaPrediccion(datosHistoricos);

            return {
                datos_historicos: datosHistoricos,
                predicciones: predicciones,
                confianza: confianza,
                recomendaciones: this.generarRecomendaciones(datosHistoricos, predicciones)
            };
        } catch (error) {
            logger.error('Error en predicción de tendencias:', error);
            throw error;
        }
    }

    // ================================
    // MÉTODOS AUXILIARES
    // ================================

    async actualizarEstadisticasEnTiempoReal(tipoEntidad, idEntidad, metricas) {
        try {
            // Actualizar contadores en MongoDB para acceso rápido
            await mongoose.connection.collection('estadisticas_tiempo_real').findOneAndUpdate(
                {
                    tipo_entidad: tipoEntidad,
                    id_entidad: idEntidad,
                    fecha: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                },
                {
                    $inc: metricas,
                    $set: { ultima_actualizacion: new Date() }
                },
                { upsert: true }
            );
        } catch (error) {
            logger.warn('Error actualizando estadísticas en tiempo real:', error);
            // No lanzar error para no afectar el flujo principal
        }
    }

    calcularResumenGlobal(metricasPorEntidad) {
        return metricasPorEntidad.reduce((resumen, entidad) => {
            resumen.total_eventos += entidad.total_eventos;
            resumen.usuarios_unicos += entidad.usuarios_unicos;
            resumen.total_reproducciones += entidad.total_reproducciones || 0;
            resumen.total_ingresos += entidad.total_ingresos || 0;
            resumen.engagement_total += entidad.engagement_promedio || 0;
            return resumen;
        }, {
            total_eventos: 0,
            usuarios_unicos: 0,
            total_reproducciones: 0,
            total_ingresos: 0,
            engagement_total: 0
        });
    }

    calcularTendenciaLineal(datos, diasPrediccion) {
        // Implementación básica de regresión lineal
        const n = datos.length;
        const sumX = datos.reduce((sum, _, i) => sum + i, 0);
        const sumY = datos.reduce((sum, d) => sum + (d.reproducciones || 0), 0);
        const sumXY = datos.reduce((sum, d, i) => sum + i * (d.reproducciones || 0), 0);
        const sumX2 = datos.reduce((sum, _, i) => sum + i * i, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const predicciones = [];
        for (let i = 0; i < diasPrediccion; i++) {
            const x = n + i;
            const prediccion = slope * x + intercept;
            const fecha = new Date();
            fecha.setDate(fecha.getDate() + i + 1);

            predicciones.push({
                fecha: fecha,
                reproducciones_predichas: Math.max(0, Math.round(prediccion)),
                tendencia: slope > 0 ? 'creciente' : slope < 0 ? 'decreciente' : 'estable'
            });
        }

        return predicciones;
    }

    calcularConfianzaPrediccion(datosHistoricos) {
        // Calcular variabilidad de los datos
        const valores = datosHistoricos.map(d => d.reproducciones || 0);
        const promedio = valores.reduce((sum, v) => sum + v, 0) / valores.length;
        const varianza = valores.reduce((sum, v) => sum + Math.pow(v - promedio, 2), 0) / valores.length;
        const desviacion = Math.sqrt(varianza);

        // Confianza inversamente proporcional a la variabilidad
        const coeficienteVariacion = desviacion / promedio;
        const confianza = Math.max(0.1, Math.min(0.95, 1 - coeficienteVariacion));

        return {
            porcentaje: Math.round(confianza * 100),
            nivel: confianza > 0.7 ? 'alto' : confianza > 0.4 ? 'medio' : 'bajo',
            desviacion_estandar: desviacion,
            coeficiente_variacion: coeficienteVariacion
        };
    }

    generarRecomendaciones(datosHistoricos, predicciones) {
        const recomendaciones = [];
        const tendencia = predicciones[0]?.tendencia;
        const promedio = datosHistoricos.reduce((sum, d) => sum + (d.reproducciones || 0), 0) / datosHistoricos.length;

        if (tendencia === 'decreciente') {
            recomendaciones.push({
                tipo: 'alerta',
                mensaje: 'Tendencia decreciente detectada. Considerar estrategias de promoción.',
                prioridad: 'alta'
            });
        }

        if (tendencia === 'creciente') {
            recomendaciones.push({
                tipo: 'oportunidad',
                mensaje: 'Tendencia creciente. Momento ideal para intensificar promoción.',
                prioridad: 'media'
            });
        }

        if (promedio < 100) {
            recomendaciones.push({
                tipo: 'mejora',
                mensaje: 'Bajo engagement. Revisar estrategia de contenido y promoción.',
                prioridad: 'media'
            });
        }


        return recomendaciones;
    }
}

module.exports = AnalyticsService;
