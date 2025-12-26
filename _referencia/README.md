# LFR Telemetry System 🏎️💨

Este proyecto proporciona un ecosistema completo para el desarrollo, telemetría y análisis de robots Seguidores de Línea (LFR). Incluye firmware para Arduino, un graficador en tiempo real por Bluetooth, un dashboard de análisis post-carrera y un simulador físico de PID.

## 🚀 Características Principales

-   **Telemetría Binaria de Alta Velocidad:** Protocolo optimizado para enviar datos (posición, PID, PWM, timestamp) vía Bluetooth (HM-10/HC-05) sin afectar el bucle de control.
-   **Real-Time Python Plotter:** Visualización instantánea de los términos del PID y la posición del robot mientras corre.
-   **Análisis Pro Dashboard:** Herramienta web para cargar archivos CSV de sesiones y realizar un análisis detallado con zoom sincronizado.
-   **Simulador Físico PID:** Prueba tus constantes de control en un entorno virtual basado en el modelo físico real de tu robot (incluye inercia y sensibilidad de giro).

## 📂 Estructura del Proyecto

-   `LFR-Telemetry.ino`: Firmware principal para Arduino (basado en Sensores QTR y PID).
-   `plotter.py`: Aplicación Python para recibir y graficar datos por BLE en tiempo real.
-   `telemetry_dashboard.html`: Interfaz web de análisis de datos post-procesados.
-   `simulator.html`: Simulador interactivo de PID con integración de modelos SVG.
-   `diagnostic_tool.py` & `scan_ports.py`: Herramientas auxiliares para depuración de Bluetooth y puertos.

## 🛠️ Instalación

### Arduino
1. Instala la librería `QTRSensors` desde el Gestor de Librerías de Arduino.
2. Carga `LFR-Telemetry.ino` en tu robot.

### Python
Instala las dependencias necesarias para el graficador:
```bash
pip install -r requirements.txt
```
*Dependencias principales: `bleak`, `matplotlib`, `asyncio`.*

## 📖 Guía de Uso

### 1. Telemetría en Tiempo Real
Conecta tu módulo Bluetooth (ej. HM-10) al puerto Serial del Arduino. Ejecuta:
```bash
python plotter.py
```
Ingresa el nombre de la sesión y el script buscará automáticamente el dispositivo para empezar a loguear datos en la carpeta `logs/`.

### 2. Análisis de Sesiones
Abre `telemetry_dashboard.html` en cualquier navegador moderno. Haz clic en **LOAD CSV** y selecciona un archivo generado por el `plotter.py`. Podrás analizar el comportamiento del robot en cada punto de la pista.

### 3. Simulación de PID
Para ajustar tus constantes sin riesgo de colisiones, usa `simulator.html`. 
- Arrastra un archivo CSV para "calibrar" la física del simulador basada en datos reales.
- Ajusta Kp, Ki y Kd y observa el comportamiento del modelo SVG en la pista virtual.

## ⚖️ Licencia
Este proyecto es de código abierto. ¡Siéntete libre de contribuir!
