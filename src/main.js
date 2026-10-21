// Punto de entrada. Se compila a un único script clásico para el motor web de la TV.
import * as auth from './auth/deviceFlow.js';
import * as drive from './drive/driveClient.js';

window.CodeTV = { auth: auth, drive: drive };
