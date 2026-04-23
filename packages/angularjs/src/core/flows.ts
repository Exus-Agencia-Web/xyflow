import type {
	Flows,
	FlowNode,
	FlowEdge,
	FlowChange,
	NodeTypeDef,
	Position,
	Size
} from './types';

let idCounter = 0;

export function generateId(prefix = 'n'): string {
	idCounter += 1;
	return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function createFlows<T = unknown>(): Flows<T> {
	return {
		nodes: new Map(),
		edges: new Map(),
		roots: []
	};
}

export function createNode<T = unknown>(
	typeDef: NodeTypeDef<T>,
	init?: { id?: string; position?: Position; size?: Size }
): FlowNode<T> {
	const entity = typeDef.createEntity();
	return {
		id: init?.id || generateId('node'),
		entity: entity as FlowNode<T>['entity'],
		position: init?.position ? { ...init.position } : { x: 0, y: 0 },
		size: init?.size ? { ...init.size } : typeDef.defaultSize || { w: 240, h: 88 }
	};
}

export function createEdge(
	source: string,
	target: string,
	init?: { id?: string; sourceHandle?: string; targetHandle?: string; label?: string }
): FlowEdge {
	return {
		id: init?.id || generateId('edge'),
		source,
		target,
		sourceHandle: init?.sourceHandle,
		targetHandle: init?.targetHandle,
		label: init?.label,
		entity: { type: 'default' }
	};
}

/**
 * Apply a FlowChange[] batch to a flows instance — mutative for perf.
 * Returns true if anything structural changed.
 */
export function applyChanges<T = unknown>(
	flows: Flows<T>,
	changes: FlowChange<T>[]
): boolean {
	let structural = false;
	for (const ch of changes) {
		switch (ch.type) {
			case 'node:add': {
				const n: FlowNode<T> = {
					id: ch.id,
					entity: ch.entity as FlowNode<T>['entity'],
					position: ch.position,
					size: ch.size || { w: 240, h: 88 }
				};
				flows.nodes.set(n.id, n);
				if (!ch.parentId) flows.roots.push(n.id);
				structural = true;
				break;
			}
			case 'node:update': {
				const n = flows.nodes.get(ch.id);
				if (!n) break;
				if (ch.entity) n.entity = { ...n.entity, ...ch.entity } as FlowNode<T>['entity'];
				if (ch.size) n.size = { ...ch.size };
				break;
			}
			case 'node:move': {
				const n = flows.nodes.get(ch.id);
				if (n) n.position = { ...ch.position };
				break;
			}
			case 'node:delete': {
				flows.nodes.delete(ch.id);
				flows.roots = flows.roots.filter((id) => id !== ch.id);
				for (const [eid, e] of flows.edges) {
					if (e.source === ch.id || e.target === ch.id) flows.edges.delete(eid);
				}
				structural = true;
				break;
			}
			case 'edge:add': {
				flows.edges.set(ch.id, {
					id: ch.id,
					source: ch.sourceId,
					target: ch.targetId,
					sourceHandle: ch.sourceHandle,
					targetHandle: ch.targetHandle,
					entity: ch.entity
				});
				structural = true;
				break;
			}
			case 'edge:delete': {
				flows.edges.delete(ch.id);
				structural = true;
				break;
			}
		}
	}
	return structural;
}

export function cloneFlows<T = unknown>(flows: Flows<T>): Flows<T> {
	const out = createFlows<T>();
	flows.nodes.forEach((n, id) => out.nodes.set(id, {
		...n,
		entity: { ...n.entity, data: n.entity.data },
		position: { ...n.position },
		size: { ...n.size }
	}));
	flows.edges.forEach((e, id) => out.edges.set(id, { ...e }));
	out.roots = [...flows.roots];
	return out;
}
