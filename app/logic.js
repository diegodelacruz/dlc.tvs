// Funciones puras de la app: orden, progreso, tiempos y listas. Sin acceso al DOM ni a la red.
(function (root) {
	// Carpetas primero; luego ordena por 'name', 'date' (más reciente primero) o 'size' (más grande primero).
	function sortItems(items, mode) {
		var list = items.slice();
		list.sort(function (a, b) {
			var fa = a.kind === 'folder' ? 0 : 1;
			var fb = b.kind === 'folder' ? 0 : 1;
			if (fa !== fb) return fa - fb;
			if (mode === 'date') return String(b.modifiedTime || '').localeCompare(String(a.modifiedTime || ''));
			if (mode === 'size') return (b.size || 0) - (a.size || 0);
			return String(a.name).localeCompare(String(b.name));
		});
		return list;
	}

	// Formato de tiempo: m:ss, o h:mm:ss si pasa de una hora.
	function formatTime(seconds) {
		var s = Math.max(0, Math.floor(seconds || 0));
		var h = Math.floor(s / 3600);
		var m = Math.floor((s % 3600) / 60);
		var r = s % 60;
		var mm = h > 0 && m < 10 ? '0' + m : String(m);
		var ss = r < 10 ? '0' + r : String(r);
		return h > 0 ? h + ':' + mm + ':' + ss : m + ':' + ss;
	}

	// Un archivo se considera en curso si tiene posición guardada y no está casi terminado.
	function isInProgress(entry) {
		if (!entry || !entry.time || entry.time < 5) return false;
		if (entry.duration && entry.time > entry.duration - 30) return false;
		return true;
	}

	// Lista de "Continuar viendo": entradas en curso, más recientes primero.
	function continueList(progress, max) {
		var list = Object.keys(progress || {}).map(function (id) {
			var e = progress[id];
			return { id: id, name: e.name, time: e.time, duration: e.duration, updated: e.updated || 0 };
		}).filter(isInProgress);
		list.sort(function (a, b) { return b.updated - a.updated; });
		return list.slice(0, max || 10);
	}

	// Añade un elemento al inicio de la lista de recientes, sin duplicados, y limita el tamaño.
	function pushRecent(list, item, max) {
		var out = (list || []).filter(function (x) { return x.id !== item.id; });
		out.unshift(item);
		return out.slice(0, max || 10);
	}

	// Orden de reproducción: índices 0..n-1 en orden o mezclados (Fisher-Yates con randomFn en [0, 1)).
	function playOrder(n, shuffle, randomFn) {
		var order = [];
		for (var i = 0; i < n; i++) order.push(i);
		if (!shuffle) return order;
		var rnd = randomFn || Math.random;
		for (var j = n - 1; j > 0; j--) {
			var k = Math.floor(rnd() * (j + 1));
			var t = order[j];
			order[j] = order[k];
			order[k] = t;
		}
		return order;
	}

	// Siguiente posición en un orden de reproducción. Devuelve -1 si no hay más y no se repite.
	function nextPosition(pos, length, repeat) {
		if (length === 0) return -1;
		if (pos + 1 < length) return pos + 1;
		return repeat ? 0 : -1;
	}

	// Posición anterior; al inicio de la lista se queda en 0.
	function previousPosition(pos) {
		return pos > 0 ? pos - 1 : 0;
	}

	// Clamp de un tiempo dentro de [0, duración].
	function clampTime(t, duration) {
		var max = duration || 0;
		return Math.max(0, Math.min(max, t));
	}

	var LANGUAGES = { eng: 'Inglés', en: 'Inglés', spa: 'Español', es: 'Español', fre: 'Francés', fra: 'Francés', fr: 'Francés', ger: 'Alemán', deu: 'Alemán', ita: 'Italiano', por: 'Portugués', jpn: 'Japonés', kor: 'Coreano', und: 'Sin idioma' };
	var MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

	// Nombre en español de un código de idioma (eng, spa...). Si no se conoce, devuelve el código.
	function languageName(code) {
		var key = String(code || 'und').toLowerCase();
		return LANGUAGES[key] || key;
	}

	// Fecha corta en español: "5 mar 2025". Vacía si no es válida.
	function dateText(iso) {
		var d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
	}

	// Nombre sin extensión.
	function titleOf(name) {
		return String(name || '').replace(/\.[A-Za-z0-9]{2,4}$/, '');
	}

	// Extensión en mayúsculas (MP4, MKV...). Vacía si no tiene.
	function extOf(name) {
		var m = String(name || '').match(/\.([A-Za-z0-9]{2,4})$/);
		return m ? m[1].toUpperCase() : '';
	}

	// Tamaño legible: 2,4 GB, 150 MB, 68 KB.
	function sizeText(bytes) {
		if (!bytes) return '';
		if (bytes >= 1e9) return (bytes / 1e9).toFixed(1).replace('.', ',') + ' GB';
		if (bytes >= 1e6) return (bytes / 1e6).toFixed(1).replace('.', ',') + ' MB';
		return Math.round(bytes / 1e3) + ' KB';
	}

	// Minutos restantes para "Quedan 31 min". Cadena vacía si no hay datos.
	function remainingText(time, duration) {
		if (!duration || duration <= time) return '';
		var min = Math.max(1, Math.round((duration - time) / 60));
		return 'Quedan ' + min + ' min';
	}

	root.CodeLogic = {
		languageName: languageName,
		dateText: dateText,
		titleOf: titleOf,
		extOf: extOf,
		sizeText: sizeText,
		remainingText: remainingText,
		sortItems: sortItems,
		formatTime: formatTime,
		isInProgress: isInProgress,
		continueList: continueList,
		pushRecent: pushRecent,
		playOrder: playOrder,
		nextPosition: nextPosition,
		previousPosition: previousPosition,
		clampTime: clampTime,
	};
})(typeof window !== 'undefined' ? window : globalThis);
