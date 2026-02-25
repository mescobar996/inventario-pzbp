# Inventario PZBP - Sistema de Gestión de Inventario

Aplicación web progresiva (PWA) para la gestión de inventario de equipos de radiocomunicación (Mototrbo, P25, etc.).

## Características

- 📊 Dashboard interactivo con gráficos de distribución
- 📁 Gestión de destinos dinámicos (CRUD)
- 📻 Control de equipos, baterías y bases cargadoras
- 📜 Historial de movimientos inmutable
- 👥 Autenticación por roles (Admin/Observador)
- 📄 Carga masiva via CSV
- 📱 Diseño responsivo y PWA

## Estructura del Proyecto

```
inventario-pzbp/
├── client/                 # Frontend React + Tailwind
│   ├── public/
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── context/        # Contextos de React
│       ├── pages/          # Páginas de la app
│       └── services/       # Servicios API
├── server/                 # Backend Node.js + Express
│   ├── config/            # Configuración de DB
│   ├── middleware/        # Middlewares (Auth)
│   ├── models/            # Modelos Sequelize
│   └── routes/            # Rutas API
├── database/               # Base de datos SQLite
│   ├── schema.sql         # Esquema SQL
│   └── inventario.db      # Archivo DB
├── package.json
└── README.md
```

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd inventario-pzbp
```

2. Instalar dependencias del proyecto raíz:
```bash
npm install
```

3. Instalar dependencias del cliente:
```bash
cd client && npm install
```

4. Copiar el archivo de entorno:
```bash
cp .env.example .env
```

## Configuración

Editar `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=tu-secret-key-aqui
REACT_APP_API_URL=http://localhost:5000/api
```

## Ejecución

### Modo desarrollo (ambos servidores):
```bash
npm run dev
```

### Servidor solo backend:
```bash
npm run server
```

### Servidor solo frontend:
```bash
npm run client
```

### Producción:
```bash
npm run build
npm start
```

## Credenciales por defecto

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | admin | admin123 |
| Observador | observador | admin123 |

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/verify` - Verificar token
- `GET /api/auth/usuarios` - Listar usuarios (Admin)

### Destinos
- `GET /api/destinos` - Listar destinos
- `POST /api/destinos` - Crear destino (Admin)
- `PUT /api/destinos/:id` - Actualizar destino (Admin)
- `DELETE /api/destinos/:id` - Eliminar destino (Admin)

### Equipos
- `GET /api/equipos` - Listar equipos
- `POST /api/equipos` - Crear equipo
- `PUT /api/equipos/:id` - Actualizar equipo
- `DELETE /api/equipos/:id` - Eliminar equipo (Admin)
- `PATCH /api/equipos/:id/trasladar` - Trasladar equipo

### Dashboard
- `GET /api/dashboard` - Datos del dashboard

### Historial
- `GET /api/historial` - Lista de movimientos
- `GET /api/historial/equipo/:id` - Historial de un equipo

### Upload
- `POST /api/upload/csv` - Cargar CSV
- `GET /api/upload/plantilla` - Descargar plantilla

## Base de Datos

El sistema usa SQLite por defecto. La base de datos se crea automáticamente en `database/inventario.db`.

### Esquema Principal

```sql
-- Destinos (pestañas)
CREATE TABLE destinos (
  id INTEGER PRIMARY KEY,
  nombre VARCHAR(50),
  codigo VARCHAR(10),
  color VARCHAR(7)
);

-- Equipos
CREATE TABLE equipos (
  id INTEGER PRIMARY KEY,
  n_inventario VARCHAR(50) UNIQUE,
  ns_serial VARCHAR(100) UNIQUE,
  tipo_equipo ENUM('Equipo','Batería','Base Cargadora'),
  destino_id INTEGER,
  estado ENUM('Activo','Inactivo','Mantenimiento','Dado de Baja')
);

-- Historial (log inmutable)
CREATE TABLE historial_movimientos (
  id INTEGER PRIMARY KEY,
  equipo_id INTEGER,
  tipo_movimiento ENUM('Alta','Traslado','Cambio Estado','Baja'),
  fecha_movimiento DATETIME
);
```

## Tecnologías

- **Frontend:** React 18, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, Sequelize
- **Base de datos:** SQLite
- **Auth:** JWT, bcrypt

## Licencia

MIT
