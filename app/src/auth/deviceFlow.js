// Flujo de dispositivo de Google (OAuth 2.0 para TV y dispositivos de entrada limitada).
// Sintaxis ES2017 para el motor web de la TV de 2020. Sin optional chaining ni nullish.

export const DEVICE_CODE_URL = 'https://oauth2.googleapis.com/device/code';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

export class AuthError extends Error {
	constructor(code, message) {
		super(message || code);
		this.code = code;
	}
}

function formBody(fields) {
	const params = new URLSearchParams();
	Object.keys(fields).forEach(function (key) {
		if (fields[key] !== undefined && fields[key] !== null) params.append(key, fields[key]);
	});
	return params.toString();
}

async function readJson(res) {
	try {
		return await res.json();
	} catch (e) {
		return {};
	}
}

// Paso 1: pide código de dispositivo. El usuario lo introduce en el teléfono.
export async function requestDeviceCode(config, fetchFn = fetch) {
	const res = await fetchFn(DEVICE_CODE_URL, {
		method: 'POST',
		headers: FORM_HEADERS,
		body: formBody({ client_id: config.clientId, scope: config.scope }),
	});
	const data = await readJson(res);
	if (!res.ok) throw new AuthError(data.error || 'device_code_failed', data.error_description);
	return {
		deviceCode: data.device_code,
		userCode: data.user_code,
		verificationUrl: data.verification_url || data.verification_uri,
		expiresAt: null,
		expiresIn: data.expires_in,
		interval: data.interval || 5,
	};
}

// Paso 2: sondea el token hasta que el usuario autorice, se deniegue o caduque el código.
// opts: { fetchFn, sleep(ms), now() } inyectables para pruebas.
export async function pollForToken(config, device, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const sleep = (opts && opts.sleep) || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
	const now = (opts && opts.now) || function () { return Date.now(); };
	const deadline = device.expiresAt || now() + device.expiresIn * 1000;
	let interval = device.interval;

	while (now() < deadline) {
		await sleep(interval * 1000);
		const res = await fetchFn(TOKEN_URL, {
			method: 'POST',
			headers: FORM_HEADERS,
			body: formBody({
				client_id: config.clientId,
				client_secret: config.clientSecret,
				device_code: device.deviceCode,
				grant_type: DEVICE_GRANT,
			}),
		});
		const data = await readJson(res);
		if (res.ok) return toTokens(data, now());
		if (data.error === 'authorization_pending') continue;
		if (data.error === 'slow_down') { interval += 5; continue; }
		throw new AuthError(data.error || 'token_failed', data.error_description);
	}
	throw new AuthError('expired_token', 'El código de dispositivo caducó');
}

// Renueva el access token. invalid_grant significa que hay que volver a autorizar.
export async function refreshAccessToken(config, refreshToken, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const now = (opts && opts.now) || function () { return Date.now(); };
	const res = await fetchFn(TOKEN_URL, {
		method: 'POST',
		headers: FORM_HEADERS,
		body: formBody({
			client_id: config.clientId,
			client_secret: config.clientSecret,
			refresh_token: refreshToken,
			grant_type: 'refresh_token',
		}),
	});
	const data = await readJson(res);
	if (!res.ok) throw new AuthError(data.error || 'refresh_failed', data.error_description);
	return toTokens(data, now(), refreshToken);
}

function toTokens(data, issuedAt, fallbackRefresh) {
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token || fallbackRefresh || null,
		expiresAt: issuedAt + (data.expires_in || 3600) * 1000,
		scope: data.scope || null,
	};
}

// Margen de 60 s para no enviar un token a punto de caducar.
export function isExpired(tokens, now) {
	const t = now ? now() : Date.now();
	return !tokens || tokens.expiresAt - 60000 <= t;
}
