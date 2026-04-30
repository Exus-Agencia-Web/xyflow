import type { Flows, FlowNode, Direction } from './types';

/**
 * Reingold-Tilford tidy tree layout — simplified for sparse DAGs used in
 * workflow editors. Treats each root + forward edges as a tree; back-edges
 * (joins) are ignored during positioning and remain as decorative crossings.
 *
 * Positions are mutated in place on flows.nodes[*].position.
 */
/**
 * Rank determinístico para sourceHandle. xyflow renderiza handles distribuídos
 * uniformemente con `spreadStyle(total, i, position)`: el handle declarado en
 * el índice 0 cae a la izquierda (cuando outputPos='bottom'). Por tanto el
 * autoLayout debe colocar a los hijos en el mismo orden visual del handle de
 * origen, no en el orden en que el usuario hizo drag.
 *
 * Reglas: yes-out=0, no-out=1, main-out=0, otros = char code primera letra.
 * Si dos hijos comparten rank, se respeta el orden de inserción (sort estable).
 */
function handleRank(h?: string): number {
	if (!h) return 0;
	if (h === 'yes-out') return 0;
	if (h === 'no-out') return 1;
	if (h === 'main-out') return 0;
	// Generic '${type}-out': usar el char code de la primera letra del type.
	return h.charCodeAt(0);
}

export function autoLayout<T>(flows: Flows<T>, direction: Direction = 'vertical', gap = 40): void {
	if (flows.roots.length === 0) return;

	type ChildEntry = { target: string; rank: number };
	const childrenMeta = new Map<string, ChildEntry[]>();
	for (const e of flows.edges.values()) {
		const arr = childrenMeta.get(e.source) || [];
		arr.push({ target: e.target, rank: handleRank(e.sourceHandle) });
		childrenMeta.set(e.source, arr);
	}
	const children = new Map<string, string[]>();
	for (const [src, arr] of childrenMeta) {
		arr.sort((a, b) => a.rank - b.rank);
		children.set(src, arr.map((x) => x.target));
	}

	const visited = new Set<string>();
	let x = 0;

	for (const rootId of flows.roots) {
		if (visited.has(rootId)) continue;
		layoutSubtree(rootId, 0, x, children, flows.nodes, visited, direction, gap);
		const tree = subtreeWidth(rootId, children, flows.nodes, visited, direction);
		x += tree + gap;
	}
}

function subtreeWidth<T>(
	id: string,
	children: Map<string, string[]>,
	nodes: Map<string, FlowNode<T>>,
	seen: Set<string>,
	direction: Direction
): number {
	const node = nodes.get(id);
	if (!node) return 0;
	const self = direction === 'vertical' ? node.size.w : node.size.h;
	const kids = children.get(id) || [];
	if (kids.length === 0) return self;
	let sum = 0;
	for (const kid of kids) {
		if (seen.has(kid)) continue;
		sum += subtreeWidth(kid, children, nodes, seen, direction);
	}
	return Math.max(self, sum);
}

function layoutSubtree<T>(
	id: string,
	depth: number,
	offset: number,
	children: Map<string, string[]>,
	nodes: Map<string, FlowNode<T>>,
	seen: Set<string>,
	direction: Direction,
	gap: number
): number {
	if (seen.has(id)) return 0;
	seen.add(id);
	const node = nodes.get(id);
	if (!node) return 0;

	const kids = children.get(id) || [];
	let childOffset = offset;
	const kidSizes: number[] = [];
	for (const kid of kids) {
		const size = layoutSubtree(kid, depth + 1, childOffset, children, nodes, seen, direction, gap);
		kidSizes.push(size);
		childOffset += size + gap;
	}

	const selfSize = direction === 'vertical' ? node.size.w : node.size.h;
	const childrenSpan = kidSizes.reduce((s, v) => s + v, 0) + Math.max(0, kids.length - 1) * gap;
	const span = Math.max(selfSize, childrenSpan);

	const selfOffset = offset + span / 2 - selfSize / 2;
	const depthPx = depth * ((direction === 'vertical' ? node.size.h : node.size.w) + gap * 2);

	if (direction === 'vertical') {
		node.position = { x: selfOffset, y: depthPx };
	} else {
		node.position = { x: depthPx, y: selfOffset };
	}

	return span;
}
