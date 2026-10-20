# Investigación: webOS (LG TV) y Google Drive

Fecha de la investigación: 2026-10-20.

Convención: las afirmaciones sin marca vienen de fuentes encontradas. Las marcadas como **[Inferencial]** son deducciones. Las marcadas como **[No verificado]** requieren confirmación en la TV, en la consola de Google o en la documentación oficial vigente.

## 1. Herramientas y plataforma

- CLI oficial vigente: `@webos-tools/cli` (npm). Versión verificada en registro npm: 3.2.6. Sirve para webOS OSE y webOS TV cambiando el perfil.
- La CLI anterior de webOS TV quedó sin soporte desde marzo de 2024 según LG.
- Comandos: `ares-generate`, `ares-package`, `ares-install`, `ares-launch`, `ares-inspect`, `ares-setup-device`, `ares-device-info`, `ares-log`.
- Plantillas de `ares-generate`: `basic`, `hosted_webapp`, `webappinfo`, `js_service`, `jsserviceinfo`, `packageinfo`.
- Empaquetado verificado en entorno local: `ares-package` genera un `.ipk` a partir de la plantilla `basic`. Muestra advertencia si falta `requiredACG` en `appinfo.json`; por eso se declara `"requiredACG": []`.
- Motor web por versión (documentación de LG, vía búsqueda):
  - webOS TV 24: Chromium 108
  - webOS TV 23: Chromium 94
  - webOS TV 22: Chromium 87
  - Un TV conserva el motor con el que salió de fábrica. **[No verificado]** para webOS 5/6, que corresponden a los modelos 2020 y 2021. Hay que confirmar la versión exacta en cada TV.
- Depuración: LG documenta Web Inspector basado en Chromium. Requiere un build de Chromium compatible con la versión de la TV. Fuente comunitaria: webosbrew.org.

## 2. Modo desarrollador

- Se activa con la app "Developer Mode" de la LG Content Store, con cuenta LG.
- La sesión caduca. Cifras encontradas:
  - 50 h: reportes de usuarios de 2022.
  - 999 h: foro oficial de desarrolladores, publicación más reciente. LG indicó que no hay limitaciones conocidas. **[No verificado]** el valor vigente.
- Eventos que desactivan el modo desarrollador: reinicio de la TV sin conexión de red (LG indica 10 reinicios sin red), o agotamiento de la sesión tras reiniciar.
- Al caducar, las apps instaladas en modo desarrollador se eliminan. Es una limitación para uso personal continuo.
- Iniciar sesión con la misma cuenta en otra TV cierra la sesión en la primera. **[No verificado]**.

## 3. Reproducción de video

- Fuentes de terceros (no oficiales) indican soporte de DASH y HLS en webOS, con codecs:
  - AVC en DASH y HLS VOD
  - HEVC y AV1 en DASH VOD (según modelo)
  - DASH con Widevine (CENC)
- Fuentes: Radiant Media Player (demo para webOS), Nagra Connect Player SDK.
- No se encontró documentación oficial de LG sobre la pila de medios. Se debe probar directamente en cada TV.

## 4. Google Drive

- Descarga de contenido binario: `files.get` con `alt=media`. Solo funciona con archivos almacenados en Drive (no con Google Docs/Sheets/Slides, que usan `files.export`).
- Soporte de `Range` en `alt=media`: **no confirmado** en documentación oficial de Drive. Fuentes secundarias indican respuestas HTTP 206. Es un punto crítico para el seek de video.
- OAuth para TV y dispositivos de entrada limitada (device flow):
  - Endpoint de código: `https://oauth2.googleapis.com/device/code`
  - Google usa Drive como ejemplo de caso de uso para este flujo.
  - El ejemplo oficial usa scopes de YouTube. **No se confirmó** que los scopes de Drive estén permitidos en este flujo. Validar en Hito 2.
- Scopes de Drive, como `drive.readonly`, son restringidos. Para distribución pública requieren verificación de Google.
- En proyectos en modo de prueba, los refresh tokens de apps no verificadas caducan a los 7 días. **[Inferencial]**, verificar en la consola de Google.

## 5. Distribución

- Tienda oficial: LG Seller Lounge.
- Proceso: envío de la app con documentos (UX scenario, self checklist), QA de LG, y publicación en LG Content Store. Si falla QA, se devuelve con lista de problemas.
- Tipos de vendedor: individual o corporativo.
- No verificado: costos, requisitos fiscales, tiempos actuales de revisión para vendedor individual.

## 6. Decisiones derivadas

- Tipo de app: web empaquetada (HTML/CSS/JS), formato oficial de LG.
- Pendiente: framework (JS plano o Enact).
- Pendiente: estrategia de seek si `Range` no está soportado (proxy propio, reproducción sin seek, u otro formato).

## Fuentes

- Documentación de la CLI de webOS TV: https://webostv.developer.lge.com/develop/tools/webos-tv-cli-introduction
- Paquete `@webos-tools/cli` en npm: https://www.npmjs.com/package/@webos-tools/cli
- Modo desarrollador: https://webostv.developer.lge.com/develop/getting-started/developer-mode-app
- Motor web y API: https://webostv.developer.lge.com/develop/specifications/web-api-and-web-engine
- Depuración: https://webostv.developer.lge.com/develop/getting-started/app-debugging
- Aprobación de apps: https://webostv.developer.lge.com/distribute/app-approval-process
- Foro de desarrolladores de LG (sesión de modo desarrollador): https://forum.webostv.developer.lge.com/t/developer-mode-keeps-login-me-out-before-999h-run-out/6428
- webosbrew.org (devmode, web engine, inspección): https://www.webosbrew.org/devmode/ y https://www.webosbrew.org/develop/guides/web-app/web-engine
- OAuth para dispositivos de entrada limitada: https://developers.google.com/identity/protocols/oauth2/limited-input-device
- Drive `files.get`: https://developers.google.com/drive/api/v3/reference/files/get
- Radiant Media Player (compatibilidad webOS, tercero): https://www.radiantmediaplayer.com/rmp-webos/
