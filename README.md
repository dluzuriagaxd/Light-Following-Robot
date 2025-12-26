# LFR Telemetry Academy 🏎️💨

Plataforma educativa de nivel ingeniería diseñada para el desarrollo, simulación y optimización de robots seguidores de línea de alto rendimiento.

## 🚀 Visión General

Este proyecto combina la educación en robótica clásica con herramientas modernas de análisis de datos (telemetría). El objetivo es que los estudiantes dejen de "adivinar" las constantes PID y comiencen a optimizar basadas en evidencia científica y visualización de datos en tiempo real.

## 🛠️ Stack Tecnológico

La plataforma está construida utilizando las tecnologías más modernas para asegurar velocidad, escalabilidad y una experiencia de usuario premium:

*   **Core Framework**: [Astro 5](https://astro.build/) (Arquitectura de Islas, Zero JS por defecto).
*   **Contenido Dinámico**: [MDX](https://mdxjs.com/) para lecciones interactivas.
*   **Interactividad**: [React 19](https://react.dev/) para el simulador y dashboard de análisis.
*   **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) para una estética "Dark Mode" de alto contraste.
*   **Gráficas**: [Chart.js](https://www.chartjs.org/) para visualización de telemetría.
*   **Matemáticas**: Remark-math y KaTeX para renderizar fundamentos teóricos.

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/       # Componentes Astro y React
│   │   ├── tools/        # Simulador y Dashboard (React)
│   │   └── ui/           # Componentes de interfaz (Astro)
│   ├── content/
│   │   ├── lessons/      # Sílabo modular (01-05) en .mdx
│   │   └── materials.ts  # Base de datos de componentes oficiales
│   ├── data/             # Definiciones de tipos y constantes
│   ├── layouts/          # Plantillas base (Main y Lesson)
│   └── pages/            # Sistema de rutas (Index, Curso, Herramientas)
├── public/
│   ├── downloads/        # Firmware (.ino) y Scripts (.py)
│   └── images/           # Activos visuales y esquemáticos
└── _referencia/          # Código fuente legacy y prototipos
```

## 🏗️ Módulos del Curso

1.  **Introducción**: Objetivos y selección de materiales de nivel ingeniería.
2.  **Diseño**: Enfoque en dibujo técnico y Tinkercad para fabricación digital.
3.  **Montaje**: Proceso paso a paso con énfasis en filtrado de ruido (Caps 104) y electrónica eficiente (TB6612FNG).
4.  **Programación**: Fundamentos del control PID y lógica de interfaces seguras.
5.  **Telemetría**: Optimización basada en datos usando el script `Potter.py` y el Dashboard web.

## 🛠️ Herramientas Pro Incluidas

### [Simulador PID](/simulador)
Permite a los estudiantes experimentar con valores de Kp, Ki y Kd en una pista virtual antes de cargar el código al hardware real. Ayuda a entender visualmente el efecto de las oscilaciones y el amortiguamiento.

### [Dashboard de Telemetría](/telemetria)
Herramienta de nivel profesional que procesa archivos CSV generados por el robot en pista. Permite analizar el error, las contribuciones de cada término PID y el consumo de los motores.

## 💻 Desarrollo

Para correr el proyecto localmente:

1.  Instalar dependencias: `npm install`
2.  Iniciar servidor de desarrollo: `npm run dev`
3.  Abrir: `http://localhost:4321`

---
© 2025 LFR Telemetry System - Proyecto Educativo Open Source
