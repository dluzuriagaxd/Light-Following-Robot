import React, { useState } from 'react';

export default function CrepuscularSwitchSim() {
  const [distance, setDistance] = useState(60); // 10 to 100
  const [threshold, setThreshold] = useState(500); // editable threshold

  // Math to get analog reading
  const rLdr = Math.round(500 + Math.pow(distance / 10, 2.5) * 314);
  const rFixed = 10000;
  const vOut = 5 * (rFixed / (rLdr + rFixed));
  const analogRead = Math.round((vOut / 5) * 1023);

  // Condition evaluation
  const isDark = analogRead < threshold;

  // Handle threshold change
  const handleThresholdChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setThreshold(Math.max(0, Math.min(1023, val)));
    }
  };

  return (
    <div className="my-8 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col lg:flex-row gap-6 font-sans text-slate-200">
      {/* Block Editor Area */}
      <div className="flex-1 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-brand-orange font-mono">
          🧩 Lógica Condicional (SteamakersBlocks)
        </h4>
        <p className="text-xs text-slate-400">
          Haz clic en el cuadro de número verde abajo para <strong>modificar el Umbral</strong> de activación.
        </p>

        {/* Visual Blocks */}
        <div className="space-y-2 text-xs font-bold leading-none font-sans">
          {/* Loop outer */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-2">
            <span className="text-indigo-400 uppercase tracking-wider text-[9px] font-mono">🔁 Repetir por siempre</span>
            
            {/* IF-ELSE Block */}
            <div className="pl-3 border-l-2 border-indigo-500/10 space-y-2">
              <div className="p-3 bg-yellow-950/40 border border-yellow-500/30 rounded-xl space-y-2.5">
                {/* Condition header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-yellow-400 uppercase tracking-widest text-[9px] font-mono">🤔 SI</span>
                  <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-lg border border-slate-700 font-mono text-[10px]">
                    <span className="text-sky-300">Lectura_Analógica(A0)</span>
                    <span className="text-yellow-500 font-bold">&lt;</span>
                    {/* Editable threshold inside the block */}
                    <input
                      type="number"
                      min="0"
                      max="1023"
                      value={threshold}
                      onChange={handleThresholdChange}
                      className="w-14 bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded text-center font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <span className="text-yellow-400 uppercase tracking-widest text-[9px] font-mono">ENTONCES:</span>
                </div>

                {/* THEN block */}
                <div className={`p-2 pl-3 rounded-lg border transition-all ${isDark ? 'bg-orange-500 text-black border-white shadow-[0_0_12px_rgba(249,115,22,0.3)] scale-[1.01]' : 'bg-slate-800/80 border-slate-700 opacity-40'}`}>
                  🟢 DEFINIR PIN Digital (5) en ALTO
                </div>

                {/* ELSE header */}
                <div className="text-yellow-400 uppercase tracking-widest text-[9px] font-mono">SINO:</div>

                {/* ELSE block */}
                <div className={`p-2 pl-3 rounded-lg border transition-all ${!isDark ? 'bg-orange-500 text-black border-white shadow-[0_0_12px_rgba(249,115,22,0.3)] scale-[1.01]' : 'bg-slate-800/80 border-slate-700 opacity-40'}`}>
                  🔴 DEFINIR PIN Digital (5) en BAJO
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live status banner */}
        <div className={`p-3 rounded-xl border text-center font-bold text-xs ${isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-amber-950/40 border-amber-500/30 text-amber-400'}`}>
          Evaluación: {analogRead} &lt; {threshold} ➔ <span className="font-mono font-black">{isDark ? 'VERDADERO (Prende LED)' : 'FALSO (Apaga LED)'}</span>
        </div>
      </div>

      {/* Controller & Linterna Area */}
      <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">
            🔦 Control de Luz y Hardware
          </h4>
          
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
              onDoubleClick={() => setDistance(60)}
              className="w-full accent-orange-500 h-1.5 rounded-full bg-black/40 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Mucha Luz (Lectura A0: {analogRead})</span>
              <span>Oscuridad (Lectura A0: {analogRead})</span>
            </div>
          </div>
        </div>

        {/* Visual circuit output */}
        <div className="bg-black/30 border border-slate-850 p-4 rounded-2xl flex flex-col items-center">
          <div className="flex items-center gap-10">
            {/* LDR representation */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[8px] font-bold text-slate-500 font-mono">SENSOR LDR</span>
              <div className="relative p-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-xl">☀️</span>
                {/* Simulated light overlay depending on distance */}
                <div 
                  className="absolute inset-0 bg-yellow-400 rounded-xl pointer-events-none mix-blend-overlay transition-opacity" 
                  style={{ opacity: (100 - distance) / 100 }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">{analogRead} / 1023</span>
            </div>

            {/* Arduino brain indicator */}
            <div className="flex flex-col items-center gap-1 text-[8px] font-bold text-slate-500 font-mono">
              <span className="text-lg">➔</span>
              <span>COMPARA</span>
              <span className="text-lg">➔</span>
            </div>

            {/* LED representation */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[8px] font-bold text-slate-500 font-mono">PIN DIGITAL 5</span>
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isDark ? 'bg-amber-400 border-white shadow-[0_0_20px_#f59e0b]' : 'bg-slate-800 border-slate-700'}`}>
                <span className="text-lg">{isDark ? '💡' : '🌑'}</span>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>{isDark ? 'ON (HIGH)' : 'OFF (LOW)'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
