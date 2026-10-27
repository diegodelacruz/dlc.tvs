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
| Reproducción AV1 | pendiente | pendiente |
| Seek (adelantar y retroceder) | pendiente | pendiente |
| Pausa y reanudación | pendiente | OK (Diego, 2026-10-27) |
| Pérdida de red durante reproducción | pendiente | pendiente |
| Expiración de sesión de Developer Mode | pendiente | pendiente |
| Reinstalación tras expiración | pendiente | pendiente |

## Formatos de audio e imágenes (Hito 5)

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Audio mp3 | pendiente | pendiente |
| Audio aac / m4a | pendiente | pendiente |
| Audio flac | pendiente | pendiente |
| Audio ogg / opus | pendiente | pendiente |
| Imagen jpg | pendiente | pendiente |
| Imagen png | pendiente | pendiente |
| Imagen webp / heic | pendiente | pendiente |
| Presentación automática | pendiente | pendiente |
| Reproducción de audio en segundo plano | pendiente | pendiente |
| Pistas múltiples en mkv (audio y subtítulos) | pendiente | pendiente |

## Control Magic Remote (requerido por Diego)

Las pruebas deben cubrir el Magic Remote completo, no solo las flechas.

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Puntero: clic en pestañas de la barra superior | pendiente | pendiente |
| Puntero: el foco sigue al pasar sobre tarjetas y pestañas | pendiente | OK (2026-10-27) |
| Puntero: clic en tarjeta abre detalle | pendiente | pendiente |
| Puntero: clic en controles del reproductor (10 s, pausa, audio y subtítulos) | pendiente | pendiente |
| Rueda: desplaza listas de videos, carpetas y fotos | pendiente | pendiente |
| Botón Atrás del Magic Remote desde cada pantalla | pendiente | pendiente |
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
