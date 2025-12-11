const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer'); // Necesario para subir fotos
const path = require('path');

// --- 1. CONFIGURACIÓN PARA GUARDAR ARCHIVOS ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Los archivos van a la carpeta 'uploads'
    },
    filename: (req, file, cb) => {
        // Le ponemos fecha al nombre para que no se repita
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- 2. RUTAS DE HISTORIA CLÍNICA ---

// VER HISTORIA (Leer notas anteriores)
router.get('/historia/:id', (req, res) => {
    const sql = `
        SELECT h.*, u.apellido as dentista 
        FROM historia_clinica h
        JOIN usuarios u ON h.dentista_id = u.id
        WHERE h.paciente_id = ?
        ORDER BY h.fecha DESC
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send('Error al leer historia');
        res.json(result);
    });
});

// GUARDAR NOTA NUEVA
router.post('/historia', (req, res) => {
    const { paciente_id, dentista_id, observaciones, diente } = req.body;
    
    const sql = 'INSERT INTO historia_clinica (paciente_id, dentista_id, observaciones, diente) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [paciente_id, dentista_id, observaciones, diente], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error guardando la nota');
        }
        res.send('Nota guardada');
    });
});

// --- 3. RUTAS DE ARCHIVOS (FOTOS/RADIOGRAFÍAS) ---

// SUBIR UN ARCHIVO
router.post('/subir-archivo', upload.single('archivo'), (req, res) => {
    if (!req.file) return res.status(400).send('No se envió ningún archivo');

    const { paciente_id, tipo } = req.body;
    // Guardamos solo el nombre del archivo en la base de datos
    const sql = 'INSERT INTO archivos_paciente (paciente_id, nombre_archivo, ruta_archivo, tipo) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [paciente_id, req.file.originalname, req.file.filename, tipo], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error guardando archivo en BD');
        }
        res.send('Archivo subido con éxito');
    });
});

// LISTAR ARCHIVOS DEL PACIENTE
router.get('/archivos/:id', (req, res) => {
    const sql = 'SELECT * FROM archivos_paciente WHERE paciente_id = ? ORDER BY fecha_subida DESC';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send('Error leyendo archivos');
        res.json(result);
    });
});

module.exports = router;