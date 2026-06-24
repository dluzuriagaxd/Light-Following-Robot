import { useState, useEffect, useRef } from "react";

const GEAR_RATIO = 48;
const STALL_TORQUE_BASE = 0.8; // kg·cm at 6V
const NO_LOAD_RPM_BASE = 15000; // motor RPM at 6V

export default function DcMotorSim() {
  const [voltage, setVoltage] = useState(6.0);
  const [load, setLoad] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  const maxVoltage = 8.4;
  const scale = voltage / 6;
  const stallTorque = STALL_TORQUE_BASE * scale;
  const noLoadRPM = NO_LOAD_RPM_BASE * scale;

  // Output shaft RPM and torque (after gear reduction)
  const outputNoLoadRPM = noLoadRPM / GEAR_RATIO;
  const outputStallTorque = stallTorque * GEAR_RATIO;

  // Operating point based on load (0-100% of stall)
  const loadFraction = load / 100;
  const operatingTorque = outputStallTorque * loadFraction;
  const operatingRPM = outputNoLoadRPM * (1 - loadFraction);
  const motorRPM = operatingRPM * GEAR_RATIO;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = 60 + (i / 10) * (W - 80);
        const y = 20 + (i / 10) * (H - 50);
        ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 20, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(60, H - 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(60, H - 30); ctx.lineTo(W - 20, H - 30); ctx.stroke();

      // Axis labels
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${outputStallTorque.toFixed(1)}`, 56, 24);
      ctx.fillText("0", 56, H - 26);
      ctx.textAlign = "center";
      ctx.fillText(`${outputNoLoadRPM.toFixed(0)} RPM`, W - 20, H - 14);
      ctx.fillText("0", 60, H - 14);

      // Axis titles
      ctx.save();
      ctx.translate(18, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Torque (kg·cm)", 0, 0);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Speed (RPM)", W / 2 + 20, H - 2);

      // Torque-speed line
      const x0 = 60;
      const y0 = H - 30;
      const xEnd = W - 20;
      const yEnd = 20;
      const grad = ctx.createLinearGradient(x0, y0, xEnd, yEnd);
      grad.addColorStop(0, "#f97316");
      grad.addColorStop(1, "#fb923c");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, yEnd); // (0 RPM, stall torque) — top left
      ctx.lineTo(xEnd, y0); // (no-load RPM, 0 torque) — bottom right
      ctx.stroke();

      // Operating point
      const opX = x0 + (operatingRPM / outputNoLoadRPM) * (xEnd - x0);
      const opY = y0 - (operatingTorque / outputStallTorque) * (y0 - yEnd);

      // Dotted lines to axes
      ctx.strokeStyle = "rgba(251,146,60,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(opX, opY); ctx.lineTo(opX, y0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(opX, opY); ctx.lineTo(x0, opY); ctx.stroke();
      ctx.setLineDash([]);

      // Operating point dot
      ctx.beginPath();
      ctx.arc(opX, opY, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(opX, opY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#f97316";
      ctx.fill();

      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${operatingRPM.toFixed(0)} RPM`, opX + 10, opY - 4);
      ctx.fillText(`${operatingTorque.toFixed(2)} kg·cm`, opX + 10, opY + 10);
    };

    // Motor animation
    const animate = () => {
      angleRef.current += (operatingRPM / 60) * (Math.PI * 2) * 0.016;
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [voltage, load, operatingRPM, operatingTorque, outputNoLoadRPM, outputStallTorque]);

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#0d1117", borderRadius: 16, padding: 24, border: "1px solid rgba(249,115,22,0.2)", marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 10px #f97316" }} />
        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>DC Motor Simulator</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Voltage slider */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Battery Voltage</label>
          <div style={{ color: "#f97316", fontSize: 24, fontWeight: 800, margin: "6px 0" }}>{voltage.toFixed(1)}V</div>
          <input type="range" min="4" max="8.4" step="0.1" value={voltage}
            onChange={e => setVoltage(parseFloat(e.target.value))}
            onDoubleClick={() => setVoltage(6.0)}
            style={{ width: "100%", accentColor: "#f97316" }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4 }}>
            <span>4.0V (low)</span><span>8.4V (full)</span>
          </div>
        </div>
        {/* Load slider */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Mechanical Load</label>
          <div style={{ color: "#60a5fa", fontSize: 24, fontWeight: 800, margin: "6px 0" }}>{load}%</div>
          <input type="range" min="0" max="95" step="1" value={load}
            onChange={e => setLoad(parseInt(e.target.value))}
            onDoubleClick={() => setLoad(0)}
            style={{ width: "100%", accentColor: "#60a5fa" }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4 }}>
            <span>0% (free spin)</span><span>100% (stall)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <canvas ref={canvasRef} width={560} height={240} style={{ width: "100%", height: "auto", borderRadius: 8 }} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
        {[
          { label: "Output RPM", value: operatingRPM.toFixed(0), unit: "rpm", color: "#f97316" },
          { label: "Output Torque", value: operatingTorque.toFixed(2), unit: "kg·cm", color: "#60a5fa" },
          { label: "Motor RPM", value: motorRPM.toFixed(0), unit: "rpm (pre-gear)", color: "rgba(255,255,255,0.4)" },
          { label: "Gear Ratio", value: `1:${GEAR_RATIO}`, unit: "reduction", color: "rgba(255,255,255,0.4)" },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12, border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            <div style={{ color, fontSize: 20, fontWeight: 800, margin: "4px 0" }}>{value}</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
