// Cliente de Google Drive para listar y reproducir archivos multimedia.
// Sintaxis ES2017 para el motor web de la TV de 2020.

export const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
export const FOLDER_MIME = 'application/vnd.google-apps.folder';

const LIST_FIELDS = 'nextPageToken, files(id, name, mimeType, size, modifiedTime)';

// Categoría de la app a partir del tipo MIME de Drive. null = no soportado.
export function categorize(mimeType) {
	if (!mimeType) return null;
	if (mimeType === FOLDER_MIME) return 'folder';
	if (mimeType.indexOf('video/') === 0) return 'video';
	if (mimeType.indexOf('audio/') === 0) return 'audio';
	if (mimeType.indexOf('image/') === 0) return 'image';
	return null;
}

// Consulta de Drive para los hijos de una carpeta: carpetas y medios no borrados.
export function buildListQuery(parentId) {
	const safeParent = String(parentId).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
	return "'" + safeParent + "' in parents and trashed = false and (" +
		"mimeType = '" + FOLDER_MIME + "' or " +
		"mimeType contains 'video/' or mimeType contains 'audio/' or mimeType contains 'image/')";
}

// Lista todos los hijos siguiendo pageToken.
export async function listChildren(parentId, accessToken, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const pageSize = (opts && opts.pageSize) || 100;
	const files = [];
	let pageToken = null;
	do {
		const params = new URLSearchParams({
			q: buildListQuery(parentId),
			fields: LIST_FIELDS,
			pageSize: String(pageSize),
			orderBy: 'folder,name',
		});
		if (pageToken) params.set('pageToken', pageToken);
		const res = await fetchFn(FILES_URL + '?' + params.toString(), {
			headers: { Authorization: 'Bearer ' + accessToken },
		});
		if (!res.ok) throw new DriveError(res.status, 'list_failed');
		const data = await res.json();
		(data.files || []).forEach(function (f) {
			const kind = categorize(f.mimeType);
			if (kind) files.push({ id: f.id, name: f.name, mimeType: f.mimeType, kind: kind, size: Number(f.size) || 0, modifiedTime: f.modifiedTime });
		});
		pageToken = data.nextPageToken || null;
	} while (pageToken);
	return files;
}

// URL de contenido para el elemento <video>, <audio> o <img>.
// Un elemento multimedia no puede enviar cabeceras, por eso el token va en la URL.
// Riesgo: el token queda en el historial del reproductor. Ver docs/plan.md.
export function mediaUrl(fileId, accessToken) {
	return FILES_URL + '/' + encodeURIComponent(fileId) + '?alt=media&access_token=' + encodeURIComponent(accessToken);
}

export class DriveError extends Error {
	constructor(status, code) {
		super(code + ' (' + status + ')');
		this.status = status;
		this.code = code;
	}
}

function escapeQuery(text) {
	return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Lista los elementos de una carpeta compartida con la cuenta de servicio, buscándola por nombre.
// Devuelve null si no existe.
export async function listFolderByName(folderName, accessToken, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const params = new URLSearchParams({
		q: "name = '" + escapeQuery(folderName) + "' and mimeType = '" + FOLDER_MIME + "' and trashed = false",
		fields: 'files(id,name)',
		pageSize: '10',
	});
	const res = await fetchFn(FILES_URL + '?' + params.toString(), { headers: { Authorization: 'Bearer ' + accessToken } });
	if (!res.ok) throw new DriveError(res.status, 'search_failed');
	const found = (await res.json()).files || [];
	if (found.length === 0) return null;
	return listChildren(found[0].id, accessToken, opts);
}

// Id de una carpeta compartida con la cuenta de servicio, buscada por nombre. Devuelve null si no existe.
export async function findFolderId(folderName, accessToken, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const params = new URLSearchParams({
		q: "name = '" + escapeQuery(folderName) + "' and mimeType = '" + FOLDER_MIME + "' and trashed = false",
		fields: 'files(id,name)',
		pageSize: '10',
	});
	const res = await fetchFn(FILES_URL + '?' + params.toString(), { headers: { Authorization: 'Bearer ' + accessToken } });
	if (!res.ok) throw new DriveError(res.status, 'search_failed');
	const found = (await res.json()).files || [];
	return found.length === 0 ? null : found[0].id;
}

// Carpetas visibles para la cuenta de servicio (las que alguien compartió con ella), con sus padres.
export async function listSharedFolders(accessToken, opts) {
	const fetchFn = (opts && opts.fetchFn) || fetch;
	const folders = [];
	let pageToken = null;
	do {
		const params = new URLSearchParams({
			q: "mimeType = '" + FOLDER_MIME + "' and trashed = false",
			fields: 'nextPageToken, files(id, name, parents)',
			pageSize: '100',
		});
		if (pageToken) params.set('pageToken', pageToken);
		const res = await fetchFn(FILES_URL + '?' + params.toString(), { headers: { Authorization: 'Bearer ' + accessToken } });
		if (!res.ok) throw new DriveError(res.status, 'shared_failed');
		const data = await res.json();
		(data.files || []).forEach(function (f) {
			folders.push({ id: f.id, name: f.name, parents: f.parents || [] });
		});
		pageToken = data.nextPageToken || null;
	} while (pageToken);
	return folders;
}
