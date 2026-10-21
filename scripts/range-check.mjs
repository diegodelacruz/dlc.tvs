// Verifica si Drive responde 206 a Range en alt=media, con cabecera Authorization y con access_token en la URL.
// Uso: node scripts/range-check.mjs <ruta-llave.json> [nombre-carpeta] [nombre-archivo]
// No imprime el token. Cancela el cuerpo de la respuesta para no descargar el archivo completo.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { getAccessToken, findFolderFiles } from './drive-check.mjs';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';

async function probe(label, url, headers) {
	const res = await fetch(url, { headers: headers });
	const contentRange = res.headers.get('content-range') || '-';
	const length = res.headers.get('content-length') || '-';
	await res.body.cancel();
	console.log(label + ': status ' + res.status + ' | Content-Range: ' + contentRange + ' | Content-Length: ' + length);
	return res.status;
}

async function main() {
	const keyPath = process.argv[2];
	const folder = process.argv[3] || 'CodeTV-prueba';
	const fileName = process.argv[4];
	if (!keyPath) {
		console.error('Uso: node scripts/range-check.mjs <ruta-llave.json> [nombre-carpeta] [nombre-archivo]');
		process.exit(1);
	}
	const key = JSON.parse(readFileSync(keyPath, 'utf8'));
	const token = await getAccessToken(key);
	const files = await findFolderFiles(token, folder);
	const target = (files || []).find(function (f) {
		return f.mimeType.indexOf('video/') === 0 && (!fileName || f.name === fileName);
	});
	if (!target) {
		console.log('No se encontró un video en la carpeta "' + folder + '".');
		process.exit(2);
	}
	console.log('Archivo: ' + target.name + ' (' + (target.size || '-') + ' bytes)');
	const url = FILES_URL + '/' + encodeURIComponent(target.id) + '?alt=media';
	const range = { Range: 'bytes=0-1023' };
	const headerStatus = await probe('Authorization + Range', url, Object.assign({ Authorization: 'Bearer ' + token }, range));
	const queryStatus = await probe('access_token en URL + Range', url + '&access_token=' + encodeURIComponent(token), range);
	if (headerStatus === 206 && queryStatus === 206) {
		console.log('Resultado: Range funciona por ambos caminos. El seek es viable con <video>.');
	} else {
		console.log('Resultado: revisar. Si no devuelve 206, el seek no es directo y hay que usar un proxy.');
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch(function (e) {
		console.error('FALLA: ' + e.message);
		process.exit(1);
	});
}
