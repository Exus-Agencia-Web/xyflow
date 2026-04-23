/**
 * Core module tests — applyChanges, autoLayout, createFlows, createNode, createEdge
 * Target: 80%+ coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	createFlows,
	createNode,
	createEdge,
	applyChanges,
	cloneFlows,
	generateId,
	autoLayout
} from '../src/core';
import type { Flows, FlowNode, FlowEdge, FlowChange, NodeTypeDef } from '../src/core';

/* ─────────────────────────────────────────────────────────────────────────────
   createFlows
   ───────────────────────────────────────────────────────────────────────────── */

describe('createFlows', () => {
	it('creates an empty Flows object', () => {
		const flows = createFlows();
		expect(flows.nodes).toBeInstanceOf(Map);
		expect(flows.edges).toBeInstanceOf(Map);
		expect(flows.roots).toEqual([]);
		expect(flows.nodes.size).toBe(0);
		expect(flows.edges.size).toBe(0);
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   generateId
   ───────────────────────────────────────────────────────────────────────────── */

describe('generateId', () => {
	it('generates unique IDs', () => {
		const id1 = generateId('test');
		const id2 = generateId('test');
		expect(id1).not.toBe(id2);
		expect(id1).toMatch(/^test_/);
		expect(id2).toMatch(/^test_/);
	});

	it('uses default prefix', () => {
		const id = generateId();
		expect(id).toMatch(/^n_/);
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   createNode
   ───────────────────────────────────────────────────────────────────────────── */

describe('createNode', () => {
	const emailTypeDef: NodeTypeDef<{ campaign: string | null }> = {
		type: 'email',
		label: 'Send email',
		color: '#6366f1',
		inputs: [{ type: 'main' }],
		outputs: [{ type: 'main' }],
		createEntity: () => ({ type: 'email', data: { campaign: null } })
	};

	it('creates a node with defaults', () => {
		const node = createNode(emailTypeDef);
		expect(node.id).toMatch(/^node_/);
		expect(node.entity.type).toBe('email');
		expect(node.entity.data).toEqual({ campaign: null });
		expect(node.position).toEqual({ x: 0, y: 0 });
		expect(node.size).toEqual({ w: 240, h: 88 });
	});

	it('accepts custom id, position, size', () => {
		const node = createNode(emailTypeDef, {
			id: 'custom-id',
			position: { x: 100, y: 200 },
			size: { w: 300, h: 150 }
		});
		expect(node.id).toBe('custom-id');
		expect(node.position).toEqual({ x: 100, y: 200 });
		expect(node.size).toEqual({ w: 300, h: 150 });
	});

	it('uses typeDef.defaultSize when available', () => {
		const typeWithSize: NodeTypeDef = {
			type: 'large',
			label: 'Large',
			defaultSize: { w: 400, h: 200 },
			createEntity: () => ({ type: 'large', data: {} })
		};
		const node = createNode(typeWithSize);
		expect(node.size).toEqual({ w: 400, h: 200 });
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   createEdge
   ───────────────────────────────────────────────────────────────────────────── */

describe('createEdge', () => {
	it('creates an edge with defaults', () => {
		const edge = createEdge('node1', 'node2');
		expect(edge.id).toMatch(/^edge_/);
		expect(edge.source).toBe('node1');
		expect(edge.target).toBe('node2');
		expect(edge.sourceHandle).toBeUndefined();
		expect(edge.targetHandle).toBeUndefined();
		expect(edge.entity).toEqual({ type: 'default' });
	});

	it('accepts custom id, handles, label', () => {
		const edge = createEdge('a', 'b', {
			id: 'custom-edge',
			sourceHandle: 'yes-out',
			targetHandle: 'main-in',
			label: 'Yes'
		});
		expect(edge.id).toBe('custom-edge');
		expect(edge.sourceHandle).toBe('yes-out');
		expect(edge.targetHandle).toBe('main-in');
		expect(edge.label).toBe('Yes');
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   applyChanges
   ───────────────────────────────────────────────────────────────────────────── */

describe('applyChanges', () => {
	let flows: Flows;

	beforeEach(() => {
		flows = createFlows();
	});

	describe('node:add', () => {
		it('adds a node to flows', () => {
			const changes: FlowChange[] = [{
				type: 'node:add',
				id: 'n1',
				entity: { type: 'email', data: {} },
				position: { x: 50, y: 100 }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(true);
			expect(flows.nodes.size).toBe(1);
			expect(flows.nodes.get('n1')).toMatchObject({
				id: 'n1',
				entity: { type: 'email', data: {} },
				position: { x: 50, y: 100 },
				size: { w: 240, h: 88 }
			});
			expect(flows.roots).toContain('n1');
		});

		it('adds node with custom size', () => {
			const changes: FlowChange[] = [{
				type: 'node:add',
				id: 'n2',
				entity: { type: 'sticky', data: {} },
				position: { x: 0, y: 0 },
				size: { w: 200, h: 150 }
			}];

			applyChanges(flows, changes);

			expect(flows.nodes.get('n2')?.size).toEqual({ w: 200, h: 150 });
		});

		it('does not add to roots when parentId is set', () => {
			const changes: FlowChange[] = [{
				type: 'node:add',
				id: 'child',
				entity: { type: 'email', data: {} },
				position: { x: 0, y: 0 },
				parentId: 'parent'
			}];

			applyChanges(flows, changes);

			expect(flows.nodes.has('child')).toBe(true);
			expect(flows.roots).not.toContain('child');
		});
	});

	describe('node:update', () => {
		beforeEach(() => {
			flows.nodes.set('n1', {
				id: 'n1',
				entity: { type: 'email', data: { campaign: 'old' } },
				position: { x: 0, y: 0 },
				size: { w: 240, h: 88 }
			});
		});

		it('updates entity partially', () => {
			const changes: FlowChange[] = [{
				type: 'node:update',
				id: 'n1',
				entity: { data: { campaign: 'new' } }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(false);
			expect(flows.nodes.get('n1')?.entity.data).toEqual({ campaign: 'new' });
		});

		it('updates size', () => {
			const changes: FlowChange[] = [{
				type: 'node:update',
				id: 'n1',
				size: { w: 300, h: 200 }
			}];

			applyChanges(flows, changes);

			expect(flows.nodes.get('n1')?.size).toEqual({ w: 300, h: 200 });
		});

		it('ignores update for non-existent node', () => {
			const changes: FlowChange[] = [{
				type: 'node:update',
				id: 'nonexistent',
				entity: { data: {} }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(false);
		});
	});

	describe('node:move', () => {
		beforeEach(() => {
			flows.nodes.set('n1', {
				id: 'n1',
				entity: { type: 'email', data: {} },
				position: { x: 0, y: 0 },
				size: { w: 240, h: 88 }
			});
		});

		it('updates node position', () => {
			const changes: FlowChange[] = [{
				type: 'node:move',
				id: 'n1',
				position: { x: 200, y: 300 }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(false);
			expect(flows.nodes.get('n1')?.position).toEqual({ x: 200, y: 300 });
		});

		it('ignores move for non-existent node', () => {
			const changes: FlowChange[] = [{
				type: 'node:move',
				id: 'nonexistent',
				position: { x: 100, y: 100 }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(false);
		});
	});

	describe('node:delete', () => {
		beforeEach(() => {
			flows.nodes.set('n1', {
				id: 'n1',
				entity: { type: 'start', data: {} },
				position: { x: 0, y: 0 },
				size: { w: 240, h: 88 }
			});
			flows.nodes.set('n2', {
				id: 'n2',
				entity: { type: 'email', data: {} },
				position: { x: 200, y: 0 },
				size: { w: 240, h: 88 }
			});
			flows.edges.set('e1', {
				id: 'e1',
				source: 'n1',
				target: 'n2'
			});
			flows.roots = ['n1'];
		});

		it('removes node and connected edges', () => {
			const changes: FlowChange[] = [{
				type: 'node:delete',
				id: 'n1'
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(true);
			expect(flows.nodes.has('n1')).toBe(false);
			expect(flows.edges.has('e1')).toBe(false);
			expect(flows.roots).not.toContain('n1');
		});

		it('removes node from roots', () => {
			flows.roots = ['n1', 'n2'];

			const changes: FlowChange[] = [{
				type: 'node:delete',
				id: 'n2'
			}];

			applyChanges(flows, changes);

			expect(flows.roots).toEqual(['n1']);
		});
	});

	describe('edge:add', () => {
		it('adds an edge', () => {
			const changes: FlowChange[] = [{
				type: 'edge:add',
				id: 'e1',
				sourceId: 'n1',
				targetId: 'n2',
				sourceHandle: 'yes-out',
				targetHandle: 'main-in',
				entity: { type: 'conditional' }
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(true);
			expect(flows.edges.size).toBe(1);
			expect(flows.edges.get('e1')).toMatchObject({
				id: 'e1',
				source: 'n1',
				target: 'n2',
				sourceHandle: 'yes-out',
				targetHandle: 'main-in',
				entity: { type: 'conditional' }
			});
		});
	});

	describe('edge:delete', () => {
		beforeEach(() => {
			flows.edges.set('e1', {
				id: 'e1',
				source: 'n1',
				target: 'n2'
			});
		});

		it('removes an edge', () => {
			const changes: FlowChange[] = [{
				type: 'edge:delete',
				id: 'e1'
			}];

			const structural = applyChanges(flows, changes);

			expect(structural).toBe(true);
			expect(flows.edges.has('e1')).toBe(false);
		});
	});

	describe('batch changes', () => {
		it('applies multiple changes in order', () => {
			const changes: FlowChange[] = [
				{ type: 'node:add', id: 'n1', entity: { type: 'a', data: {} }, position: { x: 0, y: 0 } },
				{ type: 'node:add', id: 'n2', entity: { type: 'b', data: {} }, position: { x: 100, y: 0 } },
				{ type: 'edge:add', id: 'e1', sourceId: 'n1', targetId: 'n2' },
				{ type: 'node:move', id: 'n1', position: { x: 50, y: 50 } }
			];

			applyChanges(flows, changes);

			expect(flows.nodes.size).toBe(2);
			expect(flows.edges.size).toBe(1);
			expect(flows.nodes.get('n1')?.position).toEqual({ x: 50, y: 50 });
		});
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   cloneFlows
   ───────────────────────────────────────────────────────────────────────────── */

describe('cloneFlows', () => {
	it('creates a deep copy', () => {
		const original = createFlows<{ value: number }>();
		original.nodes.set('n1', {
			id: 'n1',
			entity: { type: 'test', data: { value: 42 } },
			position: { x: 10, y: 20 },
			size: { w: 100, h: 50 }
		});
		original.edges.set('e1', {
			id: 'e1',
			source: 'n1',
			target: 'n2'
		});
		original.roots = ['n1'];

		const cloned = cloneFlows(original);

		// Verify it's a copy
		expect(cloned).not.toBe(original);
		expect(cloned.nodes).not.toBe(original.nodes);
		expect(cloned.edges).not.toBe(original.edges);
		expect(cloned.roots).not.toBe(original.roots);

		// Verify values are equal
		expect(cloned.nodes.get('n1')).toEqual(original.nodes.get('n1'));
		expect(cloned.edges.get('e1')).toEqual(original.edges.get('e1'));
		expect(cloned.roots).toEqual(original.roots);

		// Verify deep copy of nested objects
		const origNode = original.nodes.get('n1')!;
		const clonedNode = cloned.nodes.get('n1')!;
		expect(clonedNode.position).not.toBe(origNode.position);
		expect(clonedNode.size).not.toBe(origNode.size);
	});

	it('handles empty flows', () => {
		const original = createFlows();
		const cloned = cloneFlows(original);

		expect(cloned.nodes.size).toBe(0);
		expect(cloned.edges.size).toBe(0);
		expect(cloned.roots).toEqual([]);
	});
});

/* ─────────────────────────────────────────────────────────────────────────────
   autoLayout
   ───────────────────────────────────────────────────────────────────────────── */

describe('autoLayout', () => {
	it('does nothing for empty flows', () => {
		const flows = createFlows();
		autoLayout(flows, 'vertical');
		expect(flows.nodes.size).toBe(0);
	});

	it('positions single node at origin', () => {
		const flows = createFlows();
		flows.nodes.set('n1', {
			id: 'n1',
			entity: { type: 'start', data: {} },
			position: { x: 500, y: 500 },
			size: { w: 100, h: 50 }
		});
		flows.roots = ['n1'];

		autoLayout(flows, 'vertical');

		const node = flows.nodes.get('n1')!;
		expect(node.position.x).toBeGreaterThanOrEqual(0);
		expect(node.position.y).toBe(0);
	});

	it('layouts vertical tree correctly', () => {
		const flows = createFlows();
		flows.nodes.set('root', {
			id: 'root',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('child1', {
			id: 'child1',
			entity: { type: 'email', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('child2', {
			id: 'child2',
			entity: { type: 'wait', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.edges.set('e1', { id: 'e1', source: 'root', target: 'child1' });
		flows.edges.set('e2', { id: 'e2', source: 'root', target: 'child2' });
		flows.roots = ['root'];

		autoLayout(flows, 'vertical', 40);

		const root = flows.nodes.get('root')!;
		const child1 = flows.nodes.get('child1')!;
		const child2 = flows.nodes.get('child2')!;

		// Root should be at depth 0
		expect(root.position.y).toBe(0);
		// Children should be at depth 1
		expect(child1.position.y).toBeGreaterThan(0);
		expect(child2.position.y).toBeGreaterThan(0);
		expect(child1.position.y).toBe(child2.position.y);
	});

	it('layouts horizontal tree correctly', () => {
		const flows = createFlows();
		flows.nodes.set('root', {
			id: 'root',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('child', {
			id: 'child',
			entity: { type: 'email', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.edges.set('e1', { id: 'e1', source: 'root', target: 'child' });
		flows.roots = ['root'];

		autoLayout(flows, 'horizontal', 40);

		const root = flows.nodes.get('root')!;
		const child = flows.nodes.get('child')!;

		// In horizontal layout, x increases with depth
		expect(root.position.x).toBe(0);
		expect(child.position.x).toBeGreaterThan(0);
	});

	it('handles DAG with joins (multiple parents)', () => {
		const flows = createFlows();
		flows.nodes.set('root', {
			id: 'root',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('branch1', {
			id: 'branch1',
			entity: { type: 'if', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('branch2', {
			id: 'branch2',
			entity: { type: 'if', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('join', {
			id: 'join',
			entity: { type: 'end', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.edges.set('e1', { id: 'e1', source: 'root', target: 'branch1' });
		flows.edges.set('e2', { id: 'e2', source: 'root', target: 'branch2' });
		flows.edges.set('e3', { id: 'e3', source: 'branch1', target: 'join' });
		flows.edges.set('e4', { id: 'e4', source: 'branch2', target: 'join' });
		flows.roots = ['root'];

		// Should not throw
		expect(() => autoLayout(flows, 'vertical')).not.toThrow();

		// All nodes should have been positioned
		flows.nodes.forEach(node => {
			expect(typeof node.position.x).toBe('number');
			expect(typeof node.position.y).toBe('number');
		});
	});

	it('handles orphan nodes (no incoming edges from roots)', () => {
		const flows = createFlows();
		flows.nodes.set('root', {
			id: 'root',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('orphan', {
			id: 'orphan',
			entity: { type: 'sticky', data: {} },
			position: { x: 500, y: 500 },
			size: { w: 100, h: 50 }
		});
		flows.roots = ['root'];

		autoLayout(flows, 'vertical');

		// Root should be positioned
		expect(flows.nodes.get('root')!.position.y).toBe(0);
		// Orphan position depends on implementation — just verify it still exists
		expect(flows.nodes.has('orphan')).toBe(true);
	});

	it('handles multiple root trees', () => {
		const flows = createFlows();
		flows.nodes.set('root1', {
			id: 'root1',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('child1', {
			id: 'child1',
			entity: { type: 'email', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('root2', {
			id: 'root2',
			entity: { type: 'start', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.edges.set('e1', { id: 'e1', source: 'root1', target: 'child1' });
		flows.roots = ['root1', 'root2'];

		autoLayout(flows, 'vertical', 40);

		const root1 = flows.nodes.get('root1')!;
		const root2 = flows.nodes.get('root2')!;

		// Both roots should be at depth 0
		expect(root1.position.y).toBe(0);
		expect(root2.position.y).toBe(0);
		// They should be horizontally separated
		expect(root1.position.x).not.toBe(root2.position.x);
	});

	it('handles cycle gracefully (visited nodes skipped)', () => {
		const flows = createFlows();
		flows.nodes.set('a', {
			id: 'a',
			entity: { type: 'node', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		flows.nodes.set('b', {
			id: 'b',
			entity: { type: 'node', data: {} },
			position: { x: 0, y: 0 },
			size: { w: 100, h: 50 }
		});
		// Create cycle: a -> b -> a
		flows.edges.set('e1', { id: 'e1', source: 'a', target: 'b' });
		flows.edges.set('e2', { id: 'e2', source: 'b', target: 'a' });
		flows.roots = ['a'];

		// Should not throw or infinite loop
		expect(() => autoLayout(flows, 'vertical')).not.toThrow();

		// Both nodes should be positioned
		expect(flows.nodes.get('a')!.position).toBeDefined();
		expect(flows.nodes.get('b')!.position).toBeDefined();
	});

	it('deep tree positions nodes at increasing depths', () => {
		const flows = createFlows();
		const nodeIds = ['n1', 'n2', 'n3', 'n4', 'n5'];

		nodeIds.forEach((id, i) => {
			flows.nodes.set(id, {
				id,
				entity: { type: 'node', data: {} },
				position: { x: 0, y: 0 },
				size: { w: 100, h: 50 }
			});
			if (i > 0) {
				flows.edges.set(`e${i}`, {
					id: `e${i}`,
					source: nodeIds[i - 1],
					target: id
				});
			}
		});
		flows.roots = ['n1'];

		autoLayout(flows, 'vertical', 40);

		// Each subsequent node should be deeper
		for (let i = 1; i < nodeIds.length; i++) {
			const prev = flows.nodes.get(nodeIds[i - 1])!;
			const curr = flows.nodes.get(nodeIds[i])!;
			expect(curr.position.y).toBeGreaterThan(prev.position.y);
		}
	});
});
