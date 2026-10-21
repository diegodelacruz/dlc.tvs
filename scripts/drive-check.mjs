// Verifica el acceso a Drive con la cuenta de servicio y lista una carpeta.
// Uso: node scripts/drive-check.mjs <ruta-llave.json> [nombre-carpeta]
// La llave nunca se imprime ni se guarda en el repositorio.
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function b64url(input) {
	return Buffer.from(input).toString('base64url');
}

// Firma el JWT con RS256 usando la llave privada de la cuenta de servicio.
export function buildJwt(key, nowSeconds = Math.floor(Date.now() / 1000)) {
	const header = { alg: 'RS256', typ: 'JWT' };
	const claims = { iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 };
	const input = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(claims));
	const signer = createSign('RSA-SHA256');
	signer.update(input);
	return input + '.' + b64url(signer.sign(key.private_key));
}

export async function getAccessToken(key, fetchFn = fetch) {
	const res = await fetchFn(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: buildJwt(key) }).toString(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error('token: ' + (data.error_description || data.error || res.status));
	return data.access_token;
}

async function listFolder(parentQuery, token, fetchFn = fetch) {
	const params = new URLSearchParams({ q: parentQuery, fields: 'files(id,name,mimeType,size)', pageSize: '100' });
	const res = await fetchFn(FILES_URL + '?' + params.toString(), { headers: { Authorization: 'Bearer ' + token } });
	const data = await res.json();
	if (!res.ok) throw new Error('drive: ' + (data.error && data.error.message ? data.error.message : res.status));
	return data.files || [];
}

export async function findFolderFiles(token, folderName, fetchFn = fetch) {
	const safeName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
	const folders = await listFolder(
		"name = '" + safeName + "' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
		token,
		fetchFn
	);
	if (folders.length === 0) return null;
	return listFolder("'" + folders[0].id + "' in parents and trashed = false", token, fetchFn);
}

async function main() {
	const keyPath = process.argv[2];
	const folderName = process.argv[3] || 'CodeTV-prueba';
	if (!keyPath) {
		console.error('Uso: node scripts/drive-check.mjs <ruta-llave.json> [nombre-carpeta]');
		process.exit(1);
	}
	const key = JSON.parse(readFileSync(keyPath, 'utf8'));
	const token = await getAccessToken(key);
	console.log('OK: token obtenido con la cuenta de servicio.');
	const files = await findFolderFiles(token, folderName);
	if (files === null) {
		console.log('No se encontró la carpeta "' + folderName + '" compartida con la cuenta de servicio.');
		process.exit(2);
	}
	console.log('Carpeta "' + folderName + '": ' + files.length + ' elemento(s).');
	files.forEach(function (f) {
		console.log('  - ' + f.name + ' | ' + f.mimeType + ' | ' + (f.size || '-') + ' bytes');
	});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch(function (e) {
		console.error('FALLA: ' + e.message);
		process.exit(1);
	});
}
