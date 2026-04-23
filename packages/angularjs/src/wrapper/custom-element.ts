/**
 * <flow-canvas> Custom Element — React mount + attribute bridge.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FlowCanvas } from '../renderer/FlowCanvas';
import type { Flows, NodeTypeDef, FlowCanvasApi, IsValidConnection } from '../core';

const TAG = 'flow-canvas';

interface CanvasState {
	flows?: Flows<unknown>;
	nodeTypes?: NodeTypeDef[];
	direction?: 'vertical' | 'horizontal';
	edgeStyle?: 'bezier' | 'smoothstep';
	theme?: 'light' | 'dark';
	snapToGrid?: boolean;
	gridSize?: number;
	readOnly?: boolean;
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
	private onDropEmptyCb: ((args: { sourceId: string; x: number; y: number; type?: string }) => void) | null = null;
	private isValidConnectionFn: IsValidConnection | null = null;

	static get observedAttributes(): string[] {
		return ['direction', 'edge-style', 'theme', 'snap-to-grid', 'grid-size', 'read-only'];
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
	setOnDropEmpty(cb: (args: { sourceId: string; x: number; y: number; type?: string }) => void): void {
		this.onDropEmptyCb = cb;
		this.render();
	}

	setIsValidConnection(fn: IsValidConnection): void {
		this.isValidConnectionFn = fn;
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.root.render(
			React.createElement(FlowCanvas as any, {
				flows: this.state.flows,
				nodeTypes: this.state.nodeTypes || [],
				direction: this.state.direction,
				edgeStyle: this.state.edgeStyle,
				theme: this.state.theme,
				snapToGrid: this.state.snapToGrid,
				gridSize: this.state.gridSize,
				readOnly: this.state.readOnly,
				onChange: this.onChangeCb,
				onSelect: this.onSelectCb,
				onEdit: this.onEditCb,
				onReady: this.handleReady,
				onDropEmpty: this.onDropEmptyCb,
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
