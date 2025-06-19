const bcrypt = require("bcrypt")
const crypto = require("crypto")

const SALT_ROUNDS = 12
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// Funciones para passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// Funciones para encriptación general
const encrypt = (text) => {
  const cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return encrypted
}

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY)
  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// Generar token seguro
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex")
}

module.exports = {
  hashPassword,
  comparePassword,
  encrypt,
  decrypt,
  generateSecureToken,
}
