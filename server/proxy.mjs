// Proxy de Drive para el <video> de la TV. Recibe /stream/<fileId>?s=<secreto>, pide el archivo a Drive
// con cabecera Authorization y reenvía el Range. Si un mp4 tiene el índice al final, lo remuxa con faststart
// una sola vez, lo guarda en server/cache/ y lo sirve desde ahí. Solo para uso personal en la red local.
// Uso: node server/proxy.mjs <ruta-llave.json> <secreto> [puerto]
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getAccessToken } from '../scripts/drive-check.mjs';
import { needsFaststart, remuxFaststart, topLevelAtoms } from './faststart.mjs';
import { extractWebVtt, probeSubtitles, textSubtitleTracks } from './subtitles.mjs';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_MARGIN_MS = 60000;
const DEFAULT_CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'cache');
const MP4_NAME = /\.(mp4|m4v|mov)$/i;
const SUBS_PATH = /^\/subs\/([A-Za-z0-9_-]+)(?:\/(\d+)\.vtt)?$/;

// Remux real: ffmpeg lee el archivo directamente de Drive con el token.
function remuxFromDrive({ fileId, token, outPath }) {
	return remuxFaststart({
		inputUrl: FILES_URL + '/' + fileId + '?alt=media',
		authorization: 'Bearer ' + token,
		outPath: outPath,
	});
}

// Lectura real de pistas y conversión real a WebVTT, leyendo directamente de Drive.
function probeFromDrive({ fileId, token }) {
	return probeSubtitles(FILES_URL + '/' + fileId + '?alt=media', 'Bearer ' + token);
}

function extractFromDrive({ fileId, token, n, outPath }) {
	return extractWebVtt(FILES_URL + '/' + fileId + '?alt=media', 'Bearer ' + token, n, outPath);
}

// Crea el manejador HTTP. getToken() devuelve un token vigente. fetchFn, remux, probe y extract son inyectables para pruebas.
export function createHandler({
	getToken,
	secret,
	fetchFn = fetch,
	cacheDir = DEFAULT_CACHE_DIR,
	remux = remuxFromDrive,
	probe = probeFromDrive,
	extract = extractFromDrive,
}) {
	const decisions = new Map();
	const trackLists = new Map();
	const vttJobs = new Map();

	function driveFetch(id, token, extraHeaders, query) {
		const headers = Object.assign({ Authorization: 'Bearer ' + token }, extraHeaders);
		return fetchFn(FILES_URL + '/' + id + query, { headers: headers });
	}

	async function readRange(id, token, start, end) {
		const res = await driveFetch(id, token, { Range: 'bytes=' + start + '-' + end }, '?alt=media');
		if (res.status !== 206) throw new Error('Drive no devolvió Range (código ' + res.status + ')');
		return Buffer.from(await res.arrayBuffer());
	}

	// Decide una sola vez por archivo: 'local' (ruta en caché) o 'direct' (reenviar desde Drive).
	async function resolveSource(id, token) {
		const cachedPath = join(cacheDir, id + '.mp4');
		if (existsSync(cachedPath)) return { local: cachedPath };
		const meta = await (await driveFetch(id, token, {}, '?fields=name,size')).json();
		if (!MP4_NAME.test(meta.name)) return { direct: true };
		const atoms = await topLevelAtoms(function (start, end) { return readRange(id, token, start, end); }, Number(meta.size));
		if (!needsFaststart(atoms)) return { direct: true };
		mkdirSync(cacheDir, { recursive: true });
		const tmpPath = join(cacheDir, id + '.tmp.mp4');
		console.log('Remux faststart: ' + id);
		await remux({ fileId: id, token: token, outPath: tmpPath });
		renameSync(tmpPath, cachedPath);
		return { local: cachedPath };
	}

	function decide(id, token) {
		if (!decisions.has(id)) {
			decisions.set(id, resolveSource(id, token).catch(function (e) {
				decisions.delete(id);
				throw e;
			}));
		}
		return decisions.get(id);
	}

	// Lista de pistas de texto del archivo, calculada una vez por archivo.
	function tracksOf(id, token) {
		if (!trackLists.has(id)) {
			trackLists.set(id, probe({ fileId: id, token: token }).then(textSubtitleTracks).catch(function (e) {
				trackLists.delete(id);
				throw e;
			}));
		}
		return trackLists.get(id);
	}

	// Pista convertida a WebVTT, en caché. Se convierte una sola vez aunque lleguen varias peticiones.
	function vttOf(id, n, token) {
		const outPath = join(cacheDir, id + '.sub' + n + '.vtt');
		if (existsSync(outPath)) return Promise.resolve(outPath);
		const key = id + '.' + n;
		if (!vttJobs.has(key)) {
			vttJobs.set(key, (async function () {
				mkdirSync(cacheDir, { recursive: true });
				const tmpPath = outPath + '.tmp';
				await extract({ fileId: id, token: token, n: n, outPath: tmpPath });
				renameSync(tmpPath, outPath);
				return outPath;
			})().catch(function (e) {
				vttJobs.delete(key);
				throw e;
			}));
		}
		return vttJobs.get(key);
	}

	// Sin número: lista JSON de pistas. Con número: archivo WebVTT de esa pista.
	async function serveSubtitles(res, id, n, token) {
		const cors = { 'Access-Control-Allow-Origin': '*' };
		const tracks = await tracksOf(id, token);
		if (n === undefined) {
			res.writeHead(200, Object.assign({ 'Content-Type': 'application/json' }, cors));
			res.end(JSON.stringify(tracks));
			return;
		}
		const track = tracks.find(function (t) { return t.n === Number(n); });
		if (!track) {
			res.writeHead(404);
			res.end();
			return;
		}
		const path = await vttOf(id, track.n, token);
		res.writeHead(200, Object.assign({ 'Content-Type': 'text/vtt; charset=utf-8' }, cors));
		createReadStream(path).pipe(res);
	}

	return async function (req, res) {
		const url = new URL(req.url, 'http://localhost');
		const match = url.pathname.match(/^\/stream\/([A-Za-z0-9_-]+)$/);
		const subs = url.pathname.match(SUBS_PATH);
		if (req.method !== 'GET' || (!match && !subs)) {
			res.writeHead(404);
			res.end();
			return;
		}
		if (url.searchParams.get('s') !== secret) {
			res.writeHead(403);
			res.end();
			return;
		}
		const token = await getToken();
		if (subs) {
			await serveSubtitles(res, subs[1], subs[2], token);
			return;
		}
		const source = await decide(match[1], token);
		if (source.local) {
			serveLocal(req, res, source.local);
			return;
		}
		const headers = { Authorization: 'Bearer ' + token };
		if (req.headers.range) headers.Range = req.headers.range;
		const upstream = await driveFetch(match[1], token, headers, '?alt=media');
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

// Interpreta un Range sencillo (bytes=a-b, bytes=a-, bytes=-n). Sin Range o no válido: archivo completo.
export function parseRange(header, size) {
	const match = header && header.match(/^bytes=(\d*)-(\d*)$/);
	if (!match || (match[1] === '' && match[2] === '')) return { partial: false, start: 0, end: size - 1 };
	let start;
	let end = size - 1;
	if (match[1] === '') {
		start = Math.max(size - Number(match[2]), 0);
	} else {
		start = Number(match[1]);
		if (match[2] !== '') end = Math.min(Number(match[2]), size - 1);
	}
	if (start > end) return { partial: false, start: 0, end: size - 1 };
	return { partial: true, start: start, end: end };
}

// Sirve un archivo local de la caché con soporte de Range para el seek.
export function serveLocal(req, res, path) {
	const size = statSync(path).size;
	const range = parseRange(req.headers.range, size);
	const headers = {
		'Content-Type': 'video/mp4',
		'Accept-Ranges': 'bytes',
		'Content-Length': range.end - range.start + 1,
	};
	if (range.partial) headers['Content-Range'] = 'bytes ' + range.start + '-' + range.end + '/' + size;
	res.writeHead(range.partial ? 206 : 200, headers);
	createReadStream(path, { start: range.start, end: range.end }).pipe(res);
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
