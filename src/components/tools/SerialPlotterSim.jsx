import React, { useState, useEffect, useRef } from 'react';

export default function SerialPlotterSim() {
  const [distance, setDistance] = useState(50); // 10 to 100
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [plotPoints, setPlotPoints] = useState(Array(30).fill(512)); // history of 30 points
  const [isPaused, setIsPaused] = useState(false);
  
  const consoleEndRef = useRef(null);

  // Calculate analog reading
  const rLdr = Math.round(500 + Math.pow(distance / 10, 2.5) * 314);
  const rFixed = 10000;
  const vOut = 5 * (rFixed / (rLdr + rFixed));
  const analogRead = Math.round((vOut / 5) * 1023);

  // Append data periodically
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Append to logs
      setConsoleLogs(prev => {
        const timestamp = new Date().toLocaleTimeString().split(' ')[0];
        const newLog = `[Serial] A0: ${analogRead}`;
        return [...prev.slice(-40), newLog]; // Keep last 40 lines
      });

      // Append to plot points
      setPlotPoints(prev => {
        return [...prev.slice(1), analogRead];
      });
    }, 250); // 4 prints per second

    return () => clearInterval(interval);
  }, [analogRead, isPaused]);

  // Scroll to bottom of console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  return (
    <div className="my-8 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col xl:flex-row gap-6 font-sans text-slate-200">
      {/* Left side: Flashlight slider and block code */}
      <div className="flex-1 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-brand-orange font-mono">
            🔌 Control y Bloques
          </h4>
          
          {/* Blocks visual */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2 text-xs font-bold leading-none">
            <span className="text-indigo-400 uppercase tracking-wider text-[9px] font-mono">🔁 Repetir por siempre</span>
            <div className="pl-3 border-l-2 border-indigo-500/20 space-y-2">
              <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300">
                💬 Escribir en Puerto Serial: <span className="text-sky-300">Lectura_Analógica(A0)</span>
              </div>
              <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300">
                📈 Graficar en Puerto Serial: <span className="text-sky-300">Lectura_Analógica(A0)</span>
              </div>
              <div className="p-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-400 opacity-60">
                ⏳ ESPERAR 250 milisegundos
              </div>
            </div>
          </div>

          {/* Flashlight Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span>Distancia de la Linterna:</span>
              <span className="text-brand-orange font-mono">{distance} cm (LDR: {analogRead})</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              onDoubleClick={() => setDistance(50)}
              className="w-full accent-orange-500 h-1.5 rounded-full bg-black/40 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isPaused ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-slate-800 border border-slate-700 text-white hover:bg-white/5'}`}
        >
          {isPaused ? '▶ Reanudar Envío' : '⏸ Pausar Envío'}
        </button>
      </div>

      {/* Right side: Serial Monitor & Plotter */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 border-t xl:border-t-0 xl:border-l border-slate-800 pt-6 xl:pt-0 xl:pl-6">
        
        {/* Monitor Serial (Terminal) */}
        <div className="flex flex-col h-60 bg-black/90 border border-slate-800 rounded-2xl overflow-hidden font-mono">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>💻 MONITOR SERIAL (9600 BAUD)</span>
            <button 
              onClick={() => setConsoleLogs([])}
              className="text-[9px] hover:text-white bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded transition"
            >
              Limpiar
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto text-[10px] font-bold space-y-0.5 text-emerald-400 leading-normal custom-scrollbar">
            {consoleLogs.length === 0 && <span className="text-slate-600 italic">Esperando datos...</span>}
            {consoleLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Plotter Serial (Graph) */}
        <div className="flex flex-col h-60 bg-black/90 border border-slate-800 rounded-2xl overflow-hidden font-mono">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold text-slate-400">
            <span>📈 GRAFICADOR SERIAL</span>
          </div>
          
          <div className="flex-1 p-3 flex items-center justify-center relative">
            {/* Simple Canvas representation for line drawing */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
              
              {/* Graph line path */}
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={plotPoints.map((val, idx) => {
                  // val: 0 to 1023. Map to y: 100 to 0 (top-left is 0,0)
                  const x = (idx / (plotPoints.length - 1)) * 100;
                  const y = 100 - (val / 1023) * 90 - 5; // offset slightly from borders
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            
            {/* Graph Labels */}
            <div className="absolute left-2 top-2 text-[8px] font-bold text-slate-600 bg-black/80 px-1 rounded">1023</div>
            <div className="absolute left-2 bottom-2 text-[8px] font-bold text-slate-600 bg-black/80 px-1 rounded">0</div>
            <div className="absolute right-2 top-2 text-[8px] font-black text-brand-orange bg-black/80 px-1 rounded font-mono">A0: {analogRead}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
