export interface Material {
  id: string;
  name: string;
  description: string;
  descriptionLong: string;
  imageFileName: string;
  buyUrl: string;
  specs: { label: string; value: string }[];
}

export const materials: Material[] = [
  {
    id: "arduino-nano",
    name: "Arduino Nano V3 + Shield I/O",
    description: "Cerebro del robot y placa de expansión para conexiones rápidas.",
    descriptionLong: "El Arduino Nano V3 es nuestra unidad de procesamiento central. Lo montaremos sobre un Shield de expansión I/O que facilita la conexión de sensores y motores sin necesidad de protoboard, asegurando conexiones robustas ante las vibraciones de la competencia.",
    imageFileName: "arduino-nano.jpg",
    buyUrl: "#",
    specs: [
      { label: "Microcontrolador", value: "ATmega328P" },
      { label: "Placa Base", value: "Shield Expansión I/O" },
      { label: "Voltaje", value: "7V - 12V (VIN)" }
    ]
  },
  {
    id: "motores-tt",
    name: "Motores TT",
    description: "Caja reductora amarilla 1:48. Tracción confiable.",
    descriptionLong: "Los motores TT con caja reductora proporcionan el torque necesario. Son el estándar en robótica móvil por su bajo costo y facilidad de montaje. Requieren filtrado de ruido mediante capacitores cerámicos para no interferir con el microcontrolador.",
    imageFileName: "motor-tt.jpg",
    buyUrl: "#",
    specs: [
      { label: "Relación", value: "1:48" },
      { label: "Voltaje", value: "3V - 9V" },
      { label: "Filtrado", value: "Requiere 3x 104 Caps" }
    ]
  },
  {
    id: "driver-tb6612fng",
    name: "Driver TB6612FNG",
    description: "Puente H de alta eficiencia. Controla velocidad y dirección.",
    descriptionLong: "A diferencia del clásico L298N, el TB6612FNG es un driver basado en MOSFET, lo que significa que es mucho más eficiente, genera menos calor y es extremadamente compacto. Es ideal para robots de competencia donde cada gramo y miliamperio cuenta.",
    imageFileName: "driver-tb6612.jpg",
    buyUrl: "#",
    specs: [
      { label: "Tipo", value: "Dual MOSFET H-Bridge" },
      { label: "Corriente", value: "1.2A (3.2A pico)" },
      { label: "Eficiencia", value: "Alta (baja caída de tensión)" }
    ]
  },
  {
    id: "sensor-qtr-8rc",
    name: "Sensor QTR-8RC",
    description: "Array de reflectancia. 8 sensores IR para detección de línea.",
    descriptionLong: "El QTR-8RC (o su variante AC) es el estándar para seguidores de línea. Funciona mediante la medición del tiempo de descarga de un capacitor, lo que lo hace muy preciso y menos sensible al ruido ambiental que los sensores analógicos simples.",
    imageFileName: "sensor-qtr.jpg",
    buyUrl: "#",
    specs: [
      { label: "Canales", value: "8" },
      { label: "Tipo", value: "Digital (RC)" },
      { label: "Fijación", value: "Tornillos 2mm" }
    ]
  },
  {
    id: "modulo-bluetooth",
    name: "Módulo Bluetooth",
    description: "HC-05, HC-06 o HM-10. Comunicación para telemetría.",
    descriptionLong: "Permite la comunicación inalámbrica. Si usas iOS, el HM-10 (BLE) es el recomendado. Para Android o PC, el HC-05 es lo más común. Requiere un divisor de voltaje en el RX para protegerlo de los 5V del Arduino.",
    imageFileName: "bluetooth-module.jpg",
    buyUrl: "#",
    specs: [
      { label: "Modos", value: "UART Serial" },
      { label: "Voltaje RX", value: "3.3V (Requiere Divisor)" },
      { label: "App", value: "LFR Pro Dashboard" }
    ]
  },
  {
    id: "fuente-energia",
    name: "Batería de 9V + Switch",
    description: "Alimentación portátil con interruptor de seguridad.",
    descriptionLong: "Utilizaremos una batería de 9V estándar con un broche reforzado y un interruptor basculante para el encendido general. Esto nos permite un arranque rápido y seguro en la línea de partida.",
    imageFileName: "bateria-9v.jpg",
    buyUrl: "#",
    specs: [
      { label: "Voltaje", value: "9V Nominal" },
      { label: "Switch", value: "Basculante" }
    ]
  },
  {
    id: "chasis",
    name: "Chasis (Diseño Propio)",
    description: "Estructura diseñada en Tinkercad para impresión 3D o corte láser.",
    descriptionLong: "En este curso no usamos chasis comerciales genéricos. Diseñaremos nuestra propia estructura para optimizar el peso y la posición de los componentes, fomentando el aprendizaje de dibujo técnico y medidas.",
    imageFileName: "chasis-robot.jpg",
    buyUrl: "#",
    specs: [
      { label: "Software", value: "Tinkercad" },
      { label: "Fabricación", value: "3D / Láser" },
      { label: "Material", value: "PLA / Acrílico" }
    ]
  },
  {
    id: "modulo-pulsador",
    name: "Módulo Pulsador",
    description: "Interfaz de usuario para arranque y calibración.",
    descriptionLong: "Un componente crítico para la interfaz. Nos permite iniciar la calibración y el arranque de carrera sin necesidad de conectar cables o resetear el Arduino constantemente.",
    imageFileName: "button-module.jpg",
    buyUrl: "#",
    specs: [
      { label: "Pin Arduino", value: "11" },
      { label: "Tipo", value: "Pull-up / Pull-down" }
    ]
  }
];
