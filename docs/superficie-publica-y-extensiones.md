# Superficie pública y puntos de extensión

## `@xyflow/react` (entrada: `packages/react/src/index.ts`)

Exporta principalmente:

- Componente raíz: `ReactFlow`.
- Componentes: `Handle`, `Panel`, `ViewportPortal`, edges (`BezierEdge`, `SmoothStepEdge`, etc.).
- Hooks: `useReactFlow`, `useNodesState`, `useEdgesState`, `useViewport`, `useConnection`, etc.
- Helpers: `applyNodeChanges`, `applyEdgeChanges`, `isNode`, `isEdge`.
- Reexport de tipos y utilidades clave de `@xyflow/system`.

### Extensión típica en React

- Crear `nodeTypes`/`edgeTypes` personalizados.
- Usar hooks (`useReactFlow`, `useNodesData`, `useNodeConnections`) para lógica de negocio.
- Combinar plugins (`MiniMap`, `Controls`, `Background`) según UX.

## `@xyflow/svelte` (entrada: `packages/svelte/src/lib/index.ts`)

Exporta principalmente:

- Componente raíz: `SvelteFlow`.
- Componentes/plugins: edges, `Handle`, `EdgeLabel`, `Controls`, `Background`, `Minimap`, `NodeToolbar`, `EdgeToolbar`, `NodeResizer`.
- Hooks/utilidades: `useSvelteFlow`, `useConnection`, `useNodesData`, `useUpdateNodeInternals`, etc.
- Tipos y utilidades de `@xyflow/system`.

### Extensión típica en Svelte

- Definir nodos/edges custom vía rutas de ejemplo y componentes Svelte.
- Integrar stores para sincronización de estado.
- Reusar plugins para UX avanzada.

## `@xyflow/system` (entrada: `packages/system/src/index.ts`)

Exporta:

- `constants`, `types`, `utils`.
- Módulos core: drag, handle, minimap, pan/zoom, resizer.

### Cuándo tocar `system`

- Solo cuando el cambio sea realmente compartido por React y Svelte.
- Verificar impacto en ambos frameworks antes de cerrar PR.
