import asyncio
import collections
import threading
import time
import sys
import os
import csv
import struct
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from bleak import BleakScanner, BleakClient

# Configuration
MAX_POINTS = 5000 # Increased buffer size
UART_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
UART_TX_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"
SETPOINT_VALUE = 3500  # Default setpoint

# Binary Protocol Struct Layout
# uint16_t posicion (H), int16_t p (h), int16_t i (h), int16_t d (h)
# uint8_t pwm_l (B), uint8_t pwm_r (B), uint32_t timestamp (I), uint8_t checksum (B)
# Total Size = 2+2+2+2+1+1+4+1 = 15 bytes
PACKET_FORMAT = "<HhhhBBIB"
PACKET_SIZE = struct.calcsize(PACKET_FORMAT)
HEADER = b'\xAA\xBB'

# Global Data Queues
timestamps = collections.deque(maxlen=MAX_POINTS)
pos_data = collections.deque(maxlen=MAX_POINTS)
p_data = collections.deque(maxlen=MAX_POINTS)
i_data = collections.deque(maxlen=MAX_POINTS)
d_data = collections.deque(maxlen=MAX_POINTS)
total_data = collections.deque(maxlen=MAX_POINTS) # P+I+D

connection_status = "Disconnected"
log_filename = ""
byte_buffer = bytearray()

# View Control
time_window = 10.0 # Seconds to show
auto_scroll = True

class BLEManager:
    def __init__(self, filename=None):
        self.loop = asyncio.new_event_loop()
        self.client = None
        self.running = False
        self.log_file = filename
        
        if self.log_file:
            os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
            with open(self.log_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Timestamp_uS", "Position", "P", "I", "D", "Total_Adjustment", "PWM_L", "PWM_R", "Est_Kp", "Est_Kd"])
            print(f"Logging data to: {self.log_file}")

    def start_thread(self):
        self.running = True
        t = threading.Thread(target=self._run_loop, daemon=True)
        t.start()
        
    def _run_loop(self):
        asyncio.set_event_loop(self.loop)
        try:
            self.loop.run_until_complete(self.main_ble_task())
        except Exception as e:
            if self.running:
                print(f"BLE Thread Error: {e}")
            
    async def main_ble_task(self):
        global connection_status
        while self.running:
            device = await self.scan()
            if not device:
                if not self.running: break
                connection_status = "Scanning failed, retrying..."
                await asyncio.sleep(2)
                continue
                
            connection_status = f"Connecting to {device.name}..."
            try:
                async with BleakClient(device.address) as client:
                    self.client = client
                    connection_status = "Connected"
                    print("BLE Connected. Waiting for binary stream...")
                    
                    await client.start_notify(UART_TX_CHAR_UUID, self.notification_handler)
                    
                    while self.running and client.is_connected:
                        await asyncio.sleep(1)
                        
            except Exception as e:
                if not self.running: break
                connection_status = f"Connection Error: {e}"
                print(f"Connection lost/failed: {e}")
                await asyncio.sleep(2)

    async def scan(self):
        global connection_status
        connection_status = "Scanning..."
        print("Scanning for HM-10...")
        try:
            devices = await BleakScanner.discover(timeout=5.0)
            for d in devices:
                name = d.name or ""
                if any(k in name for k in ["HM", "BT05", "AT", "MLT"]):
                    return d
        except Exception as e:
             print(f"Scan error: {e}")
        return None

    def notification_handler(self, sender, data):
        global byte_buffer
        byte_buffer.extend(data)
        
        # Parse Packets
        while len(byte_buffer) >= (2 + PACKET_SIZE):
            # Check Header
            if byte_buffer[0:2] == HEADER:
                packet = byte_buffer[2:2+PACKET_SIZE]
                
                try:
                    unpacked = struct.unpack(PACKET_FORMAT, packet)
                    pos, p, i, d, pwm_l, pwm_r, ts, rx_checksum = unpacked
                    
                    # Verify Checksum (XOR)
                    cal_checksum = 0
                    for b in packet[:-1]: # All bytes except the last one (checksum)
                        cal_checksum ^= b
                        
                    if cal_checksum != rx_checksum:
                        print(f"Checksum Error: Calc {cal_checksum} != Rx {rx_checksum}")
                        del byte_buffer[0] 
                        continue

                    total = p + i + d
                    
                    # Estimate Constants
                    # Kp = p / error
                    # Kd = d / (error - last_error) = d / (prev_pos - pos)
                    error = SETPOINT_VALUE - pos
                    
                    est_kp = 0.0
                    if abs(error) > 0:
                        est_kp = p / error
                        
                    est_kd = 0.0
                    # We need previous position for Kd. 
                    # We can peek at the last value in pos_data if available.
                    if len(pos_data) > 0:
                        prev_pos = pos_data[-1]
                        delta_pos = prev_pos - pos
                        if abs(delta_pos) > 0:
                            est_kd = d / delta_pos
                            
                    # Convert micros to seconds 
                    timestamps.append(ts / 1000000.0)
                    
                    pos_data.append(pos)
                    p_data.append(p)
                    i_data.append(i)
                    d_data.append(d)
                    total_data.append(total)
                    
                    # Log to CSV
                    if self.log_file:
                        with open(self.log_file, 'a', newline='') as f:
                            writer = csv.writer(f)
                            writer.writerow([ts, pos, p, i, d, total, pwm_l, pwm_r, f"{est_kp:.3f}", f"{est_kd:.3f}"])
                            
                    del byte_buffer[0:2+PACKET_SIZE]
                    
                except struct.error:
                    print("Struct Error")
                    del byte_buffer[0] 
            else:
                del byte_buffer[0]

    def stop(self):
        print("Stopping BLE Manager...")
        self.running = False
        if self.loop.is_running():
            self.loop.call_soon_threadsafe(self.loop.stop)

# --- Plotting Logic ---

def update(frame, line_pos, line_p, line_i, line_d, line_total, ax_pos, ax_pid):
    global time_window
    
    title = f"Status: {connection_status} | Time Window: {time_window}s (+/- to change)"
    if log_filename:
        title += f"\nLog: {os.path.basename(log_filename)}"
    ax_pos.set_title(title, fontsize=10)
    
    if len(timestamps) > 0:
        x_data = list(timestamps)
        
        # Position Plot
        line_pos.set_data(x_data, list(pos_data))
        
        # PID Plot
        line_p.set_data(x_data, list(p_data))
        line_i.set_data(x_data, list(i_data))
        line_d.set_data(x_data, list(d_data))
        line_total.set_data(x_data, list(total_data))
        
        # Manual Sliding Window
        last_t = x_data[-1]
        ax_pos.set_xlim(last_t - time_window, last_t + 0.1)
        ax_pid.set_xlim(last_t - time_window, last_t + 0.1)
        
        # Auto-scale Y
        y_p_min, y_p_max = min(pos_data), max(pos_data)
        y_p_min = min(y_p_min, SETPOINT_VALUE)
        y_p_max = max(y_p_max, SETPOINT_VALUE)
        
        margin = (y_p_max - y_p_min)*0.1 if y_p_max != y_p_min else 100
        ax_pos.set_ylim(y_p_min - margin, y_p_max + margin)

        # PID
        all_pid = list(p_data) + list(i_data) + list(d_data) + list(total_data)
        if all_pid:
            y_pid_min, y_pid_max = min(all_pid), max(all_pid)
            margin = (y_pid_max - y_pid_min)*0.1 if y_pid_max != y_pid_min else 10
            ax_pid.set_ylim(y_pid_min - margin, y_pid_max + margin)
        
    return line_pos, line_p, line_i, line_d, line_total

def on_key(event):
    global time_window
    if event.key in ['+', '=']:
        time_window += 1
    elif event.key in ['-', '_']:
        time_window = max(1, time_window - 1)

def on_close(event):
    print("Window Closed. Shutting down...")
    if 'ble_mgr' in globals():
        globals()['ble_mgr'].stop()
    sys.exit(0)

def main():
    global log_filename
    global ble_mgr
    
    print("--- Binary Telemetry Mode ---")
    
    # Windows 10/11 compatibility for Bleak
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    session_code = input("Enter Session Code: ").strip() or "telemetry"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = os.path.abspath(os.path.join("logs", f"bin_{session_code}_{timestamp}.csv"))

    ble_mgr = BLEManager(filename=log_filename)
    ble_mgr.start_thread()
    
    # Setup Plot (2 Subplots)
    fig, (ax_pos, ax_pid) = plt.subplots(2, 1, sharex=True, figsize=(10, 8))
    
    # Event Handlers
    fig.canvas.mpl_connect('close_event', on_close)
    fig.canvas.mpl_connect('key_press_event', on_key)
    
    # Plot 1: Position
    ax_pos.set_ylabel("Line Position (0-7000)")
    ax_pos.grid(True)
    line_pos, = ax_pos.plot([], [], 'b-', label='Position', linewidth=1.5)
    ax_pos.axhline(y=SETPOINT_VALUE, color='k', linestyle='--', alpha=0.5, label='Setpoint')
    ax_pos.legend(loc='upper right')
    
    # Plot 2: PID Terms
    ax_pid.set_ylabel("PID Contribution")
    ax_pid.set_xlabel("Time (s)")
    ax_pid.grid(True)
    line_p, = ax_pid.plot([], [], 'r-', label='P Term', alpha=0.7)
    line_i, = ax_pid.plot([], [], 'g-', label='I Term', alpha=0.7)
    line_d, = ax_pid.plot([], [], 'm-', label='D Term', alpha=0.7)
    line_total, = ax_pid.plot([], [], 'k-', label='Total Adjustment', linewidth=1.5)
    ax_pid.legend(loc='upper right')
    
    ani = FuncAnimation(fig, update, fargs=(line_pos, line_p, line_i, line_d, line_total, ax_pos, ax_pid), 
                        interval=33, blit=False, cache_frame_data=False) 
    
    print("Starting Plotter...")
    print("Controls: +/- to zoom time window")
    try:
        plt.show()
    except KeyboardInterrupt:
        pass
    finally:
        ble_mgr.stop()
        print("Exiting.")

if __name__ == "__main__":
    main()
