// Punto de entrada. Se compila a un único script clásico para el motor web de la TV.
import * as auth from './auth/deviceFlow.js';
import * as serviceAccount from './auth/serviceAccount.js';
import * as drive from './drive/driveClient.js';

// Prueba de punta a punta: firma con la llave de la cuenta de servicio, obtiene token
// y lista una carpeta compartida. Recibe una función que muestra cada línea de resultado.
async function checkFolder(folderName, showLine) {
	if (!window.CodeTVKey) throw new Error('No hay llave incluida (service-account.js)');
	showLine('1. Firmando JWT con crypto.subtle...');
	const token = await serviceAccount.exchangeToken(window.CodeTVKey, window.crypto);
	showLine('2. Token obtenido.');
	const files = await drive.listFolderByName(folderName, token.accessToken);
	if (files === null) {
		showLine('3. No se encontró la carpeta "' + folderName + '" compartida con la cuenta de servicio.');
		return;
	}
	showLine('3. Carpeta "' + folderName + '": ' + files.length + ' elemento(s).');
	files.forEach(function (f) {
		showLine('   - ' + f.name + ' | ' + f.mimeType + ' | ' + (f.size || '-') + ' bytes');
	});
}

// Prepara la reproducción de prueba: obtiene token, lista los videos y devuelve una función
// que asigna la URL de Drive (con access_token) al elemento <video> indicado.
async function prepareVideos(folderName) {
	if (!window.CodeTVKey) throw new Error('No hay llave incluida (service-account.js)');
	const token = await serviceAccount.exchangeToken(window.CodeTVKey, window.crypto);
	const files = await drive.listFolderByName(folderName, token.accessToken);
	if (files === null) throw new Error('No se encontró la carpeta "' + folderName + '"');
	const videos = files.filter(function (f) { return f.kind === 'video'; });
	return {
		videos: videos,
		url: function (file) {
			const config = window.CodeTVConfig;
			if (config && config.proxyBase) {
				return config.proxyBase + '/stream/' + file.id + '?s=' + encodeURIComponent(config.proxySecret);
			}
			return drive.mediaUrl(file.id, token.accessToken);
		},
	};
}

window.CodeTV = {
	auth: auth,
	serviceAccount: serviceAccount,
	drive: drive,
	checkFolder: checkFolder,
	prepareVideos: prepareVideos,
};
