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

	root.CodeLogic = {
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
