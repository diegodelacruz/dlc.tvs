import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { textSubtitleTracks } from '../server/subtitles.mjs';
import { createHandler } from '../server/proxy.mjs';

const PROBE = {
	streams: [
		{ codec_name: 'hdmv_pgs_subtitle', tags: { language: 'eng' } },
		{ codec_name: 'subrip', tags: { language: 'eng' } },
		{ codec_name: 'subrip', tags: { language: 'spa' } },
	],
};

function startServer(handler) {
	return new Promise(function (resolve) {
		const server = createServer(function (req, res) {
			Promise.resolve(handler(req, res)).catch(function () {
				res.writeHead(502);
				res.end();
			});
		});
		server.listen(0, '127.0.0.1', function () { resolve(server); });
	});
}

test('solo conserva pistas de texto y numera por posición entre subtítulos', () => {
	assert.deepEqual(textSubtitleTracks(PROBE), [
		{ n: 1, codec: 'subrip', language: 'eng' },
		{ n: 2, codec: 'subrip', language: 'spa' },
	]);
});

test('lista las pistas en JSON con CORS y convierte a WebVTT una sola vez', async () => {
	const cacheDir = mkdtempSync(join(tmpdir(), 'codetv-subs-'));
	const calls = [];
	const extract = async function ({ n, outPath }) {
		calls.push(n);
		writeFileSync(outPath, 'WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nHola\n');
	};
	const handler = createHandler({
		getToken: async () => 'tok',
		secret: 'abc',
		cacheDir: cacheDir,
		probe: async () => PROBE,
		extract: extract,
	});
	const server = await startServer(handler);
	const base = 'http://127.0.0.1:' + server.address().port + '/subs/FILE1';

	const list = await fetch(base + '?s=abc');
	assert.equal(list.status, 200);
	assert.equal(list.headers.get('access-control-allow-origin'), '*');
	assert.deepEqual(await list.json(), [
		{ n: 1, codec: 'subrip', language: 'eng' },
		{ n: 2, codec: 'subrip', language: 'spa' },
	]);

	const first = await fetch(base + '/2.vtt?s=abc');
	assert.equal(first.status, 200);
	assert.match(first.headers.get('content-type'), /text\/vtt/);
	assert.match(await first.text(), /^WEBVTT/);

	const second = await fetch(base + '/2.vtt?s=abc');
	assert.equal(second.status, 200);
	assert.deepEqual(calls, [2]);
	server.close();
});

test('rechaza pistas que no existen y secreto incorrecto', async () => {
	const handler = createHandler({
		getToken: async () => 'tok',
		secret: 'abc',
		cacheDir: mkdtempSync(join(tmpdir(), 'codetv-subs-')),
		probe: async () => PROBE,
		extract: async () => { throw new Error('no debe llamarse'); },
	});
	const server = await startServer(handler);
	const base = 'http://127.0.0.1:' + server.address().port + '/subs/FILE1';

	const missing = await fetch(base + '/0.vtt?s=abc');
	assert.equal(missing.status, 404);

	const forbidden = await fetch(base + '/1.vtt?s=mal');
	assert.equal(forbidden.status, 403);
	server.close();
});
