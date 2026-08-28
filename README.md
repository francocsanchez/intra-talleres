## Intra Talleres

Aplicación operativa para alta y seguimiento de presupuestos de talleres sobre `Next 16`, `React 19`, `Tailwind 4`, `shadcn`, MongoDB y SQL Server de solo lectura.

## Auth Central

La app ya no usa autenticación local. Para ingresar depende de un servicio externo Auth Central.

Variables mínimas:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3012
CENTRAL_AUTH_URL=http://localhost:3100
CENTRAL_AUTH_PUBLIC_URL=http://localhost:3100
CENTRAL_APP_KEY=intra-talleres
```

Qué debe existir fuera de este repo:

1. Un Auth Central corriendo y accesible desde esta app.
2. Un `appKey` dado de alta en Auth Central que coincida con `CENTRAL_APP_KEY`.
3. Un usuario con acceso a ese `appKey`.
4. La URL de retorno de esta app habilitada en Auth Central si el sistema central valida destinos permitidos.

Comportamiento esperado:

1. Si entrás sin sesión, `/sign-in` te redirige a `{CENTRAL_AUTH_PUBLIC_URL}/login`.
2. Si la sesión existe pero no tiene acceso al `appKey`, la app muestra `/forbidden`.
3. Si la sesión tiene acceso, entra al dashboard.
4. `/logout` publica el cierre de sesión contra `{CENTRAL_AUTH_PUBLIC_URL}/logout`.

## Getting Started

1. Copiá `.env.example` a `.env.local`.
2. Eliminá o reemplazá cualquier variable vieja de Better Auth que todavía tengas en `.env.local`.
3. Completá MongoDB y SQL Server.
4. Configurá las variables de Auth Central.
5. Verificá que `CENTRAL_AUTH_URL` responda desde el backend donde corre esta app.
6. Verificá que `CENTRAL_AUTH_PUBLIC_URL` sea accesible desde el navegador del usuario.
7. Levantá la app:

```bash
npm run dev
```

Abrí [http://localhost:3012](http://localhost:3012).

## Docker

En `docker-compose.yml` ya están declaradas las variables nuevas:

- `NEXT_PUBLIC_APP_URL`
- `CENTRAL_AUTH_URL`
- `CENTRAL_AUTH_PUBLIC_URL`
- `CENTRAL_APP_KEY`

## Portainer con red compartida

Para producción con dos stacks separados y Auth Central publicado en `http://192.168.100.31:32770`, la recomendación es:

```env
NEXT_PUBLIC_APP_URL=http://IP_O_DOMINIO_DE_ESTA_APP:PUERTO_PUBLICO_ACTUAL
CENTRAL_AUTH_URL=http://auth-central:3000
CENTRAL_AUTH_PUBLIC_URL=http://192.168.100.31:32770
CENTRAL_APP_KEY=intra-talleres
```

Además, ambos stacks deben unirse a la red Docker externa `internal-apps`. Este proyecto ya deja el servicio `app` conectado a:

- su red bridge propia para el stack
- la red externa `internal-apps` para hablar con `auth-central`

Si la red todavía no existe en Docker, creala una vez antes del deploy:

```bash
docker network create internal-apps
```

## Problema común

Si aparece `Runtime TypeError: fetch failed` al abrir `/`, casi siempre significa una de estas situaciones:

1. `CENTRAL_AUTH_URL` no está definido en `.env.local` o apunta a una URL incorrecta.
2. Auth Central no está levantado o no es accesible desde donde corre esta app.
3. `CENTRAL_AUTH_PUBLIC_URL` apunta a una URL interna de Docker y el navegador no puede alcanzarla.

En local o producción, el backend debe usar `CENTRAL_AUTH_URL` y el navegador debe usar `CENTRAL_AUTH_PUBLIC_URL`. No conviene mezclar ambas cuando Auth Central vive en otro stack.
