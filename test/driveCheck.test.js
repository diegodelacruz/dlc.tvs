import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { buildJwt, findFolderFiles } from '../scripts/drive-check.mjs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
	modulusLength: 2048,
	publicKeyEncoding: { type: 'spki', format: 'pem' },
	privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const key = { client_email: 'codetv-drive@test.iam.gserviceaccount.com', private_key: privateKey };

test('buildJwt produce un JWT RS256 con firma verificable', () => {
	const jwt = buildJwt(key, 1000);
	const parts = jwt.split('.');
	assert.equal(parts.length, 3);
	const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
	assert.equal(claims.iss, key.client_email);
	assert.equal(claims.exp - claims.iat, 3600);
	const verifier = createVerify('RSA-SHA256');
	verifier.update(parts[0] + '.' + parts[1]);
	assert.equal(verifier.verify(publicKey, Buffer.from(parts[2], 'base64url')), true);
});

test('findFolderFiles devuelve null si la carpeta no existe', async () => {
	const fetchFn = async function () { return { ok: true, json: async function () { return { files: [] }; } }; };
	assert.equal(await findFolderFiles('tok', 'NoExiste', fetchFn), null);
});

test('findFolderFiles escapa comillas en el nombre de la carpeta', async () => {
	const urls = [];
	const fetchFn = async function (url) {
		urls.push(url);
		return { ok: true, json: async function () { return { files: urls.length === 1 ? [{ id: 'f1', name: 'x' }] : [] }; } };
	};
	await findFolderFiles('tok', "Mi'carpeta", fetchFn);
	assert.ok(new URL(urls[0]).searchParams.get('q').includes("name = 'Mi\\'carpeta'"));
});
