// Pantallas de la app: Inicio, Explorar, Video, Música, Fotos y Ajustes. Mismo diseño que el prototipo.
// Cada pantalla se dibuja al entrar. Atrás pasa primero por back(), que deshace un nivel dentro de la pantalla.
(function (root) {
	var SORT_LABEL = { name: 'Nombre', date: 'Fecha', size: 'Tamaño' };
	var AREA = { explore: 'Explorar', music: 'Música', photo: 'Fotos', video: 'Video' };
	var SORT_ORDER = ['name', 'date', 'size'];
	// Dirección por defecto de cada orden: nombre A-Z; fecha y tamaño, de mayor a menor.
	var SORT_DEFAULT_DIR = { name: 'asc', date: 'desc', size: 'desc' };
	var VIEW_MODES = [
		{ id: 'lista', label: 'Vista de lista', icon: 'viewList' },
		{ id: 'detalle', label: 'Vista de detalle', icon: 'viewDetail' },
		{ id: 'miniatura', label: 'Vista de miniatura', icon: 'viewGrid' },
	];
	var KIND_LABEL = { folder: 'Carpeta', video: 'Video', audio: 'Audio', image: 'Foto' };
	var ICON = root.CodeIcons.icon;
	var KIND_ICON = root.CodeIcons.kindIcon;
	var L = root.CodeLogic;

	// Plural correcto en español: 1 video, 2 videos.
	function plural(n, one, many) {
		return n + ' ' + (n === 1 ? one : many);
	}

	var explore = { stack: [], scrollY: null };
	var videoState = { list: [], detail: null };
	var musicRows = [];
	var viewer = { open: false, list: [], index: 0, timer: null };

	function $(id) { return document.getElementById(id); }

	// Vacía un contenedor antes de volver a dibujarlo. Así cada render parte de cero y no quedan elementos viejos.
	function clear(node) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

	// Crea un elemento con clase y texto. El texto se asigna como textContent, para que nunca se interprete como HTML.
	function el(tag, cls, text) {
		var n = document.createElement(tag);
		if (cls) n.className = cls;
		if (text !== undefined && text !== null) n.textContent = text;
		return n;
	}

	// Enlace de acción (botón o fila). html solo para iconos fijos de este archivo.
	function action(cls, label, onPick, iconHtml) {
		var a = el('a', cls);
		a.href = '#';
		if (iconHtml) a.innerHTML = iconHtml;
		a.appendChild(document.createTextNode(label));
		a.onclick = function () { onPick(); return false; };
		return a;
	}

	// Avance de una búsqueda larga: carpetas revisadas y archivos encontrados.
	function crawlProgress(id, label, unit) {
		return function (p) {
			status(id, label + ' Carpetas revisadas: ' + p.folders + ' · ' + unit + ' encontradas: ' + p.files + '…');
		};
	}

	// Escribe un mensaje de estado. Si termina en … muestra el giro, para indicar que hay trabajo en curso.
	function status(id, msg) {
		var node = $(id);
		node.textContent = msg || '';
		// Un mensaje que termina en … indica trabajo en curso: se muestra con un giro.
		node.classList.toggle('busy', /…/.test(msg || ''));
	}

	// Muestra un error en la pantalla y lo registra, para que el problema quede visible y también en Ajustes.
	function fail(id, e) {
		status(id, 'Error: ' + (e && e.message ? e.message : String(e)));
		root.CodeErrors.record(AREA[id.split('-')[0]] || 'Pantalla', e);
	}

	// Lleva el foco al primer enlace de una lista, para que el control remoto tenga un punto de partida.
	function focusFirst(id) {
		var a = $(id).querySelector('a');
		if (a) a.focus();
	}

	// Agrega el archivo a Recientes (con su carpeta) cada vez que se abre, con el último visto primero.
	function remember(file) {
		root.CodeStore.set('recent', L.pushRecent(root.CodeStore.get('recent', []), { id: file.id, name: file.name, kind: file.kind, path: file.path || '' }, 30));
	}

	// Lee la lista de carpetas favoritas guardada en la TV.
	function favorites() {
		return root.CodeStore.get('favs', []);
	}

	// Indica si una carpeta está en favoritas. Se usa para mostrar la estrella activa.
	function isFavorite(id) {
		return favorites().some(function (f) { return f.id === id; });
	}

	// Agrega o quita una carpeta de favoritas. Se guarda solo id y nombre, lo mínimo para mostrarla.
	function toggleFavorite(folder) {
		var list = favorites();
		var exists = list.some(function (f) { return f.id === folder.id; });
		root.CodeStore.set('favs', exists ? list.filter(function (f) { return f.id !== folder.id; }) : list.concat([folder]));
	}

	// Tarjeta del prototipo: miniatura con etiqueta, nota, barra de progreso, título y detalle.
	function card(o) {
		var a = el('a', 'card');
		a.href = '#';
		if (o.id) a.setAttribute('data-id', o.id);
		a.onclick = function () { o.onPick(); return false; };
		var thumb = el('div', 'thumb');
		if (o.imageUrl) {
			var img = el('img');
			img.alt = '';
			thumb.appendChild(img);
			o.imageUrl().then(function (url) { if (url) img.src = url; });
		}
		if (o.chip) {
			var chip = el('span', 'chip');
			chip.innerHTML = KIND_ICON(o.kind || 'file', 18);
			chip.appendChild(document.createTextNode(o.chip));
			thumb.appendChild(chip);
		}
		if (o.note) thumb.appendChild(el('span', 'thumb-note', o.note));
		if (typeof o.progress === 'number' && o.progress > 0) {
			var bar = el('div', 'progress');
			var fill = el('i');
			fill.style.width = Math.min(100, Math.round(o.progress * 100)) + '%';
			bar.appendChild(fill);
			thumb.appendChild(bar);
		}
		a.appendChild(thumb);
		var body = el('div', 'card-body');
		body.appendChild(el('div', 'card-title', o.title));
		if (o.meta) body.appendChild(el('div', 'card-meta', o.meta));
		if (o.folder) body.appendChild(el('div', 'card-folder', o.folder));
		a.appendChild(body);
		return a;
	}

	// Tarjeta "Ver todo" al final de una fila. Lleva a la lista completa cuando hay más elementos que los mostrados.
	function moreCard(count, onPick) {
		var a = el('a', 'card more');
		a.href = '#';
		a.onclick = function () { onPick(); return false; };
		a.innerHTML = '<div class="card-body"><div class="arrow">' + ICON('arrow', 40) + '</div></div>';
		var body = a.querySelector('.card-body');
		body.appendChild(el('div', 'card-title', 'Ver todo'));
		body.appendChild(el('div', 'card-meta', count));
		return a;
	}

	// Mensaje cuando una sección no tiene contenido, para que la pantalla nunca quede vacía sin explicación.
	function emptyNote(parent, msg) {
		parent.appendChild(el('p', 'status', msg));
	}

	// Fila de lista: tile con icono, nombre (y ruta), columnas de fecha y tamaño.
	function row(o) {
		var a = el('a', 'row');
		a.href = '#';
		if (o.id) a.setAttribute('data-id', o.id);
		a.onclick = function () { o.onPick(); return false; };
		var tile = el('span', 'tile' + (o.art ? ' art' : ''));
		tile.innerHTML = o.art ? ICON('wave', 28) : KIND_ICON(o.kind, 30);
		a.appendChild(tile);
		if (o.no) a.appendChild(el('span', 'row-no', String(o.no)));
		var name = el('span', 'row-name');
		name.appendChild(document.createTextNode(o.title));
		if (o.sub) {
			var sub = el('span', 'row-sub', o.sub);
			sub.style.display = 'block';
			sub.style.fontSize = '24px';
			sub.style.color = 'var(--muted)';
			name.appendChild(sub);
		}
		a.appendChild(name);
		if (o.tag) {
			var tag = el('span', 'tag', o.tag);
			a.appendChild(tag);
			o.tagNode = tag;
		}
		if (o.date !== undefined) a.appendChild(el('span', 'row-col wide', o.date));
		if (o.size !== undefined) a.appendChild(el('span', 'row-col', o.size));
		o.node = a;
		return a;
	}

	// ---------- Inicio ----------
	// Continuar viendo muestra como máximo 5 tarjetas; la sexta es Ver todo.
	var HOME_ROW = 5;

	// Dibuja Inicio: Continuar viendo (una tarjeta por carpeta), Recientes (solo videos), accesos y favoritas.
	function renderHome() {
		var cont = $('home-continue');
		clear(cont);
		// Una tarjeta por carpeta: el último video en curso de cada carpeta, el más reciente primero.
		var seenFolders = {};
		var inProgress = L.continueList(root.CodeStore.get('progress', {}), 200).filter(function (e) {
			var key = L.folderOf(e.path) || '';
			if (seenFolders[key]) return false;
			seenFolders[key] = true;
			return true;
		});
		var shown = inProgress.slice(0, HOME_ROW);
		$('continue-count').textContent = inProgress.length ? plural(inProgress.length, 'carpeta', 'carpetas') : '';
		if (inProgress.length === 0) emptyNote(cont, 'Nada en curso. Empieza un video desde Video o Explorar.');
		shown.forEach(function (e) {
			cont.appendChild(card({
				kind: 'video', chip: 'Video', note: L.extOf(e.name), title: L.titleOf(e.name),
				meta: L.remainingText(e.time, e.duration), folder: L.folderLabel(e.path), progress: e.duration ? e.time / e.duration : 0,
				imageUrl: function () { return root.CodeDrive.thumbUrl({ id: e.id }); },
				onPick: function () { root.CodeShell.playVideo({ id: e.id, name: e.name, kind: 'video', path: e.path }, e.time); },
			}));
		});
		if (inProgress.length > 0) {
			cont.appendChild(moreCard(plural(inProgress.length, 'elemento', 'elementos'), function () { root.CodeShell.show(root.CodeFlags.videoSection ? 'video' : 'explorar'); }));
		}

		var rec = $('home-recent');
		clear(rec);
		// Solo videos, en el orden en que se vieron (el último primero). Al elegir uno, sigue el siguiente de esta lista.
		var recentVideos = root.CodeStore.get('recent', []).filter(function (f) { return f.kind === 'video'; });
		$('recent-count').textContent = recentVideos.length ? plural(recentVideos.length, 'video', 'videos') : '';
		if (recentVideos.length === 0) emptyNote(rec, 'Todavía no hay videos recientes.');
		recentVideos.forEach(function (f) {
			rec.appendChild(card({
				kind: 'video', chip: 'Video', note: L.extOf(f.name), id: f.id,
				title: L.titleOf(f.name), meta: '', folder: L.folderLabel(f.path),
				imageUrl: function () { return root.CodeDrive.thumbUrl(f); },
				onPick: function () { root.CodeShell.playVideo(f, 0, recentVideos); },
			}));
		});

		// Accesos a cada sección: siempre hay algo que abrir, incluso sin historial.
		var lib = $('home-library');
		clear(lib);
		[
			{ section: 'video', title: 'Video', meta: 'Películas y videos', icon: 'video' },
			{ section: 'musica', title: 'Música', meta: 'Pistas de audio', icon: 'audio' },
			{ section: 'fotos', title: 'Fotos', meta: 'Imágenes', icon: 'image' },
			{ section: 'explorar', title: 'Explorar', meta: 'Carpetas de la biblioteca', icon: 'folder' },
		].filter(function (a) {
			return root.CodeFlags.videoSection || a.section !== 'video';
		}).forEach(function (a) {
			var c = el('a', 'card');
			c.href = '#';
			c.onclick = function () { root.CodeShell.show(a.section); return false; };
			var thumb = el('div', 'thumb access-art');
			thumb.innerHTML = ICON(a.icon, 96);
			c.appendChild(thumb);
			var body = el('div', 'card-body');
			body.appendChild(el('div', 'card-title', a.title));
			body.appendChild(el('div', 'card-meta', a.meta));
			c.appendChild(body);
			lib.appendChild(c);
		});

		var favs = $('home-favs');
		clear(favs);
		var list = favorites();
		if (list.length === 0) emptyNote(favs, 'Sin favoritas. Márcalas desde Explorar.');
		list.forEach(function (folder) {
			favs.appendChild(row({
				kind: 'folder', title: folder.name, tag: 'Carpeta',
				onPick: function () {
					explore.stack = [{ id: folder.id, name: folder.name }];
					root.CodeShell.show('explorar');
				},
			}));
		});
	}

	// Abre un archivo según su tipo. siblings: lista de la que forma parte (audio e imágenes).
	function openItem(item, siblings, index) {
		if (item.kind === 'video') {
			// La lista de reproducción son los videos de la misma carpeta, en orden alfabético.
			var videos = siblings.filter(function (s) { return s.kind === 'video'; });
			root.CodeShell.playVideo(item, 0, videos.length > 1 ? L.sortItems(videos, 'name') : undefined);
		} else if (item.kind === 'audio') {
			var tracks = siblings.filter(function (s) { return s.kind === 'audio'; });
			var at = tracks.indexOf(item);
			if (at < 0) { tracks = [item]; at = 0; }
			root.CodeMusic.setQueue(tracks, at);
			root.CodeMusic.playAt(at);
			remember(item);
		} else if (item.kind === 'image') {
			var photos = siblings.filter(function (s) { return s.kind === 'image'; });
			var pos = photos.indexOf(item);
			openViewer(photos.length ? photos : [item], pos < 0 ? 0 : pos);
		}
		void index;
	}

	// ---------- Explorar ----------
	function enterExplore() {
		if (explore.stack.length > 0) {
			renderExplore();
			return;
		}
		// La primera pantalla lista las carpetas compartidas con la app (la biblioteca).
		explore.stack = [{ id: root.CodeDrive.ROOTS_ID, name: 'Biblioteca' }];
		renderExplore();
	}

	// Dibuja la carpeta actual de Explorar con su orden, sus vistas y su favorita; restaura la posición al volver.
	function renderExplore() {
		var top = explore.stack[explore.stack.length - 1];
		status('explore-status', explore.stack.length > 1 ? 'Cargando carpeta…' : 'Cargando biblioteca…');
		root.CodeDrive.children(top.id).then(function (items) {
			var cfg = root.CodeStore.settings();
			var mode = cfg.sort;
			var dir = cfg.sortDir;
			var view = cfg.explorerView;
			var sorted = L.sortItems(items, mode, dir);
			var detail = view === 'detalle';

			var crumbs = $('explore-path');
			clear(crumbs);
			explore.stack.forEach(function (c, i) {
				crumbs.appendChild(action('', c.name, function () {
					explore.stack = explore.stack.slice(0, i + 1);
					renderExplore();
				}));
				if (i < explore.stack.length - 1) crumbs.appendChild(el('span', 'sep', '›'));
			});

			var sortBox = $('explore-sort');
			clear(sortBox);
			sortBox.appendChild(el('span', 'sort-label', 'Ordenar por'));
			SORT_ORDER.forEach(function (m) {
				var on = m === mode;
				var btn = action('btn sortbtn' + (on ? ' on' : ''), SORT_LABEL[m], function () {
					// Pulsar el orden activo invierte la dirección; uno nuevo usa su dirección por defecto.
					var nextDir = on ? (dir === 'desc' ? 'asc' : 'desc') : SORT_DEFAULT_DIR[m];
					root.CodeStore.saveSettings({ sort: m, sortDir: nextDir });
					renderExplore();
				});
				if (on) btn.appendChild(el('span', 'sort-arrow')).innerHTML = ICON(dir === 'desc' ? 'arrowDown' : 'arrowUp', 22);
				sortBox.appendChild(btn);
				sortBox.appendChild(document.createTextNode(' '));
			});
			// Favorita: en la misma fila que el orden, separada por una línea y con icono de estrella.
			if (top.id !== root.CodeDrive.ROOTS_ID) {
				var fav = isFavorite(top.id);
				sortBox.appendChild(el('span', 'tool-sep'));
				var favBtn = iconButton(fav ? 'starFill' : 'star', fav ? 'Quitar de favoritas' : 'Marcar como favorita', fav);
				favBtn.className += ' fav-btn';
				favBtn.onclick = function () {
					toggleFavorite(top);
					renderExplore();
					return false;
				};
				sortBox.appendChild(favBtn);
			}

			var tools = $('explore-tools');
			clear(tools);
			VIEW_MODES.forEach(function (v) {
				var vb = iconButton(v.icon, v.label, v.id === view);
				vb.onclick = function () {
					root.CodeStore.saveSettings({ explorerView: v.id });
					renderExplore();
					return false;
				};
				tools.appendChild(vb);
			});

			var cols = $('explore-columns');
			clear(cols);
			cols.style.display = detail ? '' : 'none';
			if (detail) {
				cols.appendChild(el('span', 'row-col wide', 'Modificado'));
				cols.appendChild(el('span', 'row-col', 'Tamaño'));
			}

			var box = $('explore-list');
			clear(box);
			box.className = view === 'miniatura' ? 'grid' : 'rows';
			sorted.forEach(function (item) {
				if (view === 'miniatura') {
					box.appendChild(explorerTile(item, sorted));
				} else if (item.kind === 'folder') {
					box.appendChild(row({
						kind: 'folder', id: item.id, title: item.name, date: detail ? L.dateText(item.modifiedTime) : '', size: '',
						onPick: function () { openFolder(item); },
					}));
				} else {
					box.appendChild(row({
						kind: item.kind, id: item.id, title: item.name, date: detail ? L.dateText(item.modifiedTime) : '', size: detail ? L.sizeText(item.size) : '',
						onPick: function () {
							remember(item);
							openItem(item, sorted, sorted.indexOf(item));
						},
					}));
				}
			});
			status('explore-status', sorted.length ? plural(sorted.length, 'elemento', 'elementos') + ' · carpetas primero' : 'Carpeta vacía: no hay archivos compatibles.');
			if (root.CodeShell.current() === 'explorar') restoreFocus('explore-list', explore.stack[explore.stack.length - 1]);
			// Al volver a Explorar, la lista queda donde se dejó.
			if (root.CodeShell.current() === 'explorar' && explore.scrollY !== null) {
				window.scrollTo(0, explore.scrollY);
				explore.scrollY = null;
			}
		}).catch(function (e) { fail('explore-status', e); });
	}

	// ---------- Video ----------
	function enterVideo() {
		if (videoState.detail) showVideoDetail(videoState.detail);
		else showVideoList();
	}

	// Enfoca el elemento de la lista que lleva el id guardado; si no hay ninguno, el primero.
	function restoreFocus(boxId, entry) {
		var target = entry && entry.focusId ? $(boxId).querySelector('[data-id="' + entry.focusId + '"]') : null;
		if (entry) entry.focusId = null;
		if (target) target.focus();
		else focusFirst(boxId);
	}

	// Lista de videos de la sección Video. Hoy la sección está desactivada por interruptor; se conserva para reactivarla.
	function showVideoList() {
		var restoreId = videoState.lastId;
		videoState.lastId = null;
		videoState.detail = null;
		$('video-detail').hidden = true;
		$('video-list').hidden = false;
		var grid = $('video-list');
		clear(grid);
		$('video-count').textContent = '';
		status('video-status', 'Buscando videos en la biblioteca…');
		root.CodeDrive.crawl(['video']).then(function (items) {
			videoState.list = L.sortItems(items, 'name');
			$('video-count').textContent = plural(videoState.list.length, 'video', 'videos') + ' en tu Drive';
			status('video-status', videoState.list.length ? '' : 'No hay videos en la biblioteca.');
			var progress = root.CodeStore.get('progress', {});
			videoState.list.forEach(function (item) {
				var entry = progress[item.id];
				var inProgress = L.isInProgress(entry);
				grid.appendChild(card({
					kind: 'video', id: item.id, chip: L.extOf(item.name), note: item.path.indexOf(' / ') >= 0 ? item.path.split(' / ').slice(-2, -1)[0] : '',
					title: L.titleOf(item.name),
					meta: inProgress ? L.remainingText(entry.time, entry.duration) : L.sizeText(item.size),
					progress: inProgress && entry.duration ? entry.time / entry.duration : 0,
					onPick: function () { showVideoDetail(item); },
				}));
			});
			if (root.CodeShell.current() === 'video') {
				var back = restoreId ? grid.querySelector('[data-id="' + restoreId + '"]') : null;
				if (back) back.focus();
				else focusFirst('video-list');
			}
		}).catch(function (e) { fail('video-status', e); });
	}

	// Ficha de un video de la sección Video, con sus acciones de reproducir o continuar.
	function showVideoDetail(item) {
		videoState.detail = item;
		videoState.lastId = item.id;
		$('video-list').hidden = true;
		$('video-count').textContent = '';
		status('video-status', '');
		var detail = $('video-detail');
		detail.hidden = false;
		clear(detail);
		var wrap = el('div', 'detail');
		var info = el('div', 'detail-info');
		info.appendChild(el('div', 'dim', 'Mi unidad' + (item.path ? ' › ' + item.path.replace(/ \/ /g, ' › ') : '')));
		info.appendChild(el('h1', '', L.titleOf(item.name)));
		var tags = el('div', 'detail-tags');
		tags.innerHTML = '<span>' + ICON('file', 22) + ' ' + L.extOf(item.name) + '</span>' +
			'<span>' + ICON('storage', 22) + ' ' + L.sizeText(item.size) + '</span>';
		info.appendChild(tags);
		var entry = root.CodeStore.get('progress', {})[item.id];
		var resume = L.isInProgress(entry);
		info.appendChild(kv('Ubicación', item.path || L.titleOf(item.name)));
		info.appendChild(kv('Formato', L.extOf(item.name) || 'desconocido'));
		var actions = el('div', 'detail-actions');
		if (resume) {
			actions.appendChild(action('btn primary', 'Continuar desde ' + L.formatTime(entry.time), function () {
				root.CodeShell.playVideo(item, entry.time, videoState.list);
			}, ICON('play', 26) + ' '));
			actions.appendChild(action('btn', 'Reproducir desde el inicio', function () {
				root.CodeShell.playVideo(item, 0, videoState.list);
			}));
		} else {
			actions.appendChild(action('btn primary', 'Reproducir', function () {
				root.CodeShell.playVideo(item, 0, videoState.list);
			}, ICON('play', 26) + ' '));
		}
		actions.appendChild(action('btn', 'Volver a la lista', function () { showVideoList(); }));
		info.appendChild(actions);
		wrap.appendChild(info);
		var preview = el('div', 'detail-preview');
		preview.appendChild(el('span', 'thumb-note', 'fotograma · ' + item.name));
		wrap.appendChild(preview);
		detail.appendChild(wrap);
		focusFirst('video-detail');
	}

	// Fila de dato clave-valor para los paneles de información de Ajustes.
	function kv(key, value) {
		var line = el('div', 'kv');
		line.appendChild(el('span', 'k', key));
		line.appendChild(el('span', 'v', value));
		return line;
	}

	// ---------- Música ----------
	// ---------- Orden, vista y carga por bloques (Música y Fotos) ----------
	// El orden y la vista son los mismos que en Explorar: se guardan en ajustes.
	var CHUNK = 60;
	var activeLazy = null;

	// Dibuja la barra de orden (con flecha en el orden activo) y la de vista.
	function renderSortBar(sortBox, toolsBox, cfg, onChange) {
		clear(sortBox);
		clear(toolsBox);
		sortBox.appendChild(el('span', 'sort-label', 'Ordenar por'));
		SORT_ORDER.forEach(function (m) {
			var on = m === cfg.sort;
			var btn = action('btn sortbtn' + (on ? ' on' : ''), SORT_LABEL[m], function () {
				// Pulsar el orden activo invierte la dirección; uno nuevo usa su dirección por defecto.
				var nextDir = on ? (cfg.sortDir === 'desc' ? 'asc' : 'desc') : SORT_DEFAULT_DIR[m];
				root.CodeStore.saveSettings({ sort: m, sortDir: nextDir });
				onChange();
			});
			if (on) btn.appendChild(el('span', 'sort-arrow')).innerHTML = ICON(cfg.sortDir === 'desc' ? 'arrowDown' : 'arrowUp', 18);
			sortBox.appendChild(btn);
			sortBox.appendChild(document.createTextNode(' '));
		});
		VIEW_MODES.forEach(function (v) {
			var vb = iconButton(v.icon, v.label, v.id === cfg.explorerView);
			vb.onclick = function () {
				root.CodeStore.saveSettings({ explorerView: v.id });
				onChange();
				return false;
			};
			toolsBox.appendChild(vb);
		});
	}

	// Carga perezosa: dibuja la lista por bloques. Otro bloque se añade al acercarse al final de la página
	// o al enfocar uno de los últimos elementos dibujados.
	function lazyList(box, items, makeNode, onChunk) {
		var state = { next: 0 };
		// Dibuja el siguiente bloque de la lista perezosa.
		function more() {
			var end = Math.min(items.length, state.next + CHUNK);
			for (var i = state.next; i < end; i++) {
				box.appendChild(makeNode(items[i], i));
			}
			state.next = end;
			if (onChunk) onChunk();
		}
		var lazy = {
			box: box,
			check: function () {
				while (state.next < items.length &&
					document.documentElement.scrollHeight - (window.pageYOffset + window.innerHeight) < 900) {
					more();
				}
			},
			focused: function (target) {
				var index = Array.prototype.indexOf.call(box.children, target);
				if (index >= 0 && index >= state.next - 12) lazy.check();
				if (index >= state.next - 12 && state.next < items.length) more();
			},
		};
		activeLazy = lazy;
		more();
		lazy.check();
		return lazy;
	}

	// Scroll y foco alimentan la carga por bloques de la lista activa.
	window.addEventListener('scroll', function () { if (activeLazy) activeLazy.check(); });
	document.addEventListener('focusin', function (e) {
		if (activeLazy && activeLazy.box.contains(e.target)) {
			var child = e.target;
			while (child && child.parentNode !== activeLazy.box) child = child.parentNode;
			if (child) activeLazy.focused(child);
		}
	});

	// Busca las pistas de la biblioteca (con avance) y dibuja Música.
	function enterMusic() {
		musicRows = [];
		activeLazy = null;
		$('music-count').textContent = '';
		status('music-status', 'Buscando música en la biblioteca…');
		root.CodeDrive.crawl(['audio'], crawlProgress('music-status', 'Buscando música…', 'pistas')).then(function (items) {
			musicState.items = items;
			renderMusic();
			if (root.CodeShell.current() === 'musica') focusFirst('music-list');
		}).catch(function (e) { fail('music-status', e); });
	}

	var musicState = { items: [], sorted: [] };

	// Dibuja la lista de Música con el orden y la vista compartidos con Explorar.
	function renderMusic() {
		var cfg = root.CodeStore.settings();
		var sorted = L.sortItems(musicState.items, cfg.sort, cfg.sortDir);
		musicState.sorted = sorted;
		var detail = cfg.explorerView === 'detalle';
		$('music-count').textContent = plural(sorted.length, 'pista', 'pistas');
		status('music-status', sorted.length ? '' : 'No hay pistas de audio en la biblioteca.');
		renderSortBar($('music-sort'), $('music-tools'), cfg, renderMusic);
		var cols = $('music-columns');
		clear(cols);
		cols.style.display = detail ? '' : 'none';
		if (detail) cols.appendChild(el('span', 'row-col', 'Tamaño'));
		$('music-play-all').onclick = function () { playTracks(sorted, 0, false); return false; };
		$('music-shuffle-all').onclick = function () {
			if (sorted.length) playTracks(sorted, Math.floor(Math.random() * sorted.length), true);
			return false;
		};
		var list = $('music-list');
		clear(list);
		musicRows = [];
		list.className = cfg.explorerView === 'miniatura' ? 'grid' : 'rows';
		lazyList(list, sorted, function (item, i) {
			var node;
			if (cfg.explorerView === 'miniatura') {
				node = card({ kind: 'audio', chip: 'Pista', id: item.id, title: L.titleOf(item.name), meta: L.sizeText(item.size),
					onPick: function () { playTracks(sorted, i, false); } });
			} else {
				node = row({
					kind: 'audio', art: true, no: i + 1, id: item.id, title: L.titleOf(item.name),
					sub: item.path.indexOf(' / ') >= 0 ? item.path.replace(/ \/ [^/]*$/, '') : '',
					size: detail ? L.sizeText(item.size) : '',
					onPick: function () { playTracks(sorted, i, false); },
				});
			}
			musicRows.push({ item: item, node: node });
			return node;
		}, function () { renderMusicState(root.CodeMusic.snapshot()); });
	}

	// Dibuja la lista de Fotos con el orden y la vista compartidos; en vista de miniatura carga las imágenes por demanda.
	function renderPhotos() {
		var cfg = root.CodeStore.settings();
		var sorted = L.sortItems(photoState.items, cfg.sort, cfg.sortDir);
		photoState.list = sorted;
		var detail = cfg.explorerView === 'detalle';
		$('photo-count').textContent = plural(sorted.length, 'foto', 'fotos');
		status('photo-status', sorted.length ? '' : 'No hay fotos en la biblioteca.');
		renderSortBar($('photo-sort'), $('photo-tools'), cfg, renderPhotos);
		var cols = $('photo-columns');
		clear(cols);
		cols.style.display = detail ? '' : 'none';
		if (detail) {
			cols.appendChild(el('span', 'row-col wide', 'Modificado'));
			cols.appendChild(el('span', 'row-col', 'Tamaño'));
		}
		$('photo-slideshow').onclick = function () {
			if (sorted.length) openViewer(sorted, 0, true);
			return false;
		};
		var grid = $('photo-grid');
		clear(grid);
		grid.className = cfg.explorerView === 'miniatura' ? 'grid' : 'rows';
		activeLazy = null;
		lazyList(grid, sorted, function (item, i) {
			var onPick = function () { openViewer(sorted, i, false); };
			if (cfg.explorerView === 'miniatura') {
				return card({
					kind: 'image', chip: 'Foto', id: item.id, title: item.name, meta: L.dateText(item.modifiedTime),
					imageUrl: function () { return root.CodeDrive.urlFor(item); }, onPick: onPick,
				});
			}
			return row({
				kind: 'image', id: item.id, title: item.name,
				date: detail ? L.dateText(item.modifiedTime) : '', size: detail ? L.sizeText(item.size) : '', onPick: onPick,
			});
		});
		if (root.CodeShell.current() === 'fotos') focusFirst('photo-grid');
	}

	// Busca las fotos de la biblioteca (con avance) y dibuja Fotos.
	function enterPhotos() {
		photoState.items = [];
		activeLazy = null;
		$('photo-count').textContent = '';
		status('photo-status', 'Buscando fotos en la biblioteca…');
		root.CodeDrive.crawl(['image'], crawlProgress('photo-status', 'Buscando fotos…', 'fotos')).then(function (items) {
			photoState.items = items;
			renderPhotos();
		}).catch(function (e) { fail('photo-status', e); });
	}

	var photoState = { list: [], items: [] };

	// Pone una lista de pistas en la cola de música y empieza en el índice elegido, con o sin aleatorio.
	function playTracks(list, index, shuffle) {
		root.CodeMusic.setQueue(list, index);
		root.CodeMusic.setShuffle(shuffle);
		root.CodeMusic.playAt(index);
		remember(list[index]);
	}

	// Marca la pista que suena en la lista, sin reconstruirla (así el foco no se pierde).
	function renderMusicState(s) {
		musicRows.forEach(function (r) {
			var playing = s.item === r.item;
			var tag = r.node.querySelector('.tag');
			if (playing && !tag) {
				var t = el('span', 'tag', s.playing ? 'Sonando' : 'En pausa');
				var anchor = r.node.querySelector('.row-col');
				if (anchor) r.node.insertBefore(t, anchor);
				else (r.node.querySelector('.card-body') || r.node).appendChild(t);
			} else if (playing && tag) {
				tag.textContent = s.playing ? 'Sonando' : 'En pausa';
			} else if (!playing && tag) {
				tag.parentNode.removeChild(tag);
			}
		});
		var now = $('music-now');
		now.hidden = !s.item;
		if (s.item) {
			$('music-now-title').textContent = (s.playing ? 'Reproduciendo: ' : 'En pausa: ') + L.titleOf(s.item.name);
			setIconBtn('music-toggle', s.playing ? 'pause' : 'play', s.playing ? 'Pausar' : 'Reproducir', false);
			setIconBtn('music-shuffle', 'shuffle', 'Aleatorio: ' + (s.shuffle ? 'sí' : 'no'), s.shuffle);
			setIconBtn('music-repeat', 'repeat', 'Repetir: ' + (s.repeat ? 'sí' : 'no'), s.repeat);
		}
	}

	// ---------- Fotos ----------
	function openViewer(list, index, slide) {
		viewer.open = true;
		viewer.list = list;
		viewer.index = index;
		$('viewer').hidden = false;
		$('viewer').setAttribute('data-modal', '');
		if (slide) startSlideshow();
		showViewerItem();
	}

	// Muestra la foto actual del visor con su nombre y su posición en la lista.
	function showViewerItem() {
		var item = viewer.list[viewer.index];
		$('viewer-caption').textContent = (viewer.index + 1) + ' / ' + viewer.list.length + ' · ' + item.name +
			(viewer.timer ? ' · presentación activa' : '');
		root.CodeDrive.urlFor(item).then(function (url) {
			if (viewer.open && viewer.list[viewer.index] === item) $('viewer-img').src = url;
		});
	}

	// Avanza o retrocede una foto en el visor; da la vuelta al llegar al principio o al final.
	function stepViewer(delta) {
		var n = viewer.list.length;
		viewer.index = (viewer.index + delta + n) % n;
		showViewerItem();
	}

	// Detiene la presentación automática de fotos.
	function stopSlideshow() {
		if (viewer.timer) clearInterval(viewer.timer);
		viewer.timer = null;
	}

	// Inicia la presentación automática, con el intervalo configurado en Ajustes.
	function startSlideshow() {
		stopSlideshow();
		viewer.timer = setInterval(function () { stepViewer(1); }, root.CodeStore.settings().slideSeconds * 1000);
	}

	// Alterna la presentación automática (OK en el visor).
	function toggleSlideshow() {
		if (viewer.timer) stopSlideshow();
		else startSlideshow();
		showViewerItem();
	}

	// Cierra el visor de fotos y devuelve el foco a la lista.
	function closeViewer() {
		stopSlideshow();
		viewer.open = false;
		$('viewer').hidden = true;
		$('viewer').removeAttribute('data-modal');
		$('viewer-img').removeAttribute('src');
	}

	// Teclas del visor: izquierda/derecha cambian la foto y OK inicia o detiene la presentación.
	document.addEventListener('keydown', function (e) {
		if (!viewer.open) return;
		if (e.keyCode === 37) { e.preventDefault(); stepViewer(-1); }
		else if (e.keyCode === 39) { e.preventDefault(); stepViewer(1); }
		else if (e.keyCode === 13) { e.preventDefault(); toggleSlideshow(); }
	});

	// ---------- Ajustes ----------
	var FONTS = [{ key: 'inter', label: 'Inter' }, { key: 'atkinson', label: 'Atkinson Hyperlegible' }, { key: 'fira', label: 'Fira Code' }];
	// Normal es el tamaño más grande; los demás reducen el texto.
	var TEXT_SIZES = [{ key: 'normal', label: 'Normal', zoom: 1 }, { key: 'pequeno', label: 'Pequeño', zoom: 0.9 }, { key: 'muy-pequeno', label: 'Muy pequeño', zoom: 0.8 }, { key: 'minimo', label: 'Mínimo', zoom: 0.7 }];
	var SLIDE_OPTIONS = [5, 10, 30];

	// Busca la posición de una opción de ajustes por su clave; si no existe, usa la primera para no romper la pantalla.
	function indexOfKey(list, key) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].key === key) return i;
		}
		return 0;
	}

	// Aplica tema, tipo de letra y tamaño de texto guardados. El tamaño escala las secciones, no la barra.
	function applySettings() {
		var s = root.CodeStore.settings();
		root.CodeTheme.apply(s.theme);
		document.body.className = s.font === 'atkinson' ? 'font-atkinson' : (s.font === 'fira' ? 'font-fira' : '');
		var size = TEXT_SIZES[indexOfKey(TEXT_SIZES, s.textSize)];
		document.querySelectorAll('.section').forEach(function (sec) {
			sec.style.zoom = size.zoom;
		});
	}

	// Fila de ajustes del prototipo: icono, nombre, valor actual y, si cambia, icono de ciclo.
	function settingRow(iconName, label, value, onPick, cycles) {
		var a = el('a', 'srow');
		a.href = '#';
		a.onclick = function () { onPick(); return false; };
		a.innerHTML = ICON(iconName, 30);
		a.firstChild.setAttribute('class', 'lead');
		a.appendChild(el('span', 'label', label));
		a.appendChild(el('span', 'value', value));
		if (cycles) {
			var c = document.createElement('span');
			c.innerHTML = ICON('cycle', 26);
			c.firstChild.setAttribute('class', 'cycle');
			a.appendChild(c);
		}
		return a;
	}

	// Escribe un mensaje de confirmación o error en la parte inferior de Ajustes.
	function setStatus(msg) {
		$('settings-status').textContent = msg || '';
	}

	// Registro de errores: el más reciente primero, con explicación, acción y detalle técnico.
	function renderErrors() {
		var box = $('error-list');
		clear(box);
		var list = root.CodeErrors.list();
		$('error-count').textContent = list.length ? plural(list.length, 'registro', 'registros') : '';
		if (list.length === 0) {
			box.appendChild(el('p', 'side-note', 'Sin errores registrados.'));
		} else {
			list.forEach(function (e) {
				var item = el('div', 'error-item');
				item.appendChild(el('div', 'error-when', root.CodeErrors.stamp(e.at) + ' · ' + e.area));
				item.appendChild(el('div', 'error-title', e.title));
				item.appendChild(el('p', 'error-text', e.explain));
				item.appendChild(el('p', 'error-text', 'Qué hacer: ' + e.action));
				item.appendChild(el('code', 'error-detail', e.detail));
				box.appendChild(item);
			});
			box.appendChild(action('btn', 'Borrar registro', function () {
				root.CodeErrors.clear();
				renderErrors();
			}));
		}
		// Abrir Ajustes equivale a haber visto los errores: el semáforo se apaga.
		root.CodeErrors.markAllSeen();
	}

	// Dibuja Ajustes: cuenta, opciones, errores, estado de la biblioteca y pruebas de desarrollo.
	function renderSettings() {
		var s = root.CodeStore.settings();
		var list = $('settings-list');
		clear(list);

		var theme = root.CodeTheme.names;
		list.appendChild(settingRow('palette', 'Tema', s.theme, function () {
			var next = theme[(theme.indexOf(s.theme) + 1) % theme.length];
			root.CodeStore.saveSettings({ theme: next });
			applySettings();
			renderSettings();
		}, true));

		var font = FONTS[indexOfKey(FONTS, s.font)];
		list.appendChild(settingRow('font', 'Tipo de letra', font.label, function () {
			var next = FONTS[(indexOfKey(FONTS, s.font) + 1) % FONTS.length];
			root.CodeStore.saveSettings({ font: next.key });
			applySettings();
			renderSettings();
		}, true));

		var size = TEXT_SIZES[indexOfKey(TEXT_SIZES, s.textSize)];
		list.appendChild(settingRow('text', 'Tamaño de texto', size.label, function () {
			var next = TEXT_SIZES[(indexOfKey(TEXT_SIZES, s.textSize) + 1) % TEXT_SIZES.length];
			root.CodeStore.saveSettings({ textSize: next.key });
			applySettings();
			renderSettings();
		}, true));

		list.appendChild(settingRow('globe', 'Idioma', 'Español', function () {
			setStatus('Por ahora la app solo está en español.');
		}, false));

		list.appendChild(settingRow('timer', 'Intervalo de presentación', s.slideSeconds + ' segundos', function () {
			var next = SLIDE_OPTIONS[(SLIDE_OPTIONS.indexOf(s.slideSeconds) + 1) % SLIDE_OPTIONS.length];
			root.CodeStore.saveSettings({ slideSeconds: next });
			renderSettings();
		}, true));

		list.appendChild(settingRow('sort', 'Orden por defecto', SORT_LABEL[s.sort], function () {
			var next = SORT_ORDER[(SORT_ORDER.indexOf(s.sort) + 1) % SORT_ORDER.length];
			root.CodeStore.saveSettings({ sort: next, sortDir: SORT_DEFAULT_DIR[next] });
			renderSettings();
		}, true));

		list.appendChild(settingRow('logout', 'Cerrar sesión', '', function () {
			root.CodeStore.set('progress', {});
			root.CodeStore.set('recent', []);
			root.CodeStore.set('favs', []);
			root.CodeStore.set('settings', {});
			applySettings();
			setStatus('Datos de esta TV borrados: progreso, recientes, favoritas y ajustes. El acceso a Drive sigue con la cuenta de servicio de la app.');
			renderSettings();
		}, false));

		var key = root.CodeTVKey;
		$('acct-avatar').textContent = key && key.client_email ? key.client_email.charAt(0).toUpperCase() : 'C';
		$('acct-mail').textContent = key && key.client_email ? key.client_email : 'Sin llave: revisa js/service-account.js';

		$('library-info').textContent = 'Biblioteca: cargando carpetas compartidas…';
		root.CodeDrive.roots().then(function (list) {
			$('library-info').textContent = list.length
				? 'Biblioteca: ' + list.length + ' carpeta(s) compartida(s): ' + list.map(function (f) { return f.name; }).join(', ') + '.'
				: 'Biblioteca: no hay carpetas compartidas con la cuenta de servicio.';
		}).catch(function (e) {
			$('library-info').textContent = 'Biblioteca: ' + (e && e.message ? e.message : String(e));
			root.CodeErrors.record('Biblioteca', e);
			renderErrors();
		});
		$('proxy-info').textContent = root.CodeDrive.hasProxy()
			? 'Reproducción: con proxy (remux automático y subtítulos disponibles).'
			: 'Reproducción: sin proxy (solo reproducción directa).';
		$('diag-info').textContent = root.CodeDrive.status();
		renderErrors();
		$('engine-info').textContent = 'Motor web: ' + navigator.userAgent;

		var dev = $('dev-links');
		clear(dev);
		[
			{ file: 'diagnostic.html', label: 'Diagnóstico de firma RSA' },
			{ file: 'drive-check.html', label: 'Prueba de Drive' },
			{ file: 'player-check.html', label: 'Prueba de reproducción' },
			{ file: 'mini-check.html', label: 'Prueba de mini reproductor' },
		].forEach(function (d) {
			dev.appendChild(settingRow('info', d.label, '', function () {
				window.location.href = d.file;
			}, false));
		});
	}

	// Entra en una carpeta de Explorar. Al volver con Atrás, el foco regresa a ella.
	function openFolder(item) {
		explore.stack[explore.stack.length - 1].focusId = item.id;
		explore.stack.push({ id: item.id, name: item.name });
		renderExplore();
	}

	// Vista de miniatura: carpetas con icono y archivos con fotograma (video) o imagen.
	function explorerTile(item, sorted) {
		if (item.kind === 'folder') {
			return card({ kind: 'folder', id: item.id, chip: 'Carpeta', title: item.name, meta: '', onPick: function () { openFolder(item); } });
		}
		var image = item.kind === 'video' ? function () { return root.CodeDrive.thumbUrl(item); }
			: item.kind === 'image' ? function () { return root.CodeDrive.urlFor(item); } : null;
		return card({
			kind: item.kind, id: item.id, chip: KIND_LABEL[item.kind] || 'Archivo', note: L.extOf(item.name),
			title: L.titleOf(item.name), meta: L.sizeText(item.size), imageUrl: image,
			onPick: function () { remember(item); openItem(item, sorted, sorted.indexOf(item)); },
		});
	}

	// Botón solo con icono, con nombre accesible. on marca el estado activo.
	function iconButton(icon, label, on) {
		var b = el('a', 'btn iconbtn' + (on ? ' on' : ''));
		b.href = '#';
		b.setAttribute('aria-label', label);
		b.innerHTML = ICON(icon, 24);
		b.onclick = function () { return false; };
		return b;
	}

	// Cambia un botón de texto por uno de icono (Música y Fotos).
	function setIconBtn(id, icon, label, on) {
		var b = $(id);
		var keep = b.className.replace(/\b(on|iconbtn)\b/g, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
		b.className = keep + ' iconbtn' + (on ? ' on' : '');
		b.innerHTML = ICON(icon, 24);
		b.setAttribute('aria-label', label);
	}

	// Reemplaza los textos de los botones de Música y Fotos por iconos con nombre accesible.
	function setupIcons() {
		setIconBtn('music-play-all', 'play', 'Reproducir todo', false);
		setIconBtn('music-shuffle-all', 'shuffle', 'Reproducir en aleatorio', false);
		setIconBtn('music-prev', 'prev', 'Anterior', false);
		setIconBtn('music-toggle', 'play', 'Reproducir', false);
		setIconBtn('music-next', 'next', 'Siguiente', false);
		setIconBtn('music-shuffle', 'shuffle', 'Aleatorio: no', false);
		setIconBtn('music-repeat', 'repeat', 'Repetir: no', false);
		setIconBtn('photo-slideshow', 'play', 'Iniciar presentación', false);
	}

	// ---------- Entrada a cada sección y Atrás ----------
	function enter(name) {
		if (name === 'inicio') renderHome();
		else if (name === 'explorar') enterExplore();
		else if (name === 'video') enterVideo();
		else if (name === 'musica') enterMusic();
		else if (name === 'fotos') enterPhotos();
		else if (name === 'ajustes') renderSettings();
	}

	// Lista principal de cada sección (la que se recorre con las flechas).
	function listIdFor(section) {
		if (section === 'explorar') return 'explore-list';
		if (section === 'video') return videoState.detail ? 'video-detail' : 'video-list';
		if (section === 'musica') return 'music-list';
		if (section === 'fotos') return 'photo-grid';
		if (section === 'ajustes') return 'settings-list';
		return null;
	}

	// Atrás primero lleva al principio de la lista donde está el foco. Si ya está arriba, no hace nada.
	function toTopOfList() {
		var section = root.CodeShell.current();
		var content = document.getElementById('sec-' + section);
		if (!content || !content.contains(document.activeElement)) return '';
		var id = listIdFor(section);
		var first = id ? $(id).querySelector('a') : null;
		if (window.scrollY > 0) {
			// Sube la página y lleva el foco al primer elemento, para que la siguiente flecha parta desde arriba.
			window.scrollTo(0, 0);
			if (first) first.focus();
			return 'Vuelve al inicio de la lista';
		}
		if (!first || document.activeElement === first) return '';
		first.focus();
		return 'Vuelve al inicio de la lista';
	}

	// Atrás dentro de la pantalla. Devuelve el nombre de la acción, o '' si la pantalla no tenía nada que hacer.
	// Orden: visor, inicio de la lista, nivel superior (detalle o carpeta).
	function back() {
		if (viewer.open) {
			closeViewer();
			return 'Cierra el visor';
		}
		var top = toTopOfList();
		if (top) return top;
		if (root.CodeShell.current() === 'video' && videoState.detail) {
			showVideoList();
			return 'Vuelve a la lista de videos';
		}
		if (root.CodeShell.current() === 'explorar' && explore.stack.length > 1) {
			explore.stack.pop();
			renderExplore();
			return 'Sube a la carpeta anterior';
		}
		return '';
	}

	// Conecta la música con la pantalla: estado, barra superior y URLs de las pistas.
	function initMusic() {
		root.CodeMusic.init($('music'));
		root.CodeMusic.setUrlFunction(function (item) { return root.CodeDrive.urlFor(item); });
		root.CodeMusic.subscribe(function (s) {
			renderMusicState(s);
			root.CodeShell.renderPill(s);
		});
		$('music-prev').onclick = function () { root.CodeMusic.previous(); return false; };
		$('music-toggle').onclick = function () { root.CodeMusic.toggle(); return false; };
		$('music-next').onclick = function () { root.CodeMusic.next(); return false; };
		$('music-shuffle').onclick = function () { root.CodeMusic.setShuffle(!root.CodeMusic.snapshot().shuffle); return false; };
		$('music-repeat').onclick = function () { root.CodeMusic.setRepeat(!root.CodeMusic.snapshot().repeat); return false; };
	}

	root.CodeScreens = {
		init: function () {
			applySettings();
			initMusic();
			setupIcons();
		},
		enter: enter,
		leave: function (name) {
			if (name === 'explorar') explore.scrollY = window.scrollY;
		},
		reload: function (name) {
			root.CodeDrive.refresh();
			enter(name);
		},
		back: back,
		remember: remember,
		openItem: openItem,
		isViewerOpen: function () { return viewer.open; },
		card: card,
	};
})(window);
