// Comprueba que el bundle no usa sintaxis posterior a ES2015 (motor de webOS 4.5).
import { readFileSync } from 'node:fs';
import * as acorn from 'acorn';

const code = readFileSync('app/js/app.js', 'utf8');
try {
	acorn.parse(code, { ecmaVersion: 2015, sourceType: 'script' });
	console.log('OK: bundle parsea como ES2015 (script clásico).');
} catch (e) {
	console.error('FALLA: ' + e.message);
	process.exit(1);
}
