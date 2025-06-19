const mongoose = require("mongoose")

const groupDetailsSchema = new mongoose.Schema(
  {
    group_id: {
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
    miembros: {
      type: Array,
      default: [],
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

module.exports = mongoose.model("GroupDetails", groupDetailsSchema)
