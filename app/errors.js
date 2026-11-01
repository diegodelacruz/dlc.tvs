// Registro de errores de la app. Guarda cada incidente con fecha, explicación, acción sugerida y detalle técnico.
// El detalle nunca incluye llaves, tokens ni el secreto del proxy. El más reciente va primero.
(function (root) {
	var KEY = 'errors';
	var MAX = 50;
	var listeners = [];

	// Patrones (en orden): el primero que coincida define título, explicación y acción.
	var RULES = [
		{ test: /Salto hacia atrás tras cambiar la velocidad/, title: 'La posición retrocedió al cambiar la velocidad',
			explain: 'Al subir la velocidad, el video volvió a un punto anterior sin que se pidiera un salto.',
			action: 'Anota la velocidad y los pasos previos; el detalle técnico muestra los segundos de antes y después.' },
		{ test: /Falta js\/|no cargó|Falta la biblioteca/i, title: 'Un archivo de la app no cargó',
			explain: 'La TV no encontró js/app.js o js/service-account.js. Sin ellos no hay acceso a Drive.',
			action: 'Vuelve a instalar la app completa (npm run package:tv y ares-install).' },
		{ test: /código 4|formato no soportado/i, title: 'Formato no soportado por la TV',
			explain: 'La TV no puede decodificar el video o el audio de ese archivo.',
			action: 'Convierte el archivo a MP4 (H.264 + AAC) o MKV con pistas compatibles.' },
		{ test: /código 3|decodificar/i, title: 'El archivo no se pudo decodificar',
			explain: 'El archivo está dañado o usa un códec que la TV no maneja.',
			action: 'Prueba el archivo en otro reproductor; si funciona allí, conviértelo.' },
		{ test: /código 2|error de red/i, title: 'Se cortó la red durante la reproducción',
			explain: 'La TV dejó de recibir datos del proxy o de Drive.',
			action: 'Revisa la conexión de la TV y vuelve a abrir el video. Si se repite, revisa la Mac y el proxy.' },
		{ test: /no empieza tras/i, title: 'El video no empezó a tiempo',
			explain: 'El proxy o Drive tardaron más de lo esperado en enviar los primeros datos.',
			action: 'Confirma que el proxy esté encendido y que la IP de la Mac sea la del build.' },
		{ test: /ECONNREFUSED|proxy|Failed to fetch|fetch failed|NetworkError|ETIMEDOUT/i, title: 'Sin conexión con el proxy',
			explain: 'La TV no alcanza el proxy de la Mac (apagado, IP cambiada o red distinta).',
			action: 'Enciende el proxy en la Mac, verifica su IP y que la TV esté en la misma red.' },
		{ test: /\b403\b|\b401\b|denegad|permiso|forbidden/i, title: 'Drive niega el acceso',
			explain: 'La cuenta de servicio no tiene permiso para esa carpeta o archivo.',
			action: 'Comparte la carpeta con la cuenta de servicio (client_email de la llave) como lector.' },
		{ test: /\b404\b|no encontrad/i, title: 'Archivo o carpeta no encontrado',
			explain: 'Drive ya no tiene ese elemento; puede haberse movido, renombrado o eliminado.',
			action: 'Pulsa recargar en Explorar para actualizar la lista.' },
		{ test: /\b429\b|\b5\d\d\b/, title: 'Drive respondió con un error temporal',
			explain: 'Google devolvió un error del servicio o un límite de uso.',
			action: 'Espera un momento y pulsa recargar.' },
		{ test: /red|network|timeout|conexi/i, title: 'Problema de conexión',
			explain: 'La TV no pudo completar una petición de red.',
			action: 'Revisa el Wi-Fi o el cable de la TV y vuelve a intentar.' },
	];

	var FALLBACK = { title: 'Error no clasificado',
		explain: 'La app encontró un error que no reconoce.',
		action: 'Copia el detalle técnico y revísalo con el código.' };

	// Quita valores sensibles del texto técnico.
	function sanitize(text) {
		return String(text)
			.replace(/Bearer\s+\S+/gi, 'Bearer [oculto]')
			.replace(/([?&]s=)[^&\s]+/g, '$1[oculto]')
			.replace(/("?private_key"?\s*[:=]\s*)"[^"]*"/gi, '$1"[oculto]"')
			.replace(/access_token["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, 'access_token=[oculto]');
	}

	function classify(text) {
		for (var i = 0; i < RULES.length; i++) {
			if (RULES[i].test.test(text)) return RULES[i];
		}
		return FALLBACK;
	}

	function stamp(ms) {
		var d = new Date(ms);
		function p(n) { return n < 10 ? '0' + n : String(n); }
		return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
			p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
	}

	function all() {
		return root.CodeStore.get(KEY, []);
	}

	function emit() {
		listeners.forEach(function (fn) { fn(); });
	}

	// Registra un error. area: dónde ocurrió (Explorar, Reproducción, Drive…). err: texto o Error.
	function record(area, err) {
		var raw = err && err.message ? err.message : String(err);
		var rule = classify(raw);
		var entry = {
			at: Date.now(),
			area: area,
			title: rule.title,
			explain: rule.explain,
			action: rule.action,
			detail: sanitize(area + ': ' + raw),
			seen: false,
		};
		var list = all();
		var last = list[0];
		// Un mismo error repetido en pocos segundos no llena el registro.
		if (last && last.detail === entry.detail && entry.at - last.at < 10000) return;
		list.unshift(entry);
		root.CodeStore.set(KEY, list.slice(0, MAX));
		emit();
	}

	function unseen() {
		return all().filter(function (e) { return !e.seen; }).length;
	}

	function markAllSeen() {
		var list = all().map(function (e) { e.seen = true; return e; });
		root.CodeStore.set(KEY, list);
		emit();
	}

	function clear() {
		root.CodeStore.set(KEY, []);
		emit();
	}

	root.CodeErrors = {
		record: record,
		list: all,
		unseen: unseen,
		markAllSeen: markAllSeen,
		clear: clear,
		subscribe: function (fn) { listeners.push(fn); },
		stamp: stamp,
		classify: classify,
		sanitize: sanitize,
	};
})(window);
