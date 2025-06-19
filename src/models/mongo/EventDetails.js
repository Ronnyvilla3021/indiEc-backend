const mongoose = require("mongoose")

const eventDetailsSchema = new mongoose.Schema(
  {
    event_id: {
      type: Number,
      required: true,
      unique: true,
    },
    foto: {
      type: String,
      default: null,
    },
    descripcion: {
      type: String,
      default: null,
    },
    ubicacion_detallada: {
      type: String,
      default: null,
    },
    precio: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("EventDetails", eventDetailsSchema)
