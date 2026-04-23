# Troubleshooting rápido

## `pnpm: command not found`

```bash
corepack enable
corepack prepare pnpm@9.2.0 --activate
pnpm -v
```

## Fallo al instalar Cypress por red restringida

Síntoma: error descargando `download.cypress.io`.

Solución:

```bash
CYPRESS_INSTALL_BINARY=0 pnpm install
```

## Fallo en Playwright por navegadores no instalados

```bash
cd tests/playwright
npx playwright install
```

## Fallos de formato/lint en Svelte

El paquete Svelte valida con `prettier --check . && eslint ./src`.

Para corregir formato:

```bash
cd packages/svelte
pnpm format
pnpm lint
```

## Fallos al arrancar E2E por ejemplos

Playwright depende de:

- React examples en `3000`
- Svelte examples en `5173`

Verificar que scripts `dev` de `react-examples` y `svelte-examples` compilan sin errores.
