import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorize, buildListQuery, listChildren, mediaUrl, DriveError, FOLDER_MIME, FILES_URL } from '../src/drive/driveClient.js';

function jsonResponse(status, body) {
	return { ok: status >= 200 && status < 300, status: status, json: async function () { return body; } };
}

test('categorize clasifica carpetas, video, audio e imágenes', () => {
	assert.equal(categorize(FOLDER_MIME), 'folder');
	assert.equal(categorize('video/mp4'), 'video');
	assert.equal(categorize('video/x-matroska'), 'video');
	assert.equal(categorize('audio/mpeg'), 'audio');
	assert.equal(categorize('image/jpeg'), 'image');
	assert.equal(categorize('application/pdf'), null);
	assert.equal(categorize(undefined), null);
});

test('buildListQuery escapa comillas del id y excluye archivos borrados', () => {
	const q = buildListQuery("abc'def");
	assert.match(q, /'abc\\'def' in parents/);
	assert.match(q, /trashed = false/);
	assert.match(q, /mimeType contains 'video\/'/);
});

test('listChildren recorre todas las páginas y omite tipos no soportados', async () => {
	const pages = [
		jsonResponse(200, { nextPageToken: 'p2', files: [{ id: '1', name: 'Serie', mimeType: FOLDER_MIME }, { id: '2', name: 'a.mkv', mimeType: 'video/x-matroska', size: '1024' }] }),
		jsonResponse(200, { files: [{ id: '3', name: 'b.pdf', mimeType: 'application/pdf' }, { id: '4', name: 'c.mp3', mimeType: 'audio/mpeg' }] }),
	];
	const urls = [];
	const fetchFn = async function (url) { urls.push(url); return pages.shift(); };
	const files = await listChildren('root', 'tok', { fetchFn: fetchFn });
	assert.equal(urls.length, 2);
	assert.match(urls[1], /pageToken=p2/);
	assert.deepEqual(files.map(function (f) { return f.kind; }), ['folder', 'video', 'audio']);
	assert.equal(files[1].size, 1024);
});

test('listChildren envía el token en cabecera Authorization', async () => {
	let seen = null;
	const fetchFn = async function (url, init) { seen = init.headers.Authorization; return jsonResponse(200, { files: [] }); };
	await listChildren('root', 'tok-123', { fetchFn: fetchFn });
	assert.equal(seen, 'Bearer tok-123');
});

test('listChildren lanza DriveError con el estado HTTP', async () => {
	const fetchFn = async function () { return jsonResponse(403, {}); };
	await assert.rejects(listChildren('root', 'tok', { fetchFn: fetchFn }), function (e) { return e instanceof DriveError && e.status === 403; });
});

test('mediaUrl codifica el id y pide alt=media', () => {
	const url = mediaUrl('id/raro', 'tok');
	assert.equal(url.indexOf(FILES_URL + '/id%2Fraro?alt=media'), 0);
	assert.match(url, /access_token=tok/);
});
