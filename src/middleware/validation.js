const Joi = require("joi")

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      })
    }

    next()
  }
}

// Esquemas de validación
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "El email debe tener un formato válido",
      "any.required": "El email es requerido",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "La contraseña debe tener al menos 6 caracteres",
      "any.required": "La contraseña es requerida",
    }),
    nombres: Joi.string().min(2).max(100).required().messages({
      "string.min": "Los nombres deben tener al menos 2 caracteres",
      "string.max": "Los nombres no pueden exceder 100 caracteres",
      "any.required": "Los nombres son requeridos",
    }),
    apellidos: Joi.string().min(2).max(100).required().messages({
      "string.min": "Los apellidos deben tener al menos 2 caracteres",
      "string.max": "Los apellidos no pueden exceder 100 caracteres",
      "any.required": "Los apellidos son requeridos",
    }),
    genero: Joi.string().valid("Masculino", "Femenino", "Otro").required().messages({
      "any.only": "El género debe ser Masculino, Femenino u Otro",
      "any.required": "El género es requerido",
    }),
    fecha: Joi.date().required().messages({
      "any.required": "La fecha de nacimiento es requerida",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  music: Joi.object({
    titulo: Joi.string().min(1).max(255).required(),
    album: Joi.string().min(1).max(255).required(),
    duracion: Joi.string()
      .pattern(/^\d{1,2}:\d{2}$/)
      .required()
      .messages({
        "string.pattern.base": "La duración debe tener formato MM:SS",
      }),
    año: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    genero: Joi.string()
      .valid("Rock", "Pop", "Jazz", "Clásica", "Electrónica", "Hip-Hop", "Reggae", "Metal")
      .required(),
  }),

  album: Joi.object({
    titulo: Joi.string().min(1).max(255).required(),
    artista: Joi.string().min(1).max(255).required(),
    año: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
    genero: Joi.string()
      .valid("Rock", "Pop", "Jazz", "Clásica", "Electrónica", "Hip-Hop", "Reggae", "Metal")
      .required(),
  }),

  group: Joi.object({
    nombre_grupo: Joi.string().min(1).max(255).required(),
    genero_musical: Joi.string().min(1).max(100).required(),
  }),

  event: Joi.object({
    nombre_evento: Joi.string().min(1).max(255).required(),
    genero_musical: Joi.string().min(1).max(100).required(),
    fecha: Joi.date().min("now").required().messages({
      "date.min": "La fecha del evento debe ser futura",
    }),
    contacto: Joi.string().min(1).max(100).required(),
    capacidad: Joi.number().integer().min(1).required(),
  }),
}

module.exports = { validate, schemas }
