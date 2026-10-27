# Diseño: mini reproductor de video (app final)

Fecha: 2026-10-27. Estado: **propuesta por bloques, pendiente de confirmación de Diego**. No se ha programado en la app.

Base: `docs/factibilidad-mini-reproductor.md` (sección 8, decisiones de 2026-10-20) y lo probado en TV 2021 en `docs/pruebas.md`.

Convención: **[Verificado]** = probado en TV 2021 o en el Mac. **[Inferencial]** = deducción. **[No verificado]** = requiere prueba en la TV.

## Bloque 1: qué ya está decidido

- Un solo video a la vez. No se abre un segundo `<video>`. [Fuente secundaria, ver factibilidad]
- Iniciar video pausa la música. [Decisión de Diego, 2026-10-20]
- El video real se muestra en el mini. [Decisión de Diego, 2026-10-20]
- El mini permanece mientras haya reproducción o pausa, hasta que el usuario lo cierre. [Decisión de Diego]
- Atrás dentro del selector cierra el panel y no sale de la app. [Verificado en TV 2021]

## Bloque 2: arquitectura

**Un solo elemento `<video>` vive en una capa global, creado una vez al iniciar la app.** Las pantallas no lo contienen.

- **Módulo `player`** (estado único): `idle`, `playing`, `paused`, `ended`. Guarda el archivo actual, el segundo actual y la duración. Las pantallas solo llaman a `play(file)`, `toggle()`, `seek(delta)` y `close()`.
- **Vista completa:** el `<video>` ocupa la pantalla. Es una clase CSS, no un elemento nuevo.
- **Mini:** el mismo `<video>` con posición y tamaño fijos en la barra superior. Es otra clase CSS.
- **Por qué no mover el elemento en el DOM:** mover un `<video>` puede pausarlo o reiniciarlo en el motor de la TV. [No verificado; se evita por diseño]. Por eso el elemento nunca cambia de padre.

**[Inferencial]** El video se dibuja sobre la capa web de la TV. Los controles y el selector se superponen con `z-index`. [No verificado en TV]

## Bloque 3: comportamiento

| Acción | Resultado |
|---|---|
| Elegir un video en una pantalla | El video inicia en vista completa. La música se pausa. |
| Atrás en vista completa | Vuelve a la pantalla anterior. El mini aparece con el video en pausa o reproduciéndose. |
| Enfocar el mini y pulsar OK | Vuelve a vista completa en el mismo segundo. |
| Pulsar OK en play/pausa del mini | Alterna reproducción y pausa sin abrir vista completa. |
| Botón "Cerrar" del mini (con OK) | Detiene el video y oculta el mini. La música queda en pausa. |
| El video termina | El mini muestra estado "terminado" y permanece hasta cerrarlo. |
| Iniciar otro video con el mini visible | Reemplaza el archivo actual. El segundo anterior se pierde. |

**Foco:**

- El mini se alcanza con Abajo o Derecha desde la barra superior, en el orden de la barra.
- Dentro del mini, las flechas recorren play/pausa, "Cerrar" y el área de OK para abrir vista completa.
- Atrás **no** cierra el mini. Evita cierres accidentales. [Propuesta]

**Audio:** un solo audio a la vez. Si el video está activo, la música no suena.

## Bloque 4: preguntas para Diego

1. **Música al cerrar el video:** ¿la música queda en pausa (propuesta) o se reanuda?
2. **Fin del video:** ¿el mini se queda en "terminado" (propuesta) o se oculta solo?
3. **Posición al reabrir:** ¿un video cerrado y vuelto a abrir empieza desde el principio (propuesta) o recuerda el segundo?
4. **Atrás en el mini:** ¿confirmas que Atrás no lo cierra? Si prefieres que sí, habría que definirlo con cuidado para no salir de la app.
5. **Controles en el mini:** ¿solo play/pausa y cerrar (propuesta), o también adelantar y retroceder 10 s?

## Bloque 5: prerrequisito de la app

El mini depende de la **barra superior y de las pantallas** de la app final. Hoy `app/index.html` es un placeholder. Antes del mini hay que definir:

- La estructura de pantallas (Inicio, Música, Video, Fotos, Ajustes), según `docs/diseno-interfaz.md`.
- El módulo `player` y la capa global donde vive el `<video>`.

Propongo construir primero el módulo `player` con la vista completa y el mini, y probarlo en la página de prueba antes de conectar las pantallas.

## Bloque 6: validación en TV (cuando se implemente)

1. Mini con mp4 H.264 1080p y mkv HEVC 4K en la TV 2021 y en la TV 2019.
2. Medir caída de cuadros y si los controles quedan encima del video.
3. Confirmar que el video no se corta al navegar entre pantallas.
4. Confirmar que Atrás no cierra el mini ni sale de la app.
5. Si la TV 2019 no soporta el mini con video real, usar la alternativa de fotograma de la factibilidad.
