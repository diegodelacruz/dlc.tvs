# Revisión del prototipo CodeTV

Fecha: 2026-10-20. Archivo revisado: `docs/prototipo/CodeTV.html`.

## Método

- Prototipo abierto en Chromium headless a 1920x1080. Sin errores de consola en ningún recorrido.
- **Control D-pad:** flechas, Enter = OK, Escape = Atrás. El código 461 de webOS para Atrás está soportado en el código.
- **Magic Remote (puntero):** clics y movimiento del puntero simulados con el ratón, y rueda.
- Recorridos: inicio, barra superior, sección Video, detalle, reproductor, menú de audio y subtítulos, mini reproductor de video y música.

**Limitación:** las pruebas son en un navegador de escritorio. El control físico Magic Remote y la TV real quedan para el Hito 5 del plan. La matriz de pruebas (`docs/pruebas.md`) ya incluye esos casos.

## Resultados

| Área | Control | Resultado | Evidencia |
|---|---|---|---|
| Carga y estructura | Todos | OK. Sin errores de consola. | Recorridos automatizados |
| Barra superior y foco | D-pad | OK. Arriba lleva a la barra y las flechas cambian de sección. | `revision/video-seccion.png` |
| Desplazamiento de filas | D-pad | OK. La fila enfocada se muestra completa al bajar. | `revision/video-desplazamiento.png` |
| Reproductor | D-pad | OK. Barra de progreso, 10 s, pausa, audio y subtítulos. | `revision/reproductor.png` |
| Menú de audio y subtítulos | D-pad | OK. Se abre desde el reproductor y muestra la pista activa. | `revision/menu-audio-subtitulos.png` |
| Clic en pestañas y tarjetas | Magic Remote (puntero) | OK. Abre la sección y el detalle. | `revision/magic-clic-tarjeta.png` |
| Foco al pasar el puntero | Magic Remote (puntero) | Corregido. Pasar el puntero sobre una opción mueve el foco sin ejecutarla. Antes: `revision/magic-hover-sin-foco.png`. | Recorrido automatizado |
| Rueda del Magic Remote | Magic Remote (rueda) | Corregido. La rueda desplaza la lista hasta el final y vuelve al inicio. Antes: `revision/magic-rueda-sin-desplazamiento.png`. Después: `revision/magic-rueda-corregida.png`. | Recorrido automatizado |
| Mini reproductor de música | D-pad y puntero | OK. Visible en la barra superior con una pista seleccionada. | `captura-inicio.png` |
| Mini reproductor de video | D-pad y puntero | OK tras implementarlo. Aparece al salir del reproductor, se reabre con clic o OK, y se cierra con la "×". | `revision/mini-video-en-barra.png`, `revision/mini-video-cerrado.png` |
| Pausa de música al iniciar video | D-pad | OK. El reproductor de video pausa la música. | `revision/mini-video-cerrado.png` (música en pausa) |
| Renombre a CodeTV | Todos | OK. Marca, título y diálogos actualizados. | Revisión de texto |
| Correo de ejemplo | Todos | OK. Reemplazado por `usuario@ejemplo.com`. | Revisión de texto |

## Hallazgos

### 1. Foco no sigue al puntero (corregido)

- El puntero sobre una tarjeta o pestaña mueve el foco a esa opción. Solo el clic la ejecuta.
- Implementado en el prototipo como manejador de movimiento del puntero. Pendiente de confirmar con el Magic Remote físico (Hito 5).

### 2. La rueda no desplaza la lista (corregido)

- La rueda desplaza el contenedor de la sección activa. El foco no cambia al desplazarse; las flechas lo traen de vuelta a la vista.
- Pendiente de confirmar con el Magic Remote físico (Hito 5): que el control envía eventos de rueda en la TV.

### 3. Texto de 20 px (decidido)

- Diego confirmó que el mínimo de texto se mantiene en 20 px para aprovechar el tamaño de la pantalla.
- El tamaño "Mínimo" (16 px) queda como opción del usuario. Si se quiere que nunca baje de 20 px, se corrige en el prototipo.

### 4. Mini reproductor de video (implementado)

- Se implementó en el prototipo. Usa un solo elemento de video, la música se pausa al iniciar el video, y el mini de video reemplaza al de música mientras esté activo.
- El video del prototipo es un marcador (fotograma de muestra). El video real se valida en el Hito 5, en la TV de 2020 y en la de 2023.

### 5. Miniaturas de muestra

- Las miniaturas son bandas diagonales, no imágenes. Esperado en un prototipo. Conviene probar el recorte y el texto con miniaturas reales.

### 6. Foco inicial en el reproductor

- Al abrir el reproductor, el foco va a la barra de progreso. Hay que confirmar con el control físico que la pausa es lo primero que llega con Abajo.

## Pendientes antes de programar

1. Probar todo en la TV con el Magic Remote físico (Hito 5).
2. Validar el video real en el mini reproductor (Hito 5).
