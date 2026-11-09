const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'comercioexpress',
    password: process.env.DB_PASSWORD || 'tu_password',
    port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = 'secreto_super_seguro_para_auditoria';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token de acceso requerido (Bearer Token)' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'UP', service: 'ComercioExpress API', database: 'CONNECTED' });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', error: err.message });
    }
});

// 1. Autenticación (Sin Rate Limiting - Vulnerable API4:2023)
app.post('/rest/user/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        
        const user = result.rows[0];
        const token = jwt.sign({ user_id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Autenticación exitosa', token, user_id: user.id });
    } catch (err) {
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

// 2. Consulta de Pedidos (BOLA - Vulnerable API1:2023)
app.get('/api/v1/orders/:order_id', authenticateToken, async (req, res) => {
    const { order_id } = req.params;
    try {
        const order = await pool.query('SELECT * FROM orders WHERE order_id = $1', [order_id]);
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(order.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al consultar el pedido' });
    }
});

// 3. Actualización de Perfil (Mass Assignment - Vulnerable API3:2023)
app.put('/api/v1/users/profile', authenticateToken, async (req, res) => {
    const userId = req.user.user_id;
    const updates = req.body;

    try {
        const fields = [];
        const values = [];
        let index = 1;

        for (let key in updates) {
            fields.push(`${key} = $${index}`);
            values.push(updates[key]);
            index++;
        }
        values.push(userId);

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, name, email, role, is_admin, address`;
        const result = await pool.query(query, values);

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de ComercioExpress ejecutándose en puerto ${PORT}`);
});