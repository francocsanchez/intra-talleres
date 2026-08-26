# Changelog

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
