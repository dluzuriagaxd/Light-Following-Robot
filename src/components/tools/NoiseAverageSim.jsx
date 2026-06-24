import React, { useState, useEffect } from 'react';

export default function NoiseAverageSim() {
  const [distance, setDistance] = useState(50); // 10 to 100
  const [showFiltered, setShowFiltered] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(30); // noise amplitude
  
  const [historyRaw, setHistoryRaw] = useState(Array(40).fill(512));
  const [historyFiltered, setHistoryFiltered] = useState(Array(40).fill(512));

  // Base analog reading without noise
  const rLdr = Math.round(500 + Math.pow(distance / 10, 2.5) * 314);
  const rFixed = 10000;
  const vOut = 5 * (rFixed / (rLdr + rFixed));
  const baseValue = Math.round((vOut / 5) * 1023);

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Generate Raw Reading with noise
      const noise = (Math.random() - 0.5) * noiseLevel;
      const rawVal = Math.max(0, Math.min(1023, Math.round(baseValue + noise)));

      // 2. Generate Filtered Reading (simulate averaging 100 reads)
      // Since taking 100 fast readings reduces the noise mathematically by sqrt(100) = 10,
      // the filtered noise will be much smaller.
      const filteredNoise = (Math.random() - 0.5) * (noiseLevel / 8);
      const filteredVal = Math.max(0, Math.min(1023, Math.round(baseValue + filteredNoise)));

      setHistoryRaw(prev => [...prev.slice(1), rawVal]);
      setHistoryFiltered(prev => [...prev.slice(1), filteredVal]);
    }, 150);

    return () => clearInterval(interval);
  }, [baseValue, noiseLevel]);

  const currentRaw = historyRaw[historyRaw.length - 1] || baseValue;
  const currentFiltered = historyFiltered[historyFiltered.length - 1] || baseValue;

  return (
    <div className="my-8 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row gap-6 font-sans text-slate-200">
      {/* Settings Panel */}
      <div className="flex-1 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-brand-orange font-mono">
            ⚙️ Ajuste de Ruido y Filtro
          </h4>
          <p className="text-xs text-slate-400 font-medium">
            El "ruido" es provocado por fluctuaciones de luz en el salón o ruido eléctrico en los cables. Compara la señal temblorosa frente al promedio de 100 lecturas.
          </p>

          {/* Flashlight Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>Posición de la Luz:</span>
              <span className="text-slate-300 font-mono">Base: {baseValue}</span>
            </div>
            <input
              type="range"
              min="15"
              max="95"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              onDoubleClick={() => setDistance(50)}
              className="w-full accent-orange-500 h-1 rounded-full bg-black/40 cursor-pointer"
            />
          </div>

          {/* Noise Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span>Nivel de Ruido:</span>
              <span className="text-red-400 font-mono">±{noiseLevel}</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseInt(e.target.value))}
              onDoubleClick={() => setNoiseLevel(30)}
              className="w-full accent-red-500 h-1 rounded-full bg-black/40 cursor-pointer"
            />
          </div>

          {/* Toggle filter */}
          <label className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-750 rounded-xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFiltered}
              onChange={(e) => setShowFiltered(e.target.checked)}
              className="rounded border-slate-700 bg-black/40 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Activar Filtro Promedio</span>
              <span className="text-[10px] text-slate-400">Promedia 100 lecturas para estabilizar la señal.</span>
            </div>
          </label>
        </div>

        {/* Live indicators */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold font-mono">
          <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-xl">
            <span className="text-red-400 text-[9px] uppercase tracking-wider block mb-0.5">Señal con Ruido (Raw)</span>
            <span className="text-lg font-black text-red-500">{currentRaw}</span>
          </div>
          <div className={`p-2.5 rounded-xl border transition-opacity ${showFiltered ? 'bg-emerald-950/20 border-emerald-900/30' : 'opacity-20 bg-slate-900 border-slate-800'}`}>
            <span className="text-emerald-400 text-[9px] uppercase tracking-wider block mb-0.5">Señal Filtrada (Promedio)</span>
            <span className="text-lg font-black text-emerald-500">{showFiltered ? currentFiltered : '---'}</span>
          </div>
        </div>
      </div>

      {/* Plotter Visual */}
      <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono mb-4">
          📈 Gráfico de Estabilización en Tiempo Real
        </h4>

        {/* Plotter window */}
        <div className="h-48 bg-black/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

            {/* Raw signal line (Red) */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
              points={historyRaw.map((val, idx) => {
                const x = (idx / (historyRaw.length - 1)) * 100;
                const y = 100 - (val / 1023) * 90 - 5;
                return `${x},${y}`;
              }).join(' ')}
            />

            {/* Filtered signal line (Green) */}
            {showFiltered && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={historyFiltered.map((val, idx) => {
                  const x = (idx / (historyFiltered.length - 1)) * 100;
                  const y = 100 - (val / 1023) * 90 - 5;
                  return `${x},${y}`;
                }).join(' ')}
              />
            )}
          </svg>

          {/* Scale Labels */}
          <div className="absolute left-2 top-2 text-[8px] font-bold text-slate-600 bg-black/60 px-1 rounded">1023</div>
          <div className="absolute left-2 bottom-2 text-[8px] font-bold text-slate-600 bg-black/60 px-1 rounded">0</div>
          
          <div className="absolute right-2 top-2 flex flex-col gap-1 items-end">
            <span className="text-[8px] font-black text-red-500 bg-black/80 px-1.5 py-0.5 rounded border border-red-500/20">Raw (Noisy)</span>
            {showFiltered && <span className="text-[8px] font-black text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded border border-emerald-500/20">Promedio (100)</span>}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 italic">
          {showFiltered 
            ? '🟢 Con el promedio activado, la línea verde es lisa. ¡El robot no vibrará!' 
            : '⚠️ Sin promedio (solo línea roja), las fluctuaciones harán que el robot zigzaguee temblando.'}
        </p>
      </div>
    </div>
  );
}
