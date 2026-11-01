// Traducción de la interfaz a inglés. El texto de la app está en español; cuando el idioma es "en",
// este módulo reemplaza cada texto visible conocido. Así no hay que tocar cada pantalla.
// - EXACT: textos completos (botones, títulos, mensajes fijos).
// - PATTERNS: textos con números, nombres o fechas (se reescriben con sus partes).
// Lo que no está en el diccionario (por ejemplo, nombres de archivos o detalles técnicos) se muestra tal cual.
(function (root) {
	var EXACT = {
		// Pestañas y barra superior
		'Inicio': 'Home', 'Explorar': 'Explore', 'Video': 'Video', 'Música': 'Music', 'Fotos': 'Photos',
		'Atrás': 'Back', 'Ajustes': 'Settings', 'Abrir': 'Open', 'Cambiar': 'Change', 'OK': 'OK',
		'Biblioteca': 'Library', 'Recargar': 'Reload', 'Subir': 'Up', 'Ver': 'View',
		'Continuar viendo': 'Continue watching', 'Recientes': 'Recent', 'Carpetas favoritas': 'Favorite folders',
		'Carpetas de la biblioteca': 'Library folders', 'Películas y videos': 'Movies and videos',
		'Pistas de audio': 'Audio tracks', 'Imágenes': 'Images', 'Ver todo': 'See all',
		'Borrar historial': 'Clear history', 'de Continuar viendo': 'from Continue watching',
		'¿Borrar? OK de nuevo': 'Clear? Press OK again',
		'Nada en curso. Empieza un video desde Video o Explorar.': 'Nothing in progress. Start a video from Explore.',
		'Todavía no hay videos recientes.': 'No recent videos yet.',
		'Sin favoritas. Márcalas desde Explorar.': 'No favorites. Mark them from Explore.',
		'Marcar como favorita': 'Mark as favorite', 'Quitar de favoritas': 'Remove from favorites',
		'Ordenar por': 'Sort by', 'Nombre': 'Name', 'Fecha': 'Date', 'Tamaño': 'Size', 'Modificado': 'Modified',
		'Vista de lista': 'List view', 'Vista de detalle': 'Detail view', 'Vista de miniatura': 'Thumbnail view',
		'Carpeta': 'Folder', 'Archivo': 'File', 'Foto': 'Photo', 'Pista': 'Track', 'Carpeta vacía: no hay archivos compatibles.': 'Empty folder: no supported files.',
		'Cargando biblioteca…': 'Loading library…', 'Cargando carpeta…': 'Loading folder…',
		'Volver a la lista': 'Back to list', 'Volver a la lista de videos': 'Back to video list',
		'Vuelve al inicio de la lista': 'Back to the top of the list', 'Vuelve al inicio de la página': 'Back to the top of the page',
		'Sube a la carpeta anterior': 'Up to the previous folder', 'Cierra el visor': 'Close the viewer',
		'Reproducir': 'Play', 'Reproducir todo': 'Play all', 'Reproducir en aleatorio': 'Play shuffled',
		'Reproducir desde el inicio': 'Play from the start', 'Continuar desde': 'Continue from',
		'Pausar': 'Pause', 'Reproducir o pausar': 'Play or pause', 'En pausa': 'Paused', 'Sonando': 'Playing',
		'Anterior': 'Previous', 'Siguiente': 'Next', 'Aleatorio': 'Shuffle', 'Repetir': 'Repeat',
		'Iniciar presentación': 'Start slideshow', 'Izquierda / derecha: cambiar foto · OK: presentación · Atrás: cerrar': 'Left / right: change photo · OK: slideshow · Back: close',
		'Buscando música en la biblioteca…': 'Searching music in the library…', 'Buscando fotos en la biblioteca…': 'Searching photos in the library…',
		'Buscando videos en la biblioteca…': 'Searching videos in the library…',
		'Buscando música…': 'Searching music…', 'Buscando fotos…': 'Searching photos…',
		'No hay pistas de audio en la biblioteca.': 'No audio tracks in the library.', 'No hay fotos en la biblioteca.': 'No photos in the library.',
		'No hay videos en la biblioteca.': 'No videos in the library.',
		'· carpetas primero': '· folders first', '· presentación activa': '· slideshow on',
		'Reproduciendo: ': 'Playing: ', 'En pausa: ': 'Paused: ', 'Aleatorio: no': 'Shuffle: off', 'Repetir: no': 'Repeat: off',
		'Vuelve a 1x': 'Back to 1x', 'Volver a 1x': 'Back to 1x', 'Reproducción': 'Playback',

		'Video anterior': 'Previous video', 'Video siguiente': 'Next video',
		// Controles de la vista completa y del mini
		'Avance rápido': 'Fast forward', 'Retroceso rápido': 'Fast rewind', 'Avanzar 10 segundos': 'Forward 10 seconds',
		'Retroceder 10 segundos': 'Back 10 seconds', 'Audio y subtítulos': 'Audio and subtitles', 'Posición del video': 'Video position',
		'Cambiar esquina': 'Change corner', 'Cambiar tamaño': 'Change size', 'Cerrar': 'Close', 'Ver completo': 'Full view',
		// Pistas
		'Audio': 'Audio', 'Subtítulos': 'Subtitles', 'Activo': 'Active', 'Subtítulos: desactivados': 'Subtitles: off',
		'Audio y subtítulos ': 'Audio and subtitles ', 'OK: seleccionar · Atrás: cerrar': 'OK: select · Back: close',
		'Este video no permite elegir audio.': 'This video does not allow choosing audio.',
		'Sin subtítulos: la URL no pasa por el proxy.': 'No subtitles: the URL does not go through the proxy.',
		'Subtítulos no disponibles: ': 'Subtitles not available: ', 'Audio: ': 'Audio: ', 'Subtítulos: ': 'Subtitles: ',
		// Ajustes
		'Errores recientes': 'Recent errors', 'Sin errores registrados.': 'No errors recorded.', 'Borrar registro': 'Clear log',
		'Qué hacer: ': 'What to do: ', 'Estado': 'Status', 'Cuenta vinculada': 'Linked account', 'Cuenta de servicio': 'Service account',
		'Google Drive': 'Google Drive', 'Pruebas de desarrollo': 'Development tests', 'Diagnóstico de firma RSA': 'RSA signature diagnostic',
		'Prueba de Drive': 'Drive test', 'Prueba de reproducción': 'Playback test', 'Prueba de mini reproductor': 'Mini player test',
		'Tema': 'Theme', 'Tipo de letra': 'Font', 'Tamaño de texto': 'Text size', 'Idioma': 'Language',
		'Intervalo de presentación': 'Slideshow interval', 'Orden por defecto': 'Default sort', 'Cerrar sesión': 'Log out',
		'Negro OLED': 'Black OLED', 'Nocturne': 'Nocturne', 'Grafito ámbar': 'Amber graphite', 'Bosque': 'Forest', 'Alto contraste': 'High contrast',
		'Inter': 'Inter', 'Atkinson Hyperlegible': 'Atkinson Hyperlegible', 'Fira Code': 'Fira Code',
		'Normal': 'Normal', 'Pequeño': 'Small', 'Muy pequeño': 'Very small', 'Mínimo': 'Minimal',
		'Español': 'Spanish', 'English': 'English',
		'Datos de esta TV borrados: progreso, recientes, favoritas y ajustes. El acceso a Drive sigue con la cuenta de servicio de la app.':
			'This TV\'s data was cleared: progress, recent items, favorites and settings. Drive access still uses the app\'s service account.',
		'Biblioteca: cargando carpetas compartidas…': 'Library: loading shared folders…',
		'Biblioteca: no hay carpetas compartidas con la cuenta de servicio.': 'Library: no folders are shared with the service account.',
		'Reproducción: con proxy (remux automático y subtítulos disponibles).': 'Playback: with proxy (automatic remux and subtitles available).',
		'Reproducción: sin proxy (solo reproducción directa).': 'Playback: without proxy (direct playback only).',
		'Motor web: ': 'Web engine: ', 'Sin llave: revisa js/service-account.js': 'No key: check js/service-account.js',
		'Cuenta de servicio ': 'Service account ', 'Error: ': 'Error: ',
		// Errores registrados: títulos, explicaciones y acciones
		'Un archivo de la app no cargó': 'An app file did not load',
		'La TV no encontró js/app.js o js/service-account.js. Sin ellos no hay acceso a Drive.': 'The TV did not find js/app.js or js/service-account.js. Without them there is no access to Drive.',
		'Vuelve a instalar la app completa (npm run package:tv y ares-install).': 'Reinstall the full app (npm run package:tv and ares-install).',
		'Formato no soportado por la TV': 'Format not supported by the TV',
		'La TV no puede decodificar el video o el audio de ese archivo.': 'The TV cannot decode this file\'s video or audio.',
		'Convierte el archivo a MP4 (H.264 + AAC) o MKV con pistas compatibles.': 'Convert the file to MP4 (H.264 + AAC) or MKV with compatible tracks.',
		'El archivo no se pudo decodificar': 'The file could not be decoded',
		'El archivo está dañado o usa un códec que la TV no maneja.': 'The file is damaged or uses a codec the TV does not handle.',
		'Prueba el archivo en otro reproductor; si funciona allí, conviértelo.': 'Try the file in another player; if it works there, convert it.',
		'Se cortó la red durante la reproducción': 'The network dropped during playback',
		'La TV dejó de recibir datos del proxy o de Drive.': 'The TV stopped receiving data from the proxy or Drive.',
		'Revisa la conexión de la TV y vuelve a abrir el video. Si se repite, revisa la Mac y el proxy.': 'Check the TV connection and open the video again. If it repeats, check the Mac and the proxy.',
		'El video no empezó a tiempo': 'The video did not start in time',
		'El proxy o Drive tardaron más de lo esperado en enviar los primeros datos.': 'The proxy or Drive took longer than expected to send the first data.',
		'Confirma que el proxy esté encendido y que la IP de la Mac sea la del build.': 'Make sure the proxy is running and the Mac IP matches the build.',
		'Sin conexión con el proxy': 'No connection to the proxy',
		'La TV no alcanza el proxy de la Mac (apagado, IP cambiada o red distinta).': 'The TV cannot reach the Mac proxy (off, IP changed or different network).',
		'Enciende el proxy en la Mac, verifica su IP y que la TV esté en la misma red.': 'Turn on the proxy on the Mac, check its IP and that the TV is on the same network.',
		'Drive niega el acceso': 'Drive denies access',
		'La cuenta de servicio no tiene permiso para esa carpeta o archivo.': 'The service account does not have permission for that folder or file.',
		'Comparte la carpeta con la cuenta de servicio (client_email de la llave) como lector.': 'Share the folder with the service account (client_email in the key) as a reader.',
		'Archivo o carpeta no encontrado': 'File or folder not found',
		'Drive ya no tiene ese elemento; puede haberse movido, renombrado o eliminado.': 'Drive no longer has that item; it may have been moved, renamed or deleted.',
		'Pulsa recargar en Explorar para actualizar la lista.': 'Press reload in Explore to update the list.',
		'Drive respondió con un error temporal': 'Drive returned a temporary error',
		'Google devolvió un error del servicio o un límite de uso.': 'Google returned a service error or a usage limit.',
		'Espera un momento y pulsa recargar.': 'Wait a moment and press reload.',
		'Problema de conexión': 'Connection problem', 'La TV no pudo completar una petición de red.': 'The TV could not complete a network request.',
		'Revisa el Wi-Fi o el cable de la TV y vuelve a intentar.': 'Check the TV Wi-Fi or cable and try again.',
		'Error no clasificado': 'Unclassified error', 'La app encontró un error que no reconoce.': 'The app found an error it does not recognize.',
		'Copia el detalle técnico y revísalo con el código.': 'Copy the technical detail and review it with the code.',
		'La posición retrocedió al cambiar la velocidad': 'Position went back when the speed changed',
		'Al subir la velocidad, el video volvió a un punto anterior sin que se pidiera un salto.': 'When the speed went up, the video went back to an earlier point without a jump being requested.',
		'La app corrigió la posición. Anota el video y la velocidad: el detalle técnico muestra los segundos.': 'The app corrected the position. Note the video and the speed: the technical detail shows the seconds.',
		// Avisos de reproducción
		'El proxy respondió ': 'The proxy responded ', 'sin detalle': 'no details', 'código ': 'code ',
		'No hay conexión con el proxy. Revisa que esté corriendo y que la IP de PROXY_BASE sea la de la Mac.': 'No connection to the proxy. Check that it is running and that the PROXY_BASE IP is the Mac IP.',
		'formato no soportado por la TV': 'format not supported by the TV', 'error de red': 'network error',
		'error al decodificar': 'decoding error', 'cancelado': 'cancelled', 'desconocido': 'unknown',
		'Revisa la red y que el proxy esté encendido.': 'Check the network and that the proxy is running.',
		'Volver a ': 'Back to ', 'Detalle: ': 'Detail: ',
		// Idiomas de pistas
		'Español': 'Spanish', 'Inglés': 'English', 'Francés': 'French', 'Alemán': 'German', 'Japonés': 'Japanese',
		'Portugués': 'Portuguese', 'Sin idioma': 'No language', 'Carpeta no registrada': 'Folder not recorded',
		'Raíz de la biblioteca': 'Library root',
		// Estados de los mensajes técnicos del módulo Drive
		'Módulo Drive (js/app.js): ': 'Drive module (js/app.js): ', 'cargado': 'loaded', 'NO cargado': 'NOT loaded',
		'NO cargada': 'NOT loaded', 'cargada': 'loaded', ' · Llave (js/service-account.js): ': ' · Key (js/service-account.js): ',
		'Cargando…': 'Loading…', 'Vuelve al inicio de la página': 'Back to the top of the page',
		'Sube la página y lleva el foco al primer elemento': 'Scrolls up and moves focus to the first item',
		'Motor web': 'Web engine'
	};

	var MONTHS_EN = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
	var NOUNS = { elemento: 'item', elementos: 'items', video: 'video', videos: 'videos', foto: 'photo', fotos: 'photos',
		pista: 'track', pistas: 'tracks', carpeta: 'folder', carpetas: 'folders', registro: 'record', registros: 'records',
		'en curso': 'in progress', 'compartida(s)': 'shared' };

	// Cada patrón devuelve la traducción o null si no coincide.
	var PATTERNS = [
		[/^(\d+) (elemento|elementos|video|videos|foto|fotos|pista|pistas|carpeta|carpetas|registro|registros|en curso)$/, function (m) { return m[1] + ' ' + NOUNS[m[2]]; }],
		[/^Quedan (\d+) min$/, function (m) { return m[1] + ' min left'; }],
		[/^(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic) (\d{4})$/, function (m) { return m[1] + ' ' + MONTHS_EN[m[2]] + ' ' + m[3]; }],
		[/^(\d+),(\d) (KB|MB|GB)$/, function (m) { return m[1] + '.' + m[2] + ' ' + m[3]; }],
		[/^Aleatorio: sí$/, function () { return 'Shuffle: on'; }],
		[/^Repetir: sí$/, function () { return 'Repeat: on'; }],
		[/^Continuar desde (.+)$/, function (m) { return 'Continue from ' + m[1]; }],
		[/^Buscando (música|fotos)… Carpetas revisadas: (\d+) · (pistas|fotos) encontradas: (\d+)…$/,
			function (m) { return 'Searching ' + (m[1] === 'música' ? 'music' : 'photos') + '… Folders checked: ' + m[2] + ' · ' + (m[3] === 'pistas' ? 'tracks' : 'photos') + ' found: ' + m[4] + '…'; }],
		[/^Biblioteca: (\d+) carpeta\(s\) compartida\(s\): (.*)\.$/, function (m) { return 'Library: ' + m[1] + ' shared folder(s): ' + m[2] + '.'; }],
		[/^No se pudo abrir "(.*)": (.*)$/, function (m) { return 'Could not open "' + m[1] + '": ' + m[2]; }],
		[/^El video no empieza tras (\d+) s\. Revisa la red y que el proxy esté encendido\.$/, function (m) { return 'The video does not start after ' + m[1] + ' s. Check the network and that the proxy is running.'; }],
		[/^La TV no pudo reproducir el archivo \(código (\d+): (.*)\)\.( Detalle: .*)?$/, function (m) { return 'The TV could not play the file (code ' + m[1] + ': ' + (EXACT[m[2]] || m[2]) + ').' + (m[3] ? ' Details: ' + m[3].slice(10) : ''); }],
		[/^(\d+) (elemento|elementos) · carpetas primero$/, function (m) { return m[1] + (m[2] === 'elemento' ? ' item' : ' items') + ' · folders first'; }],
		[/^Error: (.*)$/, function (m) { return 'Error: ' + m[1]; }],
		[/^Continuar desde (\d+:\d+)$/, function (m) { return 'Continue from ' + m[1]; }],
		[/^Biblioteca: (.*)$/, function (m) { return 'Library: ' + m[1]; }]
	];

	// Claves con espacio final (etiqueta + valor dinámico): se traduce solo la etiqueta.
	var PREFIXES = Object.keys(EXACT).filter(function (k) { return k !== k.trim() && EXACT[k]; });

	// Traduce un texto completo. Devuelve la traducción, o null si no hay ninguna.
	function translateText(text) {
		var t = String(text).trim();
		if (!t) return null;
		if (Object.prototype.hasOwnProperty.call(EXACT, t) && EXACT[t]) return text.replace(t, EXACT[t]);
		for (var k = 0; k < PREFIXES.length; k++) {
			var label = PREFIXES[k].trim();
			if (t.indexOf(label + ' ') === 0) return text.replace(t, EXACT[PREFIXES[k]].trim() + ' ' + t.slice(label.length + 1));
		}
		for (var i = 0; i < PATTERNS.length; i++) {
			var fn = PATTERNS[i][1];
			var m = t.match(PATTERNS[i][0]);
			if (m && fn) return text.replace(t, fn(m));
		}
		return null;
	}

	function isEnglish() {
		var s = root.CodeStore ? root.CodeStore.settings() : null;
		return Boolean(s && s.lang === 'en');
	}

	function translateNode(node) {
		if (node.nodeType === 3) {
			var out = translateText(node.nodeValue);
			if (out !== null && out !== node.nodeValue) node.nodeValue = out;
		} else if (node.nodeType === 1) {
			['aria-label', 'title'].forEach(function (attr) {
				if (!node.hasAttribute(attr)) return;
				var out = translateText(node.getAttribute(attr));
				if (out !== null && out !== node.getAttribute(attr)) node.setAttribute(attr, out);
			});
			for (var c = node.firstChild; c; c = c.nextSibling) translateNode(c);
		}
	}

	// Traduce lo que se dibuja después (listas, mensajes, cambios de estado). Así las pantallas no cambian.
	function start() {
		document.documentElement.lang = 'en';
		translateNode(document.body);
		var observer = new MutationObserver(function (records) {
			records.forEach(function (r) {
				if (r.type === 'characterData') translateNode(r.target);
				else if (r.type === 'attributes') translateNode(r.target);
				else r.addedNodes.forEach(translateNode);
			});
		});
		observer.observe(document.body, { childList: true, subtree: true, characterData: true,
			attributes: true, attributeFilter: ['aria-label', 'title'] });
	}

	root.CodeI18n = {
		isEnglish: isEnglish,
		translate: translateText,
		start: start,
	};

	if (isEnglish()) {
		if (document.body) start();
		else document.addEventListener('DOMContentLoaded', start);
	}
})(window);
