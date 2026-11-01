// Datos guardados en la TV: progreso, recientes, favoritas y ajustes. Son preferencias de uso personal.
// Si el almacenamiento no está disponible, la app sigue funcionando sin guardar.
(function (root) {
	var PREFIX = 'codetv.';

	// Lee una clave guardada. Si el JSON está dañado o el almacenamiento no existe, devuelve el valor por defecto para que la app no se detenga.
	function get(key, fallback) {
		try {
			var raw = root.localStorage.getItem(PREFIX + key);
			return raw ? JSON.parse(raw) : fallback;
		} catch (e) {
			return fallback;
		}
	}

	// Guarda una clave. Si falla (almacenamiento lleno o bloqueado), la app sigue funcionando sin persistir ese dato.
	function set(key, value) {
		try {
			root.localStorage.setItem(PREFIX + key, JSON.stringify(value));
		} catch (e) {
			// Sin almacenamiento: la app sigue funcionando sin guardar.
		}
	}

	var DEFAULTS = { slideSeconds: 10, sort: 'name', theme: 'Negro OLED', font: 'inter', textSize: 'normal', miniSize: 'normal', miniCorner: 'arriba', sortDir: 'asc', explorerView: 'detalle', lang: 'es' };

	root.CodeStore = {
		get: get,
		set: set,
		settings: function () {
			var s = get('settings', {});
			return {
				slideSeconds: s.slideSeconds || DEFAULTS.slideSeconds,
				sort: s.sort || DEFAULTS.sort,
				theme: s.theme || DEFAULTS.theme,
				font: s.font || DEFAULTS.font,
				textSize: s.textSize || DEFAULTS.textSize,
				miniSize: s.miniSize || DEFAULTS.miniSize,
				miniCorner: s.miniCorner || DEFAULTS.miniCorner,
				sortDir: s.sortDir || DEFAULTS.sortDir,
				explorerView: s.explorerView || DEFAULTS.explorerView,
				lang: s.lang || DEFAULTS.lang,
			};
		},
		saveSettings: function (patch) {
			var s = this.settings();
			Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
			set('settings', s);
		},
	};
})(typeof window !== 'undefined' ? window : globalThis);
