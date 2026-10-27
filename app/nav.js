// Navegación con control remoto para las páginas de la app.
// - Puntero: al pasar sobre un enlace, ese enlace pasa a ser el foco; clic lo activa y luego lo libera.
// - Flechas: mueven el foco desde el enlace marcado (el último que apuntó el puntero o que enfocaron las flechas).
// - OK (13): activa el enlace enfocado.
(function () {
	var current = -1;

	// Si hay un panel abierto (data-modal sin hidden), el foco queda dentro de él.
	// Solo cuentan los enlaces visibles.
	function links() {
		var scope = document.querySelector('[data-modal]:not([hidden])') || document;
		return Array.prototype.slice.call(scope.querySelectorAll('a[href]')).filter(function (a) {
			return a.offsetParent !== null;
		});
	}

	function closestLink(node) {
		while (node && node.tagName !== 'A') node = node.parentNode;
		return node || null;
	}

	function focusAt(index) {
		var list = links();
		if (list.length === 0) return;
		current = (index + list.length) % list.length;
		list[current].focus();
	}

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
		var list = links();
		var active = document.activeElement;
		var index = list.indexOf(active);

		if (code === 40 || code === 39 || code === 38 || code === 37) {
			e.preventDefault();
			if (index < 0) {
				// Nada enfocado (por ejemplo, tras un clic): continuar desde el último enlace marcado.
				focusAt(current < 0 ? 0 : current);
				return;
			}
			var forward = code === 40 || code === 39;
			focusAt(forward ? index + 1 : index - 1);
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
