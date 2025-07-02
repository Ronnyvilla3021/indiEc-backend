// src/models/sql/UsuarioNuevo.js - VERSIÓN CORREGIDA
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database.sql");
const bcrypt = require("bcrypt");

const UsuarioNuevo = sequelize.define("UsuarioNuevo", {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    references: {
      model: 'estados',
      key: 'id'
    }
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  sexo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sexos',
      key: 'id'
    }
  },
  pais_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'paises',
      key: 'id'
    }
  },
  fecha_ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verificado_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificado_telefono: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: "usuarios",
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contraseña) {
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, 12);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contraseña')) {
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, 12);
      }
    }
  }
});

// Métodos de instancia
UsuarioNuevo.prototype.verificarContraseña = async function(contraseña) {
  return await bcrypt.compare(contraseña, this.contraseña);
};

UsuarioNuevo.prototype.getDatosSeguros = function() {
  const { contraseña, ...datosSeguros } = this.toJSON();
  return datosSeguros;
};

module.exports = UsuarioNuevo;