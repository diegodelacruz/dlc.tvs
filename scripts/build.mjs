// Compila src/ a app/js/app.js como script clásico (sin módulos ES) para webOS 4.5 en adelante.
import { build } from 'esbuild';

await build({
	entryPoints: ['src/main.js'],
	bundle: true,
	format: 'iife',
	target: 'chrome53',
	outfile: 'app/js/app.js',
	logLevel: 'info',
});
