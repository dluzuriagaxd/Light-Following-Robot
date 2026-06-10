import React, { useState } from 'react';

export default function BatteryChemistrySim({ isFullscreen = false, onMaximize = null }) {
  const [soc, setSoc] = useState(80); // % Capacity
  const [current, setCurrent] = useState(1.5); // Amps
  const [rInternal, setRInternal] = useState(120); // milli-Ohms

  // Constants
  const CELLS = 2;
  const FULL_V = 4.2 * CELLS; // 8.4V
  const CUTOFF_V = 3.0 * CELLS; // 6.0V

  // Open Circuit Voltage (Voc) based on SoC (NMC Piecewise curve)
  const getVoc = (pct) => {
    if (pct > 95) return FULL_V - (FULL_V - 8.0) * ((100 - pct) / 5);
    if (pct > 20) return 8.0 - (8.0 - 7.0) * ((95 - pct) / 75);
    return Math.max(6.0, 7.0 - (7.0 - CUTOFF_V) * ((20 - pct) / 20));
  };

  const voc = getVoc(soc);
  const rOhms = rInternal / 1000;
  const vSag = current * rOhms;
  const vTerminal = Math.max(0, voc - vSag);
  const pLoss = current * current * rOhms; // I^2 * R

  // Dynamic Graph Sizing
  const graphWidth = isFullscreen ? 400 : 280;
  const graphHeight = isFullscreen ? 160 : 90;
  const paddingX = 30;
  const paddingY = 15;

  const toGraphX = (s) => paddingX + (s / 100) * (graphWidth - paddingX - 10);
  const toGraphY = (v) => {
    const minV = 5.5;
    const maxV = 8.6;
    const rangeV = maxV - minV;
    const pixelsY = graphHeight - paddingY - 10;
    return graphHeight - paddingY - ((v - minV) / rangeV) * pixelsY;
  };

  // Build SVG path for NMC curve
  let pathD = '';
  for (let s = 0; s <= 100; s += 2) {
    const v = getVoc(s);
    const x = toGraphX(s);
    const y = toGraphY(v);
    if (s === 0) pathD += `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;
  }

  // Diagnostics Status
  let statusText = '💚 HEALTHY: STABLE VOLTAGE';
  let statusColor = 'text-green-400 bg-green-950/30 border-green-900/50';
  if (vTerminal < 6.0) {
    statusText = '🔴 CRITICAL: LOW VOLTAGE CUTOFF (LVD) TRIGGERED!';
    statusColor = 'text-red-400 bg-red-950/30 border-red-900/50 animate-pulse';
  } else if (vSag > 0.6) {
    statusText = '⚠️ WARNING: HEAVY VOLTAGE SAG (HIGH R_INT / LOAD)';
    statusColor = 'text-yellow-400 bg-yellow-950/30 border-yellow-900/50';
  }

  return (
    <div className={`bg-slate-900/60 border border-white/5 text-slate-300 ${isFullscreen ? 'p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between space-y-8 bg-transparent border-none' : 'p-4 rounded-2xl space-y-4'}`}>
      
      {/* Header (hidden in fullscreen overlay) */}
      {!isFullscreen && (
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            🔋 Battery Chemistry & Sag Simulator
          </h4>
          <div className="flex items-center gap-2">
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
              >
                <span>⛶</span> Maximize
              </button>
            )}
            <span className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-bold font-mono">
              NMC 2S
            </span>
          </div>
        </div>
      )}

      {/* Responsive layout */}
      <div className={`flex gap-6 ${isFullscreen ? 'flex-col lg:flex-row flex-1 items-stretch' : 'flex-col'}`}>
        
        {/* Left column: SVG Diagrams */}
        <div className={`space-y-4 ${isFullscreen ? 'flex-1 flex flex-col justify-between' : 'w-full'}`}>
          
          {/* Equivalent Circuit Diagram */}
          <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase text-slate-500 font-mono mb-1.5 self-start">
              Thévenin Equivalent Circuit Model
            </span>
            <svg 
              viewBox="0 0 320 110" 
              className={`w-full h-auto font-mono text-[9px] text-slate-400 ${isFullscreen ? 'max-w-[600px]' : 'max-w-[500px]'}`}
            >
              {/* Battery cell boundary box */}
              <rect x="8" y="8" width="162" height="94" rx="6" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
              <text x="14" y="18" fill="rgba(255,255,255,0.2)" fontSize="6" fontWeight="bold">BATTERY PACK</text>

              {/* Voc Voltage source */}
              <circle cx="45" cy="55" r="13" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.8" />
              <text x="45" y="51" fill="#fbbf24" fontWeight="bold" textAnchor="middle" fontSize="11">+</text>
              <text x="45" y="64" fill="#fbbf24" fontWeight="bold" textAnchor="middle" fontSize="9">-</text>
              <text x="45" y="80" fill="#fbbf24" textAnchor="middle" fontWeight="bold" fontSize="8">Voc</text>
              <text x="45" y="89" fill="#fbbf24" textAnchor="middle" fontSize="7">({voc.toFixed(2)}V)</text>

              {/* Connection lines inside cell */}
              <line x1="58" y1="55" x2="95" y2="55" stroke="#94a3b8" strokeWidth="1.2" />

              {/* Internal Resistor R_int */}
              <g transform="translate(95, 45)">
                <rect x="0" y="0" width="36" height="20" rx="2" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M 0 10 L 6 10 L 10 5 L 14 15 L 18 5 L 22 15 L 26 5 L 30 10 L 36 10" fill="none" stroke="#ef4444" strokeWidth="1" />
                <text x="18" y="-4" fill="#ef4444" textAnchor="middle" fontWeight="bold" fontSize="7">R_int</text>
                <text x="18" y="28" fill="#ef4444" textAnchor="middle" fontSize="7" fontWeight="bold">{rInternal} m&Omega;</text>
              </g>

              {/* Connection from Resistor to outer terminals */}
              <line x1="131" y1="55" x2="190" y2="55" stroke="#f97316" strokeWidth="1.5" />

              {/* outer terminal + */}
              <circle cx="190" cy="55" r="2" fill="#f97316" />
              <text x="190" y="47" fill="#f97316" textAnchor="middle" fontWeight="bold">+</text>

              {/* Voltages labels */}
              <text x="190" y="68" fill="#22c55e" textAnchor="middle" fontWeight="bold" fontSize="8">V_term</text>
              <text x="190" y="77" fill="#22c55e" textAnchor="middle" fontWeight="bold" fontSize="8">{vTerminal.toFixed(2)}V</text>

              {/* Connection to ground loop */}
              <line x1="45" y1="68" x2="45" y2="95" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="45" y1="95" x2="250" y2="95" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="250" y1="95" x2="250" y2="73" stroke="#94a3b8" strokeWidth="1.2" />

              {/* Connection from positive terminal to motor load */}
              <line x1="190" y1="55" x2="250" y2="55" stroke="#f97316" strokeWidth="1.5" />
              <line x1="250" y1="55" x2="250" y2="38" stroke="#f97316" strokeWidth="1.5" />

              {/* Motor Load */}
              <g transform="translate(232, 10)">
                <circle cx="18" cy="14" r="13" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="18" y="18" fill="#60a5fa" textAnchor="middle" fontSize="11" fontWeight="bold">M</text>
                <text x="18" y="34" fill="#60a5fa" textAnchor="middle" fontSize="7" fontWeight="bold">MOTORS</text>
              </g>

              {/* Current flow indicator */}
              <path d="M 152 48 L 162 48" fill="none" stroke="#60a5fa" strokeWidth="1.2" />
              <polygon points="162,48 158,45 158,51" fill="#60a5fa" />
              <text x="157" y="42" fill="#60a5fa" fontSize="8" fontWeight="bold">I = {current.toFixed(1)}A</text>
            </svg>
          </div>

          {/* NMC Discharge Curve Graph */}
          <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase text-slate-500 font-mono mb-1.5 self-start">
              2S NMC Discharge Curve & Loaded Sag
            </span>
            <svg 
              viewBox={`0 0 ${graphWidth} ${graphHeight}`} 
              className={`w-full h-auto font-mono text-[8px] text-slate-400 ${isFullscreen ? 'max-w-[600px]' : 'max-w-[500px]'}`}
            >
              {/* Grid axes */}
              <line x1={paddingX} y1={graphHeight - paddingY} x2={graphWidth - 10} y2={graphHeight - paddingY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <line x1={paddingX} y1={10} x2={paddingX} y2={graphHeight - paddingY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

              {/* Y Axis Labels */}
              {[6.0, 7.0, 8.0, 8.4].map(v => {
                const y = toGraphY(v);
                return (
                  <g key={v}>
                    <line x1={paddingX} y1={y} x2={graphWidth - 10} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="2,2" />
                    <text x={paddingX - 4} y={y + 2.5} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="6">{v.toFixed(1)}V</text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {[0, 25, 50, 75, 100].map(s => {
                const x = toGraphX(s);
                return (
                  <g key={s}>
                    <line x1={x} y1={10} x2={x} y2={graphHeight - paddingY} stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" strokeDasharray="2,2" />
                    <text x={x} y={graphHeight - paddingY + 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6">{s}%</text>
                  </g>
                );
              })}

              {/* The piecewise curve path */}
              <path d={pathD} fill="none" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="2" />

              {/* Voltage Sag shading */}
              {soc > 0 && vSag > 0.05 && (
                <g>
                  <line 
                    x1={toGraphX(soc)} 
                    y1={toGraphY(voc)} 
                    x2={toGraphX(soc)} 
                    y2={toGraphY(vTerminal)} 
                    stroke="#ef4444" 
                    strokeWidth="1.2" 
                    strokeDasharray="2,2" 
                  />
                  <path d={`M ${toGraphX(soc)} ${toGraphY(voc)} L ${toGraphX(soc)} ${toGraphY(vTerminal)}`} fill="none" stroke="#ef4444" strokeWidth="1" />
                  <polygon points={`${toGraphX(soc)},${toGraphY(vTerminal)} ${toGraphX(soc)-2},${toGraphY(vTerminal)-3.5} ${toGraphX(soc)+2},${toGraphY(vTerminal)-3.5}`} fill="#ef4444" />
                  
                  <text x={toGraphX(soc) + 6} y={(toGraphY(voc) + toGraphY(vTerminal)) / 2 + 2} fill="#ef4444" fontSize="5.5" fontWeight="bold">
                    -{vSag.toFixed(2)}V
                  </text>
                </g>
              )}

              {/* Glowing Open-Circuit Voltage Dot */}
              <circle cx={toGraphX(soc)} cy={toGraphY(voc)} r="4" fill="#fbbf24" />
              <circle cx={toGraphX(soc)} cy={toGraphY(voc)} r="2" fill="#fff" />

              {/* Loaded terminal voltage dot */}
              {vSag > 0.05 && (
                <circle cx={toGraphX(soc)} cy={toGraphY(vTerminal)} r="3" fill="#22c55e" />
              )}
            </svg>
          </div>

        </div>

        {/* Right column: Interactive Sliders & Math Calculations */}
        <div className={`flex flex-col gap-4 ${isFullscreen ? 'w-[400px] justify-between shrink-0' : 'w-full'}`}>
          
          {/* Sliders Card */}
          <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-3 font-mono text-[9px]">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1">
              ⚙️ Battery Parameters
            </h5>

            {/* Slider 1: SoC */}
            <div>
              <div className="flex justify-between font-bold mb-0.5">
                <span className="text-yellow-400">State of Charge (SoC):</span>
                <span className="text-white font-bold">{soc}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={soc}
                onChange={(e) => setSoc(parseInt(e.target.value))}
                className="w-full accent-yellow-500 h-1 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 2: Current Drain */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex justify-between font-bold mb-0.5">
                <span className="text-blue-400">Current Load (I):</span>
                <span className="text-white font-bold">{current.toFixed(1)} A</span>
              </div>
              <input
                type="range"
                min="0"
                max="4.0"
                step="0.1"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider 3: Internal Resistance */}
            <div className="border-t border-white/5 pt-2">
              <div className="flex justify-between font-bold mb-0.5">
                <span className="text-red-400">Cell Resistance (R_int):</span>
                <span className="text-white font-bold">{rInternal} m&Omega;</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={rInternal}
                onChange={(e) => setRInternal(parseInt(e.target.value))}
                className="w-full accent-red-500 h-1 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

          </div>

          {/* Real-time Math Output Card */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-2.5 font-sans text-xs flex-1">
            <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono">
              Chemistry & Circuit Math Trace
            </p>

            <div className="space-y-2 font-serif italic text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 font-semibold font-sans not-italic text-[10px]">1. Open-Circuit Potential (Voc):</span>
                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 mt-0.5">
                  V<sub>oc</sub> = getVoc({soc}%) = <span className="text-yellow-400 font-bold font-mono text-[9px] not-italic">{voc.toFixed(2)} V</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold font-sans not-italic text-[10px]">2. Ohm's Law Voltage Sag (&Delta;V):</span>
                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 mt-0.5">
                  V<sub>sag</sub> = I &middot; R<sub>int</sub> = {current.toFixed(1)}A &middot; {rOhms.toFixed(3)}&Omega; = <span className="text-red-400 font-bold font-mono text-[9px] not-italic">{vSag.toFixed(2)} V</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold font-sans not-italic text-[10px]">3. Terminal Voltage (V_term):</span>
                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 mt-0.5">
                  V<sub>term</sub> = V<sub>oc</sub> - V<sub>sag</sub> = {voc.toFixed(2)}V - {vSag.toFixed(2)}V = <span className="text-green-400 font-bold font-mono text-[9px] not-italic">{vTerminal.toFixed(2)} V</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold font-sans not-italic text-[10px]">4. Power Lost as Heat (P_loss):</span>
                <div className="bg-black/30 p-1.5 rounded-lg border border-white/5 mt-0.5">
                  P<sub>loss</sub> = I² &middot; R<sub>int</sub> = {current.toFixed(1)}² &middot; {rOhms.toFixed(3)} = <span className="text-red-400 font-bold font-mono text-[9px] not-italic">{pLoss.toFixed(2)} W</span>
                </div>
              </div>
            </div>

            {/* Status Alert */}
            <div className={`p-2 rounded-lg border text-[9px] font-bold font-mono tracking-wide text-center mt-1.5 ${statusColor}`}>
              {statusText}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
