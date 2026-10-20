# Revisión del prototipo CodeTV

Fecha: 2026-10-20. Archivo revisado: `docs/prototipo/CodeTV.html` (prototipo aprobado para revisión).

## Método

- Prototipo abierto en Chromium headless a 1920x1080, sin errores de consola en los recorridos.
- Control remoto simulado con el teclado: flechas = D-pad, Enter = OK, Escape = Atrás. También se probó el código 461 de webOS para Atrás, que el prototipo acepta en el código.
- Recorridos: inicio, barra superior, sección Video (con desplazamiento), detalle, reproductor, menú de audio y subtítulos, y regreso con Atrás.

**Limitación:** no se probó con el control físico ni en la TV. La prueba en TV queda en el Hito 5 del plan.

## Resultados

| Área | Resultado | Evidencia |
|---|---|---|
| Carga y estructura | OK. Sin errores de consola. | Recorrido automatizado |
| Barra superior y foco | OK. Arriba lleva a la barra y las flechas cambian de sección. | `prototipo/revision/video-seccion.png` |
| Desplazamiento de filas | OK. La fila enfocada se muestra completa al bajar. | `prototipo/revision/video-desplazamiento.png` |
| Reproductor | OK. Barra de progreso, 10 s, pausa, audio y subtítulos. | `prototipo/revision/reproductor.png` |
| Menú de audio y subtítulos | OK. Se abre desde el reproductor y muestra la pista activa. | `prototipo/revision/menu-audio-subtitulos.png` |
| Mini reproductor de música | OK. Visible en la barra superior con una pista seleccionada. | `docs/prototipo/captura-inicio.png` |
| Renombre a CodeTV | OK. Marca, título y diálogos actualizados. | 7 ocurrencias en el archivo |

Capturas del recorrido en `docs/prototipo/revision/`.

## Hallazgos

### 1. Texto demasiado pequeño para 2.5 a 3.5 m (prioridad alta)

- El texto más pequeño del prototipo es de 20 px. Con el tamaño "Mínimo" baja a 16 px.
- Los títulos de 48 px y el cuerpo de 32 px quedan bien. Los textos de 20 a 22 px (etiquetas y metadatos) son los que más se perderían a distancia.
- Recomendación: mínimo de 24 px en cualquier texto, y que "Mínimo" no baje de 20 px. Esto es una propuesta [Inferencial], no verificada en la TV.

### 2. Dato de ejemplo con apariencia de correo real (prioridad media)

- El diálogo de cerrar sesión en Ajustes muestra `maria.lopez@gmail.com`.
- Recomendación: reemplazar por un dato genérico, como `usuario@ejemplo.com`, para evitar que parezca un dato real.

### 3. Mini reproductor de video ausente (requerimiento nuevo)

- Ya no aparece solo con música. Ver `docs/factibilidad-mini-reproductor.md`.

### 4. Fotogramas de muestra

- Las miniaturas son bandas diagonales, no imágenes reales. Es esperado en un prototipo, pero conviene probar el recorte y el texto con miniaturas reales.

### 5. Enfoque inicial en el reproductor

- Al abrir el reproductor, el foco va a la barra de progreso. Es una buena elección para el control de saltos, pero hay que confirmar que la pausa es el primer botón al que llega el usuario con Abajo.

## Pendientes antes de programar

1. Decidir el tamaño mínimo de texto (hallazgo 1).
2. Reemplazar el correo de ejemplo (hallazgo 2).
3. Decidir el comportamiento del mini reproductor de video (ver factibilidad).
4. Probar el prototipo con el control físico del TV.
