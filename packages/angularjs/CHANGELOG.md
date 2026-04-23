# Changelog

All notable changes to `@xyflow/angularjs` will be documented in this file.

## [0.1.0] - 2024

### Added

- Initial AngularJS 1.x wrapper release for `@xyflow/react`
- **Core module** (`src/core/`):
  - `createFlows()`, `createNode()`, `createEdge()` — factory functions
  - `applyChanges()` — mutative batch change application
  - `cloneFlows()` — deep copy utility
  - `autoLayout()` — Reingold-Tilford tree layout for DAGs
  - Full TypeScript types (`Flows`, `FlowNode`, `FlowEdge`, `FlowChange`, etc.)
- **React renderer** (`src/renderer/FlowCanvas.tsx`):
  - Catalog-driven `NodeCard` component with icon, label, summary, colored border
  - `StickyNode` variant with contenteditable, color picker, resize
  - Sidebar `Palette` panel with drag-drop support
  - `MiniMap` (bottom-right), `Controls` (bottom-left), dot `Background`
  - Edge labels on multi-output handles
  - `isValidConnection` coloring during drag
  - Debounced `onChange` emission (100ms)
  - `onDropEmpty` when connect-drag ends on empty canvas
  - `forwardRef` exposing `FlowCanvasApi`:
    - `getFlows()`, `setFlows()`, `redraw()`
    - `undo()`, `redo()`, `canUndo()`, `canRedo()`
    - `autoArrange()`, `fitView()`, `setZoom()`, `getView()`, `setView()`
    - `toggleFullscreen()`, `exportPng()`
    - `selectNode()`, `clearSelection()`, `focusNode()`, `getSelectedIds()`
  - Props: `direction`, `edgeStyle`, `snapToGrid`, `gridSize`, `readOnly`, `theme`
- **Custom Element** (`src/wrapper/custom-element.ts`):
  - `<flow-canvas>` web component wrapping React renderer
  - Property setters: `setFlows()`, `setNodeTypes()`, `setIsValidConnection()`, `setOnDropEmpty()`
  - Callback setters: `onChange()`, `onSelect()`, `onEdit()`, `onReady()`
  - Observed attributes: `direction`, `edge-style`, `theme`, `snap-to-grid`, `grid-size`, `read-only`
  - Clean unmount on `disconnectedCallback`
- **AngularJS directive** (`src/wrapper/directive.ts`):
  - `<flow-canvas>` directive with two-way bindings for `flows` and `nodeTypes`
  - `$watch('flows', ..., true)` — deep watch for in-place mutations
  - `$watchGroup` for scalar attributes
  - `isValidConnection` and `onDropEmpty` bindings
  - `$destroy` cleanup removes CE from DOM
- **CSS theming** (`src/styles/tokens.css`):
  - CSS custom properties for all colors, radii, shadows
  - Light/dark theme via `data-theme` attribute
  - Scoped to `.flow-canvas-root`
- **Build**:
  - Rollup config producing UMD + ESM bundles
  - UMD inlines React + xyflow; ESM treats them as peer deps
  - CSS extracted to `dist/flow-canvas.css`
- **Examples**:
  - `examples/minimal.html` — basic usage demo
  - `examples/full.html` — 8 node types, theme toggle, fullscreen, localStorage save
  - `examples/mailer-like.html` — Mailer-style with inspector side panel
- **Tests**:
  - `tests/core.test.ts` — vitest suite for `applyChanges`, `autoLayout`, factory functions

### Notes

- TypeScript strict mode with `noImplicitAny`
- No Tailwind — plain CSS with variables
- React 19 + xyflow 12 compatible
- UMD bundle exposes `window.FlowCanvas` with `.initAngular(moduleName)`
