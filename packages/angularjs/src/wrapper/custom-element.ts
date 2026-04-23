/**
 * <flow-canvas> Custom Element — React mount + attribute bridge.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FlowCanvas } from '../renderer/FlowCanvas';
import type { Flows, NodeTypeDef, FlowCanvasApi, IsValidConnection } from '../core';
import type { ContextMenuArgs } from '../renderer/FlowCanvas';

const TAG = 'xyflow-canvas';

interface CanvasState {
	flows?: Flows<unknown>;
	nodeTypes?: NodeTypeDef[];
	direction?: 'vertical' | 'horizontal';
	edgeStyle?: 'bezier' | 'smoothstep';
	theme?: 'light' | 'dark';
	snapToGrid?: boolean;
	gridSize?: number;
	readOnly?: boolean;
	paletteTitle?: string;
}

export class FlowCanvasElement extends HTMLElement {
	private root: Root | null = null;
	private container: HTMLElement | null = null;
	private state: CanvasState = {};
	private api: FlowCanvasApi<unknown> | null = null;

	// Callbacks
	private onChangeCb: ((changes: unknown[]) => void) | null = null;
	private onSelectCb: ((id: string | null) => void) | null = null;
	private onEditCb: ((id: string) => void) | null = null;
	private onReadyCb: ((api: FlowCanvasApi<unknown>) => void) | null = null;
	private onDropEmptyCb: ((args: { sourceId: string; sourceHandle?: string; x: number; y: number; screenX: number; screenY: number; type?: string }) => void) | null = null;
	private onNodeContextMenuCb: ((args: ContextMenuArgs & { id: string }) => void) | null = null;
	private onEdgeContextMenuCb: ((args: ContextMenuArgs & { id: string }) => void) | null = null;
	private onPaneContextMenuCb: ((args: ContextMenuArgs) => void) | null = null;
	private isValidConnectionFn: IsValidConnection | null = null;

	static get observedAttributes(): string[] {
		return ['direction', 'edge-style', 'theme', 'snap-to-grid', 'grid-size', 'read-only', 'palette-title'];
	}

	connectedCallback(): void {
		this.container = document.createElement('div');
		this.container.className = 'flow-canvas-root';
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		this.appendChild(this.container);
		this.root = createRoot(this.container);
		this.render();
	}

	disconnectedCallback(): void {
		// Clean unmount
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.container && this.container.parentNode === this) {
			this.removeChild(this.container);
			this.container = null;
		}
		// Release references
		this.api = null;
		this.onChangeCb = null;
		this.onSelectCb = null;
		this.onEditCb = null;
		this.onReadyCb = null;
		this.onDropEmptyCb = null;
		this.isValidConnectionFn = null;
	}

	attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
		switch (name) {
			case 'direction':
				this.state.direction = value === 'horizontal' ? 'horizontal' : 'vertical';
				break;
			case 'edge-style':
				this.state.edgeStyle = value === 'smoothstep' ? 'smoothstep' : 'bezier';
				break;
			case 'theme':
				this.state.theme = value === 'dark' ? 'dark' : 'light';
				if (this.container) this.container.setAttribute('data-theme', this.state.theme);
				break;
			case 'snap-to-grid':
				this.state.snapToGrid = value !== null && value !== 'false';
				break;
			case 'grid-size':
				this.state.gridSize = value ? parseInt(value, 10) : 20;
				break;
			case 'read-only':
				this.state.readOnly = value !== null && value !== 'false';
				break;
			case 'palette-title':
				this.state.paletteTitle = value ?? undefined;
				break;
		}
		this.render();
	}

	// Property setters for complex types that don't serialize to attributes
	setFlows(flows: Flows<unknown>): void {
		this.state.flows = flows;
		this.render();
	}

	setNodeTypes(types: NodeTypeDef[]): void {
		this.state.nodeTypes = types;
		this.render();
	}

	// Callback setters
	onChange(cb: (changes: unknown[]) => void): void {
		this.onChangeCb = cb;
		this.render();
	}

	onSelect(cb: (id: string | null) => void): void {
		this.onSelectCb = cb;
		this.render();
	}

	onEdit(cb: (id: string) => void): void {
		this.onEditCb = cb;
		this.render();
	}

	onReady(cb: (api: FlowCanvasApi<unknown>) => void): void {
		this.onReadyCb = cb;
		// If API already available, call immediately
		if (this.api) {
			cb(this.api);
		}
		this.render();
	}

	// New setters per spec
	setOnDropEmpty(cb: (args: { sourceId: string; sourceHandle?: string; x: number; y: number; screenX: number; screenY: number; type?: string }) => void): void {
		this.onDropEmptyCb = cb;
		this.render();
	}

	setIsValidConnection(fn: IsValidConnection): void {
		this.isValidConnectionFn = fn;
		this.render();
	}

	setOnNodeContextMenu(cb: (args: ContextMenuArgs & { id: string }) => void): void {
		this.onNodeContextMenuCb = cb;
		this.render();
	}

	setOnEdgeContextMenu(cb: (args: ContextMenuArgs & { id: string }) => void): void {
		this.onEdgeContextMenuCb = cb;
		this.render();
	}

	setOnPaneContextMenu(cb: (args: ContextMenuArgs) => void): void {
		this.onPaneContextMenuCb = cb;
		this.render();
	}

	// Expose the API for external access
	getApi(): FlowCanvasApi<unknown> | null {
		return this.api;
	}

	private handleReady = (api: FlowCanvasApi<unknown>): void => {
		this.api = api;
		if (this.onReadyCb) {
			this.onReadyCb(api);
		}
	};

	private render(): void {
		if (!this.root) return;
		// React's `FlowCanvas` uses `useMemo`/`useEffect` keyed on the `flows`
		// reference to decide whether to re-run `flowsToReactFlow`. Host code
		// tends to mutate the `flows` Map in place (applyChanges) and call
		// setFlows with the same reference — that produces no diff and React
		// keeps showing stale data. We emit a shallow clone for the render so
		// every setFlows forces a reconciliation without pushing a new ref
		// back to the host (which would trigger AngularJS digest loops).
		const flowsForRender = this.state.flows ? {
			nodes: new Map(this.state.flows.nodes),
			edges: new Map(this.state.flows.edges),
			roots: [...this.state.flows.roots]
		} : undefined;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.root.render(
			React.createElement(FlowCanvas as any, {
				flows: flowsForRender,
				nodeTypes: this.state.nodeTypes || [],
				direction: this.state.direction,
				edgeStyle: this.state.edgeStyle,
				theme: this.state.theme,
				snapToGrid: this.state.snapToGrid,
				gridSize: this.state.gridSize,
				readOnly: this.state.readOnly,
				paletteTitle: this.state.paletteTitle,
				onChange: this.onChangeCb,
				onSelect: this.onSelectCb,
				onEdit: this.onEditCb,
				onReady: this.handleReady,
				onDropEmpty: this.onDropEmptyCb,
				onNodeContextMenu: this.onNodeContextMenuCb,
				onEdgeContextMenu: this.onEdgeContextMenuCb,
				onPaneContextMenu: this.onPaneContextMenuCb,
				isValidConnection: this.isValidConnectionFn
			})
		);
	}
}

export function registerCustomElement(): void {
	if (typeof window === 'undefined' || !window.customElements) return;
	if (!window.customElements.get(TAG)) {
		window.customElements.define(TAG, FlowCanvasElement);
	}
}
