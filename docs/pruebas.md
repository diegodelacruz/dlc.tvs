# Matriz de pruebas

Registrar resultados por TV. Estado: `pendiente`, `ok`, `falla`, `no aplica`.

## Datos de cada TV

| Campo | TV 2019 | TV 2021 |
|---|---|---|
| Modelo | OLED55B9PSB (fabricada 08/2019, ensamblada en Ecuador) | OLED48A1PSA (fabricada 12/2021, ensamblada en Ecuador) |
| Año de modelo según etiqueta | 2019 (fabricada 08/2019) | 2021 (fabricada 12/2021) |
| webOS de fábrica (fuente secundaria) | 4.5 según fichas; leído en TV: 4.10.2-31 | 6.0 según distribuidor; leído en TV: 6.5.3-47 |
| Versión de software (firmware) | 05.50.00 (Diego, 2026-10-21) | 03.53.45 (Diego, 2026-10-21) |
| Versión de webOS (leer en TV) | webOS TV 4.10.2-31 (leído en TV, Diego, 2026-10-21) | webOS TV 6.5.3-47 (leído en TV, Diego, 2026-10-21) |
| Actualizaciones disponibles | No hay (Diego, 2026-10-21) | No hay (Diego, 2026-10-21) |
| Motor web (Chromium) | Chromium 53 para webOS 4.x (fuente secundaria, LG) | pendiente de leer en TV |
| IP en red local | pendiente (Diego) | pendiente (Diego) |
| Sesión de Developer Mode (duración leída en app) | pendiente | 999h:59m al activar (Diego, 2026-10-21) |

## Hito 0: empaquetado y CLI (sin TV)

| Prueba | Resultado |
|---|---|
| `ares-generate` con plantilla `basic` | ok (verificado en scratchpad) |
| `ares-package` genera `.ipk` | ok (verificado en scratchpad) |
| `requiredACG` declarado | ok |
| `ares-package` sobre `app/` del repositorio | ok (sin advertencias) |

## Hito 2: autenticación Google

| Prueba | Resultado |
|---|---|
| Device flow con scopes de Drive | pendiente |
| Refresh token obtenido | pendiente |
| Refresh token tras 7 días (modo prueba) | pendiente |

## Hito 3: Drive y reproducción

| Prueba | Resultado |
|---|---|
| `files.list` filtrando video | pendiente |
| Paginación con `pageToken` | pendiente |
| `files.get alt=media` completo | pendiente |
| `files.get alt=media` con `Range` (206) | pendiente |

## Hito 5: en TV

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Instalación con `ares-install` | pendiente | pendiente |
| Lanzamiento con `ares-launch` | pendiente | pendiente |
| Login (device flow) | pendiente | pendiente |
| Listado de carpetas | pendiente | pendiente |
| Reproducción mp4 H.264 AAC | pendiente | pendiente |
| Reproducción mkv | pendiente | pendiente |
| Reproducción HEVC | pendiente | pendiente |
| Reproducción AV1 | pendiente | OK (Diego, 2026-10-27) |
| Seek (adelantar y retroceder) | pendiente | pendiente |
| Pausa y reanudación | pendiente | OK (Diego, 2026-10-27) |
| Pérdida de red durante reproducción | pendiente | Parcial (Diego, 2026-10-27): se cortó la red de la Mac (proxy). La reproducción siguió unos segundos con el buffer y luego se congeló cerca de un minuto. Al reconectar, continuó sin reabrir. Falta probar corte de red del TV y comportamiento con cortes más largos |
| Expiración de sesión de Developer Mode | pendiente | pendiente |
| Reinstalación tras expiración | pendiente | pendiente |

## Formatos de audio e imágenes (Hito 5)

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Audio mp3 | pendiente | pendiente |
| Audio aac / m4a | pendiente | pendiente |
| Audio flac | pendiente | OK (Diego, 2026-10-27) |
| Audio ogg / opus | pendiente | Parcial (Diego, 2026-10-27): `.opus` OK; Opus dentro de `.ogg` OK; `.ogg` con Vorbis FALLA. Conclusión: el TV no decodifica Vorbis (confirmado). No soportado; pendiente para corrección futura (ver docs/plan.md) |
| Imagen jpg | pendiente | pendiente |
| Imagen png | pendiente | pendiente |
| Imagen webp / heic | pendiente | Parcial (Diego, 2026-10-27): webp OK; heic pendiente (sin archivo de prueba) |
| Presentación automática | pendiente | pendiente |
| Reproducción de audio en segundo plano | pendiente | pendiente |
| Pistas múltiples en mkv (audio y subtítulos) | pendiente | Probado (Diego, 2026-10-27): selector de audio y subtítulos funciona con `prueba-multipista-larga.mkv`. Antecedentes: en el mkv corto el `<video>` nativo no ofrecía pistas; ver docs/plan.md |

## Control Magic Remote (requerido por Diego)

Las pruebas deben cubrir el Magic Remote completo, no solo las flechas.

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Puntero: clic en pestañas de la barra superior | pendiente | pendiente |
| Puntero: el foco sigue al pasar sobre tarjetas y pestañas | pendiente | OK (2026-10-27) |
| Puntero: clic en tarjeta abre detalle | pendiente | pendiente |
| Puntero: clic en controles del reproductor (10 s, pausa, audio y subtítulos) | pendiente | pendiente |
| Rueda: desplaza listas de videos, carpetas y fotos | pendiente | Pendiente (Diego, 2026-10-27): las 24 imágenes `prueba-rueda` ya están en `CodeTV-prueba` y se ven en la lista. Prueba de la rueda diferida |
| Botón Atrás del Magic Remote desde cada pantalla | pendiente | Parcial: en el selector de audio y subtítulos, Atrás cierra el panel y el foco vuelve al botón (Diego, 2026-10-27). Pendiente en el resto de pantallas |
| Botón OK del Magic Remote en tarjetas y controles | pendiente | pendiente |
| Cambio entre D-pad y puntero sin perder el foco | pendiente | OK (2026-10-27, tras quitar :hover y unificar foco en nav.js) |

## Mini reproductor de video

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Video real reproduce en el mini tras salir del reproductor | pendiente | pendiente |
| Clic en el mini reabre el reproductor en el mismo segundo | pendiente | pendiente |
| Botón "×" del mini cierra sin reabrir el reproductor | pendiente | pendiente |
| Iniciar video pausa la música | pendiente | pendiente |
| Mini se mantiene al cambiar de sección | pendiente | pendiente |
| Rendimiento del mini con video 4K HDR | pendiente | pendiente |

## Drive con cuenta de servicio

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Firma RSA con crypto.subtle (diagnóstico) | pendiente (diferida) | OK (2026-10-21) |
| Token de la cuenta de servicio desde la TV | pendiente (diferida) | OK (2026-10-21) |
| Listado de CodeTV-prueba (mkv y mp4) | pendiente (diferida) | OK (2026-10-21) |
| Range en alt=media con Authorization (206) | pendiente | pendiente (script desde Mac) |
| Range en alt=media con access_token en URL (206) | pendiente | pendiente (script desde Mac) |
| Reproducción mp4 en <video> | pendiente | pendiente |
| Reproducción mkv en <video> | pendiente | pendiente |

## Reproducción vía proxy (TV 2021, 2026-10-21)

| Prueba | Resultado |
|---|---|
| Range con cabecera Authorization desde Drive (206) | OK (Mac) |
| access_token en URL para <video> | FALLA: Google responde página "Sorry..." (403) |
| Proxy local con Range (server/proxy.mjs) | OK en TV |
| Reproducción mkv (TBBT, 1402 s) en <video> vía proxy | OK: loadedmetadata, playing |
| Seek a 60 s en mkv vía proxy | OK: seeked |
| Reproducción mp4 (Sakura, 157 MB) en <video> vía proxy | FALLA: código 4 (formato no soportado) — pendiente revisar códecs |

## Corrección del mp4 (TV 2021, 2026-10-27)

| Prueba | Resultado |
|---|---|
| mp4 original (índice al final) en <video> vía proxy | FALLA: código 4 |
| mp4 con índice al inicio (remux con `-movflags +faststart`, sin recodificar) | OK: loadedmetadata (1501 s), playing |
| Seek a 1:00 en mp4 faststart | OK (Diego, 2026-10-27): adelantar y retroceder funcionan bien |
| Remux automático en el proxy (detección por átomos + ffmpeg `-c copy +faststart`, caché en `server/cache/`) | Verificado con pruebas y con ffmpeg real en Mac. TV 2021: OK (Diego, 2026-10-27): abre el original `Sakura y el Misterioso Libro Mágico.mp4`, unos 3 s hasta empezar |
| PNG en TV 2021 (Wallpaper Sainte-Catherine 939 KB, Fondo Miami Mac 7.1 MB, Fondo Miami iPad 5.3 MB) | OK (Diego, 2026-10-27): cargan. Sin medir tiempos |

## Audio, imagen y HEVC (TV 2021, 2026-10-27)

| Prueba | Resultado |
|---|---|
| Listado de carpeta con video, audio e imagen (6 elementos) | OK |
| Audio mp3 (prueba-audio.mp3, 20 s) en <video> vía proxy | OK: loadedmetadata, playing, ended |
| Imagen jpg (prueba-imagen.jpg) en <img> vía proxy | OK: imagen cargada |
| Video HEVC mp4 (prueba-hevc.mp4, 20 s) vía proxy | OK: loadedmetadata, playing, ended |
| Sonido del mp3 en la TV | Pendiente de confirmar por Diego |
| Navegación con flechas y marca de foco | OK |

## Sesión 2026-11-01: casos de uso

Leyenda de resultados:
- **HL**: verificado en headless (Chromium con Playwright, fake de Drive y video de prueba de 120 s).
- **TV**: confirmado por Diego en TV 2021 (fecha indicada).
- **pend.**: pendiente de confirmar en TV 2021.
- **no verif.**: no se pudo verificar fuera del TV.

Los scripts de headless se ejecutaron desde la carpeta de trabajo local (no se versionan porque dependen de archivos de prueba locales).

### A. Reproducción en vista normal

| Caso | Resultado | Notas |
|---|---|---|
| A1. Abrir video: empieza a 1x con audio | HL ok; TV ok (reproducción previa) | |
| A2. OK con la barra enfocada alterna reproducir/pausa una sola vez | HL ok; pend. | `nav.js` ahora respeta `defaultPrevented`, para evitar una activación doble. En headless no se reprodujo la doble activación antes del cambio: es preventivo, no confirmado como causa. |
| A3. OK con controles ocultos: una sola acción y muestra controles | HL ok; pend. | Mismo arreglo que A2. |
| A4. Avance a 2x y OK en el botón central: vuelve a 1x y sigue reproduciendo | HL ok; pend. | Diego reportó que no funcionaba en TV. Causa en TV no confirmada; ver A2. Pendiente de probar en TV. |
| A5. Velocidades de avance 0.5x, 1x, 1.5x, 2x, 5x, 10x (ciclo) | HL ok | Etiqueta solo con la velocidad (sin "mudo"). |
| A6. Audio silenciado fuera de 1x y restaurado al volver a 1x | HL ok; TV: "se mutea" (Diego, 2026-11-01) | Solo se escucha a 1x (confirmado en TV). |
| A7. Velocidad distinta de 1x: el botón central cambia a "Volver a 1x" | HL ok; TV ok (2026-11-01, "sí, que se entienda") | |
| A8. Subir de velocidad no devuelve la posición | HL ok (control de posición); TV ok (2026-11-01, "avanza sin regresar") | Control: si retrocede más de 1.5 s, corrige y registra. Causa de fondo no confirmada. |
| A9. Retroceso rápido: búsqueda cada 1 s a la velocidad elegida; queda en pausa | HL ok; TV: "se traba" | Pendiente de decisión (opción A: saltos fijos). |
| A10. Saltos de 10 s adelante y atrás | HL ok; TV: pend. | Botones a cada lado del centro. |
| A11. Video nuevo empieza a 1x | HL ok | |
| A12. Avance desde pausa arranca la reproducción | no verif. (no probado en HL) | Pendiente. |
| A13. Izquierda/derecha con controles ocultos saltan 10 s | pend. | Sin cambios desde la sesión anterior. |
| A14. Atrás con controles visibles: oculta controles; el siguiente Atrás pasa al mini | HL ok (sesión anterior); pend. TV | |

### B. Mini reproductor

| Caso | Resultado | Notas |
|---|---|---|
| B1. Tamaño normal (405 px) y grande (525 px) | TV: "quedó perfecto" (2026-11-01) | Escalas 1.35x y 1.75x. |
| B2. Controles: anterior, reproducir/pausa y siguiente a la izquierda; ver, tamaño y esquina a la derecha | HL ok; pend. TV | |
| B3. Cerrar arriba a la derecha del mini, visible con los controles | HL ok; pend. TV | |
| B4. Cambiar esquina (arriba/abajo) y guardarla | HL ok; pend. TV | |
| B5. Mini no tiene imagen fija (se descartó la idea de póster) | Corregido | Se revirtió lo que no era lo pedido. |

### C. Explorar

| Caso | Resultado | Notas |
|---|---|---|
| C1. Orden: botones de igual ancho, flecha solo en el activo, invertir al pulsar de nuevo | HL ok; TV: "funcionan" (2026-11-01) | Flecha hacia arriba = ascendente. |
| C2. Vistas lista, detalle y miniatura | HL ok; TV: "funcionan" | |
| C3. Estrella de favorita separada del orden | HL ok; TV: pend. | |
| C4. Parte superior fija al bajar la lista | HL ok; TV: pend. | |
| C5. Indicador de posición solo en la región de la lista | HL ok; TV: pend. | |
| C6. Indicador se atenúa tras 3 s sin navegar y reaparece al navegar | HL ok; pend. TV | Agregado a petición de Diego. |
| C7. Indicador oculto durante la reproducción (completa o mini) | HL ok; pend. TV | |
| C8. Atrás al final de una lista: sube al inicio y el foco queda en el primer elemento | HL ok; pend. TV | Antes el foco quedaba en el último elemento. |
| C9. Contorno de la primera fila visible | TV: "corregido" (2026-11-01) | Espacio superior de la lista. |
| C10. Recordar posición al volver a Explorar | HL ok; pend. TV | |
| C11. Recargar la sección actual sin reiniciar la app | HL ok; pend. TV | Caso real: compartir una carpeta nueva en Drive. |
| C12. Indicador de carga en búsquedas largas (carpetas revisadas y archivos encontrados) | HL ok (texto); pend. TV (giro) | |

### D. Música y Fotos

| Caso | Resultado | Notas |
|---|---|---|
| D1. Orden y vista compartidos con Explorar | HL ok; pend. TV | Se guardan en ajustes. |
| D2. Cabecera fija e indicador de posición | HL ok; pend. TV | |
| D3. Carga por bloques de 60 (al bajar o al enfocar los últimos) | HL ok; pend. TV | La búsqueda de la biblioteca sigue recorriendo todas las carpetas (límite de 300). |
| D4. Botones de Música y Fotos con icono | TV: pend. | |

### E. Inicio

| Caso | Resultado | Notas |
|---|---|---|
| E1. Tarjetas de video con fotograma de Drive | TV: "quedó perfecto" (2026-11-01) | Caché de miniaturas de 20 min (HL). |
| E2. Continuar viendo: 5 tarjetas y "Ver todo" en la misma fila | HL ok; TV: pend. | |
| E3. Sección Video desactivada por interruptor (`app/flags.js`) | TV: "hecho" (2026-11-01) | |
| E4. Tamaño de texto de tarjetas (título 26 px, subtítulo 20 px) | TV: pend. | |

### F. Errores y semáforo

| Caso | Resultado | Notas |
|---|---|---|
| F1. Errores de reproducción, de pantallas y de biblioteca se registran | HL ok | Detalle sin tokens, llaves ni secreto del proxy. |
| F2. Ajustes muestra fecha, hora, explicación, acción y detalle; el más reciente primero | HL ok; TV: pend. | |
| F3. Semáforo rojo con errores sin revisar; solo al navegar; se apaga al abrir Ajustes | HL ok; TV: "me parece bien" (2026-11-01) | |
| F4. Borrar registro | HL ok | |

### G. Proxy

| Caso | Resultado | Notas |
|---|---|---|
| G1. Corte de Drive a mitad de descarga no tumba el proceso | Prueba unitaria ok (`pipeTo`); no verif. en Mac | Causa del incidente: `read ETIMEDOUT` sin manejador de error. |
| G2. Secreto del proxy visible en el chat | Pendiente | Se recomienda rotarlo antes de seguir. |

### H. Pendientes anteriores (sin cambios)

- Video negro con audio sin cortes: no reproducido; no hay código que oculte el video.
- Archivos grandes (100 GB) con cortes: falta medir duración y tipo de conexión.
- TV 2019: prueba completa.
- Pérdida de Wi-Fi durante la reproducción; vencimiento del modo desarrollador y reinstalación.
- HEIC: falta archivo de prueba.
