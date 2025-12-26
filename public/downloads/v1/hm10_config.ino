#include <SoftwareSerial.h>

// Conecta el HM-10 a estos pines para configurarlo
// RX del Arduino (12) -> TX del HM-10
// TX del Arduino (11) -> RX del HM-10
SoftwareSerial BT(12, 11); 

void setup() {
  Serial.begin(9600);
  Serial.println("HM-10 Config Bridge Started");
  Serial.println("Escribe comandos AT en el monitor serial.");
  Serial.println("Ejemplo: 'AT' -> Deberia responder 'OK'");
  Serial.println("Para subir velocidad: 'AT+BAUD4' (o prueba 0-8)");
  
  // Asumimos que el HM-10 esta a 9600 actualmente
  BT.begin(9600);
}

void loop() {
  // Leer del HM-10 y enviar al PC
  if (BT.available()) {
    Serial.write(BT.read());
  }

  // Leer del PC y enviar al HM-10
  if (Serial.available()) {
    char c = Serial.read();
    BT.write(c);
    // Eco local para ver lo que escribimos
    // Serial.write(c); 
  }
}
