# Arquitectura de CodeTV

Documento técnico para mantener y extender la app. Explica qué hace cada módulo y **por qué** se diseñó así. Para el uso, ver [manual-usuario.md](manual-usuario.md). La versión en inglés está en [en/implementation.md](en/implementation.md).

## 1. Visión general

CodeTV es una app web empaquetada para webOS (LG). Se compone de:

- **Interfaz** (`app/`): HTML, CSS y JavaScript de navegador, sin frameworks. Corre en el motor Chromium de la TV.
- **Módulo de Drive** (`src/` → `app/js/app.js`): firma el token de la cuenta de servicio y consulta Drive. Se compila a un script clásico con esbuild.
- **Proxy** (`server/`): en una computadora de la red local. Sirve el contenido de Drive al `<video>` de la TV, con el token en la cabecera.

```
TV (webOS)                                   Computadora (red local)
┌──────────────────────────────┐             ┌───────────────────────┐
│ app/index.html               │             │ server/proxy.mjs      │
│  shell.js  screens.js        │  /stream/   │  Range, faststart,   │──► Google Drive
│  player.js music.js tracks.js│ ──────────► │  subtítulos (WebVTT)  │   (Authorization)
│  drive.js  logic.js store.js │             └───────────────────────┘
│  errors.js nav.js icons.js   │
│  js/app.js (src/ compilado)  │── listado y miniaturas ─────────────────► Google Drive
└──────────────────────────────┘
```

## 2. Estructura de carpetas

| Ruta | Contenido |
|---|---|
| `app/` | Interfaz. Se empaqueta con `ares-package`. |
| `app/index.html` | Estructura de todas las pantallas y del reproductor. El orden de los `<script>` importa. |
| `app/styles.css` | Estilos. Los temas vienen de `app/themes.js`. |
| `app/js/` | Generado por la compilación (no se versiona). Contiene `app.js` y `service-account.js`. |
| `src/` | Módulo de Drive y autenticación (ES2017 compilado a ES2015 por esbuild). |
| `server/` | Proxy, remux faststart y subtítulos. Corre en Node.js. |
| `scripts/` | Compilación, comprobación de sintaxis y pruebas manuales de Drive. |
| `test/` | Pruebas automáticas (`npm test`). |
| `docs/` | Documentación, incluida la matriz de pruebas (`pruebas.md`). |

## 3. Módulos de la interfaz

El orden de carga en `index.html` es: `flags.js`, `nav.js`, `icons.js`, `logic.js`, `store.js`, `errors.js`, `drive.js`, `player.js`, `tracks.js`, `music.js`, `themes.js`, `screens.js`, `shell.js`, después `js/service-account.js` y `js/app.js`.

Todos los módulos son IIFE que se cuelgan de `window` (`CodeXxx`). **Por qué:** no hay módulos ES en el navegador de la TV de 2020, y así cada parte expone solo su API.

| Módulo | Responsabilidad | Por qué existe así |
|---|---|---|
| `flags.js` | Interruptores de funciones (`videoSection`). | Desactivar una sección sin borrar su código. |
| `nav.js` | Navegación con flechas por proximidad espacial y Enter. | Las flechas deben ir al elemento visible más cercano, no al siguiente en el DOM. |
| `icons.js` | Iconos SVG de trazo, con tamaño. | Un solo lugar para el estilo de iconos. |
| `logic.js` | Funciones puras: orden, progreso, tiempos, carpetas y cola. | Sin DOM ni red, así se prueban con `node --test`. |
| `store.js` | Lectura y escritura de `localStorage` con prefijo `codetv.`. | Si el almacenamiento falla, la app sigue sin guardar. |
| `i18n.js` | Traducción a inglés: diccionario, patrones y un `MutationObserver` que traduce lo que se dibuja. | Así las pantallas no se tocan una por una; cambiar el idioma recarga la app. |
| `errors.js` | Registro de errores, clasificación y saneamiento del detalle. | Un error explicado y con acción es más útil que un mensaje técnico. |
| `drive.js` | Biblioteca de Drive para las pantallas: raíces, hijos, recorrido, miniaturas y URL. | Concentra la caché y la espera al módulo compilado. |
| `player.js` | Reproductor único (`CodePlayer`): un solo `<video>`, estados y progreso. | Un solo elemento evita dos fuentes de audio y de posición. |
| `tracks.js` | Panel de audio y subtítulos. | Aislado porque depende solo de `video.audioTracks` y `textTracks`. |
| `music.js` | Reproductor de música con su propio `<audio>`. | Independiente del video; se pausa cuando empieza un video. |
| `themes.js` | Temas de color. **Generado** desde `src/styles/tokens.css`. | Los colores viven en tokens, no en el CSS de cada pantalla. |
| `screens.js` | Contenido de Inicio, Explorar, Video (desactivada), Música, Fotos y Ajustes. | Cada pantalla se dibuja al entrar. |
| `shell.js` | Barra superior, mini, vista completa, controles, velocidades, Atrás y cola. | Es el único que decide cómo se muestra el reproductor. |

### 3.1 Una sola fuente de verdad para el reproductor

`CodePlayer` (en `player.js`) es el único dueño del `<video>`. El elemento **nunca cambia de padre**: la vista completa y el mini solo cambian su posición y tamaño en `#stage`. **Por qué:** mover un `<video>` en el DOM lo reinicia en muchos navegadores, y se perdería la reproducción.

El estado (`idle`, `playing`, `paused`, `ended`) y el modo (`full`, `mini`) viven en `CodePlayer`. `shell.js` se suscribe y aplica el estado en `render(s)`.

### 3.2 Pantallas y foco

`screens.js` crea los elementos y los enlaza con `card()` o `row()`. Cada enlace es un `<a href="#">` con `data-id` cuando hace falta restaurar el foco. **Por qué:** el control remoto solo puede enfocar enlaces; un `<a>` recibe foco y OK sin código extra.

Las listas largas (Música, Fotos) se dibujan por bloques de 60 (`lazyList`). Al bajar o al enfocar uno de los últimos, se añade el siguiente bloque. **Por qué:** dibujar miles de tarjetas con miniaturas bloquea la TV.

## 4. Flujos principales

### 4.1 Reproducción

1. `playVideo(file, startAt, list)` en `shell.js` reinicia las velocidades y prepara la cola.
2. `ensureQueue` decide la cola:
   - con `list`: esa lista (desde Recientes o Explorar);
   - sin `list` y con `file.path`: los videos de la **misma carpeta** (`L.folderOf`);
   - sin nada: toda la biblioteca.
3. `probeStream` comprueba que el proxy responda antes de abrir el archivo; si falla, el error se registra.
4. `CodePlayer.play` asigna la URL y empieza. Los eventos del `<video>` actualizan estado, progreso y avisos.
5. `saveProgress` guarda `{name, path, time, duration, updated}` cada cinco segundos. Al terminar, borra la entrada.

### 4.2 Continuar viendo y Recientes

- **Continuar viendo:** `L.continueList` toma los progresos en curso, ordenados por `updated`. `renderHome` deja **una entrada por carpeta** (`L.folderOf(path)`).
- **Recientes:** `remember(file)` agrega el archivo a `recent` (máximo 30) con su ruta. Inicio muestra solo los de tipo `video`, en el orden guardado (el último primero). Al elegir uno, se reproduce con esa lista como cola.

**Por qué:** la regla de "siguiente" depende de dónde se eligió el video. Sin la ruta, la app no puede saber la carpeta de origen.

### 4.3 Atrás

`back()` en `screens.js` y `handleFullBack(popped)` en `shell.js` resuelven el Atrás en orden:

1. Cerrar el visor de fotos.
2. Subir la lista al inicio (`toTopOfList`), con el foco en el primer elemento.
3. Subir un nivel de carpeta, o cerrar el panel de pistas, ocultar controles y pasar al mini.
4. Volver a la sección anterior o a Inicio.

**Por qué:** el control remoto envía Atrás como tecla (461, 27 u 8) y el sistema también puede generar un evento de historial. Un `sentinel` en el historial y contadores de "eco" evitan que una sola pulsación haga dos cosas.

### 4.4 Navegación con flechas

`nav.js` busca, para cada dirección, el enlace visible más cercano, con penalización por desalineación. Si ninguno cumple, el foco se queda. Las pantallas con paneles (`data-modal`) limitan el foco a su interior.

**Por qué:** en una TV la navegación lineal (siguiente en el DOM) no coincide con lo que ve el usuario.

Si otra capa ya atendió OK (`defaultPrevented`), `nav.js` no vuelve a activar el enlace. **Por qué:** evita que una misma pulsación ejecute dos acciones.

### 4.5 Velocidades

- **Avance:** `playbackRate` con los valores de `RATES` (0.5, 1, 1.5, 2, 5, 10). Fuera de 1x el audio se silencia (`muted`).
- **Retroceso:** `CodePlayer.seekBy` cada segundo, con paso igual a la velocidad. El video queda en pausa.
- **Control de posición:** `changeSpeed` compara la posición esperada con la real 1.5 s después de un cambio. Si retrocedió, la corrige y lo registra.

**Por qué el retroceso por pasos:** los navegadores no reproducen hacia atrás de forma continua. Por la misma razón, el control de posición es una mitigación de un comportamiento del TV que no se ha confirmado (ver `pruebas.md`).

### 4.6 Errores

Toda falla pasa por `CodeErrors.record(área, error)`:

1. `sanitize` quita tokens (`Bearer …`), el parámetro `s=` del proxy y llaves privadas.
2. `classify` busca la primera regla que coincide y devuelve título, explicación y acción.
3. Se guarda al inicio de la lista (máximo 50). Un mismo error repetido en 10 s no se duplica.
4. `subscribe` avisa al semáforo de Ajustes.

**Por qué:** un mensaje técnico sin acción obliga a investigar. La explicación y la acción permiten resolverlo sin el desarrollador.

## 5. Drive y autenticación

- La TV firma un JWT RS256 con la llave de la cuenta de servicio (`src/auth/serviceAccount.js`) y lo cambia por un token de acceso (dura una hora). El token se reutiliza hasta caducar.
- `driveClient.js` lista carpetas, hijos y URLs de medios; `escapeQuery` protege las búsquedas.
- `CodeDrive.crawl(kinds, onProgress)` recorre la biblioteca por niveles (amplitud primero), con límite de 300 carpetas. **Por qué por niveles:** las carpetas cercanas a la raíz aparecen primero, y el límite corta recorridos enormes.
- `thumbUrl` guarda la miniatura 20 minutos, porque las URL de Drive caducan.

**Riesgo conocido:** la llave privada viaja dentro del bundle de la TV (`app/js/service-account.js`, no versionado). Es aceptable solo para uso personal en una TV propia. No distribuir ese archivo.

## 6. Proxy (`server/`)

`server/proxy.mjs` sirve `/stream/<id>?s=<secreto>` y `/subs/<id>`:

- Reenvía `Range` a Drive con `Authorization` en la cabecera (el `<video>` no puede enviar cabeceras, y Drive no acepta el token en la URL).
- Si un mp4 tiene el índice al final, `faststart.mjs` lo remuxa una vez (sin recodificar) y lo sirve desde `server/cache/`. Límite: 10 GB; por encima responde 413 con un mensaje.
- `subtitles.mjs` convierte las pistas de texto a WebVTT con ffmpeg.
- Los streams se conectan con `pipeTo`: si Drive corta a mitad, la respuesta se cierra y el proceso no se cae.

**Por qué un proxy:** el `<video>` de la TV no puede enviar `Authorization`, y el token en la URL es rechazado.

## 7. Compilación, empaquetado y pruebas

```bash
npm install
npm run build            # src/ -> app/js/app.js (script clásico)
npm run check:es2015     # comprueba que el bundle no usa sintaxis posterior a ES2015
npm run build:tv         # build + llave en app/js/service-account.js
npm run package:tv       # + ares-package app -o dist
npm test                 # pruebas con node --test
```

Las pruebas (`test/`) cubren: lógica (`logic`), reproductor (`player`), Drive (`driveClient`, `driveCheck`), autenticación (`deviceFlow`, `serviceAccount`), proxy (`proxy`), faststart y subtítulos. Las pruebas de interfaz se hicieron con Chromium headless en la sesión de desarrollo y se registran en `pruebas.md`; no están en el repositorio porque dependen de archivos de prueba locales.

## 8. Almacenamiento local

Todas las claves tienen el prefijo `codetv.`.

| Clave | Contenido | Quién la escribe |
|---|---|---|
| `settings` | Tema, fuente, tamaño de texto, idioma, intervalo, orden, vista, tamaño y esquina del mini. | `screens.js`, `shell.js` |
| `progress` | `{id: {name, path, time, duration, updated}}` | `shell.js` (`saveProgress`) |
| `recent` | Lista de los últimos 30 archivos abiertos, con su ruta. | `screens.js` (`remember`) |
| `favs` | Carpetas favoritas. | `screens.js` |
| `watched` | Videos vistos por completo: `{id: true}`. Independiente de `progress`, así borrar el historial de Continuar viendo no la quita. | `shell.js` (`saveProgress`) |
| `errors` | Registro de errores (máximo 50). | `errors.js` |

"Cerrar sesión" en Ajustes borra progreso, recientes, favoritas, vistos y ajustes. No borra el registro de errores.

## 9. Decisiones y su motivo

| Decisión | Motivo |
|---|---|
| JavaScript de navegador sin frameworks | El motor de la TV es antiguo; un framework añade riesgo de compatibilidad. |
| Un solo `<video>` | Evita dos fuentes de audio y posiciones desincronizadas. |
| Proxy local para Drive | El `<video>` no envía cabeceras de autorización. |
| Cola por carpeta de origen | Así el "siguiente" responde a lo que el usuario eligió. |
| Recientes con la ruta | Permite saber la carpeta de cada video sin consultar Drive. |
| Listas por bloques | Evita bloquear la TV con bibliotecas grandes. |
| Registro de errores con acción | Permite resolver problemas sin depurar. |
| Interruptor de sección (`flags.js`) | Desactiva funciones sin borrar su código. |
| Retroceso por pasos | Los navegadores no reproducen hacia atrás de forma continua. |

## 10. Limitaciones y pendientes

- No hay pruebas automáticas de la interfaz en el repositorio.
- `screens.js` y `shell.js` son grandes (más de 900 líneas cada uno). Dividirlos en módulos por pantalla es el siguiente paso recomendado, con pruebas que lo respalden.
- Varias conductas dependen del TV real (ver `pruebas.md`, sección de casos de uso).
