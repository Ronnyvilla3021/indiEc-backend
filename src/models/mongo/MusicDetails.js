const mongoose = require("mongoose")

const musicDetailsSchema = new mongoose.Schema(
  {
    music_id: {
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
    lyrics: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    file_path: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("MusicDetails", musicDetailsSchema)
