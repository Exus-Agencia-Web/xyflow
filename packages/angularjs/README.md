# @xyflow/angularjs

AngularJS 1.x wrapper around `@xyflow/react` — Custom Element + directive + catalog-driven node renderer.

## Install

```bash
pnpm add @xyflow/angularjs
# or include the UMD bundle:
<link rel="stylesheet" href="dist/flow-canvas.css">
<script src="dist/flow-canvas.umd.cjs"></script>
<script>FlowCanvas.initAngular('flowCanvas');</script>
```

## Minimal usage

```html
<div ng-app="myApp" ng-controller="EditorCtrl as $ctrl">
  <flow-canvas
    flows="$ctrl.flows"
    node-types="$ctrl.nodeTypes"
    direction="horizontal"
    theme="light"
    on-change="$ctrl.onChange(changes)"
    on-ready="$ctrl.onReady(api)">
  </flow-canvas>
</div>
```

```js
angular.module('myApp', ['flowCanvas'])
  .controller('EditorCtrl', function(){
    this.nodeTypes = [
      {
        type: 'email', label: 'Send email', color: '#6366f1',
        icon: '<svg ...>...</svg>',
        inputs: [{ type: 'main' }],
        outputs: [{ type: 'main' }],
        createEntity: () => ({ type: 'email', data: { campaign: null } }),
        renderSummary: (n) => n.entity.data.campaign ? `Campaign #${n.entity.data.campaign}` : 'No campaign'
      },
      // ...
    ];
    this.flows = FlowCanvas.createFlows();
    this.onChange = (changes) => FlowCanvas.applyChanges(this.flows, changes);
    this.onReady  = (api) => { this.api = api; };
  });
```

## Implementation Spec (for Copilot / contributors)

The scaffold in `src/` covers **core logic + wrapper glue**. The **React renderer** in `src/renderer/FlowCanvas.tsx` is a stub. Fill in according to:

### React renderer (`src/renderer/FlowCanvas.tsx`)

Must render the following using `@xyflow/react`:

1. `<ReactFlow>` with `nodeTypes` derived from `props.nodeTypes`. All types share a single `NodeCard` React component that reads the type def to render:
   - colored chip with SVG icon (`dangerouslySetInnerHTML`, icons are trusted)
   - label + `renderSummary(node)` subtitle
   - border-left with type color
   - handles per `inputs[]` and `outputs[]` (with edge labels when `outputs.length > 1`)
   - sticky variant when `typeDef.isSticky` — body contenteditable, resize handle, color picker
2. `<Background>` with dot pattern using `var(--fc-grid-color)`
3. `<Controls>` positioned bottom-left
4. `<MiniMap>` positioned bottom-right, `pannable`, `zoomable`
5. `<Panel position="top-left">` with sidebar palette — one card per type chain (excluding `isInitial`), draggable with `dataTransfer`
6. Edge label SVG `<text>` at path midpoint when `edge.label` present

### Interactions

- `onNodesChange` / `onEdgesChange` from xyflow → translate to `FlowChange[]` → debounce 100ms → emit
- drop from palette → compute canvas coords (via `screenToFlowPosition`) → `node:add` change
- connect drag that lands on empty canvas → `onDropEmpty({ sourceId, x, y })` (host opens picker)
- dblclick node → `onEdit(id)`
- single click → `onSelect(id)` (null when clearing)
- `isValidConnection` used to color the ghost edge (green/red) during drag
- delete key when node selected → `node:delete`
- Ctrl/Cmd + Z / Shift+Z / Y → `api.undo()` / `api.redo()`

### Imperative API (forwardRef)

Match `FlowCanvasApi` in `core/types.ts`. Implement on top of xyflow's `useReactFlow` hook:

- `getView()` / `setView()` → `getViewport()` + `setViewport()`
- `fitView(padding)` → `fitView({ padding })`
- `autoArrange()` → call `core/auto-layout.ts:autoLayout` then `applyChanges` for node moves + trigger `fitView`
- `undo/redo` → maintain a history ring of `Flows` snapshots in a ref
- `exportPng()` → `html-to-image` or `react-flow-to-image` helper

### Custom Element (`src/wrapper/custom-element.ts`)

Already scaffolded. Must be patched to:

- Accept `setIsValidConnection(fn)` + `setOnDropEmpty(fn)` setters
- Forward imperative `api` from `onReady` out to host via `onReady` callback
- On disconnect: unmount React cleanly, release event listeners

### Directive (`src/wrapper/directive.ts`)

Already scaffolded. Must be patched to:

- `$watch('flows', ..., true)` → re-sync to CE when the host mutates in place
- `$watch('nodeTypes')`
- `$watchGroup(['direction','edgeStyle','theme','snapToGrid','gridSize','readOnly'], ...)` → re-sync attrs
- On `$destroy` → remove CE from DOM so React unmounts

### Build

- `pnpm build` → rollup produces `dist/flow-canvas.umd.cjs` + `dist/flow-canvas.esm.js` + `dist/flow-canvas.css`
- UMD inlines React + xyflow; ESM treats them as peer deps
- Target bundle size: ≤ 600KB min + gzip

### Tests

- `tests/core.test.ts` — vitest suites for `applyChanges`, `autoLayout`, `createNode/Edge`
- `tests/e2e.spec.ts` — playwright smoke: load `examples/full.html`, drag 2 nodes, connect, save, verify `on-change` payload

## Full API Spec

See the sibling files:
- `src/core/types.ts` — all shapes + `FlowCanvasApi`
- `src/wrapper/directive.ts` — binding table
- `examples/` — runnable demos

## License

MIT — same as upstream xyflow.
