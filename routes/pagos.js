const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/cobrar', (req, res) => {
    const { turno_id, total, items, notas } = req.body;

    console.log("Intentando cobrar:", req.body); // <--- VEREMOS QUÉ DATOS LLEGAN

    if (!turno_id || !total) {
        return res.status(400).send('Faltan datos obligatorios');
    }

    // 1. Insertamos el pago
    const sqlPago = 'INSERT INTO pagos (turno_id, monto, metodo_pago, notas) VALUES (?, ?, "Efectivo", ?)';

    db.query(sqlPago, [turno_id, total, notas], (err, result) => {
        if (err) {
            console.error("Error al insertar pago:", err);
            return res.status(500).send('Error en la tabla pagos');
        }
        
        const pagoID = result.insertId;

        // 2. Insertamos los detalles (Si hay items seleccionados)
        if (items && items.length > 0) {
            const sqlDetalle = 'INSERT INTO pagos_detalle (pago_id, tratamiento_nombre, precio_cobrado) VALUES ?';
            
            // Preparamos el array de arrays para MySQL
            const valores = items.map(item => [pagoID, item.nombre, item.precio]);
            
            db.query(sqlDetalle, [valores], (err2) => {
                if (err2) {
                    console.error("Error al insertar detalles:", err2);
                    // No cortamos la respuesta, pero avisamos en consola
                }
                res.json({ mensaje: 'Cobro registrado completo' });
            });
        } else {
            res.json({ mensaje: 'Cobro registrado sin detalles' });
        }
    });
});
// 3. OBTENER TODOS LOS PAGOS (HISTORIAL COMPLETO CON NOMBRES)
router.get('/pagos', (req, res) => {
    const sql = `
        SELECT p.*, u.nombre, u.apellido, t.motivo_consulta
        FROM pagos p
        JOIN turnos t ON p.turno_id = t.id
        JOIN usuarios u ON t.paciente_id = u.id
        ORDER BY p.fecha_pago DESC
    `;
    
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send('Error al obtener pagos');
        res.json(result);
    });
});

// Ruta para ver pagos de un turno
router.get('/pagos-turno/:id', (req, res) => {
    db.query('SELECT * FROM pagos WHERE turno_id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send('Error');
        res.json(result);
    });
});

module.exports = router;