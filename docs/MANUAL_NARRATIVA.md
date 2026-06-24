# 📖 Manual de Narrativa y Storytelling: Misión "Apolo-Bot"

Este manual establece las directrices creativas, el marco de storytelling y la estructura didáctica para incorporar la narrativa de exploración espacial en el curso **Robot Seguidor de Luz**. Este marco está diseñado para estudiantes de **6to de básica (11 a 12 años)** bajo el modelo transdisciplinario del Bachillerato Internacional (IB-PEP).

---

## 🌌 1. La Trama Central: Exploración en Lumina-IX

### La Sinopsis
En el año 2085, la agencia de exploración espacial ha desplegado un micro-rover autónomo experimental llamado **"Apolo"** en la superficie de **Lumina-IX**, un exoplaneta ubicado en los límites de la galaxia conocida. Este planeta posee valiosos recursos minerales, pero sufre de **tormentas eléctricas de polvo cósmico** que bloquean la luz solar durante largos periodos.

### El Conflicto
Apolo se alimenta exclusivamente de energía solar. Debido al impacto de la tormenta de polvo inicial, el sistema de navegación automática del rover se ha dañado. Si Apolo se queda a oscuras, sus baterías se vaciarán, sus sistemas se congelarán y la misión fracasará. Para sobrevivir, el rover debe desplazarse y resguardarse en los **"Oasis de Luz"** (haces de luz estelar que logran cruzar la densa atmósfera de polvo).

### El Rol del Estudiante (Control de Misión)
El estudiante actúa como **Ingeniero/a de Control de Misión en la Tierra**. Mediante el envío remoto de actualizaciones de código (programación en bloques) y el ensamblaje de componentes compatibles, el estudiante guiará a Apolo paso a paso para recuperar sus funciones de comunicación, activar sus sensores y dotarlo de la lógica de navegación autónoma necesaria para ponerse a salvo de la tormenta.

---

## 👩‍🚀 2. Personaje Guía: Comandante Stella

El nexo entre la narrativa y el estudiante será la **Comandante Stella** (Directora de la Misión Apolo-Bot), un personaje inspirado visualmente en la docente de teatro Gabriela Falquez y representado en un estilo de ilustración limpio en 2D similar a los avatares del entorno **Scratch**.

### Reglas de Presentación de la Comandante Stella:
*   Aparece al inicio de cada lección a través del componente `<StoryTeller />`.
*   Su intervención debe ser breve, entusiasta y directa (máximo 3-4 líneas de diálogo).
*   Su mensaje siempre constará de dos partes:
    1.  **Estado de la Misión:** La situación actual de Apolo y el reto narrativo.
    2.  **Pregunta de Indagación:** El cuestionamiento reflexivo alineado con el IB-PEP.

---

## 🛠️ 3. Estructura de la Trama Lección por Lección

Cada lección del curso debe arrancar bajo la justificación narrativa descrita a continuación:

### 📂 Fase 1: Diagnóstico y Conexión (Lecciones 0 - 3)

#### **Lección 0: ¿Qué es el Arduino y la Robótica? (Planos del Cerebro)**
*   **Contexto de Stella:** *"¡Hola, Ingeniero/a! Bienvenido a la base espacial de Control de Misión. Apolo ha aterrizado en Lumina-IX, pero sus sistemas de movimiento no responden. Primero debemos analizar los planos de su computadora central para entender cómo procesará nuestras futuras instrucciones."*
*   **Pregunta de Indagación:** ¿Cómo puede una máquina imitar la atracción de un girasol hacia la luz del sol?

#### **Lección 1: Cómo ingresar a Tinkercad (El Simulador de Vuelo)**
*   **Contexto de Stella:** *"No podemos enviar códigos directamente al espacio sin probarlos; un error de conexiones destruiría el único procesador de Apolo. Activaremos el Simulador Holográfico de Vuelo (Tinkercad) para realizar pruebas seguras en la Tierra."*
*   **Pregunta de Indagación:** ¿Cómo podemos experimentar con electricidad de forma segura y sin dañar los componentes?

#### **Lección 2: Programando en Tinkercad - Blink (La Señal de Vida)**
*   **Contexto de Stella:** *"¡Necesitamos saber si el enlace de comunicación con Apolo funciona! Enviaremos una orden básica para que una luz LED en su antena empiece a parpadear. Si responde, ¡sabremos que nos escucha!"*
*   **Pregunta de Indagación:** ¿Cómo se comunica una computadora con un circuito físico?

#### **Lección 3: Salidas Digitales y Protoboard (Baliza de Emergencia)**
*   **Contexto de Stella:** *"La tormenta se acerca y la luz integrada de Apolo es muy débil. Diseñaremos una Baliza de Emergencia Externa usando un LED de alto brillo en nuestra matriz de conexiones (protoboard). ¡Cuidado! Debemos usar una resistencia como escudo protector para que no se queme."*
*   **Pregunta de Indagación:** ¿Cómo viaja la corriente por la protoboard y por qué un LED necesita un escudo protector?

---

### 👁️ Fase 2: Creando los Ojos Estelares (Lecciones 4 - 6)

#### **Lección 4: El Divisor de Voltaje (Regulador de Energía)**
*   **Contexto de Stella:** *"Apolo recibe energía cruda de sus reactores, pero el voltaje es demasiado alto para el microchip. Aprenderemos a dividir la tensión en dos partes usando resistencias fijas para medir la energía de forma segura."*
*   **Pregunta de Indagación:** ¿Cómo podemos dividir la energía eléctrica para que un chip pueda medirla?

#### **Lección 5: Fotorresistencias LDR (Activación de los Ojos)**
*   **Contexto de Stella:** *"El cielo de Lumina-IX se está oscureciendo rápidamente. Reemplazaremos una resistencia del divisor por un sensor de luz LDR. Así, Apolo podrá medir el brillo y enviarnos la telemetría por el Puerto Serie."*
*   **Pregunta de Indagación:** ¿Cómo puede un robot medir la intensidad del brillo de la luz en una habitación?

#### **Lección 6: El Interruptor Crepuscular (Faro Automático)**
*   **Contexto de Stella:** *"Si la tormenta bloquea la luz del sol por completo, los satélites de rastreo perderán a Apolo. Programaremos un sistema de emergencia: si el sensor de luz LDR detecta oscuridad, el robot encenderá automáticamente su faro LED."*
*   **Pregunta de Indagación:** ¿Cómo automatizar una lámpara para que se encienda sola cuando se oculte el sol?

---

### ⚙️ Fase 3: Sistemas de Propulsión (Lecciones 7 - 8)

#### **Lección 7: El Puente H y Control de Motores (Suministro de Fuerza)**
*   **Contexto de Stella:** *"¡Llegó la hora de movernos! Pero el cerebro de Apolo no tiene suficiente fuerza eléctrica para girar los motores. Conectaremos un distribuidor de potencia (Puente H L298N) para alimentar las ruedas directamente de las baterías."*
*   **Pregunta de Indagación:** ¿Por qué el Arduino no puede mover directamente las ruedas del robot?

#### **Lección 8: Programando Funciones de Movimiento (El Piloto Automático)**
*   **Contexto de Stella:** *"Las señales de radio tardan en viajar al espacio. Debemos dotar a Apolo de un piloto automático con cuatro funciones básicas: `avanzar()`, `izquierda()`, `derecha()` y `parar()`. Haremos que pruebe su navegación trazando un patrón cuadrado en el suelo."*
*   **Pregunta de Indagación:** ¿Cómo podemos simplificar las instrucciones complejas del robot utilizando atajos de código?

---

### 🌪️ Fase 4: Sobreviviendo a la Tormenta (Lecciones 9 - 12)

#### **Lección 9: Ensamblaje de Sensores y Cableado del Robot (El Chasis Real)**
*   **Contexto de Stella:** *"¡Es el momento de la verdad! Llevaremos todo lo aprendido al modelo físico real. Montaremos los sensores de luz LDR en el chasis de nuestro prototipo terrestre y conectaremos todos los cables de potencia."*
*   **Pregunta de Indagación:** ¿Cómo integramos los ojos de fotorresistencia en el chasis físico de nuestro robot móvil?

#### **Lección 10: Lógica de Control del Seguidor (El Instinto de Luz)**
*   **Contexto de Stella:** *"Programaremos el algoritmo de supervivencia autónomo de Apolo: si el ojo izquierdo ve más luz, gira a la izquierda; si el derecho ve más luz, gira a la derecha; si ambos ven luz, avanza. Calibraremos sus respuestas usando una linterna."*
*   **Pregunta de Indagación:** ¿Cómo decide el robot a qué motor enviar energía basándose en lo que lee cada LDR?

#### **Lección 11: Suavizado y Filtrado de Ruido (El Escudo contra Estática)**
*   **Contexto de Stella:** *"La tormenta eléctrica de polvo genera interferencia estática, haciendo que las lecturas oscilen y Apolo avance de forma inestable. Programaremos un filtro de promedio para suavizar el movimiento y estabilizar al robot."*
*   **Pregunta de Indagación:** ¿Cómo evitamos que la luz de los focos del techo confunda al robot?

#### **Lección 12: Integración, Exposición y Reflexión (Misión Cumplida)**
*   **Contexto de Stella:** *"¡Misión cumplida! Apolo cruzó la tormenta de Lumina-IX y está a salvo en la estación de recarga solar. Presentemos nuestro reporte de misión y reflexionemos sobre cómo la robótica y las energías limpias pueden salvar el futuro."*
*   **Pregunta de Indagación:** ¿Qué hemos aprendido sobre automatización y cómo podemos usar robots para solucionar problemas comunitarios?

---

## 📖 4. Glosario de Rigor Técnico (Término Técnico Primero)

Para asegurar la rigurosidad científica del curso, los contenidos del aula, simuladores y explicaciones técnicas deberán utilizar la siguiente nomenclatura:

| Nombre Técnico Oficial (Primario) | Analogía Narrativa (Secundario) |
| :--- | :--- |
| **Placa Arduino Uno R3** | El Computador Central de Apolo |
| **Protoboard** | Matriz de Conexiones de Prueba |
| **Resistencia eléctrica (Resistor)** | El Escudo Limitador de Corriente |
| **Diodo LED** | Faro de Posicionamiento / Baliza de Señal |
| **Fotorresistencia (LDR)** | Sensor Óptico de Luz |
| **Monitor Serie (Serial Monitor)** | Telemetría / Terminal de Datos |
| **Puente H L298N** | Distribuidor de Potencia para Motores |
| **Motores de Corriente Continua (DC)** | Propulsores de las Ruedas |
| **Linterna (en las pruebas)** | Haz Solar / Luz Guía |
| **Depuración (Debugging)** | Diagnóstico del Sistema / Reparación |
