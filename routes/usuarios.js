const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. VER USUARIOS
router.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios';
    db.query(sql, (err, resultados) => {
        if (err) return res.status(500).send('Error al consultar');
        res.json(resultados);
    });
});

// 2. REGISTRO (CON VALIDACIÓN DE DUPLICADOS)
router.post('/crear-paciente', (req, res) => {
    const { nombre, apellido, email, telefono, dni, obra_social, numero_afiliado, fecha_nacimiento, domicilio } = req.body;

    // Validación básica
    if (!email || !nombre || !apellido || !dni) {
        return res.status(400).send('Faltan datos obligatorios');
    }

    // La contraseña será el DNI automáticamente
    const passwordAutomatico = dni.toString(); 

    // PASO A: Intentamos guardar en la tabla USUARIOS (aquí valida el EMAIL único)
    const sqlUsuario = 'INSERT INTO usuarios (nombre, apellido, email, password, telefono, rol_id) VALUES (?, ?, ?, ?, ?, 3)';

    db.query(sqlUsuario, [nombre, apellido, email, passwordAutomatico, telefono], (err, result) => {
        if (err) {
            // Si el código de error es duplicado, es culpa del email
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).send('Error: Ese EMAIL ya está registrado.');
            return res.status(500).send('Error técnico al crear usuario.');
        }

        const idNuevoUsuario = result.insertId;

        // PASO B: Intentamos guardar en la tabla DETALLES (aquí valida el DNI único)
        const sqlDetalle = 'INSERT INTO pacientes_detalle (usuario_id, dni, obra_social, numero_afiliado, fecha_nacimiento, domicilio) VALUES (?, ?, ?, ?, ?, ?)';

        db.query(sqlDetalle, [idNuevoUsuario, dni, obra_social, numero_afiliado, fecha_nacimiento, domicilio], (err2) => {
            if (err2) {
                // Si falla el detalle (por ej. DNI repetido), BORRAMOS al usuario creado en el PASO A
                // para no dejar basura ni ocupar el email.
                db.query('DELETE FROM usuarios WHERE id = ?', [idNuevoUsuario]);
                
                if (err2.code === 'ER_DUP_ENTRY') return res.status(400).send('Error: Ese DNI ya está registrado en el sistema.');
                
                return res.status(500).send('Error al guardar ficha médica.');
            }
            res.send('¡Paciente registrado con éxito!');
        });
    });
});

// 3. LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';

    db.query(sql, [email, password], (err, result) => {
        if (err) return res.status(500).send('Error del servidor');
        if (result.length === 0) return res.status(401).send('Email o DNI incorrectos');
        res.json(result[0]);
    });
});

// 4. OBTENER UN SOLO USUARIO COMPLETO (CON DETALLES)
router.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    
    // EL CAMBIO MÁGICO: Usamos LEFT JOIN para traer los datos de la otra tabla también
    const sql = `
        SELECT u.*, d.dni, d.obra_social, d.numero_afiliado, d.domicilio, d.fecha_nacimiento
        FROM usuarios u
        LEFT JOIN pacientes_detalle d ON u.id = d.usuario_id
        WHERE u.id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send('Error del servidor');
        if (result.length === 0) return res.status(404).send('Usuario no encontrado');
        
        res.json(result[0]);
    });
});

// 5. ACTUALIZAR DATOS DEL PACIENTE (Editar)
router.put('/pacientes/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, dni, obra_social, numero_afiliado, domicilio, fecha_nacimiento } = req.body;

    // 1. Actualizamos datos básicos (Tabla Usuarios)
    const sqlUsuario = 'UPDATE usuarios SET nombre=?, apellido=?, email=?, telefono=? WHERE id=?';
    
    db.query(sqlUsuario, [nombre, apellido, email, telefono, id], (err) => {
        if (err) return res.status(500).send('Error al actualizar usuario');

        // 2. Actualizamos detalles médicos (Tabla Detalles)
        const sqlDetalle = 'UPDATE pacientes_detalle SET dni=?, obra_social=?, numero_afiliado=?, domicilio=?, fecha_nacimiento=? WHERE usuario_id=?';
        
        db.query(sqlDetalle, [dni, obra_social, numero_afiliado, domicilio, fecha_nacimiento, id], (err2) => {
            if (err2) return res.status(500).send('Error al actualizar detalles');
            res.send('Datos actualizados correctamente');
        });
    });
});

// 6. CAMBIAR CONTRASEÑA PROPIA
router.put('/cambiar-password', (req, res) => {
    const { id, actual, nueva } = req.body;

    // 1. Verificamos que la contraseña actual sea correcta
    const sqlCheck = 'SELECT * FROM usuarios WHERE id = ? AND password = ?';
    db.query(sqlCheck, [id, actual], (err, result) => {
        if (err) return res.status(500).send('Error del servidor');
        if (result.length === 0) return res.status(401).send('La contraseña actual es incorrecta');

        // 2. Si está bien, actualizamos por la nueva
        const sqlUpdate = 'UPDATE usuarios SET password = ? WHERE id = ?';
        db.query(sqlUpdate, [nueva, id], (err2) => {
            if (err2) return res.status(500).send('Error al actualizar');
            res.send('Contraseña actualizada con éxito');
        });
    });
});

// 7. CAMBIAR ROL (Ascender/Degradar usuarios)
router.put('/cambiar-rol', (req, res) => {
    const { usuario_id, nuevo_rol } = req.body; // nuevo_rol: 1=Admin, 2=Dentista, 3=Paciente

    const sql = 'UPDATE usuarios SET rol_id = ? WHERE id = ?';
    db.query(sql, [nuevo_rol, usuario_id], (err) => {
        if (err) return res.status(500).send('Error al cambiar rol');
        res.send('Rol actualizado correctamente');
    });
});

module.exports = router;