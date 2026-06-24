import { useState } from "react";

// Switch state: true = ON (closed), false = OFF (open)
const PRESETS = {
  off:      { s1: false, s2: false, s3: false, s4: false, label: "Coast (off)" },
  forward:  { s1: true,  s2: false, s3: false, s4: true,  label: "Forward ▶" },
  backward: { s1: false, s2: true,  s3: true,  s4: false, label: "Backward ◀" },
  brake:    { s1: true,  s2: false, s3: true,  s4: false, label: "Brake ■" },
};

function getMotorState(s1, s2, s3, s4) {
  if (s1 && s4 && !s2 && !s3) return { dir: "forward",  label: "FORWARD",  color: "#22c55e", current: "→" };
  if (s2 && s3 && !s1 && !s4) return { dir: "backward", label: "BACKWARD", color: "#3b82f6", current: "←" };
  if ((s1 && s3) || (s2 && s4))   return { dir: "shoot",    label: "⚠ SHORT CIRCUIT!", color: "#ef4444", current: "!" };
  if (s1 && s3 && !s2 && !s4)     return { dir: "brake",    label: "BRAKE",   color: "#f59e0b", current: "■" };
  return { dir: "coast", label: "COAST", color: "rgba(255,255,255,0.3)", current: "○" };
}

function Switch({ id, label, active, onClick, shootThrough }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 60, height: 36,
        borderRadius: 8,
        border: `2px solid ${active ? (shootThrough ? "#ef4444" : "#f97316") : "rgba(255,255,255,0.15)"}`,
        background: active ? (shootThrough ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)") : "rgba(255,255,255,0.03)",
        color: active ? (shootThrough ? "#ef4444" : "#f97316") : "rgba(255,255,255,0.4)",
        fontWeight: 800,
        fontSize: 11,
        cursor: "pointer",
        transition: "all 0.15s",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </button>
  );
}

export default function HBridgeSim() {
  const [switches, setSwitches] = useState({ s1: false, s2: false, s3: false, s4: false });
  const [pwm, setPwm] = useState(255);

  const toggle = (key) => setSwitches(prev => ({ ...prev, [key]: !prev[key] }));
  const applyPreset = (preset) => setSwitches(PRESETS[preset]);

  const { s1, s2, s3, s4 } = switches;
  const shootThrough = (s1 && s3) || (s2 && s4);
  const motorState = getMotorState(s1, s2, s3, s4);
  const speedPct = Math.round((pwm / 255) * 100);

  // Current path colors
  const topLeftActive  = s1 && !shootThrough;
  const topRightActive = s2 && !shootThrough;
  const botLeftActive  = s3 && !shootThrough;
  const botRightActive = s4 && !shootThrough;

  const wireColor = (active) => active ? "#f97316" : "rgba(255,255,255,0.1)";

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#0d1117", borderRadius: 16, padding: 24, border: "1px solid rgba(249,115,22,0.2)", marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", boxShadow: "0 0 10px #f97316" }} />
        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase" }}>H-Bridge Simulator</span>
      </div>

      {/* Preset buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} onClick={() => applyPreset(key)}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* H-Bridge diagram */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 24, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        <svg viewBox="0 0 400 300" style={{ width: "100%", height: "auto" }}>
          {/* Battery */}
          <text x="20" y="150" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">V+</text>
          <text x="20" y="165" fill="rgba(255,255,255,0.5)" fontSize="11" textAnchor="middle">7.4V</text>

          {/* Top rail */}
          <line x1="40" y1="80"  x2="120" y2="80"  stroke={wireColor(topLeftActive)}  strokeWidth="3" />
          <line x1="200" y1="80" x2="280" y2="80" stroke={wireColor(topRightActive)} strokeWidth="3" />
          <line x1="40" y1="80"  x2="40"  y2="220" stroke={wireColor(false)} strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3" />

          {/* Bottom rail */}
          <line x1="120" y1="220" x2="40"  y2="220" stroke={wireColor(botLeftActive)}  strokeWidth="3" />
          <line x1="280" y1="220" x2="360" y2="220" stroke={wireColor(botRightActive)} strokeWidth="3" />
          <line x1="360" y1="80"  x2="360" y2="220" stroke={wireColor(false)} strokeWidth="1.5" strokeDasharray="4,4" opacity="0.3" />

          {/* Motor (center) */}
          <line x1="120" y1="80"  x2="120" y2="120" stroke={wireColor(topLeftActive)}  strokeWidth="3" />
          <line x1="280" y1="80"  x2="280" y2="120" stroke={wireColor(topRightActive)} strokeWidth="3" />
          <line x1="120" y1="180" x2="120" y2="220" stroke={wireColor(botLeftActive)}  strokeWidth="3" />
          <line x1="280" y1="180" x2="280" y2="220" stroke={wireColor(botRightActive)} strokeWidth="3" />

          {/* Motor body */}
          <rect x="120" y="120" width="160" height="60" rx="10"
            fill={shootThrough ? "rgba(239,68,68,0.1)" : "rgba(249,115,22,0.05)"}
            stroke={motorState.color} strokeWidth="2" />
          <text x="200" y="148" fill={motorState.color} fontSize="22" textAnchor="middle" fontWeight="800">
            {motorState.current === "→" ? "⟶" : motorState.current === "←" ? "⟵" : motorState.current}
          </text>
          <text x="200" y="168" fill={motorState.color} fontSize="11" textAnchor="middle" fontWeight="700">{motorState.label}</text>

          {/* S1 — top left */}
          <rect x="120" y="60" width="60" height="32" rx="6"
            fill={s1 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)"}
            stroke={s1 ? "#f97316" : "rgba(255,255,255,0.15)"} strokeWidth="1.5"
            style={{ cursor: "pointer" }} onClick={() => toggle("s1")} />
          <text x="150" y="80" fill={s1 ? "#f97316" : "rgba(255,255,255,0.4)"} fontSize="12" textAnchor="middle" fontWeight="700" style={{ cursor: "pointer" }} onClick={() => toggle("s1")}>S1 {s1 ? "■" : "□"}</text>

          {/* S2 — top right */}
          <rect x="220" y="60" width="60" height="32" rx="6"
            fill={s2 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)"}
            stroke={s2 ? "#f97316" : "rgba(255,255,255,0.15)"} strokeWidth="1.5"
            style={{ cursor: "pointer" }} onClick={() => toggle("s2")} />
          <text x="250" y="80" fill={s2 ? "#f97316" : "rgba(255,255,255,0.4)"} fontSize="12" textAnchor="middle" fontWeight="700" style={{ cursor: "pointer" }} onClick={() => toggle("s2")}>S2 {s2 ? "■" : "□"}</text>

          {/* S3 — bottom left */}
          <rect x="120" y="208" width="60" height="32" rx="6"
            fill={s3 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)"}
            stroke={s3 ? "#f97316" : "rgba(255,255,255,0.15)"} strokeWidth="1.5"
            style={{ cursor: "pointer" }} onClick={() => toggle("s3")} />
          <text x="150" y="228" fill={s3 ? "#f97316" : "rgba(255,255,255,0.4)"} fontSize="12" textAnchor="middle" fontWeight="700" style={{ cursor: "pointer" }} onClick={() => toggle("s3")}>S3 {s3 ? "■" : "□"}</text>

          {/* S4 — bottom right */}
          <rect x="220" y="208" width="60" height="32" rx="6"
            fill={s4 ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)"}
            stroke={s4 ? "#f97316" : "rgba(255,255,255,0.15)"} strokeWidth="1.5"
            style={{ cursor: "pointer" }} onClick={() => toggle("s4")} />
          <text x="250" y="228" fill={s4 ? "#f97316" : "rgba(255,255,255,0.4)"} fontSize="12" textAnchor="middle" fontWeight="700" style={{ cursor: "pointer" }} onClick={() => toggle("s4")}>S4 {s4 ? "■" : "□"}</text>

          {/* Ground symbol */}
          <text x="380" y="225" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle">GND</text>
        </svg>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginTop: 8 }}>Click S1–S4 to toggle transistor switches</p>
      </div>

      {/* PWM slider */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
        <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>PWM Duty Cycle — analogWrite(ENA, {pwm})</label>
        <div style={{ color: "#f97316", fontSize: 22, fontWeight: 800, margin: "6px 0" }}>{speedPct}% duty = ~{(7.4 * pwm / 255).toFixed(1)}V average</div>
        <input type="range" min="0" max="255" step="1" value={pwm}
          onChange={e => setPwm(parseInt(e.target.value))}
          onDoubleClick={() => setPwm(255)}
          style={{ width: "100%", accentColor: "#f97316" }} />
        {/* PWM bar visualization */}
        <div style={{ display: "flex", gap: 1, marginTop: 8, height: 12, borderRadius: 4, overflow: "hidden" }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: (i / 40) < (pwm / 255) ? "#f97316" : "rgba(255,255,255,0.08)", borderRadius: 2 }} />
          ))}
        </div>
      </div>

      {/* Status */}
      {shootThrough && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: 14, color: "#ef4444", fontWeight: 700, fontSize: 13, textAlign: "center" }}>
          ⚠️ SHOOT-THROUGH: S1+S3 or S2+S4 simultaneously ON — this short-circuits the battery!
        </div>
      )}
    </div>
  );
}
