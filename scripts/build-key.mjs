// Incluye la llave de la cuenta de servicio en app/js/service-account.js para la prueba en la TV.
// Uso: node scripts/build-key.mjs [ruta-llave.json]. El archivo generado NO se versiona (app/js/ está en .gitignore).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const source = process.argv[2] || join(homedir(), '.config', 'codetv', 'service-account.json');
const key = JSON.parse(readFileSync(source, 'utf8'));
const subset = { client_email: key.client_email, private_key: key.private_key };
mkdirSync('app/js', { recursive: true });
writeFileSync('app/js/service-account.js', '// Generado por scripts/build-key.mjs. No versionar.\nwindow.CodeTVKey = ' + JSON.stringify(subset) + ';\n');
console.log('OK: llave incluida en app/js/service-account.js (no versionar).');
