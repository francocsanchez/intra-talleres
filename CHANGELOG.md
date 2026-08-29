# Changelog

## 2026-08-29

- Se corrigió la escala del radar `Presupuestos por marca` para que todas las marcas compartan el mismo máximo de referencia y la distancia al centro refleje proporciones reales.
- Se rearmó el gráfico `Aprobados anualizados por taller` para consolidar todos los talleres dentro de cada mes, con barras agrupadas por taller y una línea única de monto total mensual aprobado.
- Se corrigieron los selects de taller en los modales de alta para que, al elegir una opción, se siga mostrando el nombre del taller y no el `id` interno de MongoDB.
- Al cerrar los modales de `Nuevo presupuesto` y `Nuevo presupuesto externo` ahora se limpian todos los datos cargados para que la próxima apertura arranque en blanco.
- Se robusteció la conexión compartida a SQL Server para reiniciar el pool si falla la conexión o si queda desconectado, evitando errores persistentes en búsquedas de internos y catálogos luego de un primer fallo.
- Se corrigió la carga del catálogo de marcas y modelos externos para limpiar el mensaje de error global cuando una consulta posterior responde correctamente.
- Se ajustó la consulta de modelos para presupuestos externos para que lea desde `siac.dbo.auto`, vinculando `au_marca = mar_codigo`, usando `au_codigo` como identificador y mostrando `au_nombre`.
- Se reemplazaron los selects de marca y modelo en presupuestos externos por campos con autocomplete nativo para hacer más ágil la búsqueda dentro de catálogos largos.
- Se corrigió el alta de presupuestos externos para que el selector de marca y modelo conserve la etiqueta visible y no exponga el código interno en el trigger.
- Se reforzó la consulta SQL del catálogo de modelos casteando `au_nombre` antes de deduplicar, evitando errores al seleccionar una marca y cargar sus modelos.
- Se agregó un flujo de `presupuesto externo` con botón dedicado junto a `Nuevo presupuesto`, pensado para unidades que no existen en el sistema y por lo tanto no tienen `interno`.
- Los presupuestos externos permiten cargar dominio, taller, km, costo y observaciones, resolviendo marca y modelo desde el catálogo SQL del sistema para evitar carga manual libre.
- Se incorporó el endpoint `GET /api/unidades/catalogo` para consultar marcas y modelos desde SQL Server y se adaptó `POST /api/presupuestos` para aceptar altas internas y externas.
- Los presupuestos externos ahora se distinguen en la tabla y en el detalle mostrando `Externo` o `Unidad externa` en lugar de un interno vacío.
- Se corrigió el gráfico `Aprobados anualizados por taller` para desagregar los aprobados por `mes + taller`, evitando que cada taller consolide todo el año en una única barra.
- Se compactaron los cards de métricas del dashboard para reducir su altura visual y hacer más densa la primera fila de indicadores.
- Los indicadores del dashboard ahora funcionan como accesos rápidos a `Presupuestos`: `Total` abre sin filtro y cada estado abre la vista filtrada por el estado seleccionado.
- Se reordenó la grilla del dashboard a una composición `1 + 3`: el gráfico anualizado queda arriba a todo el ancho y los tres gráficos mensuales quedan alineados debajo.
- Se rediseñó el dashboard para incorporar un filtro por mes que afecta solo los gráficos operativos, dejando fijo el gráfico `Aprobados anualizados por taller`.
- `Presupuestos por mes` pasó a mostrarse como gráfico `pie` por estado, `Presupuestos por taller` como `pie` por taller y `Presupuestos por marca` como gráfico `radar`.
- Se agregó en el dashboard un gráfico combinado anualizado por taller usando solo presupuestos `Aprobado`, con barras para cantidad y línea para monto total aprobado.
- Se eliminó del menú de perfil el indicador de `Vista actual` y se compactó el dropdown para que siga mejor la referencia visual del navbar compartida por el usuario.
- El menú de `Configuración` ahora solo se muestra a usuarios con rol `admin` y la vista de configuración deja de renderizarse para roles no administrativos.
- Las operaciones de alta, edición y baja de talleres quedaron protegidas también en API con validación de rol `admin`, manteniendo accesible el listado de talleres para la carga de presupuestos.
- Se cambió el lookup de unidades por `interno` en SQL Server para que parta de `siac.dbo.stoauto`, filtrando `sa_tipo = 10` y usando `sa_codigo` como identificador operativo.
- La marca y la versión exacta ahora se resuelven desde `siac.dbo.auto` mediante `sa_marca = au_marca` y `sa_auto = au_codigo`, mientras que dominio, km y chasis se completan desde `siac.dbo.anexusa` con `aus_tipo = sa_tipo` y `aus_codigo = sa_codigo`.
- Se rediseñó el navbar principal para llevarlo a una barra horizontal única, más limpia y compacta, con identidad visual a la izquierda, navegación en formato cápsula y bloque de perfil alineado a la derecha.
- Se eliminó la tarjeta separada de `Sesión activa` y la navegación tipo cards, reemplazándolas por un encabezado continuo más cercano a un layout ejecutivo.
- El botón de cierre de sesión pasó a ser reutilizable para permitir variantes visuales acordes al nuevo navbar sin modificar la mecánica de logout con `POST`.
- Se refinó el navbar para que respete mejor la referencia visual objetivo: marca y subtítulo a la izquierda, rail central extendido para tabs, tarjeta de perfil independiente y botón `Salir` desacoplado al extremo derecho.
- Se reemplazó la aproximación previa del navbar por una estructura y hoja de estilos dedicadas, alineadas casi literal al HTML de referencia para calcar proporciones, radios, espaciados y jerarquía visual.
- Se integró el navbar al layout superior eliminando el padding exterior del shell, la sombra y el borde redondeado del contenedor principal para que no se perciba como tarjeta flotante.
- Se eliminaron las cápsulas tipo card del rail interno, del perfil y del botón `Salir` para que el conjunto se lea más como navbar lineal y menos como colección de tarjetas.
- Se adoptó `Roboto` como tipografía base de la aplicación y se realineó el navbar con la copia HTML/CSS provista por el usuario, usando métricas, alturas y pesos más cercanos a esa referencia.

## 2026-08-28

- Se separó la URL interna de Auth Central (`CENTRAL_AUTH_URL`) de la URL pública de navegador (`CENTRAL_AUTH_PUBLIC_URL`) para soportar despliegue en producción con stacks Docker distintos y red compartida.
- La construcción de URLs de login y logout ahora usa `CENTRAL_AUTH_PUBLIC_URL`, mientras que la validación server-to-server de sesión sigue usando `CENTRAL_AUTH_URL`.
- Se conectó el servicio `app` del `docker-compose.yml` a la red Docker externa `internal-apps` sin cambiar el puerto público actual de la aplicación.
- Se actualizaron `.env.example`, `Dockerfile`, `README.md` y `AGENTS.md` con la configuración recomendada para Portainer usando `http://auth-central:3000` internamente y `http://192.168.100.31:32770` como URL pública de Auth Central.
- Se reemplazó la autenticación local con `Better Auth` por integración server-to-server con Auth Central, reenviando la `cookie` actual al endpoint `/api/internal/session`.
- Se agregaron helpers reutilizables en `src/lib/auth/central.ts` para consultar sesión, validar acceso por `appKey`, obtener rol y redirigir al login o logout central.
- La ruta `/sign-in` dejó de mostrar formulario local y ahora deriva al login central, mientras que `/logout` redirige al cierre de sesión central.
- Se incorporó la pantalla `/forbidden` para distinguir usuarios autenticados sin acceso a la aplicación de sesiones inexistentes o vencidas.
- Las APIs internas ahora responden `401` o `403` según la respuesta de Auth Central, conservando protegidos presupuestos, talleres y lookup de unidades.
- Se eliminaron los archivos y dependencias de `Better Auth`, junto con el bootstrap del usuario admin local.
- Se actualizaron `.env.example`, `Dockerfile`, `docker-compose.yml` y `AGENTS.md` para reflejar las nuevas variables `CENTRAL_AUTH_URL`, `NEXT_PUBLIC_APP_URL` y `CENTRAL_APP_KEY`.
- Se aclaró en la documentación de configuración que `.env.local` también debe migrarse a las variables nuevas de Auth Central y que mantener variables viejas de Better Auth provoca fallas de login.
- Se corrigió el logout central para usar `POST` real hacia Auth Central; antes se navegaba con `GET /logout` y la sesión no se invalidaba.
- Se ajustó el botón de salida para postear directamente al dominio de Auth Central, evitando que una redirección intermedia local pierda la cookie central durante el logout.

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
