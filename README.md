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
*   **Autenticación**: [Supabase Auth](https://supabase.com/auth) para gestión de usuarios segura y roles, integrado con la base de datos PostgreSQL de Supabase.
*   **Gráficas**: [Chart.js](https://www.chartjs.org/) para visualización de telemetría.
*   **Matemáticas**: Remark-math y KaTeX para renderizar fundamentos teóricos.

## 📂 Estructura del Proyecto

```text
├── src/
│   ├── components/       # Componentes Astro y React
│   │   ├── auth/         # Formularios de Login y Registro
│   │   ├── tools/        # Simulador y Dashboard (React)
│   │   └── ui/           # Componentes de interfaz (Astro)
│   ├── content/
│   │   ├── lessons/      # Sílabo modular (01-05) en .mdx
│   │   └── materials.ts  # Base de datos de componentes oficiales
│   ├── data/             # Definiciones de tipos y constantes
│   ├── layouts/          # Plantillas base (Main y Lesson)
│   └── pages/            # Sistema de rutas (Index, Curso, Auth)
├── public/
│   ├── downloads/        # Firmware (.ino) y Scripts (.py)
│   └── images/           # Activos visuales y esquemáticos
└── _referencia/          # Código fuente legacy y prototipos
```

## 🔐 Sistema de Usuarios

La plataforma implementa un sistema de autenticación robusto para personalizar la experiencia de aprendizaje:

*   **Login Seguro**: Acceso mediante credenciales de email validadas.
*   **Registro de Operadores**: Formulario de alta para nuevos estudiantes con validación de contraseña.
*   **Protección de Rutas**: Middleware que restringe el acceso a `/curso` y `/telemetria` solo a usuarios autenticados, redirigiendo automáticamente al login si no existe sesión.

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
2.  Configurar las credenciales en `.env` (copiar de `.env.example` si existe, o pedir a un admin las credenciales de Supabase).
3.  Iniciar servidor de desarrollo: `npm run dev`
4.  Abrir: `http://localhost:4321`

> **Nota**: El sistema de autenticación usa Supabase. Asegúrate de tener las variables de entorno `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` configuradas correctamente.

---
© 2025 LFR Telemetry System - Proyecto Educativo Open Source
