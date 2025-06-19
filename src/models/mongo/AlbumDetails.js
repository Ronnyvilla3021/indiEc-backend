const mongoose = require("mongoose")

const albumDetailsSchema = new mongoose.Schema(
  {
    album_id: {
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
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("AlbumDetails", albumDetailsSchema)
