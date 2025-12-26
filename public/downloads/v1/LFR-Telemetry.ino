#include <QTRSensors.h>

// --- Data Structure ---
struct Telemetria {
  uint16_t posicion;
  int16_t p_term;
  int16_t i_term;
  int16_t d_term;
  uint8_t pwm_izq;
  uint8_t pwm_der;
  uint32_t timestamp;
  uint8_t checksum;
} __attribute__((packed));

Telemetria dataPacket;

// --- Pines Puente H ---
#define STBY 7
#define PWMA 5
#define AIN1 6
#define AIN2 4
#define PWMB 10
#define BIN1 8
#define BIN2 9

// --- Constantes PID ---
float Kp = 0.2; 
float Kd = 0.05;  // Default Kd for this example
int setPoint = 3500;
int VelMax = 200; 
int lastError = 0;

// --- Sensores QTR ---
QTRSensors qtr;
const uint8_t SensorCount = 8;
uint16_t sensorValues[SensorCount];

void setup() {
  // Configuración de pines
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(STBY, OUTPUT);
  pinMode(PWMA, OUTPUT);
  pinMode(AIN1, OUTPUT);
  pinMode(AIN2, OUTPUT);
  pinMode(PWMB, OUTPUT);
  pinMode(BIN1, OUTPUT);
  pinMode(BIN2, OUTPUT);

  // Inicializar comunicaciones: Hardware Serial a 115200 (Alta velocidad)
  Serial.begin(115200);

  // 1. Secuencia inicial
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_BUILTIN, HIGH); delay(200);
    digitalWrite(LED_BUILTIN, LOW); delay(200);
  }

  // Configuración de sensores
  qtr.setTypeRC();
  qtr.setSensorPins((const uint8_t[]){A0, A1, A2, A3, A4, A5, 2, 3}, SensorCount);

  // 2. Calibración
  digitalWrite(LED_BUILTIN, HIGH);
  for (uint16_t i = 0; i < 400; i++) {
    qtr.calibrate();
  }
  digitalWrite(LED_BUILTIN, LOW);

  // 3. Finalización calibración
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_BUILTIN, HIGH); delay(50);
    digitalWrite(LED_BUILTIN, LOW); delay(50);
  }

  // Activar Motores
  digitalWrite(STBY, HIGH);
  digitalWrite(AIN1, LOW);
  digitalWrite(AIN2, HIGH);
  digitalWrite(BIN1, LOW);
  digitalWrite(BIN2, HIGH);
}

void MotorIzquierdo(int velocidad) {
  analogWrite(PWMB, constrain(velocidad, 0, 255));
}

void MotorDerecho(int velocidad) {
  analogWrite(PWMA, constrain(velocidad, 0, 255));
}

void Motores(int velDer, int velIzq) {
  MotorDerecho(velDer);
  MotorIzquierdo(velIzq);
}

void loop() {
  uint32_t currentMicros = micros();

  // Leer sensores
  uint16_t position = qtr.readLineBlack(sensorValues);

  // PID Calculations
  int error = setPoint - (int)position;
  
  // P Term
  float p_term = error * Kp;
  
  // D Term (Simple differentiation)
  float d_term = (error - lastError) * Kd; 
  lastError = error;
  
  // I Term (Omitted for this example)
  float i_term = 0; 

  int ajuste = (int)(p_term + i_term + d_term);

  // Motores
  int velDer = constrain(VelMax + ajuste, 0, 255);
  int velIzq = constrain(VelMax - ajuste, 0, 255);
  
  Motores(velDer, velIzq);

  // --- Telemetría Binaria ---
  // Populate Struct
  dataPacket.posicion = position;
  dataPacket.p_term = (int16_t)p_term;
  dataPacket.i_term = (int16_t)i_term;
  dataPacket.d_term = (int16_t)d_term;
  dataPacket.pwm_izq = (uint8_t)velIzq;
  dataPacket.pwm_der = (uint8_t)velDer;
  dataPacket.timestamp = currentMicros;
  
  // Calculate Checksum (XOR)
  dataPacket.checksum = 0;
  uint8_t *ptr = (uint8_t *)&dataPacket;
  for (int i = 0; i < sizeof(dataPacket) - 1; i++) {
    dataPacket.checksum ^= ptr[i];
  }

  // Send Header
  Serial.write(0xAA);
  Serial.write(0xBB);
  
  // Send Struct
  Serial.write((byte*)&dataPacket, sizeof(dataPacket));
  
  // No delay() calls to maximize control loop speed
}
