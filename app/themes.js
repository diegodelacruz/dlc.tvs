// Temas de color de la app. Valores tomados de src/styles/tokens.css (generado; no editar a mano).
(function (root) {
	var THEMES = {
 "Negro OLED": {
  "bg": "#000000",
  "surface": "#232532",
  "surface-2": "#1d1f2e",
  "surface-3": "#292b31",
  "raised": "#3f424d",
  "line": "#595d6c",
  "text": "#e9e9ed",
  "text-2": "#cfd3e5",
  "muted": "#b2b6ca",
  "dim": "#9397ab",
  "accent": "#9184d9",
  "accent-hi": "#b5abfc",
  "accent-text": "#d2cefd",
  "accent-fill": "#423a6a",
  "accent-tint": "#2b2741",
  "on-accent": "#f5f4ff"
 },
 "Nocturne": {
  "bg": "#161826",
  "surface": "#232532",
  "surface-2": "#1d1f2e",
  "surface-3": "#292b31",
  "raised": "#3f424d",
  "line": "#595d6c",
  "text": "#e9e9ed",
  "text-2": "#cfd3e5",
  "muted": "#b2b6ca",
  "dim": "#9397ab",
  "accent": "#9184d9",
  "accent-hi": "#b5abfc",
  "accent-text": "#d2cefd",
  "accent-fill": "#423a6a",
  "accent-tint": "#2b2741",
  "on-accent": "#f5f4ff"
 },
 "Grafito ámbar": {
  "bg": "#0b0b0c",
  "surface": "#1f1f22",
  "surface-2": "#18181b",
  "surface-3": "#26262a",
  "raised": "#3a3a40",
  "line": "#56565e",
  "text": "#ededee",
  "text-2": "#d0d0d4",
  "muted": "#b4b4ba",
  "dim": "#94949b",
  "accent": "#d9a441",
  "accent-hi": "#f2c46d",
  "accent-text": "#f5d9a0",
  "accent-fill": "#4a3816",
  "accent-tint": "#2b2210",
  "on-accent": "#fff7e8"
 },
 "Bosque": {
  "bg": "#050807",
  "surface": "#1b2420",
  "surface-2": "#151d19",
  "surface-3": "#202a25",
  "raised": "#34413a",
  "line": "#4f5e56",
  "text": "#e8eeea",
  "text-2": "#cddbd3",
  "muted": "#afc0b7",
  "dim": "#8fa198",
  "accent": "#5fbf8f",
  "accent-hi": "#8be0b4",
  "accent-text": "#b8f0d2",
  "accent-fill": "#1f4a36",
  "accent-tint": "#142a20",
  "on-accent": "#effff6"
 },
 "Alto contraste": {
  "bg": "#000000",
  "surface": "#1a1a1a",
  "surface-2": "#111111",
  "surface-3": "#222222",
  "raised": "#333333",
  "line": "#8a8a8a",
  "text": "#ffffff",
  "text-2": "#f0f0f0",
  "muted": "#d6d6d6",
  "dim": "#bdbdbd",
  "accent": "#ffd60a",
  "accent-hi": "#ffe45c",
  "accent-text": "#ffe98a",
  "accent-fill": "#4d4100",
  "accent-tint": "#2a2400",
  "on-accent": "#ffffff"
 }
};
	var NAMES = Object.keys(THEMES);

	// Aplica las variables de color del tema elegido.
	function apply(name) {
		var t = THEMES[name] || THEMES[NAMES[0]];
		Object.keys(t).forEach(function (k) {
			document.documentElement.style.setProperty('--' + k, t[k]);
		});
	}

	root.CodeTheme = { names: NAMES, apply: apply };
})(window);
