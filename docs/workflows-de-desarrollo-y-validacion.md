# Workflows de desarrollo y validación

## Requisitos

- Node.js 20+
- `pnpm@9.2.0` (usar `corepack enable` + `corepack prepare pnpm@9.2.0 --activate`)

## Setup

```bash
pnpm install
```

Si estás en una red restringida y falla descarga de Cypress:

```bash
CYPRESS_INSTALL_BINARY=0 pnpm install
```

## Comandos raíz más importantes

```bash
pnpm dev
pnpm dev:react
pnpm dev:svelte
pnpm build
pnpm lint
pnpm typecheck
pnpm test:react
pnpm test:svelte
```

## E2E con Playwright

Ubicación: `tests/playwright`.

- React: `pnpm test:react`
- Svelte: `pnpm test:svelte`
- Modos UI: `pnpm test:react:ui`, `pnpm test:svelte:ui`

Los tests levantan automáticamente:

- `react-examples` en puerto `3000`
- `svelte-examples` en puerto `5173`

## Flujo recomendado para cambios

1. Identificar paquete afectado (`react`, `svelte`, `system`).
2. Reproducir comportamiento en `examples/*`.
3. Implementar cambio mínimo en paquete objetivo.
4. Validar con `pnpm lint`, `pnpm build`, y tests aplicables.
5. Si se toca `system`, validar también React y Svelte.
