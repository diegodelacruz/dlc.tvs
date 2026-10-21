// Proxy de Drive para el <video> de la TV. Recibe /stream/<fileId>?s=<secreto>, pide el archivo a Drive
// con cabecera Authorization y reenvía el Range. Solo para uso personal en la red local.
// Uso: node server/proxy.mjs <ruta-llave.json> <secreto> [puerto]
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { getAccessToken } from '../scripts/drive-check.mjs';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_MARGIN_MS = 60000;

// Crea el manejador HTTP. getToken() devuelve un token vigente; fetchFn es inyectable para pruebas.
export function createHandler({ getToken, secret, fetchFn = fetch }) {
	return async function (req, res) {
		const url = new URL(req.url, 'http://localhost');
		const match = url.pathname.match(/^\/stream\/([A-Za-z0-9_-]+)$/);
		if (req.method !== 'GET' || !match) {
			res.writeHead(404);
			res.end();
			return;
		}
		if (url.searchParams.get('s') !== secret) {
			res.writeHead(403);
			res.end();
			return;
		}
		const headers = { Authorization: 'Bearer ' + (await getToken()) };
		if (req.headers.range) headers.Range = req.headers.range;
		const upstream = await fetchFn(FILES_URL + '/' + match[1] + '?alt=media', { headers: headers });
		const passthrough = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
		const outHeaders = {};
		passthrough.forEach(function (name) {
			const value = upstream.headers.get(name);
			if (value) outHeaders[name] = value;
		});
		res.writeHead(upstream.status, outHeaders);
		if (!upstream.body) {
			res.end();
			return;
		}
		Readable.fromWeb(upstream.body).pipe(res);
	};
}

// Obtiene token y lo renueva antes de caducar.
export function createTokenProvider(key, fetchFn) {
	let cached = null;
	return async function () {
		if (!cached || cached.expiresAt - TOKEN_MARGIN_MS <= Date.now()) {
			const token = await getAccessToken(key, fetchFn);
			cached = { value: token, expiresAt: Date.now() + 3300 * 1000 };
		}
		return cached.value;
	};
}

async function main() {
	const keyPath = process.argv[2];
	const secret = process.argv[3];
	const port = Number(process.argv[4] || 8080);
	if (!keyPath || !secret) {
		console.error('Uso: node server/proxy.mjs <ruta-llave.json> <secreto> [puerto]');
		process.exit(1);
	}
	const key = JSON.parse(readFileSync(keyPath, 'utf8'));
	const handler = createHandler({ getToken: createTokenProvider(key), secret: secret });
	createServer(function (req, res) {
		handler(req, res).catch(function (e) {
			console.error('error: ' + e.message);
			if (!res.headersSent) res.writeHead(502);
			res.end();
		});
	}).listen(port, '0.0.0.0', function () {
		console.log('Proxy escuchando en el puerto ' + port + '. Usa la IP local de tu Mac.');
	});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
