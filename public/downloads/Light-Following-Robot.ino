// Firmware Oficial: Robot Seguidor de Luz (Light-Following Robot)
// Programado originalmente en SteamakersBlocks y traducido a C++

double diferenciaBase;
double S_Izquierdo;
double Resta;
double umbral;
double S_Derecho;
double luzMinima; // Umbral mínimo de luz para activarse
double luzMaxima; // Umbral de proximidad extrema para detenerse

// Pines del Driver Puente H L298N
int l298n_1_ena = 10;
int l298n_1_in1 = 5;
int l298n_1_in2 = 4;
int l298n_1_in3 = 3;
int l298n_1_in4 = 2;
int l298n_1_enb = 9;

// Funciones de movimiento
void adelante() {
	digitalWrite(l298n_1_in1, HIGH);
	digitalWrite(l298n_1_in2, LOW);
	analogWrite(l298n_1_ena, (uint16_t)(255));
	digitalWrite(l298n_1_in3, LOW);
	digitalWrite(l298n_1_in4, HIGH);
	analogWrite(l298n_1_enb, (uint16_t)(255));
}

void atras() {
	digitalWrite(l298n_1_in1, LOW);
	digitalWrite(l298n_1_in2, HIGH);
	analogWrite(l298n_1_ena, (uint16_t)(255));
	digitalWrite(l298n_1_in3, HIGH);
	digitalWrite(l298n_1_in4, LOW);
	analogWrite(l298n_1_enb, (uint16_t)(255));
}

void izquierda() {
	digitalWrite(l298n_1_in1, HIGH);
	digitalWrite(l298n_1_in2, LOW);
	analogWrite(l298n_1_ena, (uint16_t)(255));
	digitalWrite(l298n_1_in3, HIGH);
	digitalWrite(l298n_1_in4, LOW);
	analogWrite(l298n_1_enb, (uint16_t)(0));
}

void derecha() {
	digitalWrite(l298n_1_in1, LOW);
	digitalWrite(l298n_1_in2, HIGH);
	analogWrite(l298n_1_ena, (uint16_t)(0));
	digitalWrite(l298n_1_in3, LOW);
	digitalWrite(l298n_1_in4, HIGH);
	analogWrite(l298n_1_enb, (uint16_t)(255));
}

void detener() {
	digitalWrite(l298n_1_in1, LOW);
	digitalWrite(l298n_1_in2, LOW);
	analogWrite(l298n_1_ena, (uint16_t)(0));
	digitalWrite(l298n_1_in3, LOW);
	digitalWrite(l298n_1_in4, LOW);
	analogWrite(l298n_1_enb, (uint16_t)(0));
}

void setup()
{
	// Configurar pines de motores como salidas
	pinMode(10, OUTPUT);
	pinMode(5, OUTPUT);
	pinMode(4, OUTPUT);
	pinMode(3, OUTPUT);
	pinMode(2, OUTPUT);
	pinMode(9, OUTPUT);

	// Configurar pines de sensores LDR como entradas analógicas
	pinMode(A0, INPUT);
	pinMode(A1, INPUT);
	
	// Inicializar comunicación Serial a 9600 baudios
	Serial.begin(9600);
	Serial.flush();
	while(Serial.available() > 0) Serial.read();

	// Valores iniciales de calibración
	diferenciaBase = -70; // Desfase entre sensores LDR en condiciones iguales
	umbral = 50;         // Banda muerta (tolerancia) para evitar oscilación
	luzMinima = 300;     // No moverse si ambos LDR leen menos de 300
	luzMaxima = 850;     // Detenerse si ambos LDR superan 850 (meta alcanzada)
}

void loop()
{
	S_Izquierdo = 0;
	S_Derecho = 0;
	
	// Tomar 100 lecturas y sumarlas
	for (int count = 0; count < 100; count++) {
		S_Izquierdo = (S_Izquierdo + ((float)analogRead(A0)));
		S_Derecho = (S_Derecho + ((float)analogRead(A1)));
	}
	
	// Calcular el promedio dividiendo para 100
	S_Izquierdo = (S_Izquierdo / 100);
	S_Derecho = (S_Derecho / 100);
	
	// Calcular la diferencia (resta)
	Resta = (S_Izquierdo - S_Derecho);
	
	// Control del robot según la luz detectada
	if (S_Izquierdo < luzMinima && S_Derecho < luzMinima) {
		// Poca luz en ambos sensores -> detenerse para evitar movimientos erráticos por luz ambiental
		detener();
	}
	else if (S_Izquierdo > luzMaxima && S_Derecho > luzMaxima) {
		// Llegó justo debajo de la linterna -> detenerse
		detener();
	}
	else if ((Resta > (diferenciaBase + umbral))) {
		// Más luz en el sensor izquierdo -> girar a la izquierda
		izquierda();
	}
	else if ((Resta < (diferenciaBase - umbral))) {
		// Más luz en el sensor derecho -> girar a la derecha
		derecha();
	}
	else {
		// Luz balanceada -> avanzar recto
		adelante();
	}

	// Enviar la diferencia al Monitor Serie y Graficador
	Serial.println(Resta);
}
