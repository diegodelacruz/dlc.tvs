// Pantallas de la app: Inicio, Explorar, Video, Música, Fotos y Ajustes. Mismo diseño que el prototipo.
// Cada pantalla se dibuja al entrar. Atrás pasa primero por back(), que deshace un nivel dentro de la pantalla.
(function (root) {
	var SORT_LABEL = { name: 'Nombre', date: 'Fecha', size: 'Tamaño' };
	var SORT_ORDER = ['name', 'date', 'size'];
	var KIND_LABEL = { folder: 'Carpeta', video: 'Video', audio: 'Audio', image: 'Foto' };
	var ICON = root.CodeIcons.icon;
	var KIND_ICON = root.CodeIcons.kindIcon;
	var L = root.CodeLogic;

	// Plural correcto en español: 1 video, 2 videos.
	function plural(n, one, many) {
		return n + ' ' + (n === 1 ? one : many);
	}

	var explore = { stack: [] };
	var videoState = { list: [], detail: null };
	var musicRows = [];
	var viewer = { open: false, list: [], index: 0, timer: null };

	function $(id) { return document.getElementById(id); }

	function clear(node) {
		while (node.firstChild) node.removeChild(node.firstChild);
	}

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

	function status(id, msg) {
		$(id).textContent = msg || '';
	}

	function fail(id, e) {
		status(id, 'Error: ' + (e && e.message ? e.message : String(e)));
	}

	function focusFirst(id) {
		var a = $(id).querySelector('a');
		if (a) a.focus();
	}

	function remember(file) {
		root.CodeStore.set('recent', L.pushRecent(root.CodeStore.get('recent', []), { id: file.id, name: file.name, kind: file.kind }, 12));
	}

	function favorites() {
		return root.CodeStore.get('favs', []);
	}

	function isFavorite(id) {
		return favorites().some(function (f) { return f.id === id; });
	}

	function toggleFavorite(folder) {
		var list = favorites();
		var exists = list.some(function (f) { return f.id === folder.id; });
		root.CodeStore.set('favs', exists ? list.filter(function (f) { return f.id !== folder.id; }) : list.concat([folder]));
	}

	// Tarjeta del prototipo: miniatura con etiqueta, nota, barra de progreso, título y detalle.
	function card(o) {
		var a = el('a', 'card');
		a.href = '#';
		a.onclick = function () { o.onPick(); return false; };
		var thumb = el('div', 'thumb');
		if (o.imageUrl) {
			var img = el('img');
			img.alt = '';
			thumb.appendChild(img);
			o.imageUrl().then(function (url) { img.src = url; });
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
		a.appendChild(body);
		return a;
	}

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

	function emptyNote(parent, msg) {
		parent.appendChild(el('p', 'status', msg));
	}

	// Fila de lista: tile con icono, nombre (y ruta), columnas de fecha y tamaño.
	function row(o) {
		var a = el('a', 'row');
		a.href = '#';
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
	function renderHome() {
		var cont = $('home-continue');
		clear(cont);
		var inProgress = L.continueList(root.CodeStore.get('progress', {}), 12);
		$('continue-count').textContent = inProgress.length ? plural(inProgress.length, 'en curso', 'en curso') : '';
		if (inProgress.length === 0) emptyNote(cont, 'Nada en curso. Empieza un video desde Video o Explorar.');
		inProgress.forEach(function (e) {
			cont.appendChild(card({
				kind: 'video', chip: 'Video', note: L.extOf(e.name), title: L.titleOf(e.name),
				meta: L.remainingText(e.time, e.duration), progress: e.duration ? e.time / e.duration : 0,
				onPick: function () { root.CodeShell.playVideo({ id: e.id, name: e.name, kind: 'video' }, e.time); },
			}));
		});
		if (inProgress.length > 0) {
			cont.appendChild(moreCard(plural(inProgress.length, 'elemento', 'elementos'), function () { root.CodeShell.show('video'); }));
		}

		var rec = $('home-recent');
		clear(rec);
		var recent = root.CodeStore.get('recent', []);
		$('recent-count').textContent = recent.length ? plural(recent.length, 'elemento', 'elementos') : '';
		if (recent.length === 0) emptyNote(rec, 'Todavía no hay archivos recientes.');
		recent.forEach(function (f) {
			rec.appendChild(card({
				kind: f.kind, chip: KIND_LABEL[f.kind] || 'Archivo', note: L.extOf(f.name),
				title: L.titleOf(f.name), meta: KIND_LABEL[f.kind] || '',
				imageUrl: f.kind === 'image' ? function () { return root.CodeDrive.urlFor(f); } : null,
				onPick: function () { openItem(f, [f], 0); },
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
		].forEach(function (a) {
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
			root.CodeShell.playVideo(item, 0);
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
		status('explore-status', 'Cargando…');
		root.CodeDrive.rootFolder().then(function (id) {
			explore.stack = [{ id: id, name: root.CodeDrive.ROOT_NAME }];
			renderExplore();
		}).catch(function (e) { fail('explore-status', e); });
	}

	function renderExplore() {
		var top = explore.stack[explore.stack.length - 1];
		status('explore-status', 'Cargando…');
		root.CodeDrive.children(top.id).then(function (items) {
			var mode = root.CodeStore.settings().sort;
			var sorted = L.sortItems(items, mode);

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
				sortBox.appendChild(action('btn' + (on ? ' on' : ''), SORT_LABEL[m], function () {
					root.CodeStore.saveSettings({ sort: m });
					renderExplore();
				}, on ? ICON('check', 26) + ' ' : ''));
				sortBox.appendChild(document.createTextNode(' '));
			});

			var tools = $('explore-tools');
			clear(tools);
			tools.appendChild(action('btn', isFavorite(top.id) ? 'Quitar de favoritas' : 'Marcar como favorita', function () {
				toggleFavorite(top);
				renderExplore();
			}));

			var cols = $('explore-columns');
			clear(cols);
			cols.appendChild(el('span', 'row-col wide', 'Modificado'));
			cols.appendChild(el('span', 'row-col', 'Tamaño'));

			var box = $('explore-list');
			clear(box);
			sorted.forEach(function (item) {
				var date = L.dateText(item.modifiedTime);
				if (item.kind === 'folder') {
					box.appendChild(row({
						kind: 'folder', title: item.name, date: date, size: '',
						onPick: function () {
							explore.stack.push({ id: item.id, name: item.name });
							renderExplore();
						},
					}));
				} else {
					box.appendChild(row({
						kind: item.kind, title: item.name, date: date, size: L.sizeText(item.size),
						onPick: function () {
							remember(item);
							openItem(item, sorted, sorted.indexOf(item));
						},
					}));
				}
			});
			status('explore-status', sorted.length ? plural(sorted.length, 'elemento', 'elementos') + ' · carpetas primero' : 'Carpeta vacía: no hay archivos compatibles.');
			if (root.CodeShell.current() === 'explorar') focusFirst('explore-list');
		}).catch(function (e) { fail('explore-status', e); });
	}

	// ---------- Video ----------
	function enterVideo() {
		if (videoState.detail) showVideoDetail(videoState.detail);
		else showVideoList();
	}

	function showVideoList() {
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
					kind: 'video', chip: L.extOf(item.name), note: item.path.indexOf(' / ') >= 0 ? item.path.split(' / ').slice(-2, -1)[0] : '',
					title: L.titleOf(item.name),
					meta: inProgress ? L.remainingText(entry.time, entry.duration) : L.sizeText(item.size),
					progress: inProgress && entry.duration ? entry.time / entry.duration : 0,
					onPick: function () { showVideoDetail(item); },
				}));
			});
			if (root.CodeShell.current() === 'video') focusFirst('video-list');
		}).catch(function (e) { fail('video-status', e); });
	}

	function showVideoDetail(item) {
		videoState.detail = item;
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
				root.CodeShell.playVideo(item, entry.time);
			}, ICON('play', 26) + ' '));
			actions.appendChild(action('btn', 'Reproducir desde el inicio', function () {
				root.CodeShell.playVideo(item, 0);
			}));
		} else {
			actions.appendChild(action('btn primary', 'Reproducir', function () {
				root.CodeShell.playVideo(item, 0);
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

	function kv(key, value) {
		var line = el('div', 'kv');
		line.appendChild(el('span', 'k', key));
		line.appendChild(el('span', 'v', value));
		return line;
	}

	// ---------- Música ----------
	function enterMusic() {
		var list = $('music-list');
		clear(list);
		musicRows = [];
		$('music-count').textContent = '';
		status('music-status', 'Buscando música en la biblioteca…');
		root.CodeDrive.crawl(['audio']).then(function (items) {
			var sorted = L.sortItems(items, 'name');
			$('music-count').textContent = plural(sorted.length, 'pista', 'pistas');
			status('music-status', sorted.length ? '' : 'No hay pistas de audio en la biblioteca.');
			$('music-play-all').onclick = function () { playTracks(sorted, 0, false); return false; };
			$('music-shuffle-all').onclick = function () {
				playTracks(sorted, Math.floor(Math.random() * sorted.length), true);
				return false;
			};
			sorted.forEach(function (item, i) {
				var r = row({
					kind: 'audio', art: true, no: i + 1, title: L.titleOf(item.name),
					sub: item.path.indexOf(' / ') >= 0 ? item.path.replace(/ \/ [^/]*$/, '') : '',
					size: L.sizeText(item.size),
					onPick: function () { playTracks(sorted, i, false); },
				});
				musicRows.push({ item: item, node: r });
				list.appendChild(r);
			});
			renderMusicState(root.CodeMusic.snapshot());
			if (root.CodeShell.current() === 'musica') focusFirst('music-list');
		}).catch(function (e) { fail('music-status', e); });
	}

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
				r.node.insertBefore(t, r.node.querySelector('.row-col'));
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
			$('music-toggle').textContent = s.playing ? 'Pausa' : 'Reproducir';
			$('music-shuffle').textContent = 'Aleatorio: ' + (s.shuffle ? 'sí' : 'no');
			$('music-repeat').textContent = 'Repetir: ' + (s.repeat ? 'sí' : 'no');
		}
	}

	// ---------- Fotos ----------
	function enterPhotos() {
		var grid = $('photo-grid');
		clear(grid);
		$('photo-count').textContent = '';
		status('photo-status', 'Buscando fotos en la biblioteca…');
		root.CodeDrive.crawl(['image']).then(function (items) {
			var sorted = L.sortItems(items, 'name');
			photoState.list = sorted;
			$('photo-count').textContent = plural(sorted.length, 'foto', 'fotos');
			status('photo-status', sorted.length ? '' : 'No hay fotos en la biblioteca.');
			$('photo-slideshow').onclick = function () {
				if (sorted.length) openViewer(sorted, 0, true);
				return false;
			};
			sorted.forEach(function (item, i) {
				grid.appendChild(card({
					kind: 'image', chip: 'Foto', title: item.name, meta: L.dateText(item.modifiedTime),
					imageUrl: function () { return root.CodeDrive.urlFor(item); },
					onPick: function () { openViewer(sorted, i, false); },
				}));
			});
			if (root.CodeShell.current() === 'fotos') focusFirst('photo-grid');
		}).catch(function (e) { fail('photo-status', e); });
	}

	var photoState = { list: [] };

	function openViewer(list, index, slide) {
		viewer.open = true;
		viewer.list = list;
		viewer.index = index;
		$('viewer').hidden = false;
		$('viewer').setAttribute('data-modal', '');
		if (slide) startSlideshow();
		showViewerItem();
	}

	function showViewerItem() {
		var item = viewer.list[viewer.index];
		$('viewer-caption').textContent = (viewer.index + 1) + ' / ' + viewer.list.length + ' · ' + item.name +
			(viewer.timer ? ' · presentación activa' : '');
		root.CodeDrive.urlFor(item).then(function (url) {
			if (viewer.open && viewer.list[viewer.index] === item) $('viewer-img').src = url;
		});
	}

	function stepViewer(delta) {
		var n = viewer.list.length;
		viewer.index = (viewer.index + delta + n) % n;
		showViewerItem();
	}

	function stopSlideshow() {
		if (viewer.timer) clearInterval(viewer.timer);
		viewer.timer = null;
	}

	function startSlideshow() {
		stopSlideshow();
		viewer.timer = setInterval(function () { stepViewer(1); }, root.CodeStore.settings().slideSeconds * 1000);
	}

	function toggleSlideshow() {
		if (viewer.timer) stopSlideshow();
		else startSlideshow();
		showViewerItem();
	}

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

	function setStatus(msg) {
		$('settings-status').textContent = msg || '';
	}

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
			root.CodeStore.saveSettings({ sort: next });
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

		$('library-info').textContent = 'Biblioteca: ' + root.CodeDrive.ROOT_NAME + ' (carpeta compartida con la cuenta de servicio).';
		$('proxy-info').textContent = root.CodeDrive.hasProxy()
			? 'Reproducción: con proxy (remux automático y subtítulos disponibles).'
			: 'Reproducción: sin proxy (solo reproducción directa).';
		$('diag-info').textContent = root.CodeDrive.status();
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

	// ---------- Entrada a cada sección y Atrás ----------
	function enter(name) {
		if (name === 'inicio') renderHome();
		else if (name === 'explorar') enterExplore();
		else if (name === 'video') enterVideo();
		else if (name === 'musica') enterMusic();
		else if (name === 'fotos') enterPhotos();
		else if (name === 'ajustes') renderSettings();
	}

	// Devuelve true si Atrás se consumió dentro de la pantalla (visor, detalle o carpeta anterior).
	function back() {
		if (viewer.open) {
			closeViewer();
			return true;
		}
		if (root.CodeShell.current() === 'video' && videoState.detail) {
			showVideoList();
			return true;
		}
		if (root.CodeShell.current() === 'explorar' && explore.stack.length > 1) {
			explore.stack.pop();
			renderExplore();
			return true;
		}
		return false;
	}

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
		},
		enter: enter,
		back: back,
		remember: remember,
		openItem: openItem,
		isViewerOpen: function () { return viewer.open; },
		card: card,
	};
})(window);
