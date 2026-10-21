import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify, webcrypto } from 'node:crypto';
import { buildJwt, b64url, pemToDer, exchangeToken, TOKEN_URL } from '../src/auth/serviceAccount.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
	modulusLength: 2048,
	publicKeyEncoding: { type: 'spki', format: 'pem' },
	privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const key = { client_email: 'codetv-drive@test.iam.gserviceaccount.com', private_key: privateKey };

test('b64url no deja caracteres de base64 estándar', () => {
	const out = b64url(new Uint8Array([251, 255, 191]));
	assert.equal(/[+/=]/.test(out), false);
});

test('pemToDer devuelve el DER del PEM', () => {
	const der = new Uint8Array(pemToDer(privateKey));
	assert.equal(der[0], 0x30);
});

test('buildJwt firma con RS256 y la firma se verifica con la llave pública', async () => {
	const jwt = await buildJwt(key, webcrypto, 1000);
	const parts = jwt.split('.');
	assert.equal(parts.length, 3);
	const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
	assert.equal(claims.iss, key.client_email);
	assert.equal(claims.aud, TOKEN_URL);
	assert.equal(claims.exp - claims.iat, 3600);
	const verifier = createVerify('RSA-SHA256');
	verifier.update(parts[0] + '.' + parts[1]);
	assert.equal(verifier.verify(publicKey, Buffer.from(parts[2], 'base64url')), true);
});

test('exchangeToken envía el JWT como grant jwt-bearer y devuelve el token', async () => {
	let sent = null;
	const fetchFn = async function (url, init) {
		sent = { url: url, body: init.body };
		return { ok: true, json: async function () { return { access_token: 'at-1', expires_in: 3600 }; } };
	};
	const token = await exchangeToken(key, webcrypto, fetchFn);
	assert.equal(token.accessToken, 'at-1');
	assert.equal(sent.url, TOKEN_URL);
	assert.match(sent.body, /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/);
});

test('exchangeToken lanza error si Google rechaza el JWT', async () => {
	const fetchFn = async function () {
		return { ok: false, status: 400, json: async function () { return { error: 'invalid_grant' }; } };
	};
	await assert.rejects(exchangeToken(key, webcrypto, fetchFn), /invalid_grant/);
});
