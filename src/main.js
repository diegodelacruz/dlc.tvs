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

window.CodeTV = { auth: auth, serviceAccount: serviceAccount, drive: drive, checkFolder: checkFolder };
