// simple_bt_test.ino (Updated for Binary Telemetry Verification)
// Desc: Sends fake binary telemetry data to test plotter.py
// Hardware: Connect Bluetooth to Pin 0 (RX) and 1 (TX) for 115200 baud

struct Telemetria {
  uint16_t posicion;
  int16_t p_term;
  int16_t i_term;
  int16_t d_term;
  uint8_t pwm_izq;
  uint8_t pwm_der;
  uint32_t timestamp;
} __attribute__((packed));

Telemetria fakeData;
float angle = 0;

void setup() {
  // Use Hardware Serial
  // Nota: Usuario confirmo 115200 baudios (+BAUD=4)
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Generate Fake Data (Sine waves)
  fakeData.posicion = 3500 + 1000 * sin(angle);
  fakeData.p_term = 100 * sin(angle);
  fakeData.i_term = 50 * cos(angle);
  fakeData.d_term = 20 * sin(angle * 2);
  fakeData.pwm_izq = 200;
  fakeData.pwm_der = 200;
  fakeData.timestamp = micros();

  // Send Header
  Serial.write(0xAA);
  Serial.write(0xBB);
  
  // Send Struct
  Serial.write((byte*)&fakeData, sizeof(fakeData));

  // Update animation
  angle += 0.05;
  if(angle > 6.28) angle = 0;
  
  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  delay(20); // ~50Hz update rate
}
