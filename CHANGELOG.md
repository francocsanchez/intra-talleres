# Changelog

## 2026-08-28

- Se reemplazó la autenticación local con `Better Auth` por integración server-to-server con Auth Central, reenviando la `cookie` actual al endpoint `/api/internal/session`.
- Se agregaron helpers reutilizables en `src/lib/auth/central.ts` para consultar sesión, validar acceso por `appKey`, obtener rol y redirigir al login o logout central.
- La ruta `/sign-in` dejó de mostrar formulario local y ahora deriva al login central, mientras que `/logout` redirige al cierre de sesión central.
- Se incorporó la pantalla `/forbidden` para distinguir usuarios autenticados sin acceso a la aplicación de sesiones inexistentes o vencidas.
- Las APIs internas ahora responden `401` o `403` según la respuesta de Auth Central, conservando protegidos presupuestos, talleres y lookup de unidades.
- Se eliminaron los archivos y dependencias de `Better Auth`, junto con el bootstrap del usuario admin local.
- Se actualizaron `.env.example`, `Dockerfile`, `docker-compose.yml` y `AGENTS.md` para reflejar las nuevas variables `CENTRAL_AUTH_URL`, `NEXT_PUBLIC_APP_URL` y `CENTRAL_APP_KEY`.
- Se aclaró en la documentación de configuración que `.env.local` también debe migrarse a las variables nuevas de Auth Central y que mantener variables viejas de Better Auth provoca fallas de login.
- Se corrigió el logout central para usar `POST` real hacia Auth Central; antes se navegaba con `GET /logout` y la sesión no se invalidaba.

## 2026-08-27

- Se integró autenticación local con `Better Auth` sobre MongoDB, usando email y contraseña y cierre de signup público.
- Se agregó bootstrap automático del usuario administrador `admin@nipponcarsrl.com.ar` para dejar la instancia lista al primer acceso.
- Se protegieron la pantalla principal, la carga de presupuestos, el CRUD de talleres, el lookup de unidades y las APIs internas mediante validación de sesión.
- Se creó una pantalla dedicada de ingreso y se incorporó cierre de sesión dentro del navbar operativo.
- Se dockerizó la aplicación con `Dockerfile` multi-stage, `EXPOSE 3012` y variables de entorno listas para configurar MongoDB, SQL Server y credenciales iniciales.
- Se completó `.env.example` con todas las variables requeridas por la app y se reemplazaron credenciales concretas por placeholders seguros de configuración.
- Se agregó un workflow de GitHub Actions para construir la imagen Docker en `push` y `pull_request`, validando el build de producción antes de promoción a entornos posteriores.
- Se corrigió la sincronización del usuario admin para que, si ya existe, también actualice nombre, rol y `AUTH_ADMIN_PASSWORD` desde el entorno al iniciar.
- Se aclaró en `.env.example` que `BETTER_AUTH_SECRET` firma sesiones y no funciona como contraseña de acceso.
- Se corrigió Better Auth para aceptar `localhost:3000` y otros orígenes configurables mediante `AUTH_TRUSTED_ORIGINS`, evitando el error `Invalid origin` en desarrollo.
- Se eliminó la dependencia de conexión inmediata a Mongo al construir Better Auth, evitando fallos de `docker build` y CI cuando la base no existe durante `next build`.
- Se agregó `docker-compose.yml` listo para Portainer con un único servicio `app`, reutilizando el MongoDB externo ya existente en el servidor.
- Se ajustó `.env.example` para que `MONGODB_URI` y `DBHOST_NIC` apunten por defecto a `host.docker.internal` dentro del stack Docker.

## 2026-08-26

- Se implementó el MVP operativo para presupuestos de talleres sobre `Next 16`, reemplazando el scaffold inicial por un dashboard compacto de carga y seguimiento.
- Se integró MongoDB local `intra_talleres` para persistencia del sistema y SQL Server de solo lectura para lookup de unidades por `interno`.
- Se crearon APIs para buscar unidades, listar y crear presupuestos, y actualizar estados.
- Se normalizó el modelo funcional en colecciones de `talleres` y `presupuestos`, con seed inicial de talleres basado en el Excel actual.
- Se definió una interfaz de ancho completo, compacta y monocromática, usando el preset obligatorio de `shadcn` y el `globals.css` requerido por el proyecto.
- Se reemplazó el encabezado visual inicial por un navbar con tres vistas: `Dashboard`, `Presupuestos` y `Configuración`.
- Se cambió `prioridad` a un select controlado con opciones cerradas `Alta`, `Media` y `Baja`.
- Se agregó el CRUD completo de talleres con endpoints dedicados para alta, edición y eliminación protegida cuando existen presupuestos asociados.
- Se corrigió un bug de duplicación en talleres causado por el seed automático sensible a mayúsculas/minúsculas.
- Se normalizó la creación y edición de talleres para validar duplicados en forma case-insensitive y se limpió el duplicado existente de `Gomeria F1`.
- Se corrigió un segundo bug en el que renombrar o eliminar un taller base hacía que el seed lo recreara automáticamente al volver a listar.
- El seed de talleres ahora solo corre cuando la colección está vacía por completo, respetando cambios manuales posteriores del usuario.
- La creación de presupuestos pasó a realizarse mediante un `dialog` en lugar de una card fija lateral.
- Se habilitó la carga posterior de `fecha de egreso` directamente desde la tabla de presupuestos.
- Observaciones y detalle ahora se consultan completos mediante un `dialog` abierto desde el botón `Ver más`.
- La columna `Observaciones` quedó reducida a un único botón `Ver más`, sin texto resumido en la tabla.
- La edición de estado y fecha de egreso pasó a un único `dialog` de gestión por fila para simplificar la operación en tabla.
- Se integró `ECharts` en el dashboard para visualización analítica nativa del proyecto.
- El dashboard ahora grafica: presupuestos por mes apilados por estado, gasto mensual de aprobados, cantidad de presupuestos por marca y cantidad por taller.
- Se eliminó por completo la creación automática de talleres por defecto.
- El catálogo de talleres ahora depende exclusivamente de las altas manuales realizadas desde la interfaz o por carga explícita.
