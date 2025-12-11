const express = require('express'); // <--- ¡ESTA ERA LA LÍNEA QUE FALTABA!
const router = express.Router();
const db = require('../db');

// --- FUNCIÓN AYUDA: Convertir "09:30" a minutos (570) ---
const horaAMinutos = (horaStr) => {
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
}

// --- FUNCIÓN AYUDA: Convertir minutos (570) a "09:30" ---
const minutosAHora = (minutos) => {
    const h = Math.floor(minutos / 60).toString().padStart(2, '0');
    const m = (minutos % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

// 1. AGENDAR TURNO (Con duración)
router.post('/crear-turno', (req, res) => {
    const { paciente_id, dentista_id, fecha, hora, motivo_consulta, duracion = 40 } = req.body;
    
    if (!paciente_id || !dentista_id || !fecha || !hora) return res.status(400).send('Faltan datos');

    const sql = 'INSERT INTO turnos (paciente_id, dentista_id, fecha, hora, motivo_consulta, estado_id, duracion) VALUES (?, ?, ?, ?, ?, 2, ?)';
    
    db.query(sql, [paciente_id, dentista_id, fecha, hora, motivo_consulta, duracion], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al agendar');
        }
        res.send('Turno confirmado');
    });
});

// 2. VER AGENDA (Admin) - AHORA CON INFORMACIÓN DE PAGOS
router.get('/turnos', (req, res) => {
    const sql = `
        SELECT t.id, t.fecha, t.hora, t.duracion, t.motivo_consulta, t.estado_id, t.paciente_id,
            p.nombre as p_nombre, p.apellido as p_apellido,
            d.nombre as d_nombre, d.apellido as d_apellido,
            e.nombre as estado,
            -- ESTA LÍNEA MAGICA REVISA SI HAY PAGOS --
            (SELECT COUNT(*) FROM pagos WHERE turno_id = t.id) as pagos_realizados
        FROM turnos t
        JOIN usuarios p ON t.paciente_id = p.id
        JOIN usuarios d ON t.dentista_id = d.id
        JOIN estados_turno e ON t.estado_id = e.id
        ORDER BY t.fecha ASC, t.hora ASC
    `;
    db.query(sql, (err, resultados) => {
        if (err) return res.status(500).send('Error al leer agenda');
        res.json(resultados);
    });
});
// 3. MIS TURNOS (Paciente)
router.get('/turnos-paciente/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT t.id, t.fecha, t.hora, t.duracion, t.motivo_consulta, t.estado_id, 
               d.nombre as d_nombre, d.apellido as d_apellido,
               e.nombre as estado
        FROM turnos t
        JOIN usuarios d ON t.dentista_id = d.id
        JOIN estados_turno e ON t.estado_id = e.id
        WHERE t.paciente_id = ?
        ORDER BY t.fecha DESC, t.hora DESC
    `;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send('Error al buscar turnos');
        res.json(result);
    });
});

// 4. CANCELAR TURNO
router.put('/cancelar-turno/:id', (req, res) => {
    const { id } = req.params;
    db.query('UPDATE turnos SET estado_id = 3 WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send('Error al cancelar');
        res.send('Turno cancelado');
    });
});

// 5. HORARIOS DISPONIBLES (LÓGICA AVANZADA DE BLOQUES)
router.get('/horarios-disponibles', (req, res) => {
    const { fecha, dentista_id } = req.query;
    if (!fecha || !dentista_id) return res.status(400).send('Falta fecha');

    let slots = [];
    const inicioDia = 9 * 60; // 9:00 AM
    const finDia = 18 * 60;   // 18:00 PM
    const paso = 40;          // Turnos estándar de 40 min

    for (let t = inicioDia; t < finDia; t += paso) {
        slots.push(t);
    }

    const sql = 'SELECT hora, duracion FROM turnos WHERE fecha = ? AND dentista_id = ? AND estado_id != 3';
    
    db.query(sql, [fecha, dentista_id], (err, ocupados) => {
        if (err) return res.status(500).send('Error verificando disponibilidad');

        const libres = slots.filter(slotInicio => {
            const slotFin = slotInicio + paso; 

            const choca = ocupados.some(turno => {
                const turnoInicio = horaAMinutos(turno.hora);
                const turnoFin = turnoInicio + turno.duracion;
                return (slotInicio < turnoFin) && (turnoInicio < slotFin);
            });

            return !choca; 
        });

        res.json(libres.map(minutosAHora));
    });
});

module.exports = router;