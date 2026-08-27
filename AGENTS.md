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
- El catálogo de talleres no tiene seed automático y queda bajo carga manual del usuario.
- La aplicación exige autenticación antes de permitir acceso a dashboard, presupuestos, configuración o APIs internas.
- La autenticación usa `Better Auth` con email y contraseña, persistiendo sesiones y usuarios en la misma base MongoDB del sistema.
- Existe bootstrap automático del usuario administrador inicial:
  - `admin@nipponcarsrl.com.ar`
  - clave por default `Nippon111+`

## Modelo funcional actual

- `taller`
  - `nombre`
  - `activo`
  - `tipoTrabajo` opcional
- `presupuesto`
  - `interno`
  - `dominio`
  - `marca`
  - `modelo`
  - `km`
  - `costo`
  - `costoConIva`
  - `observaciones`
  - `estado`
  - `tallerId`
  - `tallerNombre`
  - `nroPresupuesto` opcional
  - `prioridad` opcional
  - `detalle` opcional
  - `fechaIngresoTaller` opcional
  - `fechaEgresoTaller` opcional

## Estados validos

- `Pendiente`
- `Aprobado`
- `Rechazado`
- `Revisar`

## Endpoints actuales

- `GET/POST /api/auth/[...all]`
- `GET /api/unidades?interno=...`
- `GET /api/presupuestos`
- `POST /api/presupuestos`
- `PATCH /api/presupuestos/[id]`
- `GET /api/talleres`
- `POST /api/talleres`
- `PATCH /api/talleres/[id]`
- `DELETE /api/talleres/[id]`

## Navegacion actual

- `Sign-in`
  - acceso autenticado a la operación
- `Dashboard`
  - vista compacta de resumen por estado
- `Presupuestos`
  - carga por interno
  - filtros
  - tabla consolidada
- `Configuración`
  - CRUD de talleres

## Reglas UI actuales

- El hero inicial fue eliminado.
- La prioridad del presupuesto se carga mediante select cerrado con estas opciones:
  - `Alta`
  - `Media`
  - `Baja`
- La generación de presupuestos se realiza desde un `dialog` de alta.
- La fecha de egreso puede quedar vacía al crear y luego completarse desde la tabla de seguimiento.
- Observaciones y detalle se visualizan completos mediante un `dialog` disparado por `Ver más`.
- La columna `Observaciones` en la tabla no muestra texto resumido: solo expone el botón `Ver más`.
- El cambio de estado y la carga de fecha de egreso se realizan desde un único `dialog` de gestión por presupuesto.

## Dashboard actual

- El dashboard utiliza `ECharts` para las visualizaciones.
- Indicadores implementados:
  - cantidad de presupuestos por mes con barras apiladas por estado
  - gasto por mes de presupuestos aprobados
  - cantidad de presupuestos por marca
  - cantidad de presupuestos por taller

## Reglas de catalogo de talleres

- La creación y edición de talleres debe rechazar nombres repetidos aunque cambie solo el casing.
- No debe existir siembra automática de talleres por defecto.
- El catálogo de talleres debe quedar completamente bajo control manual del usuario.

## Autenticacion y despliegue

- El alta pública de usuarios está deshabilitada.
- El usuario administrador inicial se crea automáticamente si no existe.
- El acceso y el consumo de APIs del sistema requieren sesión válida.
- La aplicación está dockerizada para correr en el puerto `3012`.
- El `Dockerfile` define defaults configurables para:
  - `PORT`
  - `HOSTNAME`
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `AUTH_ADMIN_EMAIL`
  - `AUTH_ADMIN_PASSWORD`
  - `AUTH_ADMIN_NAME`
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
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `AUTH_ADMIN_EMAIL`
- `AUTH_ADMIN_PASSWORD`
- `AUTH_ADMIN_NAME`
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
