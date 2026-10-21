// Autenticación con cuenta de servicio: la TV firma el JWT RS256 con crypto.subtle.
// Sintaxis compilada para Chrome 53; crypto.subtle se verificó en la TV 2021.

export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const DRIVE_READONLY = 'https://www.googleapis.com/auth/drive.readonly';
const JWT_GRANT = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

export function pemToDer(pem) {
	const b64 = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes.buffer;
}

export function b64url(bytes) {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function buildJwt(key, cryptoObj, nowSeconds) {
	const now = nowSeconds || Math.floor(Date.now() / 1000);
	const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
	const claims = b64url(new TextEncoder().encode(JSON.stringify({
		iss: key.client_email,
		scope: DRIVE_READONLY,
		aud: TOKEN_URL,
		iat: now,
		exp: now + 3600,
	})));
	const input = header + '.' + claims;
	const privateKey = await cryptoObj.subtle.importKey(
		'pkcs8',
		pemToDer(key.private_key),
		{ name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
		false,
		['sign']
	);
	const signature = await cryptoObj.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, new TextEncoder().encode(input));
	return input + '.' + b64url(new Uint8Array(signature));
}

export async function exchangeToken(key, cryptoObj, fetchFn) {
	const doFetch = fetchFn || fetch;
	const assertion = await buildJwt(key, cryptoObj);
	const res = await doFetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ grant_type: JWT_GRANT, assertion: assertion }).toString(),
	});
	const data = await res.json();
	if (!res.ok) throw new Error('token: ' + (data.error_description || data.error || res.status));
	return { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
}
