const mysql = require('mysql2');

// Creamos la conexión INTELIGENTE
const db = mysql.createConnection({
    // Le decimos: "Usá la variable de Render, y si no existe (porque estoy en mi PC), usá 'localhost'"
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'consultorio_dental',
    port: process.env.DB_PORT || 3306, // TiDB usa el puerto 4000, esto es CLAVE
    ssl: {
        rejectUnauthorized: false // Esto es necesario para que TiDB te deje entrar seguro
    }
});

// Probamos si funciona la conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la Base de Datos:', err);
        return;
    }
    console.log('✅ ¡Conectado exitosamente a la Base de Datos!');
});

module.exports = db;
