import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import sys
import glob
import os

def analyze_log(filepath):
    print(f"Analyzing: {os.path.basename(filepath)}")
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    # Filter out empty or header-only files
    if len(df) < 50:
        print("Too few samples.")
        return

    # Data Prep
    df['t'] = (df['Timestamp_uS'] - df['Timestamp_uS'].iloc[0]) / 1_000_000.0
    df['dt'] = df['t'].diff()
    
    # Inputs
    df['pwm_diff'] = df['PWM_R'].astype(float) - df['PWM_L'].astype(float)
    df['pwm_sum'] = df['PWM_R'].astype(float) + df['PWM_L'].astype(float)
    
    # Outputs
    # Error: 0 to 7000. Center is 3500.
    # Normalize Error to -1.0 to 1.0 (Approx)
    df['err_norm'] = (df['Position'] - 3500) / 3500.0
    
    # Velocity of Error (how fast are we moving laterally?)
    # d(Error)/dt
    df['err_vel'] = df['err_norm'].diff() / df['dt']
    
    # Smooth a bit
    df['pwm_diff_smooth'] = df['pwm_diff'].rolling(window=5).mean()
    df['err_vel_smooth'] = df['err_vel'].rolling(window=5).mean()
    
    # --- System Identification 1: Turning Sensitivity ---
    # We assume d(Error)/dt ~ k * pwm_diff
    # So k = (dError/dt) / pwm_diff
    # We only care when we are actually moving and turning significantly
    
    # Filter for active movement
    mask = (df['pwm_sum'] > 100) & (np.abs(df['pwm_diff']) > 20) & (np.abs(df['pwm_diff']) < 200)
    
    valid_data = df[mask].dropna()
    
    if len(valid_data) < 10:
        print("Not enough valid turning data.")
        return

    # Simple Ratio estimator
    # k_inst = err_vel / pwm_diff
    k_inst = valid_data['err_vel_smooth'] / valid_data['pwm_diff_smooth']
    
    # Remove outliers
    k_inst = k_inst[np.abs(k_inst) < 0.1] # Cap unreasonable gains
    
    estimated_gain = k_inst.mean()
    print(f"Estimated Turning Gain (dNormErr/dt per PWM): {estimated_gain:.6f}")
    
    # --- System Identification 2: Inertia / Lag ---
    # Cross correlation between PWM_Diff and Err_Vel
    # We expect Err_Vel to lag behind PWM_Diff
    
    lags = np.arange(0, 20) # 0 to 20 samples lag
    corrs = []
    
    # clean NaNs
    s1 = df['pwm_diff_smooth'].fillna(0)
    s2 = df['err_vel_smooth'].fillna(0)
    
    for lag in lags:
        # Shift s1 (input) forward, see if it matches s2 (output)
        c = s1.shift(lag).corr(s2)
        corrs.append(c)
        
    best_lag_idx = np.argmax(corrs)
    best_lag_time = best_lag_idx * df['dt'].mean()
    
    print(f"Estimated Lag: {best_lag_idx} frames (~{best_lag_time*1000:.1f} ms)")
    
    # Plot for verification
    # Normalize to visualize overlay
    s1_norm = s1 / s1.abs().max()
    s2_norm = s2 / s2.abs().max()
    
    plt.figure(figsize=(10,6))
    plt.plot(df['t'], s1_norm, label='PWM Input (Diff)', alpha=0.5)
    plt.plot(df['t'], s2_norm, label='Error Velocity', alpha=0.5)
    plt.title(f"System ID: Gain={estimated_gain:.5f}, Lag={best_lag_time*1000:.1f}ms")
    plt.legend()
    # Save plot
    out_img = filepath.replace('.csv', '_sysid.png')
    plt.savefig(out_img)
    # plt.show()
    print(f"Saved plot to {out_img}")

    return {
        'gain': estimated_gain,
        'lag_ms': best_lag_time*1000
    }

# Run on the latest file
files = glob.glob("logs/bin_*.csv")
if not files:
    print("No logs found.")
    sys.exit()
    
latest_file = max(files, key=os.path.getctime)
print(f"Processing latest file: {latest_file}")
analyze_log(latest_file)
