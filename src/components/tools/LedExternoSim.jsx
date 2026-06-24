import React, { useState, useEffect } from 'react';

export default function LedExternoSim() {
  const [isRunning, setIsRunning] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null); // 'on' | 'delay1' | 'off' | 'delay2' | null

  useEffect(() => {
    if (!isRunning) {
      setLedState(false);
      setActiveBlock(null);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) {
        setLedState(true);
        setActiveBlock('on');
      } else if (step === 1) {
        setActiveBlock('delay1');
      } else if (step === 2) {
        setLedState(false);
        setActiveBlock('off');
      } else if (step === 3) {
        setActiveBlock('delay2');
      }
      step = (step + 1) % 4;
    }, 500); // 500ms per step

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="my-8 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col md:flex-row gap-6 font-sans text-slate-200">
      {/* Block Code Workspace */}
      <div className="flex-1 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-brand-orange font-mono">
          🧩 Código en Bloques (SteamakersBlocks)
        </h4>
        <div className="space-y-2 text-xs font-bold leading-none">
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
            <span className="text-indigo-400 uppercase tracking-wider text-[10px]">🔁 Bucle Principal (Loop)</span>
            
            <div className="pl-4 space-y-2 border-l-2 border-indigo-500/20">
              {/* Block 1: LED ON */}
              <div className={`p-2.5 rounded-lg border transition-all ${activeBlock === 'on' ? 'bg-orange-500 text-black border-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                🟢 DEFINIR PIN Digital (5) en ALTO
              </div>

              {/* Block 2: Delay 1 */}
              <div className={`p-2.5 rounded-lg border transition-all ${activeBlock === 'delay1' ? 'bg-orange-500 text-black border-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                ⏳ ESPERAR 1 segundo
              </div>

              {/* Block 3: LED OFF */}
              <div className={`p-2.5 rounded-lg border transition-all ${activeBlock === 'off' ? 'bg-orange-500 text-black border-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                🔴 DEFINIR PIN Digital (5) en BAJO
              </div>

              {/* Block 4: Delay 2 */}
              <div className={`p-2.5 rounded-lg border transition-all ${activeBlock === 'delay2' ? 'bg-orange-500 text-black border-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-[1.02]' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                ⏳ ESPERAR 1 segundo
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full py-3 px-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isRunning ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-green-500 text-black hover:bg-green-400 hover:scale-[1.02] active:scale-[0.98]'}`}
        >
          {isRunning ? '⏹ Detener Simulación' : '▶ Iniciar Bloques'}
        </button>
      </div>

      {/* Virtual Breadboard Output */}
      <div className="flex-1 flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono self-start mb-4">
          🔌 Hardware: Arduino Uno + Protoboard
        </h4>
        
        {/* Connection Diagram Drawing area (SVG) */}
        <div className="relative w-full max-w-[280px] aspect-[4/3] bg-[#0c1224] rounded-2xl border border-slate-800 p-3 flex flex-col justify-between overflow-hidden shadow-inner">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Grid */}
            <defs>
              <pattern id="dotPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1.2" fill="rgba(255,255,255,0.06)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotPattern)" rx="10" />

            {/* Virtual Arduino board (Left) */}
            <rect x="20" y="50" width="130" height="200" rx="10" fill="#082f37" stroke="#0f766e" strokeWidth="2" />
            <text x="85" y="80" fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ARDUINO</text>
            
            {/* Pin 5 header point */}
            <circle cx="140" cy="140" r="4" fill="#000" stroke="#f97316" strokeWidth="1.5" />
            <text x="130" y="143" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="monospace">D5</text>

            {/* GND header point */}
            <circle cx="140" cy="180" r="4" fill="#000" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="130" y="183" fill="#cbd5e1" fontSize="8" fontWeight="bold" fontFamily="monospace">GND</text>

            {/* Virtual Protoboard (Right) */}
            <rect x="200" y="50" width="180" height="200" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Protoboard Tie Points */}
            {[...Array(14)].map((_, row) => (
              <g key={row}>
                {[...Array(5)].map((_, col) => (
                  <circle key={col} cx={225 + col * 12} cy={70 + row * 12} r="2.2" fill="#475569" />
                ))}
                {[...Array(5)].map((_, col) => (
                  <circle key={col} cx={310 + col * 12} cy={70 + row * 12} r="2.2" fill="#475569" />
                ))}
              </g>
            ))}

            {/* Resistor (between GND path row and LED cathode row) */}
            {/* Let's draw it on rows: GND row is row 10 (y = 190), LED cathode row is row 7 (y = 154) */}
            <path d="M 237 190 L 255 190 L 260 186 L 265 194 L 270 186 L 275 194 L 280 190 L 285 190" fill="none" stroke="#ea580c" strokeWidth="2" />
            <text x="260" y="206" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">220Ω</text>

            {/* External LED (placed on rows 7 and 5) */}
            <circle cx="285" cy="154" r="7" fill={ledState ? '#ef4444' : '#7f1d1d'} stroke={ledState ? '#f87171' : '#991b1b'} strokeWidth="1.5" />
            {/* LED lens glare */}
            {ledState && <circle cx="283" cy="151" r="2.5" fill="#fff" opacity="0.8" />}
            {ledState && <circle cx="285" cy="154" r="14" fill="#ef4444" opacity="0.25" />}
            
            {/* LED anode pin connection (row 5: y=130) and cathode pin connection (row 7: y=154) */}
            <line x1="285" y1="161" x2="285" y2="190" stroke="#64748b" strokeWidth="1.5" />
            <line x1="281" y1="161" x2="261" y2="130" stroke="#64748b" strokeWidth="1.5" />

            {/* Wires */}
            {/* Wire 1: Orange wire from Arduino Pin 5 to Protoboard Row 5 (Anode, x=261, y=130) */}
            <path d="M 140 140 Q 200 100 261 130" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            {/* Wire 2: Blue wire from Arduino GND to Resistor end (Row 10, x=237, y=190) */}
            <path d="M 140 180 Q 180 220 237 190" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 italic">
          {isRunning ? '🟢 Enviando 5V al Pin 5... ¡El circuito se cierra!' : '⚪ Haz clic en "Iniciar Bloques" para energizar el Pin 5.'}
        </p>
      </div>
    </div>
  );
}
