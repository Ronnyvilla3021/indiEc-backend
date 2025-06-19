const mongoose = require("mongoose")

const userDetailsSchema = new mongoose.Schema(
  {
    user_id: {
      type: Number,
      required: true,
      unique: true,
    },
    foto: {
      type: String,
      default: null,
    },
    telefono: {
      type: String,
      default: null,
    },
    ubicacion: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    preferences: {
      type: Object,
      default: {},
    },
    social_links: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("UserDetails", userDetailsSchema)
