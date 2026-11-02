# CodeTV

CodeTV es una aplicación para televisores LG con webOS que reproduce **audio, imágenes y video guardados en Google Drive**, con navegación pensada para el control remoto.

## Qué hace

- **Inicio:** Continuar viendo (una tarjeta por carpeta) y Recientes (últimos videos vistos).
- **Explorar:** navega las carpetas de la biblioteca, con orden, tres vistas, favoritas y recarga.
- **Música y Fotos:** listas con el mismo orden y vista que Explorar; presentación y visor de fotos.
- **Reproductor:** mini reproductor y vista completa, con velocidades de 0.5x a 10x, saltos de 10 s y subtítulos incrustados.
- **Errores explicados:** registro con fecha, explicación, acción y detalle técnico, con un semáforo en Ajustes.

## Documentación

| Documento | Idioma | Para quién |
|---|---|---|
| [Guía de instalación y configuración](docs/guia-instalacion.md) | Español | Quien instala la app: cuenta de desarrollador, TV, Drive, proxy y mantenimiento. |
| [Manual de usuario](docs/manual-usuario.md) | Español | Quien usa la app. |
| [Arquitectura](docs/arquitectura.md) | Español | Quien mantiene o extiende el código. |
| [Implementation guide](docs/en/implementation.md) | Inglés | Developers who maintain the code. |
| [Matriz de pruebas](docs/pruebas.md) | Español | Resultados por TV y casos de uso. |

Documentos de diseño e investigación: [plan.md](docs/plan.md), [investigacion-webos.md](docs/investigacion-webos.md), [diseno-interfaz.md](docs/diseno-interfaz.md), [diseno-mini-reproductor.md](docs/diseno-mini-reproductor.md).

## Requisitos

- Node.js 18 o superior (probado con v22).
- Para empaquetar: CLI de webOS `@webos-tools/cli` (probado con 3.2.6).
- Una cuenta de servicio de Google con acceso de lectura a las carpetas compartidas.
- Opcional: una computadora en la misma red con el proxy (`server/proxy.mjs`) y ffmpeg.

## Inicio rápido

```bash
npm install
npm test                 # pruebas automáticas
npm run build            # compila src/ a app/js/app.js
npm run check:es2015     # verifica compatibilidad con el motor de la TV
```

Para instalar en la TV, colocar la llave de la cuenta de servicio en `~/.config/codetv/service-account.json` y ejecutar:

```bash
npm run package:tv       # genera dist/*.ipk (incluye la llave; no distribuir)
```

Detalles de la CLI de webOS, perfiles de TV y proxy: ver [arquitectura.md](docs/arquitectura.md), sección 7.

## Estructura

```
app/          Interfaz de la app (se empaqueta)
src/          Módulo de Drive y autenticación (se compila a app/js/)
server/       Proxy para Drive, remux faststart y subtítulos
scripts/      Compilación y pruebas manuales de Drive
test/         Pruebas automáticas
docs/         Documentación
```

## Seguridad y privacidad

- La llave de la cuenta de servicio viaja dentro del paquete de la TV. Es aceptable solo para uso personal. No se versiona ni se distribuye.
- Los datos de uso se guardan solo en la TV; "Cerrar sesión" en Ajustes los borra.
- El proxy requiere un secreto y debe correr solo en la red local.

## Estado

Uso personal, en desarrollo. Las pruebas de interfaz se hacen en TV 2021 (OLED48A1PSA); la TV 2019 está pendiente. Ver [pruebas.md](docs/pruebas.md) para el estado de cada caso.
