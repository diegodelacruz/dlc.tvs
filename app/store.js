// Datos guardados en la TV: progreso, recientes, favoritas y ajustes. Son preferencias de uso personal.
// Si el almacenamiento no está disponible, la app sigue funcionando sin guardar.
(function (root) {
	var PREFIX = 'codetv.';

	function get(key, fallback) {
		try {
			var raw = root.localStorage.getItem(PREFIX + key);
			return raw ? JSON.parse(raw) : fallback;
		} catch (e) {
			return fallback;
		}
	}

	function set(key, value) {
		try {
			root.localStorage.setItem(PREFIX + key, JSON.stringify(value));
		} catch (e) {
			// Sin almacenamiento: la app sigue funcionando sin guardar.
		}
	}

	var DEFAULTS = { slideSeconds: 10, sort: 'name', theme: 'Negro OLED', font: 'inter', textSize: 'normal' };

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
			};
		},
		saveSettings: function (patch) {
			var s = this.settings();
			Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
			set('settings', s);
		},
	};
})(typeof window !== 'undefined' ? window : globalThis);
