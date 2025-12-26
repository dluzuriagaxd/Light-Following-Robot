import serial.tools.list_ports

def list_ports():
    print("Escaneando puertos seriales disponibles...")
    ports = serial.tools.list_ports.comports()
    
    if not ports:
        print("No se encontraron puertos seriales.")
        print("Asegúrate de que tu dispositivo Bluetooth esté emparejado y conectado.")
        return

    print("\nPuertos encontrados:")
    print("-" * 50)
    for port in ports:
        print(f"Dispositivo: {port.device}")
        print(f"Descripción: {port.description}")
        print(f"HWID: {port.hwid}")
        print("-" * 50)

if __name__ == "__main__":
    list_ports()
