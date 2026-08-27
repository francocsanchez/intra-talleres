# Changelog

## 2026-08-27

- Se integró autenticación local con `Better Auth` sobre MongoDB, usando email y contraseña y cierre de signup público.
- Se agregó bootstrap automático del usuario administrador `admin@nipponcarsrl.com.ar` para dejar la instancia lista al primer acceso.
- Se protegieron la pantalla principal, la carga de presupuestos, el CRUD de talleres, el lookup de unidades y las APIs internas mediante validación de sesión.
- Se creó una pantalla dedicada de ingreso y se incorporó cierre de sesión dentro del navbar operativo.
- Se dockerizó la aplicación con `Dockerfile` multi-stage, `EXPOSE 3012` y variables de entorno listas para configurar MongoDB, SQL Server y credenciales iniciales.
- Se completó `.env.example` con todas las variables requeridas por la app y se reemplazaron credenciales concretas por placeholders seguros de configuración.

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
