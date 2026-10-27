import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { needsFaststart, parseAtomHeader, topLevelAtoms } from '../server/faststart.mjs';
import { createHandler, parseRange } from '../server/proxy.mjs';

function atom(type, payload) {
	const header = Buffer.alloc(8);
	header.writeUInt32BE(8 + payload.length, 0);
	header.write(type, 4, 'latin1');
	return Buffer.concat([header, payload]);
}

const FTYP = atom('ftyp', Buffer.from('isom0000'));
const MDAT = atom('mdat', Buffer.alloc(64, 1));
const MOOV = atom('moov', Buffer.alloc(32, 2));
const MOOV_AT_END = Buffer.concat([FTYP, MDAT, MOOV]);
const MOOV_FIRST = Buffer.concat([FTYP, MOOV, MDAT]);

// Simula files.get de Drive: metadatos con fields=name,size y contenido con Range.
function fakeDrive(files) {
	return async function (url, init) {
		const match = url.match(/\/files\/([^?]+)\?(.*)$/);
		const file = files[match[1]];
		if (match[2] === 'fields=name,size') {
			return new Response(JSON.stringify({ name: file.name, size: String(file.data.length) }), { headers: { 'Content-Type': 'application/json' } });
		}
		const range = init.headers.Range;
		if (!range) return new Response(file.data, { status: 200 });
		const parts = range.match(/bytes=(\d+)-(\d+)/);
		return new Response(file.data.subarray(Number(parts[1]), Number(parts[2]) + 1), { status: 206 });
	};
}

function startServer(handler) {
	return new Promise(function (resolve) {
		const server = createServer(function (req, res) { handler(req, res); });
		server.listen(0, '127.0.0.1', function () { resolve(server); });
	});
}

test('lee cabeceras de átomo normales y de tamaño 64 bits', () => {
	assert.deepEqual(parseAtomHeader(MOOV.subarray(0, 16), 100), { type: 'moov', size: 40, headerLength: 8 });
	const large = Buffer.alloc(16);
	large.writeUInt32BE(1, 0);
	large.write('mdat', 4, 'latin1');
	large.writeBigUInt64BE(5000n, 8);
	assert.deepEqual(parseAtomHeader(large, 5000), { type: 'mdat', size: 5000, headerLength: 16 });
});

test('detecta moov después de mdat y no lo marca cuando ya está al inicio', async () => {
	const readAt = (buf) => (start, end) => buf.subarray(start, end + 1);
	const atomsEnd = await topLevelAtoms(readAt(MOOV_AT_END), MOOV_AT_END.length);
	const atomsFirst = await topLevelAtoms(readAt(MOOV_FIRST), MOOV_FIRST.length);
	assert.equal(needsFaststart(atomsEnd), true);
	assert.equal(needsFaststart(atomsFirst), false);
});

test('parseRange interpreta bytes=a-b, bytes=a- y bytes=-n', () => {
	assert.deepEqual(parseRange('bytes=0-99', 1000), { partial: true, start: 0, end: 99 });
	assert.deepEqual(parseRange('bytes=900-', 1000), { partial: true, start: 900, end: 999 });
	assert.deepEqual(parseRange('bytes=-100', 1000), { partial: true, start: 900, end: 999 });
	assert.deepEqual(parseRange(undefined, 1000), { partial: false, start: 0, end: 999 });
});

test('remuxa un mp4 con moov al final una sola vez y sirve la copia con Range', async () => {
	const cacheDir = mkdtempSync(join(tmpdir(), 'codetv-cache-'));
	const calls = [];
	const remux = async function ({ fileId, outPath }) {
		calls.push(fileId);
		writeFileSync(outPath, MOOV_FIRST);
	};
	const handler = createHandler({
		getToken: async () => 'tok',
		secret: 'abc',
		fetchFn: fakeDrive({ FILE1: { name: 'pelicula.mp4', data: MOOV_AT_END } }),
		cacheDir: cacheDir,
		remux: remux,
	});
	const server = await startServer(handler);
	const port = server.address().port;
	const base = 'http://127.0.0.1:' + port + '/stream/FILE1?s=abc';

	const full = await fetch(base);
	assert.equal(full.status, 200);
	assert.deepEqual(Buffer.from(await full.arrayBuffer()), MOOV_FIRST);

	const partial = await fetch(base, { headers: { Range: 'bytes=0-7' } });
	assert.equal(partial.status, 206);
	assert.equal(partial.headers.get('content-range'), 'bytes 0-7/' + MOOV_FIRST.length);
	assert.deepEqual(Buffer.from(await partial.arrayBuffer()), MOOV_FIRST.subarray(0, 8));

	assert.deepEqual(calls, ['FILE1']);
	assert.deepEqual(readFileSync(join(cacheDir, 'FILE1.mp4')), MOOV_FIRST);
	server.close();
});

test('reenvía desde Drive sin remux cuando el mp4 ya tiene el índice al inicio', async () => {
	const remux = async function () { throw new Error('no debe remuxar'); };
	const handler = createHandler({
		getToken: async () => 'tok',
		secret: 'abc',
		fetchFn: fakeDrive({ FILE2: { name: 'ok.mp4', data: MOOV_FIRST } }),
		cacheDir: mkdtempSync(join(tmpdir(), 'codetv-cache-')),
		remux: remux,
	});
	const server = await startServer(handler);
	const port = server.address().port;
	const res = await fetch('http://127.0.0.1:' + port + '/stream/FILE2?s=abc');
	assert.equal(res.status, 200);
	assert.deepEqual(Buffer.from(await res.arrayBuffer()), MOOV_FIRST);
	server.close();
});

test('no revisa archivos que no son mp4 y los reenvía tal cual', async () => {
	const remux = async function () { throw new Error('no debe remuxar'); };
	const handler = createHandler({
		getToken: async () => 'tok',
		secret: 'abc',
		fetchFn: fakeDrive({ FILE3: { name: 'cancion.mp3', data: MOOV_AT_END } }),
		cacheDir: mkdtempSync(join(tmpdir(), 'codetv-cache-')),
		remux: remux,
	});
	const server = await startServer(handler);
	const port = server.address().port;
	const res = await fetch('http://127.0.0.1:' + port + '/stream/FILE3?s=abc');
	assert.equal(res.status, 200);
	assert.deepEqual(Buffer.from(await res.arrayBuffer()), MOOV_AT_END);
	server.close();
});
