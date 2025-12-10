const mysql = require('mysql2');

// Creamos la conexión
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Usuario por defecto de XAMPP/MySQL
    password: '1234',      // Si tienes contraseña en MySQL, ponla aquí. Si no, déjalo vacío.
    database: 'consultorio_dental' // El nombre exacto de la base que creamos
});

// Probamos si funciona la conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la Base de Datos:', err);
        return;
    }
    console.log('✅ ¡Conectado exitosamente a la Base de Datos MySQL!');
});

module.exports = db; // Exportamos la conexión para usarla en otros archivos