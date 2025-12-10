const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. VER LISTA
router.get('/tratamientos', (req, res) => {
    db.query('SELECT * FROM tratamientos ORDER BY nombre ASC', (err, result) => {
        if (err) {
            console.error("Error al leer tratamientos:", err); // <--- ESTO NOS DIRÁ EL ERROR
            return res.status(500).send('Error de base de datos');
        }
        res.json(result);
    });
});

// 2. CREAR (Aquí tenías el problema)
router.post('/tratamientos', (req, res) => {
    const { nombre, precio } = req.body;
    
    // Validamos que lleguen los datos
    if (!nombre || !precio) {
        return res.status(400).send('Faltan datos');
    }

    const sql = 'INSERT INTO tratamientos (nombre, precio) VALUES (?, ?)';
    
    db.query(sql, [nombre, precio], (err, result) => {
        if (err) {
            console.error("Error al guardar tratamiento:", err); // <--- MIRA LA TERMINAL SI FALLA
            return res.status(500).send('Error al guardar en base de datos');
        }
        res.json({ mensaje: 'Guardado', id: result.insertId });
    });
});

// 3. BORRAR
router.delete('/tratamientos/:id', (req, res) => {
    db.query('DELETE FROM tratamientos WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error("Error al borrar:", err);
            return res.status(500).send('Error');
        }
        res.send('Eliminado');
    });
});

module.exports = router;