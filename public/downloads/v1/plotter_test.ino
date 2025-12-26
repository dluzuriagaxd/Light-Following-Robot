#include <SoftwareSerial.h>

// RX del Arduino va al TX del HM-10 (Pin 12)
// TX del Arduino va al RX del HM-10 (Pin 11)
SoftwareSerial BT(12, 11); // RX, TX

float angle = 0;

void setup() {
  Serial.begin(9600);
  BT.begin(9600);
  
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("Iniciando Generador de Datos para Plotter...");
}

void loop() {
  // Generar una onda senoidal simulada que va de 0 a 100
  // sin(angle) va de -1 a 1.
  // +1 -> 0 a 2.
  // * 50 -> 0 a 100.
  float value = (sin(angle) + 1) * 50;
  
  // Enviar al módulo Bluetooth
  BT.println(value);
  
  // Debug USB
  Serial.println(value);
  
  // Incrementar ángulo
  angle += 0.1;
  if(angle > 360) angle = 0;
  
  // Parpadeo para indicar actividad
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  
  delay(100); // 10Hz sample rate aprox
}
