const { sequelize } = require('../src/config/database.sql');
const { connectMongoDB } = require('../src/config/database.orm');
const { definirAsociaciones } = require('../src/models/sql/associations');
const logger = require('../src/config/logger');

async function sincronizarModelos() {
  try {
    console.log('🚀 Iniciando sincronización de modelos...');

    // 1. Conectar a bases de datos
    await sequelize.authenticate();
    await connectMongoDB();
    console.log('✅ Conexiones establecidas');

    // 2. Definir asociaciones
    definirAsociaciones();
    console.log('✅ Asociaciones definidas');

    // 3. Sincronizar modelos (cuidado en producción)
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false // NUNCA usar force: true en producción
    });
    console.log('✅ Modelos sincronizados');

    // 4. Crear datos iniciales
    await crearDatosIniciales();
    console.log('✅ Datos iniciales creados');

    console.log('🎉 Sincronización completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    process.exit(1);
  }
}

async function crearDatosIniciales() {
  const { Estado, Rol, Sexo, GeneroMusical, Pais } = require('../src/models/sql/associations');

  // Verificar si ya existen datos
  const estadosCount = await Estado.count();
  if (estadosCount > 0) {
    console.log('💾 Datos iniciales ya existen');
    return;
  }

  // Crear estados
  await Estado.bulkCreate([
    { nombre: 'Activo', descripcion: 'Registro activo y disponible' },
    { nombre: 'Inactivo', descripcion: 'Registro inactivo temporalmente' },
    { nombre: 'Eliminado', descripcion: 'Registro marcado para eliminación' },
    { nombre: 'Pendiente', descripcion: 'Registro pendiente de aprobación' },
    { nombre: 'Suspendido', descripcion: 'Registro suspendido por políticas' }
  ]);

  // Crear sexos
  await Sexo.bulkCreate([
    { nombre: 'Masculino', descripcion: 'Género masculino' },
    { nombre: 'Femenino', descripcion: 'Género femenino' },
    { nombre: 'No binario', descripcion: 'Género no binario' },
    { nombre: 'Prefiero no decir', descripcion: 'Prefiere no especificar' }
  ]);

  // Crear roles
  await Rol.bulkCreate([
    { nombre: 'Administrador', descripcion: 'Acceso completo al sistema', permisos: { all: true } },
    { nombre: 'Manager', descripcion: 'Gestión de artistas y eventos', permisos: { artists: true, events: true } },
    { nombre: 'Artista', descripcion: 'Perfil de artista', permisos: { profile: true, music: true } },
    { nombre: 'Cliente', descripcion: 'Usuario final consumidor', permisos: { purchase: true, profile: true } },
    { nombre: 'Disquera', descripcion: 'Representante de disquera', permisos: { contracts: true, artists: true } }
  ]);

  // Crear géneros musicales
  await GeneroMusical.bulkCreate([
    { nombre: 'Rock', descripcion: 'Música rock en todas sus variantes', estado_id: 1 },
    { nombre: 'Pop', descripcion: 'Música popular contemporánea', estado_id: 1 },
    { nombre: 'Jazz', descripcion: 'Jazz tradicional y contemporáneo', estado_id: 1 },
    { nombre: 'Clásica', descripcion: 'Música clásica y orquestal', estado_id: 1 },
    { nombre: 'Electrónica', descripcion: 'Música electrónica y EDM', estado_id: 1 },
    { nombre: 'Hip-Hop', descripcion: 'Hip-Hop y Rap', estado_id: 1 },
    { nombre: 'Reggae', descripcion: 'Reggae y música caribeña', estado_id: 1 },
    { nombre: 'Metal', descripcion: 'Heavy Metal y subgéneros', estado_id: 1 }
  ]);

  // Crear países
  await Pais.bulkCreate([
    { nombre: 'Colombia', codigo_iso: 'COL', codigo_telefono: '+57', estado_id: 1 },
    { nombre: 'México', codigo_iso: 'MEX', codigo_telefono: '+52', estado_id: 1 },
    { nombre: 'Argentina', codigo_iso: 'ARG', codigo_telefono: '+54', estado_id: 1 },
    { nombre: 'España', codigo_iso: 'ESP', codigo_telefono: '+34', estado_id: 1 },
    { nombre: 'Estados Unidos', codigo_iso: 'USA', codigo_telefono: '+1', estado_id: 1 }
  ]);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  sincronizarModelos();
}

module.exports = { sincronizarModelos, crearDatosIniciales };