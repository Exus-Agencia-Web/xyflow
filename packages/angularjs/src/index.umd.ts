/**
 * UMD entry point — exposes `window.FlowCanvas` with a convenience bootstrap
 * for AngularJS hosts that load the lib via a single <script> tag.
 */

import './styles/tokens.css';
import * as core from './core';
import { FlowCanvasElement, registerCustomElement } from './wrapper/custom-element';
import { registerDirective } from './wrapper/directive';

registerCustomElement();

const FlowCanvas = {
	...core,
	FlowCanvasElement,
	registerCustomElement,
	registerDirective,
	initAngular: registerDirective,
	version: '0.1.0-alpha.0'
};

export default FlowCanvas;
