/**
 * Core types for the AngularJS ↔ xyflow wrapper.
 * Framework-agnostic. No React or Angular imports here.
 */

export type Direction = 'vertical' | 'horizontal';
export type EdgeStyle = 'bezier' | 'smoothstep';
export type Theme = 'light' | 'dark';

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	w: number;
	h: number;
}

export interface HandleDef {
	type: string;
	label?: string;
	maxConnections?: number;
}

export interface NodeTypeDef<TData = unknown> {
	type: string;
	label: string;
	icon?: string;
	color?: string;
	isInitial?: boolean;
	isTerminal?: boolean;
	isSticky?: boolean;
	isResizable?: boolean;
	locked?: boolean;
	hideContextMenu?: boolean;
	inputs?: HandleDef[];
	outputs?: HandleDef[];
	defaultSize?: Size;
	createEntity: () => { type: string; data: TData };
	renderSummary?: (node: FlowNode<TData>) => string;
}

export interface FlowNode<TData = unknown> {
	id: string;
	entity: { type: string; data: TData };
	position: Position;
	size: Size;
	selected?: boolean;
}

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
	entity?: { type?: string };
	label?: string;
}

export interface Flows<TData = unknown> {
	nodes: Map<string, FlowNode<TData>>;
	edges: Map<string, FlowEdge>;
	roots: string[];
}

export type FlowChange<TData = unknown> =
	| { type: 'node:add'; id: string; entity: FlowNode<TData>['entity']; position: Position; size?: Size; parentId?: string | null }
	| { type: 'node:update'; id: string; entity?: Partial<FlowNode<TData>['entity']>; size?: Size }
	| { type: 'node:move'; id: string; position: Position }
	| { type: 'node:delete'; id: string }
	| { type: 'edge:add'; id: string; sourceId: string; targetId: string; sourceHandle?: string; targetHandle?: string; entity?: FlowEdge['entity'] }
	| { type: 'edge:delete'; id: string };

export interface ViewState {
	zoom: number;
	scrollLeft: number;
	scrollTop: number;
	direction: Direction;
	edgeStyle: EdgeStyle;
}

export interface IsValidConnectionArgs {
	sourceId: string;
	targetId: string;
	sourceHandle: string;
	targetHandle: string;
	sourceType: string;
	targetType: string;
}

export type IsValidConnection = (args: IsValidConnectionArgs) => boolean;

export interface FlowCanvasApi<TData = unknown> {
	getFlows(): Flows<TData>;
	setFlows(flows: Flows<TData>): void;
	redraw(): void;
	undo(): void;
	redo(): void;
	canUndo(): boolean;
	canRedo(): boolean;
	autoArrange(): void;
	setDirection(dir: Direction): void;
	setEdgeStyle(style: EdgeStyle): void;
	setTheme(theme: Theme): void;
	setSnapToGrid(on: boolean, size?: number): void;
	setToolbarCompact(on: boolean): void;
	fitView(padding?: number): void;
	setZoom(level: number): void;
	getView(): ViewState;
	setView(view: Partial<ViewState>): void;
	toggleFullscreen(target?: HTMLElement): void;
	getSelectedIds(): string[];
	selectNode(id: string): void;
	clearSelection(): void;
	focusNode(id: string): void;
	exportPng(): Promise<Blob>;
}
