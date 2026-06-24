import React, { useState } from 'react';

export default function LdrVoltageDividerSim() {
  const [distance, setDistance] = useState(50); // distance in cm (10 to 100)

  // Calculate LDR resistance based on distance
  // Brightest (10cm) -> ~500 ohms
  // Darkest (100cm) -> ~100k ohms
  const rLdr = Math.round(500 + Math.pow(distance / 10, 2.5) * 314);
  const rFixed = 10000; // 10k ohm resistor
  
  // Vout = 5V * (Rfixed / (Rldr + Rfixed))
  const vOut = 5 * (rFixed / (rLdr + rFixed));
  const analogRead = Math.round((vOut / 5) * 1023);

  // Voltmeter needle rotation (from -60deg to 60deg)
  const needleRotation = -60 + (vOut / 5) * 120;

  return (
    <div className="my-8 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row gap-6 font-sans text-slate-200">
      {/* Simulation Controls & Voltmeter */}
      <div className="flex-1 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-brand-orange font-mono">
            🔦 Control de la Linterna
          </h4>
          <p className="text-xs text-slate-400">
            Mueve el deslizador para acercar o alejar la linterna del LDR y observa cómo cambia el voltaje de salida del divisor.
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Distancia de la Linterna:</span>
              <span className="text-brand-orange font-mono">{distance} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              onDoubleClick={() => setDistance(50)}
              className="w-full accent-orange-500 h-1.5 rounded-full bg-black/40 cursor-pointer"
              title="Doble clic para restablecer a 50 cm"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Muy Cerca (Brillante)</span>
              <span>Muy Lejos (Oscuro)</span>
            </div>
          </div>
        </div>

        {/* Multimeter Widget */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col items-center">
          <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono mb-3">Multímetro Digital</span>
          <div className="flex items-center gap-6">
            {/* Analog Gauge */}
            <div className="relative w-28 h-16 bg-slate-900 border border-slate-800 rounded-t-full overflow-hidden flex items-end justify-center">
              {/* Scale Arc */}
              <div className="absolute w-24 h-24 rounded-full border-4 border-slate-800 border-b-transparent top-2" />
              {/* Needle */}
              <div 
                className="absolute w-1 h-14 bg-red-500 bottom-0 origin-bottom transition-transform duration-200"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              />
              <span className="text-[8px] font-bold text-slate-600 absolute bottom-1">VOLTS</span>
            </div>

            {/* LCD Screen */}
            <div className="text-center bg-[#072007] border-2 border-emerald-950 px-4 py-2.5 rounded-xl">
              <div className="text-2xl font-black font-mono text-[#00ff00] drop-shadow-[0_0_4px_rgba(0,255,0,0.5)]">
                {vOut.toFixed(2)} <span className="text-xs">V</span>
              </div>
              <div className="text-[10px] font-bold font-mono text-[#00aa00] uppercase tracking-wider mt-0.5">
                Lectura A0: {analogRead}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schematic & Calculations */}
      <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">
          📐 Circuito Divisor de Voltaje
        </h4>

        {/* Schematic SVG */}
        <svg viewBox="0 0 320 200" className="w-full h-auto bg-black/30 rounded-xl p-2 border border-slate-800">
          {/* Rails */}
          <line x1="40" y1="30" x2="160" y2="30" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="40" cy="30" r="3" fill="#ef4444" />
          <text x="30" y="33" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="monospace">5V</text>

          <line x1="40" y1="170" x2="160" y2="170" stroke="#3b82f6" strokeWidth="1.5" />
          <circle cx="40" cy="170" r="3" fill="#3b82f6" />
          <text x="25" y="173" fill="#3b82f6" fontSize="9" fontWeight="bold" fontFamily="monospace">GND</text>

          {/* Connection dots */}
          <circle cx="100" cy="30" r="2.5" fill="#ef4444" />
          <circle cx="100" cy="170" r="2.5" fill="#3b82f6" />

          {/* LDR Symbol (Top Resistor) */}
          <line x1="100" y1="30" x2="100" y2="60" stroke="#fff" strokeWidth="1.5" />
          <rect x="92" y="60" width="16" height="30" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" rx="3" />
          {/* LDR squiggly line inside */}
          <path d="M 100 60 L 96 65 L 104 70 L 96 75 L 104 80 L 96 85 L 100 90" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Light arrows pointing to LDR */}
          <line x1="72" y1="58" x2="88" y2="70" stroke="#eab308" strokeWidth="1.5" />
          <polygon points="88,70 82,69 86,65" fill="#eab308" />
          <line x1="78" y1="50" x2="94" y2="62" stroke="#eab308" strokeWidth="1.5" />
          <polygon points="94,62 88,61 92,57" fill="#eab308" />

          <text x="120" y="78" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace">LDR</text>

          {/* Center tap node (A0) */}
          <line x1="100" y1="90" x2="100" y2="110" stroke="#fff" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="3" fill="#fff" />
          
          <line x1="100" y1="100" x2="200" y2="100" stroke="#a855f7" strokeWidth="1.5" />
          <circle cx="200" cy="100" r="2.5" fill="#a855f7" />
          <text x="210" y="103" fill="#a855f7" fontSize="9" fontWeight="bold" fontFamily="monospace">Pin A0 Arduino</text>

          {/* Fixed 10k Resistor (Bottom Resistor) */}
          <rect x="92" y="110" width="16" height="30" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" rx="1" />
          {/* Stripe bands */}
          <line x1="92" y1="117" x2="108" y2="117" stroke="#92400e" strokeWidth="2" /> {/* brown */}
          <line x1="92" y1="125" x2="108" y2="125" stroke="#000" strokeWidth="2" />    {/* black */}
          <line x1="92" y1="133" x2="108" y2="133" stroke="#ea580c" strokeWidth="2" /> {/* orange */}
          
          <line x1="100" y1="140" x2="100" y2="170" stroke="#fff" strokeWidth="1.5" />
          <text x="120" y="128" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">R_fija (10kΩ)</text>
        </svg>

        {/* Live equations */}
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[10px] text-slate-300">
          <div className="flex justify-between">
            <span>Resistencia LDR:</span>
            <span className="text-yellow-400 font-bold">{rLdr >= 1000 ? `${(rLdr/1000).toFixed(1)}k` : `${rLdr}`} Ω</span>
          </div>
          <div className="flex justify-between">
            <span>Resistencia Fija:</span>
            <span className="text-slate-400 font-bold">10,000 Ω (10k)</span>
          </div>
          <div className="border-t border-slate-800 my-1.5" />
          <div className="flex flex-col items-center py-1 bg-black/40 rounded-lg">
            <span className="text-slate-500 text-[8px] mb-1 uppercase tracking-wider font-bold">Fórmula del Divisor</span>
            <div className="text-[11px] text-slate-200">
              Vout = 5V &middot; [ 10k / ({rLdr >= 1000 ? `${(rLdr/1000).toFixed(1)}k` : `${rLdr}`} + 10k) ] = <span className="text-emerald-400 font-bold font-black">{vOut.toFixed(2)}V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
