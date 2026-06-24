export interface SpecItem {
  label: string;
  value: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  descriptionLong: string;
  imageFileName: string;
  buyUrl: string;
  specs: SpecItem[];
}

export const materials: Material[] = [
  {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    description: "El cerebro controlador de nuestro robot.",
    descriptionLong: "El Arduino Uno R3 es una placa de desarrollo basada en el microcontrolador ATmega328P. Es ideal para aprender electrónica y programación ya que cuenta con entradas analógicas para nuestros sensores de luz y salidas digitales/PWM para controlar los motores a través del driver.",
    imageFileName: "arduino-uno.jpg",
    buyUrl: "#",
    specs: [
      { label: "Microcontrolador", value: "ATmega328P" },
      { label: "Voltaje de Operación", value: "5V" },
      { label: "Entradas Analógicas", value: "6 (A0 - A5)" },
      { label: "Salidas Digitales", value: "14 (6 con PWM)" }
    ]
  },
  {
    id: "fotoresistencia-ldr",
    name: "Fotoresistencia (LDR)",
    description: "El sensor del robot. Detecta la cantidad de luz en el ambiente.",
    descriptionLong: "Una fotoresistencia o LDR (Light Dependent Resistor) es un componente cuya resistencia eléctrica disminuye a medida que aumenta la intensidad de la luz que incide sobre él. Usaremos dos fotoresistencias en la parte delantera de nuestro robot para que actúen como sensores y detecten el haz de luz de una linterna.",
    imageFileName: "ldr-sensor.jpg",
    buyUrl: "#",
    specs: [
      { label: "Resistencia con Luz", value: "~1kΩ a 10kΩ" },
      { label: "Resistencia en Oscuridad", value: "~1MΩ" },
      { label: "Pines de Conexión", value: "A0 (Izquierdo) / A1 (Derecho)" }
    ]
  },
  {
    id: "driver-l298n",
    name: "Módulo Driver L298N",
    description: "Controlador de potencia para motores DC (Puente H).",
    descriptionLong: "El módulo L298N es un driver de motores de doble puente H. Permite controlar la velocidad y dirección de giro de dos motores de corriente continua (DC). Funciona como un interruptor electrónico de alta potencia que amplifica las señales de bajo voltaje de la placa Arduino.",
    imageFileName: "driver-l298n.jpg",
    buyUrl: "#",
    specs: [
      { label: "Chip de Control", value: "L298N Dual H-Bridge" },
      { label: "Voltaje de Motores", value: "5V - 35V" },
      { label: "Corriente de Salida", value: "2A por canal" },
      { label: "Caída de Voltaje Interna", value: "~2V (pérdida por transistores)" }
    ]
  },
  {
    id: "motores-tt",
    name: "Motores TT y Ruedas",
    description: "Cajas reductoras amarillas 1:48 para la propulsión.",
    descriptionLong: "Los motores TT con caja reductora proporcionan la fuerza (torque) y velocidad ideales para robótica móvil educativa. Tienen una relación de engranajes de 1:48, lo que les permite mover el chasis del robot con facilidad sobre superficies regulares.",
    imageFileName: "motor-tt.jpg",
    buyUrl: "#",
    specs: [
      { label: "Relación de Reducción", value: "1:48" },
      { label: "Voltaje Recomendado", value: "3V - 6V" },
      { label: "Eje de Salida", value: "Doble cara para rueda" }
    ]
  },
  {
    id: "led-5mm",
    name: "LED de 5mm y Resistencia 220Ω",
    description: "Componentes para practicar salidas digitales y circuitos básicos.",
    descriptionLong: "Un diodo emisor de luz (LED) de 5mm que utilizaremos en las primeras lecciones para aprender a programar parpadeos (blink) y a controlar un pin de Arduino. Incluye una resistencia limitadora de 220Ω (rojo-rojo-marrón) para proteger el LED de quemarse.",
    imageFileName: "led-kit.jpg",
    buyUrl: "#",
    specs: [
      { label: "Diámetro del LED", value: "5mm" },
      { label: "Resistencia de Protección", value: "220 Ohmios" },
      { label: "Pin de Conexión Práctica", value: "Pin Digital 5" }
    ]
  },
  {
    id: "resistencia-10k",
    name: "Resistencias de 10kΩ",
    description: "Componentes necesarios para formar el divisor de voltaje del LDR.",
    descriptionLong: "Las fotoresistencias no pueden conectarse directamente a las entradas analógicas de Arduino solas. Necesitamos asociarlas en serie con una resistencia fija de 10kΩ (marrón-negro-naranja) para crear un divisor de tensión. Esto convierte el cambio de resistencia del LDR en un cambio de voltaje medible.",
    imageFileName: "resistors-10k.jpg",
    buyUrl: "#",
    specs: [
      { label: "Valor de Resistencia", value: "10,000 Ohmios" },
      { label: "Tolerancia", value: "±5% (Capa de carbón)" },
      { label: "Potencia", value: "1/4 Watt" }
    ]
  },
  {
    id: "bateria-energia",
    name: "Portabaterías y Baterías",
    description: "Fuente de alimentación portátil para el robot.",
    descriptionLong: "Utilizaremos un portabaterías con pilas de litio (ej. dos baterías 18650 en serie que entregan ~7.4V) o en su defecto una batería de 9V. Esto permite alimentar de manera independiente los motores a través del driver L298N y el procesador Arduino.",
    imageFileName: "battery-holder.jpg",
    buyUrl: "#",
    specs: [
      { label: "Configuración Litio", value: "18650 2S (7.4V Nominal)" },
      { label: "Alternativa", value: "Batería de 9V" },
      { label: "Conector", value: "Jack de poder DC o cables directos" }
    ]
  },
  {
    id: "chasis-3d",
    name: "Chasis Impreso en 3D",
    description: "La estructura física que soporta todos los componentes del robot.",
    descriptionLong: "Diseñado para mantener una distancia equilibrada entre las ruedas y colocar los sensores LDR al frente en un ángulo óptimo. Se puede imprimir en plástico PLA o fabricar con corte láser en acrílico, basándonos en las medidas del plano oficial.",
    imageFileName: "chasis-robot.jpg",
    buyUrl: "#",
    specs: [
      { label: "Diseño de Referencia", value: "chasis_modelo_pro.svg" },
      { label: "Material Recomendado", value: "PLA o Acrílico 3mm" },
      { label: "Fijación de Motores", value: "Tornillos M3" }
    ]
  }
];
