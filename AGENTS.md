# Contexto del proyecto

Este repositorio es un proyecto independiente.

## Commit

Luego de cada implementacion debes devovler el commando git commit -am "{Mensaje commit}", ya que esto usaremos para generar los commit de git.

## CHANGELOG && AGENTS

Luego de cada implementacion generar el registro en el CHANGELOG.md (si no existe el archivo, crearlo) ya que lo dejaremos como bitacora de cambios, ademas de actualizar el AGENTS.md para tener mas contexto del proyecto.

## Aislamiento

- No usar decisiones, estilos ni reglas provenientes de otros proyectos.
- No reutilizar paletas, diseños, componentes o arquitecturas externas.
- Trabajar únicamente con el contenido de este repositorio.
- No asumir preferencias históricas del usuario.
- Ante información faltante, preguntar o proponer una solución nueva.

## Fuente de verdad

Las únicas fuentes válidas son:

1. Este archivo AGENTS.md.
2. Los archivos del repositorio actual.
3. Las instrucciones dadas en el chat actual.

## Diseño

El sistema visual debe definirse específicamente para este proyecto.
No reutilizar sistemas visuales anteriores salvo solicitud expresa.

## Graficos

Instalar y utilizar la libreria https://echarts.apache.org/en/index.html siempre que se requiera reprensentar datos de manera grafica.

## Estilo visual

Siempre utilizar el siguiente preset para los diseños del proyecto
```bash
npx shadcn@latest init --preset b1D0dvg8 --template next
```

Usar este globals.css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.45rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

Si las fuentes no estan instaladas, deberas instalarlas para que el proyecto corra de manera visual correctamente.
Usar ademas padding reducido, no quiero separaciones grandes. Las vistas deben ser compactas pero que no se superpongan los datos. Siempre se debe utilizar todo el ancho de la pantalla.

## Estado actual del MVP

- La aplicacion actual corre sobre `Next 16`, `React 19`, `Tailwind 4` y `shadcn`.
- El MVP implementado unifica alta y seguimiento de presupuestos en una sola pantalla principal.
- La persistencia del sistema se guarda en MongoDB local usando la base `intra_talleres`.
- La consulta de unidades por `interno` se realiza contra SQL Server en modo solo lectura.
- El lookup de unidades debe partir de `siac.dbo.stoauto`, filtrando `sa_tipo = 10` y usando `sa_codigo` como `interno`.
- La marca y la versión exacta de la unidad deben resolverse con `siac.dbo.auto` usando `sa_marca = au_marca` y `sa_auto = au_codigo`.
- El resto de los datos operativos de la unidad debe completarse desde `siac.dbo.anexusa` uniendo `aus_tipo = sa_tipo` y `aus_codigo = sa_codigo`.
- La conexión compartida a SQL Server debe poder recuperarse si el pool inicial falla o queda desconectado, sin exigir reinicio manual de la app.
- El catálogo de talleres no tiene seed automático y queda bajo carga manual del usuario.
- La aplicación exige autenticación antes de permitir acceso a dashboard, presupuestos, configuración o APIs internas.
- La autenticación se delega a un sistema externo `Auth Central`.
- La app no mantiene usuarios, contraseñas ni sesiones propias de autenticación.
- La validación de sesión se hace server-to-server contra `GET {CENTRAL_AUTH_URL}/api/internal/session?appKey={CENTRAL_APP_KEY}` reenviando el header `cookie`.
- Los redirects de login y logout en navegador deben usar `CENTRAL_AUTH_PUBLIC_URL` cuando la URL pública difiera de la interna entre contenedores.
- La app debe distinguir:
  - `401` cuando no hay sesión central válida
  - `403` cuando el usuario está inactivo o sin acceso a esta app
- El rol operativo del usuario se lee desde `access[].role` para el `appKey` de la aplicación.
- La vista `Configuración` y las mutaciones de talleres solo pueden ser usadas por usuarios con rol `admin`.
- Los usuarios sin rol `admin` no deben ver el item `Configuración` en el navbar.
- El rol `viewer` solo puede ingresar a `Dashboard` y `Presupuestos` en modo lectura.
- El rol `viewer` no puede crear presupuestos ni gestionarlos, pero sí puede abrir `Ver más` para consultar observaciones y detalle.

## Modelo funcional actual

- `taller`
  - `nombre`
  - `activo`
  - `tipoTrabajo` opcional
- `presupuesto`
  - `interno` opcional para unidades externas
  - `esExterno`
  - `dominio`
  - `marca`
  - `modelo`
  - `km`
  - `costo`
  - `costoConIva`
  - `valorInfo`
  - `porcentajeToma`
  - `valorIngreso`
  - `diferencia`
  - `observaciones`
  - `estado`
  - `tallerId`
  - `tallerNombre`
  - `nroPresupuesto` opcional
  - `prioridad` opcional
  - `detalle` opcional
  - `fechaPedido` obligatoria como fecha operativa del presupuesto y base de análisis
  - `fechaIngresoTaller` opcional
  - `fechaEgresoTaller` opcional

## Estados validos

- `Pendiente`
- `Aprobado`
- `Rechazado`
- `Revisar`

En la columna de estado, `Aprobado` se representa en verde, `Pendiente` en amarillo, `Rechazado` en rojo y `Revisar` en gris.

## Endpoints actuales

- `GET /api/unidades?interno=...`
- `GET /api/unidades/catalogo`
- `GET /api/presupuestos`
- `POST /api/presupuestos`
- `PATCH /api/presupuestos/[id]`
- `GET /api/talleres`
- `POST /api/talleres`
- `PATCH /api/talleres/[id]`
- `DELETE /api/talleres/[id]`
- `GET /logout`

## Navegacion actual

- `Sign-in`
  - deriva al login central si no existe sesión
- `Forbidden`
  - informa que el usuario autenticado no tiene acceso a la app
- `Dashboard`
  - ruta real `/dashboard`
  - vista compacta de resumen por estado
- `Presupuestos`
  - ruta real `/presupuestos`
  - carga por interno
  - filtros
  - tabla consolidada
- `Configuración`
  - ruta real `/configuracion`
  - CRUD de talleres
- `Dashboard`, `Presupuestos` y `Configuración` deben tratarse como vistas independientes con URL propia y recarga de datos al navegar entre ellas.
- El navbar principal usa una barra horizontal compacta con marca `Intra Talleres` a la izquierda, tabs visuales para las tres vistas y bloque de perfil con salida a la derecha.
- El dropdown `Mi Perfil` no debe mostrar indicadores de vista actual; debe comportarse como menú compacto de perfil alineado a la referencia visual vigente.
- La composición del navbar debe mantener cuatro zonas visuales claras: marca, subtítulo, rail central de navegación, tarjeta de perfil y acción `Salir` separada.
- Para iteraciones del navbar no alcanza una aproximación visual: se prioriza replicar la anatomía exacta de la referencia mediante clases específicas y ajustes finos de proporción.
- El contenedor exterior del navbar debe comportarse como una franja superior integrada, sin sombra ni marco redondeado cuando la referencia objetivo no sea una card.
- La tipografía base vigente del proyecto es `Roboto`; cuando el usuario comparta una referencia cerrada de navbar, se deben respetar sus métricas CSS antes que reinterpretarlas.
- Dentro del navbar deben evitarse contenedores secundarios con aspecto de card salvo en el item activo; la navegación base debe sentirse lineal y liviana.
- Las vistas de la aplicación deben utilizar siempre todo el ancho disponible de la pantalla; no se deben aplicar límites máximos al contenedor principal de una vista.

## Reglas UI actuales

- El hero inicial fue eliminado.
- El favicon operativo de la aplicación debe salir de `public/favicon.ico` y quedar declarado en la metadata raíz de Next para que se refleje en todas las vistas.
- La prioridad del presupuesto se carga mediante select cerrado con estas opciones:
  - `Alta`
  - `Media`
  - `Baja`
- La generación de presupuestos se realiza desde un `dialog` de alta.
- Deben coexistir dos altas de presupuesto:
  - una para unidades del sistema buscando por `interno`
  - otra para unidades externas sin `interno`
- Ambos formularios de alta deben pedir `F. Pedido` y precargarla con la fecha actual local para acelerar la carga operativa.
- `F. Pedido` debe ser el primer campo visible en ambas altas, antes de `Interno` para unidades del sistema y antes de `Dominio` para unidades externas.
- Los formularios internos y externos incluyen `Valor info` y `% toma` como carga manual; `Valor ingreso` se calcula como `valorInfo - (valorInfo * porcentajeToma / 100)` y `Diferencia` como `valorInfo - valorIngreso`. Los dos valores calculados son de solo lectura y se persisten al guardar.
- Si `Costo ARS` es mayor que `Diferencia`, el campo de costo debe resaltarse en rojo y el formulario debe mostrar la alerta `Presupuesto supera diferencia`, sin impedir el alta.
- La tabla de seguimiento debe mostrar un ícono rojo de alerta junto al costo si supera la diferencia registrada y los kilómetros deben mostrarse con separador de miles, como `45.000`.
- Los presupuestos históricos sin `Valor info`, `% toma` y `Diferencia` no pueden evaluarse para esta alerta; las altas nuevas deben persistir obligatoriamente esos valores.
- En los formularios de alta, `Taller`, `KM informado` y `Costo ARS` comparten una fila, al igual que `Nro presupuesto`, `F. Pedido` e `Ingreso a taller` cuando el ancho disponible lo permite.
- Al cerrar cualquiera de los modales de alta, el formulario debe resetearse completo para no conservar datos de la operación anterior.
- Los selects de taller dentro de formularios deben mostrar siempre `taller.nombre` como etiqueta visible, nunca el `id` persistido.
- En presupuestos externos, la marca y el modelo deben seleccionarse desde el catálogo SQL del sistema y no como texto libre.
- Marca y modelo de presupuestos externos deben resolverse con autocomplete sobre el catálogo SQL, mostrando siempre el nombre visible y nunca el código técnico.
- El catálogo de modelos para presupuestos externos debe salir de `siac.dbo.auto`, vinculando `au_marca = mar_codigo`, guardando `au_codigo` y mostrando `au_nombre`.
- Si la carga del catálogo externo se recupera correctamente luego de un fallo previo, el mensaje global de error no debe persistir visible.
- La fecha de egreso puede quedar vacía al crear y luego completarse desde la tabla de seguimiento.
- Desde el modal de gestión debe poder editarse tanto `fechaIngresoTaller` como `fechaEgresoTaller`, y ambas deben poder limpiarse para reflejar unidades que todavía no ingresaron o egresaron.
- La tabla de seguimiento muestra sus fechas en `dd/mm/yy` para compactar columnas e incluye `D. Reparación`: diferencia de días calendario entre ingreso y egreso, o entre ingreso y hoy si todavía no hay egreso; sin fecha de ingreso debe indicar `Sin ingresar`.
- Observaciones y detalle se visualizan completos mediante un `dialog` disparado por `Ver más`.
- La columna `Observaciones` en la tabla no muestra texto resumido: solo expone el botón `Ver más`.
- El cambio de estado y la carga de fecha de egreso se realizan desde un único `dialog` de gestión por presupuesto.
- La tabla de seguimiento incluye una columna `Presupuestos` que abre un dialog con todas las cotizaciones de la misma unidad, identificada por interno o por dominio si es externa, y sus totales acumulados de costo y costo con IVA.
- El resumen del historial de presupuestos debe distinguir los montos pendientes de aprobación (`Pendiente` y `Revisar`), los montos aprobados y el total general, todos con valores netos y con IVA.

## Dashboard actual

- El dashboard utiliza `ECharts` para las visualizaciones.
- Todas las métricas y gráficos deben tomar `fechaPedido` como fecha analítica principal; `createdAt` solo puede actuar como respaldo para registros históricos sin ese campo.
- Las fechas calendario cargadas por formulario o serializadas como `YYYY-MM-DD` o `YYYY-MM-DDT...` deben interpretarse preservando el día calendario local, sin corrimientos de día o mes por zona horaria.
- El dashboard debe ofrecer un filtro por mes que afecte solo los gráficos operativos del mes y no el gráfico anualizado.
- La composición vigente del dashboard para gráficos es `1 + 3`: arriba el anualizado de aprobados por taller y debajo los tres gráficos mensuales.
- Los cards de métricas del dashboard deben mantenerse compactos y actuar como atajos hacia la vista `Presupuestos`.
- Al hacer click en un card de estado del dashboard, la app debe abrir `Presupuestos` con ese estado aplicado como filtro.
- El gráfico anualizado de aprobados debe mostrar todos los meses presentes en `presupuestos`, aunque alguno no tenga aprobados y deba visualizarse en `0`.
- Indicadores implementados:
  - distribución mensual de presupuestos por estado en gráfico `pie`
  - gráfico combinado anualizado de aprobados con eje por mes, barras agrupadas por taller y línea de monto total mensual
  - distribución mensual de presupuestos por marca en gráfico `radar` con escala común entre ejes
  - distribución mensual de presupuestos por taller en gráfico `pie`

## Reglas de catalogo de talleres

- La creación y edición de talleres debe rechazar nombres repetidos aunque cambie solo el casing.
- No debe existir siembra automática de talleres por defecto.
- El catálogo de talleres debe quedar completamente bajo control manual del usuario.

## Autenticacion y despliegue

- La app no debe exponer login local ni alta local de usuarios.
- El acceso y el consumo de APIs del sistema requieren sesión central válida.
- Si no hay sesión central, la app debe redirigir a `{CENTRAL_AUTH_PUBLIC_URL}/login?appKey={CENTRAL_APP_KEY}&returnTo={NEXT_PUBLIC_APP_URL + ruta}`.
- Si el usuario no tiene acceso, la app debe mostrar una pantalla `forbidden`.
- El logout debe redirigir a `{CENTRAL_AUTH_PUBLIC_URL}/logout?returnTo={NEXT_PUBLIC_APP_URL + ruta}`.
- El cierre de sesión debe ejecutarse con `POST` real hacia Auth Central; un `GET /logout` solo puede servir como puente o autosubmit, pero no invalida la cookie central por sí solo.
- Si la sesión central no se invalida al salir, priorizar `form action="{CENTRAL_AUTH_PUBLIC_URL}/logout?...` con `method="post"` directo desde el navegador en lugar de depender de redirects `307` entre apps.
- La aplicación está dockerizada para correr en el puerto `3012`.
- Existe un `docker-compose.yml` listo para Portainer que levanta únicamente la app y reutiliza el MongoDB externo ya existente en el servidor.
- El stack Docker para Portainer debe poder sumarse también a la red Docker externa `internal-apps` para comunicarse con el servicio `auth-central` por `http://auth-central:3000`.
- El repositorio debe validar por CI la construcción de la imagen Docker antes de promoción a producción.
- El `Dockerfile` define defaults configurables para:
  - `PORT`
  - `HOSTNAME`
  - `NEXT_PUBLIC_APP_URL`
  - `CENTRAL_AUTH_URL`
  - `CENTRAL_AUTH_PUBLIC_URL`
  - `CENTRAL_APP_KEY`
  - `MONGODB_URI`
  - `MONGODB_DB`
  - `DBHOST_NIC`
  - `DBPORT_NIC`
  - `DATABASE_NIC`
  - `DBUSER_NIC`
  - `DBPASS_NIC`

## Variables de entorno esperadas

- `PORT`
- `HOSTNAME`
- `NEXT_PUBLIC_APP_URL`
- `CENTRAL_AUTH_URL`
- `CENTRAL_AUTH_PUBLIC_URL`
- `CENTRAL_APP_KEY`
- `MONGODB_URI`
- `MONGODB_DB`
- `DBHOST_NIC`
- `DBPORT_NIC`
- `DATABASE_NIC`
- `DBUSER_NIC`
- `DBPASS_NIC`

## Archivo de ejemplo

- `.env.example` debe mantenerse completo y actualizado con todas las variables necesarias para ejecutar la app.
- `.env.example` no debe dejar credenciales reales de infraestructura: usar placeholders o defaults de desarrollo.
- `.env.example` debe incluir `NEXT_PUBLIC_APP_URL`, `CENTRAL_AUTH_URL`, `CENTRAL_AUTH_PUBLIC_URL` y `CENTRAL_APP_KEY`.
- `.env.example` debe dejar claro que la app depende de Auth Central para login, logout, sesión y permisos.
- Si todavía existe `.env.local` con variables viejas de Better Auth, deben reemplazarse por las de Auth Central antes de probar el acceso.

## CI

- Existe un workflow en GitHub Actions para construir la imagen Docker del proyecto.
- El objetivo del workflow es detectar roturas de build de producción antes de llegar a despliegue.

## Docker

- El stack Docker para Portainer debe contemplar:
  - servicio `app`
  - publicación del puerto `3012`
  - `extra_hosts` para resolver `host.docker.internal` y permitir acceso al MongoDB y SQL Server externos desde el contenedor
  - unión a la red Docker externa `internal-apps` para interoperar con `auth-central`
