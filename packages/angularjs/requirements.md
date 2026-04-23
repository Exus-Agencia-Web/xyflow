# Copilot Prompt — Implement `@xyflow/angularjs`

Paste this (or reference it) when asking Copilot / another agent to fill in the stubs.

---

You are implementing an AngularJS 1.x wrapper around `@xyflow/react` (React Flow v12). The scaffold lives at `packages/angularjs/` of the xyflow monorepo. Read these files first — they define the public contract and are DONE:

- `packages/angularjs/package.json`
- `packages/angularjs/tsconfig.json`
- `packages/angularjs/rollup.config.mjs`
- `packages/angularjs/src/core/types.ts`        (all public types — do not change without discussion)
- `packages/angularjs/src/core/flows.ts`        (createFlows, createNode, applyChanges, cloneFlows)
- `packages/angularjs/src/core/auto-layout.ts`  (Reingold-Tilford)
- `packages/angularjs/src/core/index.ts`        (barrel)
- `packages/angularjs/src/styles/tokens.css`    (CSS variables the host overrides)
- `packages/angularjs/src/index.ts`             (ESM entry — already wired)
- `packages/angularjs/src/index.umd.ts`         (UMD entry — already wired, registers CE + exports .initAngular)
- `packages/angularjs/src/wrapper/custom-element.ts`  (scaffold — patch, don't restructure)
- `packages/angularjs/src/wrapper/directive.ts`       (scaffold — patch, don't restructure)
- `packages/angularjs/README.md`                (full spec + acceptance criteria)

Fill in these files from their current stubs:

1. **`src/renderer/FlowCanvas.tsx`** — the React component that wraps `@xyflow/react`. Follow the spec in `README.md` § "React renderer". Must support:
   - Catalog-driven NodeCard (icon + label + summary + border-left color + handles)
   - Sticky variant (contenteditable + resize + color picker)
   - Palette panel with drag-drop into the canvas
   - Minimap + Controls + dot Background
   - Edge labels on multi-output handles
   - `isValidConnection` coloring during drag
   - `onNodesChange` / `onEdgesChange` → debounced `onChange(FlowChange[])` emission
   - `onDropEmpty` when a connect-drag ends in empty canvas
   - `forwardRef` exposing `FlowCanvasApi` matching `src/core/types.ts`
   - `direction` vertical/horizontal (handle positions + `Position.Top|Bottom` vs `Left|Right`)
   - `edgeStyle` bezier/smoothstep (use xyflow's `SmoothStepEdge` / `BezierEdge`)
   - `snapToGrid` + `gridSize`
   - `readOnly` disables all interactions

2. **`src/wrapper/custom-element.ts`** — patch the stub:
   - Store the last-rendered `FlowCanvasApi` and expose it via `onReady` on mount + when React re-renders it
   - Add setters `setIsValidConnection`, `setOnDropEmpty`
   - Clean unmount on `disconnectedCallback`

3. **`src/wrapper/directive.ts`** — patch the stub:
   - `$watch('flows', ..., true)` — deep watch, call `ce.setFlows(newVal)` on change
   - `$watch('nodeTypes')` — reference watch
   - `$watchGroup` on scalar attrs — call `ce.setAttribute(...)` for each
   - `scope.$on('$destroy')` — remove the CE element from DOM to trigger React unmount
   - `isValidConnection` binding wires through `ce.setIsValidConnection(args => scope.isValidConnection({ args }))`
   - `onDropEmpty` similarly

4. **`tests/core.test.ts`** (vitest) — 80%+ coverage of `applyChanges` and `autoLayout`, including edge cases: DAG with joins, orphan pasos, empty flows, single node, cycle (detect+bail).

5. **`examples/full.html`** — build a richer demo than `minimal.html`: 8 node types (action-like, wait, tag_add, tag_remove, exit, if with yes/no, sticky, start-locked), theme toggle button, dark mode, fullscreen button, save-to-localStorage button.

6. **`examples/mailer-like.html`** — mimic the Mailer use case: full palette + inspector side panel that renders different form fields based on `selected.meta.kind`. Wire `on-edit` and `on-select`.

## Constraints

- TypeScript strict mode, `noImplicitAny`
- No Tailwind. Plain CSS with variables from `tokens.css`
- React 19 + xyflow 12 only
- No Angular code in `src/renderer/**` — renderer is pure React
- No `any` in public types — internal escape hatches OK when justified by comment
- UMD bundle must expose `window.FlowCanvas` with the shape in `src/index.umd.ts`
- Final bundle ≤ 800KB minified (before gzip), ≤ 220KB gzipped

## Deliverables

- All files above filled in, `pnpm typecheck` passes, `pnpm test` passes, `pnpm build` produces UMD + ESM + CSS
- Update `README.md` — remove the "Status: scaffold" banner once everything compiles + examples render
- Add a short CHANGELOG entry in `packages/angularjs/CHANGELOG.md` (create file): `0.1.0 — initial AngularJS wrapper release`

## Acceptance

Open `examples/full.html` in Chrome. Expect:

1. Canvas renders with dot-grid background, one initial start node
2. Sidebar palette on the left with 8 item chips — each draggable
3. Drag an `email` item into the canvas → new node appears at drop position, edge from start auto-connects when drop is near an output handle
4. Double-click a node → console logs `onEdit(id)`
5. Click node → sidebar highlights
6. Right-click a node → context menu with Delete
7. MiniMap bottom-right shows all nodes
8. Zoom controls bottom-left work
9. Theme toggle button flips `data-theme` → colors update without re-mounting canvas
10. Save button serializes `flows` via `JSON.stringify` to localStorage; Reload restores
11. Fullscreen button goes fullscreen, exits with Esc
12. Node drag snaps to 20px grid

If you implement it well, I should be able to drop this into the PageGearCloud Mailer module by:
- Building with `pnpm --filter @xyflow/angularjs build`
- Copying `dist/flow-canvas.{umd.cjs,css}` to `/PageGearCloud/js/libs/flow-canvas.{js,css}`
- Adding a `case 'flow-canvas'` to `load_libjs()` with filemtime cache-bust
- Replacing `<workflowkit-builder>` with `<flow-canvas>` in the Mailer controller

Do NOT break the contract in `src/core/types.ts` without migration notes in the PR description.
