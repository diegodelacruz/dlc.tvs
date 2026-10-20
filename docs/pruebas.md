# Matriz de pruebas

Registrar resultados por TV. Estado: `pendiente`, `ok`, `falla`, `no aplica`.

## Datos de cada TV

| Campo | TV 2020 | TV 2023 |
|---|---|---|
| Modelo | pendiente (Diego) | pendiente (Diego) |
| Versión de webOS | pendiente (Diego) | pendiente (Diego) |
| Motor web (Chromium) | [No verificado] | [No verificado] |
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

| Prueba | TV 2020 | TV 2023 |
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
