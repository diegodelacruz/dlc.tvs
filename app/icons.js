// Iconos de trazo (24x24) para la interfaz. Se devuelven como texto SVG listo para innerHTML.
(function (root) {
	var PATHS = {
		folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
		video: '<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/>',
		audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
		image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
		file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
		clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
		storage: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/>',
		gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
		play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
		pause: '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>',
		back10: '<path d="M11 19l-8-7 8-7v14zM21 19l-8-7 8-7v14z"/>',
		fwd10: '<path d="M13 5l8 7-8 7V5zM3 5l8 7-8 7V5z"/>',
		subtitles: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 12h4M12 12h6M6 15h8"/>',
		check: '<path d="M5 12l5 5 9-10"/>',
		shuffle: '<path d="M3 6h4l10 12h4M3 18h4l3-4M14 10l3-4h4"/>',
		arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
		wave: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4"/>',
		palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 1.5-3.3 2 2 0 0 1 1.5-3.2H18a4 4 0 0 0 4-4C22 6 17.5 2 12 2z"/>',
		font: '<path d="M4 20l5-14 5 14M6.5 14h5M14 20l3-8 3 8M15 17h4"/>',
		text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
		globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
		timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
		sort: '<path d="M4 6h10M4 12h7M4 18h4M17 4v16M14 17l3 3 3-3"/>',
		logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
		info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
		cycle: '<path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5M18 3v4h-4M6 21v-4h4"/>',
		repeat: '<path d="M4 12V9a3 3 0 0 1 3-3h11M20 12v3a3 3 0 0 1-3 3H6"/><path d="M17 3l3 3-3 3M7 21l-3-3 3-3"/>',
	};

	// Devuelve el SVG del icono. size en píxeles.
	function icon(name, size) {
		var s = size || 24;
		return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
			'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
	}

	// Icono de tipo de archivo.
	function kindIcon(kind, size) {
		return icon(kind === 'folder' ? 'folder' : kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : kind === 'image' ? 'image' : 'file', size);
	}

	root.CodeIcons = { icon: icon, kindIcon: kindIcon };
})(typeof window !== 'undefined' ? window : globalThis);
