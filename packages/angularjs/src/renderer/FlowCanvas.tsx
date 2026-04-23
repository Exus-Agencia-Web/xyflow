/**
 * React renderer for @xyflow/angularjs.
 * Wraps @xyflow/react with catalog-driven node rendering, palette, and imperative API.
 */

import * as React from 'react';
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	Panel,
	useReactFlow,
	useNodesState,
	useEdgesState,
	Position,
	Handle,
	type Node,
	type Edge,
	type NodeProps,
	type OnConnect,
	type OnNodesChange,
	type OnEdgesChange,
	type Connection,
	BezierEdge,
	SmoothStepEdge,
	type EdgeProps,
	BackgroundVariant,
	ConnectionLineType,
	ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type {
	Flows,
	FlowNode,
	NodeTypeDef,
	FlowChange,
	FlowCanvasApi,
	IsValidConnection,
	IsValidConnectionArgs,
	Direction,
	EdgeStyle,
	ViewState
} from '../core';
import { generateId, cloneFlows, autoLayout } from '../core';

/* ─────────────────────────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────────────────────────── */

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
	onReady?: (api: FlowCanvasApi<TData>) => void;
}

interface NodeCardData<TData = unknown> {
	label: string;
	icon?: string;
	color?: string;
	summary?: string;
	typeDef: NodeTypeDef<TData>;
	flowNode: FlowNode<TData>;
	isSticky?: boolean;
	stickyContent?: string;
	stickyColor?: string;
	direction?: Direction;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Conversion helpers
   ───────────────────────────────────────────────────────────────────────────── */

function flowsToReactFlow<TData>(
	flows: Flows<TData>,
	nodeTypeDefs: NodeTypeDef<TData>[],
	_direction: Direction
): { nodes: Node<NodeCardData<TData>>[]; edges: Edge[] } {
	const typeMap = new Map(nodeTypeDefs.map(t => [t.type, t]));
	const nodes: Node<NodeCardData<TData>>[] = [];
	const edges: Edge[] = [];

	flows.nodes.forEach((fn) => {
		const typeDef = typeMap.get(fn.entity.type);
		const summary = typeDef?.renderSummary?.(fn) ?? '';
		nodes.push({
			id: fn.id,
			type: typeDef?.isSticky ? 'stickyNode' : 'nodeCard',
			position: { x: fn.position.x, y: fn.position.y },
			data: {
				label: typeDef?.label ?? fn.entity.type,
				icon: typeDef?.icon,
				color: typeDef?.color ?? '#64748b',
				summary,
				typeDef: typeDef as NodeTypeDef<TData>,
				flowNode: fn,
				isSticky: typeDef?.isSticky,
				stickyContent: (fn.entity.data as Record<string, unknown>)?.content as string,
				stickyColor: (fn.entity.data as Record<string, unknown>)?.color as string
			},
			width: fn.size.w,
			height: fn.size.h,
			selected: fn.selected,
			draggable: !typeDef?.locked,
			selectable: !typeDef?.locked
		});
	});

	flows.edges.forEach((fe) => {
		edges.push({
			id: fe.id,
			source: fe.source,
			target: fe.target,
			sourceHandle: fe.sourceHandle ?? 'main-out',
			targetHandle: fe.targetHandle ?? 'main-in',
			label: fe.label,
			type: 'default'
		});
	});

	return { nodes, edges };
}

/* ─────────────────────────────────────────────────────────────────────────────
   NodeCard component
   ───────────────────────────────────────────────────────────────────────────── */

function NodeCard<TData>({ data, selected }: NodeProps<Node<NodeCardData<TData>>>): React.ReactElement {
	const { typeDef, label, icon, color, summary, direction } = data;
	const inputs = typeDef?.inputs ?? [{ type: 'main' }];
	const outputs = typeDef?.outputs ?? [{ type: 'main' }];
	const isHorizontal = direction === 'horizontal';

	return (
		<div
			className={`fc-node-card${selected ? ' fc-selected' : ''}`}
			style={{ '--fc-node-color': color } as React.CSSProperties}
		>
			{/* Input handles */}
			{inputs.map((inp: { type: string; label?: string }, i: number) => (
				<Handle
					key={`in-${inp.type}-${i}`}
					type="target"
					position={isHorizontal ? Position.Left : Position.Top}
					id={`${inp.type}-in`}
					className="fc-handle fc-handle-in"
					style={inputs.length > 1 ? { top: `${((i + 1) / (inputs.length + 1)) * 100}%` } : undefined}
				/>
			))}

			{/* Node content */}
			<div className="fc-node-header">
				{icon && (
					<span
						className="fc-node-icon"
						dangerouslySetInnerHTML={{ __html: icon }}
					/>
				)}
				<span className="fc-node-label">{label}</span>
			</div>
			{summary && <div className="fc-node-summary">{summary}</div>}

			{/* Output handles */}
			{outputs.map((out: { type: string; label?: string }, i: number) => (
				<Handle
					key={`out-${out.type}-${i}`}
					type="source"
					position={isHorizontal ? Position.Right : Position.Bottom}
					id={`${out.type}-out`}
					className="fc-handle fc-handle-out"
					style={outputs.length > 1 ? { top: `${((i + 1) / (outputs.length + 1)) * 100}%` } : undefined}
				>
					{outputs.length > 1 && out.label && (
						<span className="fc-handle-label">{out.label}</span>
					)}
				</Handle>
			))}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   StickyNode component
   ───────────────────────────────────────────────────────────────────────────── */

function StickyNode<TData>({ data, selected }: NodeProps<Node<NodeCardData<TData>>>): React.ReactElement {
	const { stickyContent, stickyColor } = data;
	const [content, setContent] = React.useState(stickyContent ?? '');
	const [color, setColor] = React.useState(stickyColor ?? '#fef08a');
	const inputRef = React.useRef<HTMLDivElement>(null);

	return (
		<div
			className={`fc-sticky${selected ? ' fc-selected' : ''}`}
			style={{ backgroundColor: color }}
		>
			<Handle
				type="target"
				position={Position.Top}
				id="main-in"
				className="fc-handle fc-handle-in"
			/>
			<div
				ref={inputRef}
				className="fc-sticky-content"
				contentEditable
				suppressContentEditableWarning
				onBlur={(e) => setContent(e.currentTarget.textContent ?? '')}
			>
				{content}
			</div>
			<div className="fc-sticky-footer">
				<input
					type="color"
					value={color}
					onChange={(e) => setColor(e.target.value)}
					className="fc-sticky-color"
					title="Change color"
				/>
			</div>
			<Handle
				type="source"
				position={Position.Bottom}
				id="main-out"
				className="fc-handle fc-handle-out"
			/>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Palette component
   ───────────────────────────────────────────────────────────────────────────── */

interface PaletteProps<TData> {
	nodeTypes: NodeTypeDef<TData>[];
	onDragStart: (typeDef: NodeTypeDef<TData>) => void;
}

function Palette<TData>({ nodeTypes, onDragStart }: PaletteProps<TData>): React.ReactElement {
	const draggableTypes = nodeTypes.filter(t => !t.isInitial);

	return (
		<div className="fc-palette">
			<div className="fc-palette-title">Components</div>
			<div className="fc-palette-list">
				{draggableTypes.map((typeDef) => (
					<div
						key={typeDef.type}
						className="fc-palette-item"
						draggable
						onDragStart={(e) => {
							e.dataTransfer.setData('application/x-flow-type', typeDef.type);
							e.dataTransfer.effectAllowed = 'copy';
							onDragStart(typeDef);
						}}
						style={{ '--fc-node-color': typeDef.color } as React.CSSProperties}
					>
						{typeDef.icon && (
							<span
								className="fc-palette-icon"
								dangerouslySetInnerHTML={{ __html: typeDef.icon }}
							/>
						)}
						<span className="fc-palette-label">{typeDef.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Custom Edge with label support
   ───────────────────────────────────────────────────────────────────────────── */

function LabeledEdge(props: EdgeProps): React.ReactNode {
	const { sourceX, sourceY, targetX, targetY, label, style, markerEnd } = props;
	const edgePath = `M${sourceX},${sourceY} C${sourceX + 50},${sourceY} ${targetX - 50},${targetY} ${targetX},${targetY}`;
	const midX = (sourceX + targetX) / 2;
	const midY = (sourceY + targetY) / 2;

	return (
		<>
			<path
				className="react-flow__edge-path"
				d={edgePath}
				style={style}
				markerEnd={markerEnd}
			/>
			{label && (
				<text
					x={midX}
					y={midY - 8}
					className="fc-edge-label"
					textAnchor="middle"
				>
					{label as string}
				</text>
			)}
		</>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Inner Flow component (with access to useReactFlow)
   ───────────────────────────────────────────────────────────────────────────── */

interface InnerFlowProps<TData> extends FlowCanvasProps<TData> {
	apiRef: React.MutableRefObject<FlowCanvasApi<TData> | null>;
}

function InnerFlow<TData>(props: InnerFlowProps<TData>): React.ReactElement {
	const {
		flows,
		nodeTypes: nodeTypeDefs,
		direction = 'horizontal',
		edgeStyle = 'bezier',
		theme = 'light',
		snapToGrid = false,
		gridSize = 20,
		readOnly = false,
		onChange,
		onSelect,
		onEdit,
		onDropEmpty,
		isValidConnection: isValidConnectionProp,
		onReady,
		apiRef
	} = props;

	const reactFlow = useReactFlow();
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Convert flows to ReactFlow format
	const { nodes: initialNodes, edges: initialEdges } = React.useMemo(
		() => flowsToReactFlow(flows, nodeTypeDefs, direction),
		[flows, nodeTypeDefs, direction]
	);

	const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

	// History for undo/redo
	const historyRef = React.useRef<Flows<TData>[]>([cloneFlows(flows)]);
	const historyIndexRef = React.useRef(0);
	const pendingChangesRef = React.useRef<FlowChange<TData>[]>([]);
	const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	// Dragging state
	const draggingTypeRef = React.useRef<NodeTypeDef<TData> | null>(null);
	const connectingRef = React.useRef<{ sourceId: string; sourceHandle: string } | null>(null);

	// Sync when flows prop changes
	React.useEffect(() => {
		const { nodes: n, edges: e } = flowsToReactFlow(flows, nodeTypeDefs, direction);
		setNodes(n);
		setEdges(e);
	}, [flows, nodeTypeDefs, direction, setNodes, setEdges]);

	// Debounced change emission
	const emitChanges = React.useCallback((changes: FlowChange<TData>[]) => {
		pendingChangesRef.current.push(...changes);
		if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
		debounceTimerRef.current = setTimeout(() => {
			if (pendingChangesRef.current.length > 0 && onChange) {
				onChange([...pendingChangesRef.current]);
				pendingChangesRef.current = [];
			}
		}, 100);
	}, [onChange]);

	// Push to history
	const pushHistory = React.useCallback(() => {
		const snapshot = cloneFlows(flows);
		historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
		historyRef.current.push(snapshot);
		historyIndexRef.current = historyRef.current.length - 1;
	}, [flows]);

	// Handle node changes
	const handleNodesChange: OnNodesChange<Node<NodeCardData<TData>>> = React.useCallback((nodeChanges) => {
		if (readOnly) return;
		onNodesChangeInternal(nodeChanges);

		const flowChanges: FlowChange<TData>[] = [];
		for (const nc of nodeChanges) {
			if (nc.type === 'position' && nc.position) {
				flowChanges.push({
					type: 'node:move',
					id: nc.id,
					position: { x: nc.position.x, y: nc.position.y }
				});
			} else if (nc.type === 'remove') {
				flowChanges.push({ type: 'node:delete', id: nc.id });
			} else if (nc.type === 'select') {
				if (nc.selected && onSelect) onSelect(nc.id);
			}
		}
		if (flowChanges.length > 0) {
			emitChanges(flowChanges);
			pushHistory();
		}
	}, [readOnly, onNodesChangeInternal, emitChanges, pushHistory, onSelect]);

	// Handle edge changes
	const handleEdgesChange: OnEdgesChange<Edge> = React.useCallback((edgeChanges) => {
		if (readOnly) return;
		onEdgesChangeInternal(edgeChanges);

		const flowChanges: FlowChange<TData>[] = [];
		for (const ec of edgeChanges) {
			if (ec.type === 'remove') {
				flowChanges.push({ type: 'edge:delete', id: ec.id });
			}
		}
		if (flowChanges.length > 0) {
			emitChanges(flowChanges);
			pushHistory();
		}
	}, [readOnly, onEdgesChangeInternal, emitChanges, pushHistory]);

	// Handle new connections
	const handleConnect: OnConnect = React.useCallback((connection: Connection) => {
		if (readOnly || !connection.source || !connection.target) return;
		const edgeId = generateId('edge');
		const change: FlowChange<TData> = {
			type: 'edge:add',
			id: edgeId,
			sourceId: connection.source,
			targetId: connection.target,
			sourceHandle: connection.sourceHandle ?? undefined,
			targetHandle: connection.targetHandle ?? undefined
		};
		emitChanges([change]);
		pushHistory();
	}, [readOnly, emitChanges, pushHistory]);

	// Connection validation - using Edge | Connection to match xyflow's IsValidConnection type
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleIsValidConnection = React.useCallback((connection: Edge | Connection): boolean => {
		if (!isValidConnectionProp) return true;
		const conn = connection as Connection;
		const sourceNode = flows.nodes.get(conn.source ?? '');
		const targetNode = flows.nodes.get(conn.target ?? '');
		if (!sourceNode || !targetNode) return false;

		const args: IsValidConnectionArgs = {
			sourceId: conn.source ?? '',
			targetId: conn.target ?? '',
			sourceHandle: conn.sourceHandle ?? 'main-out',
			targetHandle: conn.targetHandle ?? 'main-in',
			sourceType: sourceNode.entity.type,
			targetType: targetNode.entity.type
		};
		return isValidConnectionProp(args);
	}, [isValidConnectionProp, flows]);

	// Handle connect start (for onDropEmpty)
	const handleConnectStart = React.useCallback((_event: React.MouseEvent | React.TouchEvent, params: { nodeId: string | null; handleId: string | null }) => {
		if (params.nodeId && params.handleId) {
			connectingRef.current = { sourceId: params.nodeId, sourceHandle: params.handleId };
		}
	}, []);

	// Handle connect end (drop on empty)
	const handleConnectEnd = React.useCallback((event: MouseEvent | TouchEvent) => {
		if (!connectingRef.current || !onDropEmpty) return;

		const target = event.target as HTMLElement;
		// Check if dropped on empty canvas (not on a node or handle)
		if (target.classList.contains('react-flow__pane')) {
			const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
			const position = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });
			onDropEmpty({
				sourceId: connectingRef.current.sourceId,
				x: position.x,
				y: position.y
			});
		}
		connectingRef.current = null;
	}, [onDropEmpty, reactFlow]);

	// Handle drop from palette
	const handleDrop = React.useCallback((event: React.DragEvent) => {
		event.preventDefault();
		const type = event.dataTransfer.getData('application/x-flow-type');
		const typeDef = nodeTypeDefs.find(t => t.type === type);
		if (!typeDef || readOnly) return;

		const position = reactFlow.screenToFlowPosition({
			x: event.clientX,
			y: event.clientY
		});

		const entity = typeDef.createEntity();
		const nodeId = generateId('node');
		const change: FlowChange<TData> = {
			type: 'node:add',
			id: nodeId,
			entity: entity as FlowNode<TData>['entity'],
			position: { x: position.x, y: position.y },
			size: typeDef.defaultSize ?? { w: 240, h: 88 }
		};
		emitChanges([change]);
		pushHistory();
	}, [nodeTypeDefs, readOnly, reactFlow, emitChanges, pushHistory]);

	const handleDragOver = React.useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
	}, []);

	// Handle double-click on node
	const handleNodeDoubleClick = React.useCallback((_event: React.MouseEvent, node: Node<NodeCardData<TData>>) => {
		if (onEdit) onEdit(node.id);
	}, [onEdit]);

	// Handle click for selection
	const handleNodeClick = React.useCallback((_event: React.MouseEvent, node: Node<NodeCardData<TData>>) => {
		if (onSelect) onSelect(node.id);
	}, [onSelect]);

	// Handle pane click (clear selection)
	const handlePaneClick = React.useCallback(() => {
		if (onSelect) onSelect(null);
	}, [onSelect]);

	// Keyboard shortcuts
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (readOnly) return;
			if (e.key === 'Delete' || e.key === 'Backspace') {
				const selectedNodes = nodes.filter((n: Node<NodeCardData<TData>>) => n.selected);
				if (selectedNodes.length > 0) {
					const changes: FlowChange<TData>[] = selectedNodes.map((n: Node<NodeCardData<TData>>) => ({
						type: 'node:delete' as const,
						id: n.id
					}));
					emitChanges(changes);
					pushHistory();
				}
			}
			if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
				e.preventDefault();
				apiRef.current?.undo();
			}
			if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
				e.preventDefault();
				apiRef.current?.redo();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [readOnly, nodes, emitChanges, pushHistory, apiRef]);

	// Build imperative API
	const api: FlowCanvasApi<TData> = React.useMemo(() => ({
		getFlows: () => flows,
		setFlows: () => { /* Handled by parent via prop change */ },
		redraw: () => {
			const { nodes: n, edges: e } = flowsToReactFlow(flows, nodeTypeDefs, direction);
			setNodes(n);
			setEdges(e);
		},
		undo: () => {
			if (historyIndexRef.current > 0) {
				historyIndexRef.current--;
				const snapshot = historyRef.current[historyIndexRef.current];
				if (snapshot && onChange) {
					// Reconstruct changes to restore snapshot
					const { nodes: n, edges: e } = flowsToReactFlow(snapshot, nodeTypeDefs, direction);
					setNodes(n);
					setEdges(e);
				}
			}
		},
		redo: () => {
			if (historyIndexRef.current < historyRef.current.length - 1) {
				historyIndexRef.current++;
				const snapshot = historyRef.current[historyIndexRef.current];
				if (snapshot) {
					const { nodes: n, edges: e } = flowsToReactFlow(snapshot, nodeTypeDefs, direction);
					setNodes(n);
					setEdges(e);
				}
			}
		},
		canUndo: () => historyIndexRef.current > 0,
		canRedo: () => historyIndexRef.current < historyRef.current.length - 1,
		autoArrange: () => {
			const clone = cloneFlows(flows);
			autoLayout(clone, direction);
			const changes: FlowChange<TData>[] = [];
			clone.nodes.forEach((n, id) => {
				const orig = flows.nodes.get(id);
				if (orig && (orig.position.x !== n.position.x || orig.position.y !== n.position.y)) {
					changes.push({ type: 'node:move', id, position: n.position });
				}
			});
			if (changes.length > 0) {
				emitChanges(changes);
				pushHistory();
			}
			setTimeout(() => reactFlow.fitView({ padding: 0.2 }), 50);
		},
		setDirection: () => { /* Handled via prop */ },
		setEdgeStyle: () => { /* Handled via prop */ },
		setTheme: () => { /* Handled via prop */ },
		setSnapToGrid: () => { /* Handled via prop */ },
		setToolbarCompact: () => { /* Not implemented */ },
		fitView: (padding = 0.1) => reactFlow.fitView({ padding }),
		setZoom: (level) => reactFlow.zoomTo(level),
		getView: (): ViewState => {
			const vp = reactFlow.getViewport();
			return {
				zoom: vp.zoom,
				scrollLeft: vp.x,
				scrollTop: vp.y,
				direction,
				edgeStyle
			};
		},
		setView: (view) => {
			if (view.zoom !== undefined || view.scrollLeft !== undefined || view.scrollTop !== undefined) {
				const vp = reactFlow.getViewport();
				reactFlow.setViewport({
					zoom: view.zoom ?? vp.zoom,
					x: view.scrollLeft ?? vp.x,
					y: view.scrollTop ?? vp.y
				});
			}
		},
		toggleFullscreen: (target) => {
			const el = target ?? containerRef.current;
			if (!el) return;
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				el.requestFullscreen();
			}
		},
		getSelectedIds: () => nodes.filter((n: Node<NodeCardData<TData>>) => n.selected).map((n: Node<NodeCardData<TData>>) => n.id),
		selectNode: (id) => {
			setNodes((ns: Node<NodeCardData<TData>>[]) => ns.map((n: Node<NodeCardData<TData>>) => ({ ...n, selected: n.id === id })));
			if (onSelect) onSelect(id);
		},
		clearSelection: () => {
			setNodes((ns: Node<NodeCardData<TData>>[]) => ns.map((n: Node<NodeCardData<TData>>) => ({ ...n, selected: false })));
			if (onSelect) onSelect(null);
		},
		focusNode: (id) => {
			const node = nodes.find((n: Node<NodeCardData<TData>>) => n.id === id);
			if (node) {
				reactFlow.setCenter(node.position.x, node.position.y, { zoom: 1, duration: 300 });
			}
		},
		exportPng: async () => {
			// Basic implementation using canvas
			const el = containerRef.current?.querySelector('.react-flow__viewport');
			if (!el) throw new Error('Viewport not found');
			// For production, use html-to-image or similar
			return new Blob(['PNG export not implemented'], { type: 'text/plain' });
		}
	}), [flows, nodeTypeDefs, direction, edgeStyle, nodes, reactFlow, emitChanges, pushHistory, setNodes, setEdges, onSelect, onChange]);

	// Update apiRef
	apiRef.current = api;

	// Notify onReady
	React.useEffect(() => {
		if (onReady) onReady(api);
	}, [api, onReady]);

	// Build node types for ReactFlow
	const reactNodeTypes = React.useMemo(() => ({
		nodeCard: NodeCard,
		stickyNode: StickyNode
	}), []);

	// Build edge types - use any to avoid type compatibility issues with xyflow
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const reactEdgeTypes = React.useMemo((): any => ({
		default: edgeStyle === 'smoothstep' ? SmoothStepEdge : BezierEdge,
		labeled: LabeledEdge
	}), [edgeStyle]);

	// Determine handle positions based on direction
	const connectionLineType = edgeStyle === 'smoothstep' ? ConnectionLineType.SmoothStep : ConnectionLineType.Bezier;

	return (
		<div
			ref={containerRef}
			className="flow-canvas-root"
			data-theme={theme}
			style={{ width: '100%', height: '100%' }}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={handleNodesChange}
				onEdgesChange={handleEdgesChange}
				onConnect={handleConnect}
				onConnectStart={handleConnectStart}
				onConnectEnd={handleConnectEnd}
				onNodeDoubleClick={handleNodeDoubleClick}
				onNodeClick={handleNodeClick}
				onPaneClick={handlePaneClick}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				nodeTypes={reactNodeTypes}
				edgeTypes={reactEdgeTypes}
				isValidConnection={handleIsValidConnection}
				snapToGrid={snapToGrid}
				snapGrid={[gridSize, gridSize]}
				connectionLineType={connectionLineType}
				fitView
				nodesDraggable={!readOnly}
				nodesConnectable={!readOnly}
				elementsSelectable={!readOnly}
				panOnDrag={true}
				zoomOnScroll={true}
				zoomOnPinch={true}
			>
				<Background variant={BackgroundVariant.Dots} gap={gridSize} color="var(--fc-grid-color)" />
				<Controls position="bottom-left" showInteractive={!readOnly} />
				<MiniMap
					position="bottom-right"
					pannable
					zoomable
					nodeColor={(n: Node) => ((n.data as unknown as NodeCardData<TData>)?.color) ?? '#64748b'}
				/>
				{!readOnly && (
					<Panel position="top-left">
						<Palette
							nodeTypes={nodeTypeDefs}
							onDragStart={(t) => { draggingTypeRef.current = t; }}
						/>
					</Panel>
				)}
			</ReactFlow>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main FlowCanvas component (wraps ReactFlowProvider)
   ───────────────────────────────────────────────────────────────────────────── */

export const FlowCanvas = React.forwardRef(function FlowCanvas<TData = unknown>(
	props: FlowCanvasProps<TData>,
	ref: React.Ref<FlowCanvasApi<TData>>
): React.ReactElement {
	const apiRef = React.useRef<FlowCanvasApi<TData> | null>(null);

	React.useImperativeHandle(ref, () => apiRef.current!, []);

	return (
		<ReactFlowProvider>
			<InnerFlow {...props} apiRef={apiRef} />
		</ReactFlowProvider>
	);
}) as <TData = unknown>(
	props: FlowCanvasProps<TData> & { ref?: React.Ref<FlowCanvasApi<TData>> }
) => React.ReactElement;
