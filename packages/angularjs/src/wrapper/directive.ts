/**
 * AngularJS 1.x directive wrapping <flow-canvas> Custom Element.
 * Exposes idiomatic bindings + lifecycle.
 *
 * Usage:
 *   angular.module('myApp', ['flowCanvas']).controller(...)
 *
 *   <flow-canvas
 *     flows="$ctrl.flows"
 *     node-types="$ctrl.nodeTypes"
 *     direction="horizontal"
 *     edge-style="bezier"
 *     theme="light"
 *     snap-to-grid="true"
 *     grid-size="20"
 *     on-change="$ctrl.onChange(changes)"
 *     on-select="$ctrl.onSelect(id)"
 *     on-edit="$ctrl.onEdit(id)"
 *     on-ready="$ctrl.onReady(api)">
 *   </flow-canvas>
 */

import type { FlowCanvasElement } from './custom-element';

declare const angular: {
	module: (name: string, deps?: string[]) => {
		directive: (name: string, fn: (...args: unknown[]) => unknown) => unknown;
	};
};

export function registerDirective(moduleName = 'flowCanvas'): void {
	if (typeof angular === 'undefined') return;

	const module = angular.module(moduleName, []);

	module.directive('flowCanvas', function flowCanvasDirective() {
		return {
			restrict: 'E',
			scope: {
				flows:             '=',
				nodeTypes:         '=',
				direction:         '@',
				edgeStyle:         '@',
				theme:             '@',
				snapToGrid:        '@',
				gridSize:          '@',
				readOnly:          '@',
				onChange:          '&',
				onSelect:          '&',
				onEdit:            '&',
				onDropEmpty:       '&',
				onReady:           '&',
				isValidConnection: '&'
			},
			link: function link(scope: Record<string, unknown>, element: unknown[]) {
				const host = element[0] as HTMLElement;
				const ce = document.createElement('flow-canvas') as FlowCanvasElement;
				host.appendChild(ce);

				// Pipe scope props to CE as they change
				const syncAttrs = (): void => {
					if (scope.direction) ce.setAttribute('direction', scope.direction as string);
					if (scope.edgeStyle) ce.setAttribute('edge-style', scope.edgeStyle as string);
					if (scope.theme) ce.setAttribute('theme', scope.theme as string);
					if (scope.snapToGrid) ce.setAttribute('snap-to-grid', scope.snapToGrid as string);
					if (scope.gridSize) ce.setAttribute('grid-size', scope.gridSize as string);
					if (scope.readOnly === 'true') ce.setAttribute('read-only', 'true');
					if (scope.flows) ce.setFlows(scope.flows as Parameters<FlowCanvasElement['setFlows']>[0]);
					if (scope.nodeTypes) ce.setNodeTypes(scope.nodeTypes as Parameters<FlowCanvasElement['setNodeTypes']>[0]);
				};

				ce.onChange((changes) => (scope.onChange as (arg: { changes: unknown[] }) => void)({ changes }));
				ce.onSelect((id) => (scope.onSelect as (arg: { id: string | null }) => void)({ id }));
				ce.onEdit((id) => (scope.onEdit as (arg: { id: string }) => void)({ id }));
				ce.onReady((api) => (scope.onReady as (arg: { api: unknown }) => void)({ api }));

				syncAttrs();
			}
		};
	});
}
