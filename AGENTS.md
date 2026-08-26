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
- Los talleres iniciales se siembran automaticamente con este catalogo:
  - `EMT`
  - `PROBALANCE`
  - `ALTAMIRANO`
  - `FULLSERVICE`
  - `TODO AUTO`
  - `FEPOLARIZADOS`
  - `Gomeria F1`

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

- `GET /api/unidades?interno=...`
- `GET /api/presupuestos`
- `POST /api/presupuestos`
- `PATCH /api/presupuestos/[id]`
- `GET /api/talleres`
- `POST /api/talleres`
- `PATCH /api/talleres/[id]`
- `DELETE /api/talleres/[id]`

## Navegacion actual

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

## Reglas de catalogo de talleres

- El seed de talleres debe comportarse de manera case-insensitive para evitar duplicados por diferencias entre mayúsculas y minúsculas.
- La creación y edición de talleres debe rechazar nombres repetidos aunque cambie solo el casing.
- El seed inicial de talleres debe ejecutarse solo cuando la colección de talleres está vacía, para no recrear talleres que fueron renombrados o eliminados desde la interfaz.

## Variables de entorno esperadas

- `MONGODB_URI`
- `MONGODB_DB`
- `DBHOST_NIC`
- `DBPORT_NIC`
- `DATABASE_NIC`
- `DBUSER_NIC`
- `DBPASS_NIC`
