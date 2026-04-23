/**
 * <flow-canvas> Custom Element — React mount + attribute bridge.
 * TODO(Copilot): full implementation per README.md § "Custom Element".
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FlowCanvas } from '../renderer/FlowCanvas';
import type { Flows, NodeTypeDef } from '../core';

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
	private onChangeCb: ((changes: unknown[]) => void) | null = null;
	private onSelectCb: ((id: string | null) => void) | null = null;
	private onEditCb: ((id: string) => void) | null = null;
	private onReadyCb: ((api: unknown) => void) | null = null;

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
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.container && this.container.parentNode === this) {
			this.removeChild(this.container);
			this.container = null;
		}
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
	setFlows(flows: Flows<unknown>): void { this.state.flows = flows; this.render(); }
	setNodeTypes(types: NodeTypeDef[]): void { this.state.nodeTypes = types; this.render(); }

	onChange(cb: (changes: unknown[]) => void): void { this.onChangeCb = cb; }
	onSelect(cb: (id: string | null) => void): void { this.onSelectCb = cb; }
	onEdit(cb: (id: string) => void): void { this.onEditCb = cb; }
	onReady(cb: (api: unknown) => void): void { this.onReadyCb = cb; }

	private render(): void {
		if (!this.root) return;
		this.root.render(
			React.createElement(FlowCanvas as unknown as React.ComponentType<Record<string, unknown>>, {
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
				onReady: this.onReadyCb
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
