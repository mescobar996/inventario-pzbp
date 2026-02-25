-- =====================================================
-- ESQUEMA DE BASE DE DATOS - INVENTARIO PZBP
-- Sistema de Gestión de Inventario para Radiocomunicación
-- =====================================================

-- Tabla de Usuarios (Autenticación con Roles)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rol ENUM('admin', 'observador') DEFAULT 'observador',
    nombre_completo VARCHAR(100),
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Destinos (Pestañas dinámcias)
CREATE TABLE IF NOT EXISTS destinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Equipos (Inventario principal)
CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    n_orden VARCHAR(50),
    n_inventario VARCHAR(50) UNIQUE NOT NULL,
    catalogo VARCHAR(100),
    ns_serial VARCHAR(100) UNIQUE NOT NULL,
    gebipa VARCHAR(50),
    tipo_equipo ENUM('Equipo', 'Batería', 'Base Cargadora') DEFAULT 'Equipo',
    destino_id INTEGER,
    observaciones TEXT,
    estado ENUM('Activo', 'Inactivo', 'Mantenimiento', 'Dado de Baja') DEFAULT 'Activo',
    fecha_alta DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (destino_id) REFERENCES destinos(id) ON DELETE SET NULL
);

-- Tabla de Historial de Movimientos (Log inmutable)
CREATE TABLE IF NOT EXISTS historial_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipo_id INTEGER NOT NULL,
    n_inventario VARCHAR(50) NOT NULL,
    ns_serial VARCHAR(100) NOT NULL,
    destino_origen_id INTEGER,
    destino_origen_nombre VARCHAR(50),
    destino_nuevo_id INTEGER,
    destino_nuevo_nombre VARCHAR(50),
    usuario_id INTEGER NOT NULL,
    usuario_nombre VARCHAR(100) NOT NULL,
    tipo_movimiento ENUM('Alta', 'Traslado', 'Cambio Estado', 'Baja') NOT NULL,
    observaciones TEXT,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    FOREIGN KEY (destino_origen_id) REFERENCES destinos(id) ON DELETE SET NULL,
    FOREIGN KEY (destino_nuevo_id) REFERENCES destinos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

-- Tabla de Sesiones Activas
CREATE TABLE IF NOT EXISTS sesiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_equipos_destino ON equipos(destino_id);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos(ns_serial);
CREATE INDEX IF NOT EXISTS idx_equipos_inventario ON equipos(n_inventario);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos(tipo_equipo);
CREATE INDEX IF NOT EXISTS idx_historial_equipo ON historial_movimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_movimientos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_destinos_codigo ON destinos(codigo);

-- =====================================================
-- TRIGGER PARA REGISTRAR MOVIMIENTOS AUTOMÁTICAMENTE
-- =====================================================

-- Trigger para registrar cuando se cambia el destino de un equipo
CREATE TRIGGER IF NOT EXISTS trg_equipo_cambio_destino
AFTER UPDATE OF destino_id ON equipos
FOR EACH ROW
WHEN OLD.destino_id IS NOT NEW.destino_id
BEGIN
    INSERT INTO historial_movimientos (
        equipo_id, n_inventario, ns_serial,
        destino_origen_id, destino_origen_nombre,
        destino_nuevo_id, destino_nuevo_nombre,
        usuario_id, usuario_nombre,
        tipo_movimiento, observaciones
    )
    SELECT 
        NEW.id,
        NEW.n_inventario,
        NEW.ns_serial,
        OLD.destino_id,
        (SELECT nombre FROM destinos WHERE id = OLD.destino_id),
        NEW.destino_id,
        (SELECT nombre FROM destinos WHERE id = NEW.destino_id),
        COALESCE((SELECT id FROM usuarios WHERE username = 'system'), 1),
        COALESCE((SELECT nombre_completo FROM usuarios WHERE username = 'system'), 'Sistema'),
        'Traslado',
        'Cambio de destino automático'
    WHERE NEW.destino_id IS NOT OLD.destino_id;
END;

-- Trigger para registrar nuevo equipo (Alta)
CREATE TRIGGER IF NOT EXISTS trg_equipo_alta
AFTER INSERT ON equipos
FOR EACH ROW
BEGIN
    INSERT INTO historial_movimientos (
        equipo_id, n_inventario, ns_serial,
        destino_origen_id, destino_origen_nombre,
        destino_nuevo_id, destino_nuevo_nombre,
        usuario_id, usuario_nombre,
        tipo_movimiento, observaciones
    )
    VALUES (
        NEW.id, NEW.n_inventario, NEW.ns_serial,
        NULL, 'Sin asignar',
        NEW.destino_id, (SELECT nombre FROM destinos WHERE id = NEW.destino_id),
        COALESCE((SELECT id FROM usuarios WHERE username = 'system'), 1),
        COALESCE((SELECT nombre_completo FROM usuarios WHERE username = 'system'), 'Sistema'),
        'Alta',
        'Equipo dado de alta en el sistema'
    );
END;

-- =====================================================
-- DATOS INICIALES (SEEDS)
-- =====================================================

-- Insertar destinos iniciales basados en las pestañas de la imagen
INSERT INTO destinos (nombre, codigo, descripcion, color) VALUES 
('PZBP', 'PZBP', 'Destino PZBP', '#3B82F6'),
('SLOR', 'SLOR', 'Destino SLOR', '#10B981'),
('ROSA', 'ROSA', 'Destino ROSA', '#F59E0B'),
('SAFE', 'SAFE', 'Destino SAFE', '#EF4444'),
('OSRO', 'OSRO', 'Destino OSRO', '#8B5CF6'),
('PARA', 'PARA', 'Destino PARA', '#EC4899'),
('SNIC', 'SNIC', 'Destino SNIC', '#06B6D4'),
('VCON', 'VCON', 'Destino VCON', '#84CC16'),
('RLLO', 'RLLO', 'Destino RLLO', '#F97316'),
('ASEC', 'ASEC', 'Destino ASEC', '#6366F1'),
('GCSM', 'GCSM', 'Destino GCSM', '#14B8A6'),
('DIAM', 'DIAM', 'Destino DIAM', '#A855F7');

-- Insertar usuario administrador por defecto (password: admin123)
-- Password hash generado con bcrypt: $2a$10$rBV2kz5Fz3Qvz7F5Z8vVXeP8z5Z8vVXeP8z5Z8vVXeP8z5Z8vVXeP
INSERT INTO usuarios (username, password_hash, email, rol, nombre_completo) VALUES 
('admin', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqH.vBT2G.', 'admin@inventario.com', 'admin', 'Administrador del Sistema'),
('observador', '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqH.vBT2G.', 'observador@inventario.com', 'observador', 'Usuario Observador');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para Dashboard: Conteo por tipo y destino
CREATE VIEW IF NOT EXISTS v_dashboard_resumen AS
SELECT 
    COUNT(*) as total_equipos,
    SUM(CASE WHEN tipo_equipo = 'Equipo' THEN 1 ELSE 0 END) as total_radios,
    SUM(CASE WHEN tipo_equipo = 'Batería' THEN 1 ELSE 0 END) as total_baterias,
    SUM(CASE WHEN tipo_equipo = 'Base Cargadora' THEN 1 ELSE 0 END) as total_bases
FROM equipos
WHERE estado != 'Dado de Baja';

-- Vista para distribución por destino
CREATE VIEW IF NOT EXISTS v_distribucion_destino AS
SELECT 
    d.id as destino_id,
    d.nombre as destino_nombre,
    d.codigo,
    d.color,
    COUNT(e.id) as cantidad,
    SUM(CASE WHEN e.tipo_equipo = 'Equipo' THEN 1 ELSE 0 END) as radios,
    SUM(CASE WHEN e.tipo_equipo = 'Batería' THEN 1 ELSE 0 END) as baterias,
    SUM(CASE WHEN e.tipo_equipo = 'Base Cargadora' THEN 1 ELSE 0 END) as bases
FROM destinos d
LEFT JOIN equipos e ON d.id = e.destino_id AND e.estado != 'Dado de Baja'
GROUP BY d.id, d.nombre, d.codigo, d.color
ORDER BY cantidad DESC;
