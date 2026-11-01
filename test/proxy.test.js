import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../server/proxy.mjs';

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

test('rechaza peticiones sin el secreto correcto', async () => {
	const handler = createHandler({ getToken: async () => 'tok', secret: 'abc', fetchFn: async () => { throw new Error('no debe llamarse'); } });
	const server = await startServer(handler);
	const port = server.address().port;
	const res = await fetch('http://127.0.0.1:' + port + '/stream/FILE1?s=mal');
	assert.equal(res.status, 403);
	server.close();
});

test('reenvía Range con Authorization y devuelve 206 con Content-Range', async () => {
	let upstreamHeaders = null;
	const fetchFn = async function (url, init) {
		if (url.includes('fields=')) return new Response(JSON.stringify({ name: 'video.mkv', size: '100' }), { headers: { 'Content-Type': 'application/json' } });
		upstreamHeaders = init.headers;
		return new Response(new Uint8Array([1, 2, 3]), { status: 206, headers: { 'Content-Range': 'bytes 0-2/100', 'Content-Type': 'video/mp4' } });
	};
	const handler = createHandler({ getToken: async () => 'tok-x', secret: 'abc', fetchFn: fetchFn });
	const server = await startServer(handler);
	const port = server.address().port;
	const res = await fetch('http://127.0.0.1:' + port + '/stream/FILE1?s=abc', { headers: { Range: 'bytes=0-2' } });
	assert.equal(res.status, 206);
	assert.equal(res.headers.get('content-range'), 'bytes 0-2/100');
	assert.equal(upstreamHeaders.Authorization, 'Bearer tok-x');
	assert.equal(upstreamHeaders.Range, 'bytes=0-2');
	server.close();
});

test('rechaza con 413 y un mensaje claro un mp4 con el índice al final que supera el límite', async () => {
	const atom = (type, len) => { const b = Buffer.alloc(8 + len); b.writeUInt32BE(8 + len, 0); b.write(type, 4, 'latin1'); return b; };
	const data = Buffer.concat([atom('ftyp', 4), atom('mdat', 16), atom('moov', 8)]);
	const fetchFn = async function (url, init) {
		if (url.includes('fields=')) return new Response(JSON.stringify({ name: 'enorme.mp4', size: String(data.length) }), { headers: { 'Content-Type': 'application/json' } });
		const m = init.headers.Range.match(/bytes=(\d+)-(\d+)/);
		return new Response(data.subarray(Number(m[1]), Number(m[2]) + 1), { status: 206 });
	};
	const handler = createHandler({ getToken: async () => 'tok', secret: 'abc', fetchFn: fetchFn, maxRemuxBytes: 10, remux: async () => { throw new Error('no debe remuxar'); } });
	const server = await startServer(function (req, res) {
		Promise.resolve(handler(req, res)).catch(function (e) {
			res.writeHead(e.status || 502, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end(e.message);
		});
	});
	try {
		const res = await fetch('http://127.0.0.1:' + server.address().port + '/stream/FILE1?s=abc');
		assert.equal(res.status, 413);
		assert.match(await res.text(), /índice al inicio/);
	} finally {
		server.close();
	}
});

test('pipeTo cierra la respuesta si el origen falla a mitad, sin tumbar el proceso', async () => {
	const { pipeTo } = await import('../server/proxy.mjs');
	const { Readable, PassThrough } = await import('node:stream');
	const { EventEmitter } = await import('node:events');
	const source = new Readable({ read() {} });
	const res = new PassThrough();
	let destroyed = false;
	res.destroy = () => { destroyed = true; };
	const errors = [];
	const original = console.error;
	console.error = (m) => errors.push(m);
	try {
		pipeTo(source, res);
		source.push('datos');
		source.destroy(new Error('read ETIMEDOUT'));
		await new Promise((resolve) => setTimeout(resolve, 20));
	} finally {
		console.error = original;
	}
	assert.equal(destroyed, true);
	assert.match(errors.join(' '), /read ETIMEDOUT/);
});
