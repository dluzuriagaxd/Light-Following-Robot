import asyncio
from bleak import BleakScanner, BleakClient
import sys

# HM-10 Default UUIDs
# Service UUID: 0000ffe0-0000-1000-8000-00805f9b34fb
# Characteristic UUID: 0000ffe1-0000-1000-8000-00805f9b34fb
UART_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
UART_RX_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"
UART_TX_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb" # HM-10 uses same char for TX/RX

async def scan_for_device():
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover()
    
    hm10_devices = []
    for d in devices:
        # HM-10 often names: HMSoft, MLT-BT05, AT-09, BT05
        name = d.name or "Unknown"
        print(f"Found: {name} - {d.address}")
        if "HM" in name or "BT05" in name or "AT" in name or "MLT" in name:
            hm10_devices.append(d)
    
    if not hm10_devices:
        print("\nNo obvious HM-10 devices found in name.")
        # Optional: return the first device or ask user
        # For now, let's list all and ask user if possible, or just fail safely
        return None
    
    if len(hm10_devices) == 1:
        print(f"\nAuto-selected: {hm10_devices[0].name}")
        return hm10_devices[0]
        
    print("\nMultiple candidates found:")
    for i, d in enumerate(hm10_devices):
        print(f"{i}: {d.name} ({d.address})")
    
    try:
        idx = int(input("Select device index: "))
        return hm10_devices[idx]
    except:
        return None

async def run():
    device = await scan_for_device()
    if not device:
        print("No device selected.")
        return

    print(f"Connecting to {device.name}...")
    
    async with BleakClient(device.address) as client:
        print(f"Connected: {client.is_connected}")
        
        # Notification handler
        def notification_handler(sender, data):
            decoded = data.decode('utf-8', errors='replace').strip()
            print(f"Received: '{decoded}'")
            if "RECEIVED: 1" in decoded:
                print("SUCCESS: Bidirectional confirmed!")

        await client.start_notify(UART_RX_CHAR_UUID, notification_handler)
        
        print("Sending '1'...")
        # Write without response is typical for UART streams, but HM-10 sometimes supports with response
        # We try write_gatt_char
        await client.write_gatt_char(UART_TX_CHAR_UUID, b'1', response=False)
        
        print("Waiting for response (5s)...")
        await asyncio.sleep(5)
        
        await client.stop_notify(UART_RX_CHAR_UUID)
        print("Done.")

if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as e:
        print(f"Error: {e}")
