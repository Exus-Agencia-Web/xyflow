# Catálogo de ejemplos útil para agentes

## Ubicaciones

- React: `examples/react/src/examples/*`
- Svelte: `examples/svelte/src/routes/examples/*`
- Casos genéricos para tests:
  - `examples/react/src/generic-tests/*`
  - `examples/svelte/src/generic-tests/*`

## Casos React relevantes (selección)

- Base y onboarding: `Basic`, `Overview`, `Interaction`
- Nodos/edges custom: `CustomNode`, `EdgeTypes`, `Edges`
- Toolbars y resizers: `NodeToolbar`, `EdgeToolbar`, `NodeResizer`
- Estado y hooks: `UseReactFlow`, `UseNodesData`, `UseNodeConnections`, `UseUpdateNodeInternals`
- Persistencia y layout: `SaveRestore`, `Layouting`
- Rendimiento: `Stress`
- Accesibilidad: `A11y`

## Casos Svelte relevantes (selección)

- Base y onboarding: `overview`, `interaction`
- Customización: `customnode`, `edges`, `custom-connection-line`
- Toolbars y resizers: `node-toolbar`, `edge-toolbar`, `node-resizer`
- Estado y hooks: `usesvelteflow`, `usenodesdata`, `useupdatenodeinternals`
- Integraciones: `dagre`, `figma`
- Validación y UX: `validation`, `a11y`, `color-mode`

## Regla práctica para agentes

- Antes de tocar core, localizar un ejemplo equivalente.
- Si no existe, crear uno mínimo en `examples/*` para validar manualmente.
- Reusar rutas/casos de `generic-tests` cuando el objetivo sea cobertura E2E.
