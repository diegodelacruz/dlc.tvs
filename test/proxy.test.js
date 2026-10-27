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
