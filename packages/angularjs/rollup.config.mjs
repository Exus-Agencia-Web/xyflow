import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

/**
 * Two bundles:
 *  - UMD: single file exposing `window.FlowCanvas` with `.initAngular(moduleName)`.
 *    Bundles React + React-DOM + @xyflow/react in so host needs no React.
 *  - ESM: for consumers using a bundler.
 * CSS is extracted to dist/flow-canvas.css (imports @xyflow/react/dist/style.css + our theme vars).
 */

const sharedPlugins = [
	replace({
		preventAssignment: true,
		values: {
			'process.env.NODE_ENV': JSON.stringify('production')
		}
	}),
	resolve({ browser: true, extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
	commonjs(),
	typescript({
		tsconfig: './tsconfig.json',
		declaration: false,
		declarationMap: false,
		sourceMap: true,
		inlineSources: true,
		outDir: 'dist',
		noEmitOnError: false
	}),
	postcss({
		extract: 'flow-canvas.css',
		minimize: true,
		sourceMap: true
	}),
	terser({
		mangle: { reserved: ['FlowCanvas'] },
		compress: { drop_debugger: true, dead_code: true },
		format: { comments: false }
	})
];

export default [
	{
		input: 'src/index.umd.ts',
		output: {
			file: 'dist/flow-canvas.umd.cjs',
			format: 'umd',
			name: 'FlowCanvas',
			sourcemap: true,
			globals: { angular: 'angular' }
		},
		external: ['angular'],
		plugins: sharedPlugins
	},
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/flow-canvas.esm.js',
			format: 'esm',
			sourcemap: true
		},
		external: ['angular', 'react', 'react-dom', '@xyflow/react'],
		plugins: sharedPlugins
	}
];
