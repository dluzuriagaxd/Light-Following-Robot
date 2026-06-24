# Estándar de Desarrollo para Simuladores Interactivos

Este documento establece las directrices de diseño, responsividad, interacción matemática y comportamiento de pantalla completa para todos los simuladores web de la plataforma. El cumplimiento de estas normas garantiza una experiencia de usuario coherente, accesible y libre de fallos visuales.

---

## 1. Sistema de Diseño y Estética (Tema Claro - Scratch)

Todos los simuladores interactivos deben alinearse visualmente con la estética de **Scratch (tema claro, bordes 3D y colores amigables)**:

*   **Paleta de Colores de Acento:**
    *   **Azul Scratch (Lógica/Señal):** `#4c97ff` (Hover/Borde inferior: `#3375d6`)
    *   **Naranja Scratch (Control/Espera):** `#ffab19` (Hover/Borde inferior: `#d98f0d`)
    *   **Verde Scratch (Éxito/Inicio):** `#5cb85c` (Hover/Borde inferior: `#459645`)
    *   **Rojo Scratch (Peligro/Parada):** `#ff6680` (Hover/Borde inferior: `#d9415c`)
*   **Contenedores y Tarjetas:**
    *   Las tarjetas interiores deben usar fondo blanco (`bg-white`), bordes 3D grises (`border-3 border-slate-200`), esquinas redondeadas (`rounded-3xl` o `rounded-2xl`) y una sombra Scratch definida (`shadow-[0_4px_0_#cbd5e1]`).
*   **Fondo de Lienzos Vectoriales (Canvas/Grid):**
    *   Para áreas de bloques o graficadores, utilizar un patrón de puntos sutil en lugar de un fondo plano:
        ```css
        .canvas-grid-light {
          background-color: #F5F7F9;
          background-image: radial-gradient(#D3D6DB 1.5px, transparent 1.5px);
          background-size: 20px 20px;
        }
        ```
*   **Botones Interactivos (Scratch Buttons):**
    *   Los botones deben simular un comportamiento mecánico 3D al hacer hover y click:
        ```css
        .scratch-btn {
          font-weight: 800;
          border-radius: 16px;
          padding: 8px 14px;
          cursor: pointer;
          user-select: none;
          transition: all 0.08s ease;
          border: 1px solid transparent;
        }
        .scratch-btn-blue {
          background-color: #4c97ff;
          color: white;
          border-color: #3375d6;
          border-bottom: 4px solid #3375d6;
        }
        .scratch-btn-blue:hover {
          transform: translateY(1px);
          border-bottom-width: 3px;
        }
        .scratch-btn-blue:active {
          transform: translateY(2.5px);
          border-bottom-width: 1px;
        }
        ```

---

## 2. Responsividad y Layout Inline (Embebido)

Para evitar que los simuladores se desborden de los márgenes o se corten en pantallas pequeñas y medianas (donde la barra lateral y el índice del curso restringen el espacio útil del artículo):

*   **Punto de Corte de Rejilla (Breakpoint):**
    *   **Nunca** dividir el simulador en 2 columnas en el breakpoint `lg` (1024px), ya que el ancho disponible del artículo es de aproximadamente 450px, forzando columnas de 200px que cortan el contenido.
    *   Se debe usar **`xl:grid-cols-2`** (1280px) o **`2xl:grid-cols-2`** (1536px) para la división horizontal inline. En resoluciones inferiores, los paneles deben apilarse verticalmente a 1 columna (`grid-cols-1`).
*   **Fluidez de Ancho:**
    *   Evitar declarar anchos fijos rígidos (`w-[500px]`, etc.) en contenedores principales o tarjetas. Utilizar `w-full` junto con `max-w-[...]` para limitar el tamaño máximo si es necesario.

---

## 3. Estándar de Pantalla Completa (Simulación por CSS)

Para permitir que el usuario realice zooms en toda la página mientras el simulador está maximizado, **se debe evitar el uso de la API nativa de pantalla completa (`element.requestFullscreen()`)**, ya que los navegadores bloquean el zoom de página (`Ctrl + Scroll` o gestos de pellizco) en ese modo.

*   **Implementación de Pantalla Completa Simulada:**
    *   Controlar el estado mediante una variable de estado de React (`isFullscreen`).
    *   Cuando `isFullscreen` sea `true`, aplicar clases de superposición fija sobre la ventana del navegador:
        ```javascript
        className={`w-full transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 z-[100] w-screen min-h-screen bg-[#f0f4f8] p-2 md:p-4 flex flex-col justify-between overflow-y-auto' 
            : 'my-8 p-5 bg-slate-100 border-3 border-slate-200 rounded-3xl text-slate-800'
        }`}
        ```
    *   **Nota de Altura:** Usar `min-h-screen` y `overflow-y-auto` en el contenedor principal para que, si el usuario hace zoom de página, el contenido pueda crecer verticalmente y ser scrollable de forma natural.
*   **Bloqueo de Scroll del Fondo:**
    *   Bloquear el desplazamiento del body del documento mientras el simulador esté en pantalla completa para una navegación limpia:
        ```javascript
        useEffect(() => {
          if (isFullscreen) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
          }
          return () => { document.body.style.overflow = ''; };
        }, [isFullscreen]);
        ```
*   **Densidad de Spacing:**
    *   En pantalla completa, reducir los paddings (`p-5` a `p-3 md:p-4`), la separación de rejillas (`gap-6` a `gap-4`) y la altura de las cabeceras para maximizar el espacio útil vertical y asegurar que todo quepa en una sola pantalla a 100% de escala.

---

## 4. Matemáticas de Zoom e Interacción en Canvas SVG

Si el simulador incluye un lienzo interactivo (como diagramas o bloques de programación programables mediante SVG):

### A. Zoom con Rueda del Ratón (Mouse Wheel Zoom)
Para evitar capturar gestos de zoom del navegador (como pellizco en el trackpad o `Ctrl + Scroll` del usuario para ampliar toda la página):
*   Comprobar la tecla modificadora `ctrlKey` en el evento `wheel`.
*   Si `ctrlKey` es verdadero, **dejar pasar el evento** (no llamar a `preventDefault()`) para permitir el zoom del navegador.
*   Llamar a `preventDefault()` únicamente cuando se haga scroll convencional para realizar el zoom local en el canvas.

```javascript
const handleWheel = (e) => {
  if (e.ctrlKey) return; // Permite el zoom/pellizco de la página del navegador
  e.preventDefault();    // Bloquea el scroll de página y ejecuta el zoom local
  
  const zoomFactor = 0.08;
  const direction = e.deltaY < 0 ? 1 : -1;
  setBlocksZoom(prev => Math.max(0.4, Math.min(2.5, prev + direction * zoomFactor)));
};
```

### B. Desplazamiento del Canvas (Panning)
**Nunca** utilizar las coordenadas relativas del cursor transformadas por la matriz SVG (`getMousePosition()`) para calcular el delta del paneo (`dx = x - startX`). Dado que el movimiento cambia el `viewBox` en tiempo real, la matriz de transformación cambia en cada fotograma, lo que crea un bucle de desfase acumulativo (el canvas salta erráticamente).

*   **Fórmula Correcta de Paneo:**
    1. Registrar las coordenadas de pantalla crudas del ratón (`clientX` / `clientY`) al hacer click.
    2. En el movimiento, calcular el delta en píxeles de pantalla reales (`screenDx = clientX - startScreenX`).
    3. Convertir el delta de pantalla a unidades del canvas dividiendo por la escala de pantalla a SVG (`rect.width / viewBoxWidth`):

```javascript
function drag(evt) {
  if (isPanningCanvas) {
    evt.preventDefault();
    const clientX = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientY : evt.clientY;
    
    // Delta de pantalla crudo
    const screenDx = clientX - startScreenCoord.x;
    const screenDy = clientY - startScreenCoord.y;
    
    // Escala del SVG respecto a la pantalla
    const rect = svg.getBoundingClientRect();
    const svgToScreenScaleX = rect.width / (1000 / blocksZoomRef.current);
    const svgToScreenScaleY = rect.height / (700 / blocksZoomRef.current);
    
    setBlocksPan({
      x: startPan.x + (screenDx / svgToScreenScaleX),
      y: startPan.y + (screenDy / svgToScreenScaleY)
    });
  }
}
```

---

## 5. Integración del Código y Bloques Activos

*   **Espejo de Estados:**
    *   Si el simulador expone bloques interactivos y código C++, permitir la alternancia rápida mediante pestañas.
*   **Enfoque Visual en Ejecución:**
    *   El bloque o la línea de código activa que está ejecutándose en el bucle virtual de la simulación debe resaltar nítidamente.
    *   Para bloques SVG, aplicar un contorno blanco claro o filtro de brillo:
        ```javascript
        const getBlockProps = (stepId) => {
          const isActive = isRunning && activeState === stepId;
          return {
            stroke: isActive ? '#ffffff' : defaultStroke,
            strokeWidth: isActive ? 3 : 1,
            style: isActive ? { filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.95))' } : {}
          };
        };
        ```
