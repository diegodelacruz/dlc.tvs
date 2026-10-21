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
| Sesión de Developer Mode (duración leída en app) | pendiente | pendiente |

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
| Pausa y reanudación | pendiente | pendiente |
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
| Puntero: el foco sigue al pasar sobre tarjetas y pestañas | pendiente | pendiente |
| Puntero: clic en tarjeta abre detalle | pendiente | pendiente |
| Puntero: clic en controles del reproductor (10 s, pausa, audio y subtítulos) | pendiente | pendiente |
| Rueda: desplaza listas de videos, carpetas y fotos | pendiente | pendiente |
| Botón Atrás del Magic Remote desde cada pantalla | pendiente | pendiente |
| Botón OK del Magic Remote en tarjetas y controles | pendiente | pendiente |
| Cambio entre D-pad y puntero sin perder el foco | pendiente | pendiente |

## Mini reproductor de video

| Prueba | TV 2019 | TV 2021 |
|---|---|---|
| Video real reproduce en el mini tras salir del reproductor | pendiente | pendiente |
| Clic en el mini reabre el reproductor en el mismo segundo | pendiente | pendiente |
| Botón "×" del mini cierra sin reabrir el reproductor | pendiente | pendiente |
| Iniciar video pausa la música | pendiente | pendiente |
| Mini se mantiene al cambiar de sección | pendiente | pendiente |
| Rendimiento del mini con video 4K HDR | pendiente | pendiente |
