DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client',
    is_admin BOOLEAN DEFAULT FALSE,
    address TEXT,
    credit_card VARCHAR(50)
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    user_id INT REFERENCES users(id),
    customer_name VARCHAR(100) NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    credit_card_last4 VARCHAR(4) NOT NULL
);

-- Inserción de usuarios del escenario
INSERT INTO users (id, name, email, password, role, is_admin, address, credit_card) VALUES 
(105, 'Auditor de Seguridad', 'auditor@test.com', 'password123', 'auditor', FALSE, 'Colonia San Benito, San Salvador', '4000-0000-0000-1005'),
(106, 'Carlos Mendoza', 'carlos.mendoza@cliente.sv', 'password456', 'client', FALSE, 'Colonia Escalón, San Salvador', '4532-1111-2222-1006');

-- Inserción de órdenes para la prueba BOLA
INSERT INTO orders (order_id, user_id, customer_name, items, total_amount, delivery_address, credit_card_last4) VALUES 
(105, 105, 'Auditor de Seguridad', '["Audífonos Bluetooth"]', 45.00, 'Colonia San Benito, San Salvador', '1005'),
(106, 106, 'Carlos Mendoza (Víctima)', '["Smartphone Samsung S24"]', 999.00, 'Colonia Escalón, San Salvador', '4532');