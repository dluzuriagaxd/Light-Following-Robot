# Academia Seguidor de Luz (Light-Following Robot) 💡

Plataforma educativa interactiva diseñada para el desarrollo, programación y calibración de robots seguidores de luz autónomos orientada a estudiantes de 6to de básica.

## 🚀 Visión General

Este proyecto combina la educación en robótica clásica con herramientas modernas de simulación en tiempo real. El objetivo es que los estudiantes dominen el control de entradas y salidas en microcontroladores, comprendan el divisor de tensión, analicen el ruido en señales analógicas y configuren un algoritmo diferencial con calibración real (`diferenciaBase` y `umbral`) usando la programación visual de **SteamakersBlocks**.

## 🛠️ Stack Tecnológico

La plataforma está construida utilizando tecnologías modernas para asegurar una experiencia premium:

*   **Core Framework**: [Astro 5](https://astro.build/) (Arquitectura de Islas, Zero JS por defecto).
*   **Contenido Dinámico**: [MDX](https://mdxjs.com/) para lecciones interactivas con simuladores embebidos.
*   **Interactividad**: [React 19](https://react.dev/) para el simulador principal y los mini-simuladores de lecciones.
*   **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) para una estética "Dark Mode" y glassmorphism.
*   **Autenticación**: [Supabase Auth](https://supabase.com/auth) para gestión de usuarios.
*   **Matemáticas**: Remark-math y KaTeX para renderizar fórmulas del divisor de voltaje.

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/       # Componentes Astro y React
│   │   ├── auth/         # Formularios de Login y Registro
│   │   ├── tools/        # Simulador Principal y Mini-Simuladores (React)
│   │   └── ui/           # Componentes de interfaz (Astro)
│   ├── content/
│   │   ├── config.ts     # Configuración de colecciones Astro
│   │   └── lessons/      # Sílabo modular (8 lecciones) en .mdx
│   ├── data/
│   │   └── materials.ts  # Base de datos de materiales (LDR, L298N, etc.)
│   ├── layouts/          # Plantillas base (Main y Lesson)
│   └── pages/            # Sistema de rutas (Index, Curso, Simulador)
├── public/
│   └── downloads/        # Firmware oficial (.ino)
```

## 🏗️ Módulos del Curso (13 Lecciones)

0.  **¿Qué es el Arduino y la Robótica?**: Anatomía del Arduino Uno R3, conceptos de Hardware, Software y Microcontrolador.
1.  **Ingresando a Tinkercad**: Registro y primer acceso a la plataforma virtual de circuitos.
2.  **Blink en Tinkercad**: Programar el LED integrado de forma simulada y cargarlo a un Arduino real.
3.  **Salidas Digitales y Protoboard**: Conexión de LEDs externos con resistencias protectoras de 220Ω en Tinkercad.
4.  **Divisor de Voltaje**: Comportamiento eléctrico analógico simulado en Tinkercad.
5.  **Divisor con Fotoresistencia (LDR)**: Lectura analógica de niveles de luz (0-1023) en Tinkercad.
6.  **Interruptor Crepuscular**: Lógica condicional (SI/SINO) para encender un LED según la oscuridad en Tinkercad.
7.  **Motores y Puente H**: Montaje mecánico físico de motores, batería, Arduino Uno, driver L298N e interruptor.
8.  **Introducción a SteamakersBlocks**: Registro, primer código en loop y creación de funciones de tracción (`adelante`, `atras`, etc.).
9.  **Montaje de Sensores y Cableado Final**: Fijar la protoboard de sensores LDR al frente y cablear todo el robot físico.
10. **Lógica del Seguidor I**: Implementación del error diferencial y calibración de zona muerta (Pasos 1 y 2 en simulador).
11. **Lógica del Seguidor II**: Rangos de luz mínima (apagado) y velocidad máxima (Pasos 3 y 4 en simulador).
12. **Lógica del Seguidor III**: Calibración final, filtro promedio para ruido y pruebas de desplazamiento en suelo (Pasos 5 y 6).

## 💻 Desarrollo

Para correr el proyecto localmente:

1.  Instalar dependencias: `npm install`
2.  Configurar credenciales en `.env` (Supabase).
3.  Iniciar servidor de desarrollo: `npm run dev`
4.  Abrir: `http://localhost:4321`

---
© 2026 Academia Seguidor de Luz - Proyecto Educativo Open Source
