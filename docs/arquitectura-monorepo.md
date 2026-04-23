# Arquitectura del monorepo

## Estructura principal

- `packages/react`: librería `@xyflow/react`.
- `packages/svelte`: librería `@xyflow/svelte`.
- `packages/system`: núcleo compartido framework-agnóstico `@xyflow/system`.
- `examples/react`: app Vite para ejemplos y pruebas (React).
- `examples/svelte`: app SvelteKit para ejemplos y pruebas (Svelte).
- `examples/astro-xyflow`: app Astro para escenarios SSR.
- `tests/playwright`: E2E cross-framework.
- `tooling/*`: configuración compartida (eslint, rollup, tsconfig, postcss).

## Relación entre paquetes

- `@xyflow/system` implementa lógica base (tipos, utilidades, pan/zoom, drag, handles, minimap, resizer, paths de edges).
- `@xyflow/react` consume `@xyflow/system` y expone componentes/hooks para React.
- `@xyflow/svelte` consume `@xyflow/system` y expone componentes/plugins/hooks para Svelte.

## Pipeline del monorepo

- Gestor: `pnpm` workspaces (`pnpm-workspace.yaml`).
- Orquestación: `turbo` (`turbo.json`).
- Tareas raíz:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:react`
  - `pnpm test:svelte`

## Capas técnicas por paquete

### React (`packages/react/src`)

- `container/*`: montaje/render principal de flujo.
- `components/*`: bloques UI base.
- `additional-components/*`: Background, Controls, MiniMap, NodeResizer, Toolbars.
- `hooks/*`: API reactiva pública.
- `store/*`: estado interno.
- `types/*`, `utils/*`, `styles/*`.

### Svelte (`packages/svelte/src/lib`)

- `container/*`: `SvelteFlow` y renderers.
- `components/*`: bloques UI base.
- `plugins/*`: Controls, Background, Minimap, Toolbars, Resizer.
- `hooks/*`: hooks/svelte utilities.
- `store/*`, `types/*`, `utils/*`, `actions/*`.

### System (`packages/system/src`)

- `types/*`, `constants.ts`, `utils/*`.
- Módulos core: `xydrag`, `xyhandle`, `xyminimap`, `xypanzoom`, `xyresizer`.
