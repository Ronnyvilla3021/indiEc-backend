const config = {
    PORT: 3000,
    NODE_ENV: 'production',

    // MySQL
    MYSQL: {
        HOST: 'localhost',
        USER: 'root',
        PASSWORD: '',
        DATABASE: 'indiec'
    },

    // MongoDB
    MONGODB_URI: 'mongodb://localhost:27017/indiec',

    // JWT
    JWT: {
        SECRET: 'indiec_super_secret_jwt_key_2024',
        EXPIRES_IN: '24h'
    },

    // Encryption
    ENCRYPTION_KEY: 'indiec_32_char_encryption_key_123',

    // Upload
    UPLOAD: {
        PATH: './uploads',
        MAX_FILE_SIZE: 5242880
    },

    // Logging
    LOG_LEVEL: 'info'
};

module.exports = config;
