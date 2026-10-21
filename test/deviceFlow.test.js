import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestDeviceCode, pollForToken, refreshAccessToken, isExpired, AuthError, TOKEN_URL, DEVICE_CODE_URL } from '../src/auth/deviceFlow.js';

const config = { clientId: 'cid', clientSecret: 'secret', scope: 'https://www.googleapis.com/auth/drive.readonly' };

function jsonResponse(status, body) {
	return { ok: status >= 200 && status < 300, status: status, json: async function () { return body; } };
}

function scripted(responses) {
	const calls = [];
	const fn = async function (url, init) {
		calls.push({ url: url, body: init && init.body });
		const next = responses.shift();
		return next;
	};
	fn.calls = calls;
	return fn;
}

test('requestDeviceCode envía client_id y scope y normaliza la respuesta', async () => {
	const fetchFn = scripted([jsonResponse(200, { device_code: 'dc', user_code: 'ABCD-EFGH', verification_url: 'https://www.google.com/device', expires_in: 1800, interval: 5 })]);
	const device = await requestDeviceCode(config, fetchFn);
	assert.equal(fetchFn.calls[0].url, DEVICE_CODE_URL);
	assert.match(fetchFn.calls[0].body, /client_id=cid/);
	assert.match(fetchFn.calls[0].body, /scope=https/);
	assert.equal(device.userCode, 'ABCD-EFGH');
	assert.equal(device.verificationUrl, 'https://www.google.com/device');
	assert.equal(device.interval, 5);
});

test('requestDeviceCode lanza AuthError con el código del servidor', async () => {
	const fetchFn = scripted([jsonResponse(401, { error: 'invalid_client' })]);
	await assert.rejects(requestDeviceCode(config, fetchFn), function (e) { return e instanceof AuthError && e.code === 'invalid_client'; });
});

test('pollForToken espera authorization_pending y devuelve tokens al autorizar', async () => {
	const device = { deviceCode: 'dc', interval: 5, expiresIn: 1800 };
	const fetchFn = scripted([
		jsonResponse(428, { error: 'authorization_pending' }),
		jsonResponse(428, { error: 'authorization_pending' }),
		jsonResponse(200, { access_token: 'at', refresh_token: 'rt', expires_in: 3600, scope: 'x' }),
	]);
	const waits = [];
	const tokens = await pollForToken(config, device, { fetchFn: fetchFn, sleep: async function (ms) { waits.push(ms); }, now: function () { return 1000; } });
	assert.equal(tokens.accessToken, 'at');
	assert.equal(tokens.refreshToken, 'rt');
	assert.equal(tokens.expiresAt, 1000 + 3600000);
	assert.deepEqual(waits, [5000, 5000, 5000]);
	assert.match(fetchFn.calls[0].body, /grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code/);
});

test('slow_down aumenta el intervalo de sondeo en 5 s', async () => {
	const device = { deviceCode: 'dc', interval: 5, expiresIn: 1800 };
	const fetchFn = scripted([
		jsonResponse(428, { error: 'slow_down' }),
		jsonResponse(200, { access_token: 'at', expires_in: 3600 }),
	]);
	const waits = [];
	await pollForToken(config, device, { fetchFn: fetchFn, sleep: async function (ms) { waits.push(ms); }, now: function () { return 0; } });
	assert.deepEqual(waits, [5000, 10000]);
});

test('access_denied termina el flujo con error', async () => {
	const fetchFn = scripted([jsonResponse(403, { error: 'access_denied' })]);
	await assert.rejects(pollForToken(config, { deviceCode: 'dc', interval: 1, expiresIn: 60 }, { fetchFn: fetchFn, sleep: async function () {}, now: function () { return 0; } }), function (e) { return e.code === 'access_denied'; });
});

test('pollForToken no hace peticiones si el código ya caducó', async () => {
	const fetchFn = scripted([]);
	await assert.rejects(pollForToken(config, { deviceCode: 'dc', interval: 1, expiresAt: 500 }, { fetchFn: fetchFn, sleep: async function () {}, now: function () { return 1000; } }), function (e) { return e.code === 'expired_token'; });
	assert.equal(fetchFn.calls.length, 0);
});

test('refreshAccessToken conserva el refresh token anterior si Google no devuelve uno nuevo', async () => {
	const fetchFn = scripted([jsonResponse(200, { access_token: 'nuevo', expires_in: 3600 })]);
	const tokens = await refreshAccessToken(config, 'rt-viejo', { fetchFn: fetchFn, now: function () { return 0; } });
	assert.equal(tokens.accessToken, 'nuevo');
	assert.equal(tokens.refreshToken, 'rt-viejo');
	assert.match(fetchFn.calls[0].body, /grant_type=refresh_token/);
	assert.equal(fetchFn.calls[0].url, TOKEN_URL);
});

test('invalid_grant en refresh exige volver a autorizar', async () => {
	const fetchFn = scripted([jsonResponse(400, { error: 'invalid_grant' })]);
	await assert.rejects(refreshAccessToken(config, 'rt', { fetchFn: fetchFn }), function (e) { return e.code === 'invalid_grant'; });
});

test('isExpired aplica margen de 60 s', () => {
	const tokens = { expiresAt: 100000 };
	assert.equal(isExpired(tokens, function () { return 0; }), false);
	assert.equal(isExpired(tokens, function () { return 50000; }), true);
	assert.equal(isExpired(null, function () { return 0; }), true);
});
