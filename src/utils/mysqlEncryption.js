// src/utils/encryption.js - Sistema de encriptación final corregido
const bcrypt = require("bcrypt")
const crypto = require("crypto")

const SALT_ROUNDS = 12
const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16

// Derivar clave desde la clave maestra
const deriveKey = (masterKey, salt = 'indiec-salt-2024') => {
  return crypto.pbkdf2Sync(masterKey, salt, 10000, KEY_LENGTH, 'sha256')
}

// Obtener clave de encriptación
const getEncryptionKey = () => {
  const masterKey = process.env.ENCRYPTION_KEY
  if (!masterKey || masterKey.length < 32) {
    throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres')
  }
  return deriveKey(masterKey)
}

// Funciones para passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// Encriptación segura con AES-256-CBC (API corregida)
const encryptData = (text) => {
  if (!text || text === null || text === undefined) return null
  
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Usar createCipheriv para especificar IV manualmente
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(String(text), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Combinar IV + datos encriptados con separador
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Error al encriptar:', error)
    throw new Error('Error en encriptación')
  }
}

// Desencriptación segura
const decryptData = (encryptedData) => {
  if (!encryptedData || encryptedData === null) return null
  
  try {
    const key = getEncryptionKey()
    
    // Verificar formato
    if (!encryptedData.includes(':')) {
      throw new Error('Formato de datos encriptados inválido')
    }
    
    // Separar IV y datos
    const textParts = encryptedData.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encrypted = textParts.join(':')
    
    // Usar createDecipheriv para especificar IV manualmente
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Error al desencriptar:', error)
    throw new Error('Error en desencriptación')
  }
}

// Encriptar objeto completo
const encryptObject = (obj, fieldsToEncrypt = []) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const encrypted = { ...obj }
  
  fieldsToEncrypt.forEach(field => {
    if (encrypted[field] && encrypted[field] !== null && encrypted[field] !== undefined) {
      try {
        encrypted[field] = encryptData(encrypted[field])
      } catch (error) {
        console.warn(`No se pudo encriptar el campo ${field}:`, error.message)
        // Mantener el valor original si no se puede encriptar
      }
    }
  })
  
  return encrypted
}

// Desencriptar objeto completo
const decryptObject = (obj, fieldsToDecrypt = []) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const decrypted = { ...obj }
  
  fieldsToDecrypt.forEach(field => {
    if (decrypted[field] && isEncrypted(decrypted[field])) {
      try {
        decrypted[field] = decryptData(decrypted[field])
      } catch (error) {
        console.warn(`No se pudo desencriptar el campo ${field}:`, error.message)
        // Mantener el valor original si no se puede desencriptar
      }
    }
  })
  
  return decrypted
}

// Verificar si un dato está encriptado
const isEncrypted = (data) => {
  if (!data || typeof data !== 'string') return false
  
  // Los datos encriptados tienen el formato: hexIV:hexData
  return data.includes(':') && data.length > 32 && /^[a-f0-9]+:[a-f0-9]+$/i.test(data)
}

// Generar token seguro
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex")
}

// Generar hash para verificación de integridad
const generateHash = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex')
}

// Verificar integridad de datos
const verifyIntegrity = (data, hash) => {
  return generateHash(data) === hash
}

// Función de prueba
const testEncryption = () => {
  try {
    const testData = 'Texto de prueba para encriptación'
    console.log('🧪 Probando encriptación...')
    console.log('Original:', testData)
    
    const encrypted = encryptData(testData)
    console.log('Encriptado:', encrypted)
    
    const decrypted = decryptData(encrypted)
    console.log('Desencriptado:', decrypted)
    
    const success = testData === decrypted
    console.log('✅ Prueba exitosa:', success)
    return success
  } catch (error) {
    console.error('❌ Error en prueba de encriptación:', error)
    return false
  }
}

// Funciones legacy (mantener compatibilidad)
const encrypt = encryptData
const decrypt = decryptData

module.exports = {
  // Funciones principales
  hashPassword,
  comparePassword,
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  generateSecureToken,
  generateHash,
  verifyIntegrity,
  isEncrypted,
  testEncryption,
  
  // Compatibilidad hacia atrás
  encrypt,
  decrypt,
  
  // Constantes útiles
  SENSITIVE_FIELDS: {
    USER: ['telefono', 'ubicacion', 'bio'], // MongoDB fields
    USER_MYSQL: ['nombres', 'apellidos'], // MySQL fields  
    EVENT: ['contacto', 'ubicacion_detallada'],
    MUSIC: ['lyrics'],
    GROUP: ['miembros'],
    ALBUM: ['descripcion']
  }
}