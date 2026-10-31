// Acceso a la biblioteca de Drive para las pantallas. Usa el módulo compilado (window.CodeTV) y la llave de la TV.
// La biblioteca son las carpetas compartidas con la cuenta de servicio. Cada una es una raíz de la biblioteca.
(function (root) {
	var ROOTS_ID = '__biblioteca__';
	var FOLDER_MIME = 'application/vnd.google-apps.folder';
	var TOKEN_TTL_MS = 50 * 60 * 1000;
	var MAX_FOLDERS = 300;
	var token = null;
	var tokenUntil = 0;
	var rootsPromise = null;
	var listCache = {};
	var crawlCache = {};

	// Diagnóstico: qué parte de la biblioteca cargó. Se muestra en Ajustes.
	function status() {
		return 'Módulo Drive (js/app.js): ' + (root.CodeTV ? 'cargado' : 'NO cargado') +
			' · Llave (js/service-account.js): ' + (root.CodeTVKey ? 'cargada' : 'NO cargada');
	}

	function ready() {
		if (!root.CodeTV) {
			return Promise.reject(new Error('Falta js/app.js: el módulo de Drive no cargó. ' + status()));
		}
		if (!root.CodeTVKey) {
			return Promise.reject(new Error('Falta js/service-account.js: la llave no cargó. ' + status()));
		}
		return Promise.resolve();
	}

	function tokenNow() {
		if (token && Date.now() < tokenUntil) return Promise.resolve(token);
		return ready().then(function () {
			return root.CodeTV.serviceAccount.exchangeToken(root.CodeTVKey, root.crypto);
		}).then(function (t) {
			token = t.accessToken;
			tokenUntil = Date.now() + TOKEN_TTL_MS;
			return token;
		});
	}

	// Carpetas de la biblioteca: las compartidas con la cuenta de servicio cuyo padre no es otra compartida.
	function roots() {
		if (rootsPromise) return rootsPromise;
		rootsPromise = tokenNow().then(function (t) {
			return root.CodeTV.drive.listSharedFolders(t);
		}).then(function (folders) {
			var shared = {};
			folders.forEach(function (f) { shared[f.id] = true; });
			var list = folders.filter(function (f) {
				return !f.parents.some(function (p) { return shared[p]; });
			}).map(function (f) {
				return { id: f.id, name: f.name, kind: 'folder', mimeType: FOLDER_MIME, size: 0, modifiedTime: '' };
			});
			list.sort(function (a, b) { return a.name.localeCompare(b.name); });
			return list;
		}).catch(function (e) {
			rootsPromise = null;
			throw e;
		});
		return rootsPromise;
	}

	// Hijos de una carpeta (carpetas y medios), con caché en memoria. ROOTS_ID lista las raíces.
	function children(folderId) {
		if (folderId === ROOTS_ID) return roots();
		if (listCache[folderId]) return Promise.resolve(listCache[folderId]);
		return tokenNow().then(function (t) {
			return root.CodeTV.drive.listChildren(folderId, t);
		}).then(function (items) {
			listCache[folderId] = items;
			return items;
		});
	}

	// Recorre todas las raíces y sus subcarpetas (hasta MAX_FOLDERS) y devuelve los archivos del tipo pedido con su ruta.
	// kinds: lista como ['video'] o ['audio'] o ['image'].
	function crawl(kinds) {
		var key = kinds.join(',');
		if (crawlCache[key]) return crawlCache[key];
		crawlCache[key] = roots().then(function (rootList) {
			var queue = rootList.map(function (r) { return { id: r.id, path: r.name }; });
			var found = [];
			var visited = 0;
			function step() {
				if (queue.length === 0 || visited >= MAX_FOLDERS) return Promise.resolve(found);
				var current = queue.shift();
				visited++;
				return children(current.id).then(function (items) {
					items.forEach(function (item) {
						var where = current.path ? current.path + ' / ' : '';
						if (item.kind === 'folder') {
							queue.push({ id: item.id, path: where + item.name });
						} else if (kinds.indexOf(item.kind) >= 0) {
							found.push({ id: item.id, name: item.name, kind: item.kind, size: item.size, modifiedTime: item.modifiedTime, mimeType: item.mimeType, path: where + item.name });
						}
					});
					return step();
				});
			}
			return step();
		}).catch(function (e) {
			delete crawlCache[key];
			throw e;
		});
		return crawlCache[key];
	}

	// URL que el elemento multimedia puede abrir. Con proxy, el token lo añade el proxy.
	function urlFor(file) {
		var config = root.CodeTVConfig;
		if (config && config.proxyBase) {
			return Promise.resolve(config.proxyBase + '/stream/' + file.id + '?s=' + encodeURIComponent(config.proxySecret));
		}
		return tokenNow().then(function (t) {
			return root.CodeTV.drive.mediaUrl(file.id, t);
		});
	}

	root.CodeDrive = {
		ROOTS_ID: ROOTS_ID,
		roots: roots,
		children: children,
		crawl: crawl,
		urlFor: urlFor,
		hasProxy: function () { return Boolean(root.CodeTVConfig && root.CodeTVConfig.proxyBase); },
		ready: ready,
		status: status,
	};
})(window);
