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
 *     on-drop-empty="$ctrl.onDropEmpty(args)"
 *     is-valid-connection="$ctrl.isValidConnection(args)"
 *     on-ready="$ctrl.onReady(api)">
 *   </flow-canvas>
 */

import type { FlowCanvasElement } from './custom-element';
import type { IsValidConnectionArgs } from '../core';

interface IScope {
	flows?: unknown;
	nodeTypes?: unknown;
	direction?: string;
	edgeStyle?: string;
	theme?: string;
	snapToGrid?: string;
	gridSize?: string;
	readOnly?: string;
	paletteTitle?: string;
	onChange?: (args: { changes: unknown[] }) => void;
	onSelect?: (args: { id: string | null }) => void;
	onEdit?: (args: { id: string }) => void;
	onDropEmpty?: (args: { args: { sourceId: string; sourceHandle?: string; x: number; y: number; screenX: number; screenY: number; type?: string } }) => void;
	onReady?: (args: { api: unknown }) => void;
	onNodeContextMenu?: (args: { args: { id: string; x: number; y: number } }) => void;
	onEdgeContextMenu?: (args: { args: { id: string; x: number; y: number } }) => void;
	onPaneContextMenu?: (args: { args: { x: number; y: number } }) => void;
	isValidConnection?: (args: { args: IsValidConnectionArgs }) => boolean;
	$watch: (expr: string, fn: (newVal: unknown, oldVal: unknown) => void, deep?: boolean) => () => void;
	$watchGroup: (exprs: string[], fn: (newVals: unknown[], oldVals: unknown[]) => void) => () => void;
	$on: (event: string, fn: () => void) => () => void;
	$applyAsync: (fn?: () => void) => void;
}

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
				flows:              '=',
				nodeTypes:          '=',
				direction:          '@',
				edgeStyle:          '@',
				theme:              '@',
				snapToGrid:         '@',
				gridSize:           '@',
				readOnly:           '@',
				paletteTitle:       '@',
				onChange:           '&',
				onSelect:           '&',
				onEdit:             '&',
				onDropEmpty:        '&',
				onReady:            '&',
				onNodeContextMenu:  '&',
				onEdgeContextMenu:  '&',
				onPaneContextMenu:  '&',
				isValidConnection:  '&'
			},
			link: function link(scope: IScope, element: unknown[]) {
				const host = element[0] as HTMLElement;
				const ce = document.createElement('xyflow-canvas') as FlowCanvasElement;
				ce.style.display = 'block';
				ce.style.width = '100%';
				ce.style.height = '100%';
				host.appendChild(ce);

				// Sync attributes to CE
				const syncScalarAttrs = (): void => {
					if (scope.direction) ce.setAttribute('direction', scope.direction);
					else ce.removeAttribute('direction');

					if (scope.edgeStyle) ce.setAttribute('edge-style', scope.edgeStyle);
					else ce.removeAttribute('edge-style');

					if (scope.theme) ce.setAttribute('theme', scope.theme);
					else ce.removeAttribute('theme');

					if (scope.snapToGrid === 'true') ce.setAttribute('snap-to-grid', 'true');
					else ce.removeAttribute('snap-to-grid');

					if (scope.gridSize) ce.setAttribute('grid-size', scope.gridSize);
					else ce.removeAttribute('grid-size');

					if (scope.readOnly === 'true') ce.setAttribute('read-only', 'true');
					else ce.removeAttribute('read-only');

					if (scope.paletteTitle) ce.setAttribute('palette-title', scope.paletteTitle);
					else ce.removeAttribute('palette-title');
				};

				// Wire callbacks to CE.
				// xyflow (React) fires these outside AngularJS' digest cycle, so
				// mutations in the host scope (e.g. `selectedId`, `dirty`) won't
				// reflect in the DOM — `ng-if`/`ng-model` re-evaluate only during
				// a digest. Wrap every emit in `$applyAsync` so Angular schedules
				// a digest without double-running if one is already in progress.
				ce.onChange((changes) => {
					scope.$applyAsync(() => {
						if (scope.onChange) scope.onChange({ changes });
					});
				});

				ce.onSelect((id) => {
					scope.$applyAsync(() => {
						if (scope.onSelect) scope.onSelect({ id });
					});
				});

				ce.onEdit((id) => {
					scope.$applyAsync(() => {
						if (scope.onEdit) scope.onEdit({ id });
					});
				});

				ce.onReady((api) => {
					scope.$applyAsync(() => {
						if (scope.onReady) scope.onReady({ api });
					});
				});

				// Wire onDropEmpty
				ce.setOnDropEmpty((args) => {
					scope.$applyAsync(() => {
						if (scope.onDropEmpty) scope.onDropEmpty({ args });
					});
				});

				// Wire context menu callbacks (right-click on node / edge / pane)
				ce.setOnNodeContextMenu((args) => {
					scope.$applyAsync(() => {
						if (scope.onNodeContextMenu) scope.onNodeContextMenu({ args });
					});
				});
				ce.setOnEdgeContextMenu((args) => {
					scope.$applyAsync(() => {
						if (scope.onEdgeContextMenu) scope.onEdgeContextMenu({ args });
					});
				});
				ce.setOnPaneContextMenu((args) => {
					scope.$applyAsync(() => {
						if (scope.onPaneContextMenu) scope.onPaneContextMenu({ args });
					});
				});

				// Wire isValidConnection
				ce.setIsValidConnection((args) => {
					if (scope.isValidConnection) {
						return scope.isValidConnection({ args });
					}
					return true;
				});

				// Deep watch on flows — sync when host mutates in place
				scope.$watch('flows', (newVal) => {
					if (newVal) {
						ce.setFlows(newVal as Parameters<FlowCanvasElement['setFlows']>[0]);
					}
				}, true);

				// Reference watch on nodeTypes
				scope.$watch('nodeTypes', (newVal) => {
					if (newVal) {
						ce.setNodeTypes(newVal as Parameters<FlowCanvasElement['setNodeTypes']>[0]);
					}
				});

				// Watch group for scalar attributes
				scope.$watchGroup(
					['direction', 'edgeStyle', 'theme', 'snapToGrid', 'gridSize', 'readOnly', 'paletteTitle'],
					() => {
						syncScalarAttrs();
					}
				);

				// Initial sync
				syncScalarAttrs();
				if (scope.flows) {
					ce.setFlows(scope.flows as Parameters<FlowCanvasElement['setFlows']>[0]);
				}
				if (scope.nodeTypes) {
					ce.setNodeTypes(scope.nodeTypes as Parameters<FlowCanvasElement['setNodeTypes']>[0]);
				}

				// Clean up on $destroy — remove CE from DOM to trigger React unmount
				scope.$on('$destroy', () => {
					if (ce.parentNode === host) {
						host.removeChild(ce);
					}
				});
			}
		};
	});
}
