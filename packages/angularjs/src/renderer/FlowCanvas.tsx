/**
 * React renderer — TODO(Copilot): implement per the spec in packages/angularjs/README.md.
 *
 * Responsibilities:
 *  - Mount @xyflow/react <ReactFlow> with nodeTypes + edgeTypes derived from
 *    props.nodeTypeCatalog (maps each type to our generic NodeCard renderer).
 *  - Translate Flows -> ReactFlow nodes/edges and back (via onNodesChange/onEdgesChange).
 *  - Emit consumer-facing FlowChange[] batches via onChange (debounced 100ms).
 *  - Render SidebarPalette (draggable type chips), MiniMap, Controls, Background.
 *  - Handle:
 *      - dblclick -> onEdit(node)
 *      - drop from palette -> node:add change
 *      - drop from node output into empty canvas -> onDropEmpty(args)
 *      - invalid connection hover -> red ghost line
 *  - Expose an imperative handle (forwardRef) matching FlowCanvasApi shape.
 *  - Respect direction (vertical/horizontal) + edge style (bezier/smoothstep).
 *  - Snap-to-grid configurable.
 */

import * as React from 'react';
import type { Flows, NodeTypeDef, FlowChange, IsValidConnection, Direction, EdgeStyle } from '../core';

export interface FlowCanvasProps<TData = unknown> {
	flows: Flows<TData>;
	nodeTypes: NodeTypeDef<TData>[];
	direction?: Direction;
	edgeStyle?: EdgeStyle;
	theme?: 'light' | 'dark';
	snapToGrid?: boolean;
	gridSize?: number;
	readOnly?: boolean;
	onChange?: (changes: FlowChange<TData>[]) => void;
	onSelect?: (id: string | null) => void;
	onEdit?: (id: string) => void;
	onDropEmpty?: (args: { sourceId: string; x: number; y: number; type?: string }) => void;
	isValidConnection?: IsValidConnection;
	onReady?: (api: unknown) => void;
}

export function FlowCanvas<TData = unknown>(_props: FlowCanvasProps<TData>): React.ReactElement {
	// TODO: delegate to @xyflow/react <ReactFlow>.
	return (
		<div className="flow-canvas-root">
			<div style={{ padding: 24, color: 'var(--fc-muted)' }}>
				FlowCanvas renderer stub — implement per README.md § "React renderer".
			</div>
		</div>
	);
}
