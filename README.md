# Dharry Backend — Motor central multiproyecto

Rearquitectura de la base actual para convertirla en un backend central reutilizable por DharryStats, DieselDharry y DharryNet.

## Fase implementada

- Core de usuarios globales.
- Identidades externas separadas del usuario.
- Proveedor Battle.net como primer proveedor.
- Registro automático durante el primer OAuth.
- Proyectos globales y relación `user_projects`.
- PostgreSQL + Sequelize.
- Migraciones Sequelize.
- Sesiones persistentes en PostgreSQL.
- Cookies HttpOnly.
- Respuestas canónicas `{ success, data }` / `{ success, error }`.
- Compatibilidad con `/login`, `/auth/callback`, `/auth/session`, `/auth/logout` y `/wow/profile`.
- API nueva `/api/auth`, `/api/projects` y `/api/wow`.
- Integración Blizzard aislada de controllers.

## Instalación

1. Copiar `.env.example` como `.env`.
2. Configurar PostgreSQL y `DATABASE_URL`.
3. Configurar credenciales Battle.net.
4. Ejecutar `npm install`.
5. Ejecutar `npm run db:migrate`.
6. Ejecutar `npm run dev`.

## OAuth

La URL de callback actual se mantiene compatible con el backend anterior:

`http://localhost:4000/auth/callback`

Si se cambia `BLIZZARD_REDIRECT_URI`, debe cambiarse también en la configuración de la aplicación Battle.net.

## Endpoints principales

### Core

- `GET /health`
- `GET /api/auth/login/:provider`
- `GET /api/auth/callback/:provider`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/projects`

### WoW

- `GET /api/wow/profile`
- `GET /wow/profile` (compatibilidad)

### Compatibilidad

- `GET /login`
- `GET /auth/callback`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /wow/profile`

## Límites de esta fase

Todavía no se crean tablas de personajes, cuentas WoW, items, profesiones, guías, rankings o quiz. Esas piezas pertenecen a la Fase 2/3 y deben diseñarse sobre el Core ya estabilizado.
