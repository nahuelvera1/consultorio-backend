const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- IMPORTAR RUTAS ---
const rutasUsuarios = require('./routes/usuarios');
const rutasTurnos = require('./routes/turnos');
const rutasClinica = require('./routes/clinica');
const rutasPagos = require('./routes/pagos');
const rutasTratamientos = require('./routes/tratamientos'); // <--- 1. IMPORTAR

// --- USAR RUTAS ---
app.use('/', rutasUsuarios); 
app.use('/', rutasTurnos);
app.use('/', rutasClinica);
app.use('/', rutasPagos);
app.use('/', rutasTratamientos); // <--- 2. USAR

// ... resto del código (app.listen, etc)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en https://api-consultorio-usf0.onrender.com${PORT}`);
});