// Navegación con control remoto para las páginas de la app.
// - Flechas: navegación espacial. Cada flecha mueve el foco al enlace visible más cercano en esa dirección,
//   penalizando los que quedan desalineados. Si no hay ninguno en esa dirección, el foco se queda.
// - Puntero: al pasar sobre un enlace, ese enlace pasa a ser el foco; clic lo activa y luego lo libera.
// - OK (13): activa el enlace enfocado.
(function () {
	var current = -1;

	// Si hay un panel abierto (data-modal sin hidden), el foco queda dentro de él.
	// Solo cuentan los enlaces visibles.
	function links() {
		var scope = document.querySelector('[data-modal]:not([hidden])') || document;
		// getClientRects sirve también dentro de elementos con posición fija (offsetParent no).
		return Array.prototype.slice.call(scope.querySelectorAll('a[href]')).filter(function (a) {
			return a.getClientRects().length > 0;
		});
	}

	function closestLink(node) {
		while (node && node.tagName !== 'A') node = node.parentNode;
		return node || null;
	}

	function center(el) {
		var r = el.getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	}

	// Enlace más cercano desde 'from' en la dirección indicada. Devuelve null si no hay ninguno.
	function nearest(from, dir) {
		var c = center(from);
		var best = null;
		var bestScore = Infinity;
		links().forEach(function (el) {
			if (el === from) return;
			var p = center(el);
			var dx = p.x - c.x;
			var dy = p.y - c.y;
			var along;
			var across;
			if (dir === 'right') { along = dx; across = dy; }
			else if (dir === 'left') { along = -dx; across = dy; }
			else if (dir === 'down') { along = dy; across = dx; }
			else { along = -dy; across = dx; }
			if (along <= 0) return;
			var score = along + 2 * Math.abs(across);
			if (score < bestScore) {
				bestScore = score;
				best = el;
			}
		});
		return best;
	}

	function focusAt(index) {
		var list = links();
		if (list.length === 0) return;
		current = (index + list.length) % list.length;
		list[current].focus();
	}

	var DIRECTIONS = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

	document.addEventListener('mouseover', function (e) {
		var link = closestLink(e.target);
		if (!link) return;
		var index = links().indexOf(link);
		if (index >= 0) {
			current = index;
			link.focus();
		}
	});

	document.addEventListener('keydown', function (e) {
		var code = e.keyCode;
		var active = document.activeElement;
		var index = links().indexOf(active);

		if (DIRECTIONS[code]) {
			e.preventDefault();
			if (index < 0) {
				// Nada enfocado (por ejemplo, tras un clic): continuar desde el último enlace marcado.
				focusAt(current < 0 ? 0 : current);
				return;
			}
			var target = nearest(active, DIRECTIONS[code]);
			if (target) target.focus();
		} else if (code === 13) {
			if (active && active.tagName === 'A') {
				e.preventDefault();
				active.click();
			}
		}
	});

	document.addEventListener('focusin', function (e) {
		var index = links().indexOf(e.target);
		if (index >= 0) current = index;
	});

	document.addEventListener('click', function (e) {
		var link = closestLink(e.target);
		if (link) {
			setTimeout(function () { link.blur(); }, 0);
		}
	});

	window.addEventListener('load', function () { focusAt(0); });
})();
