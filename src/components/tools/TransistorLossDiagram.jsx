import React, { useState } from 'react';

export default function TransistorLossDiagram({ isFullscreen = false, onMaximize = null }) {
  const [activeDriver, setActiveDriver] = useState('BJT'); // 'BJT' | 'MOSFET'
  const [currentLoad, setCurrentLoad] = useState(1.0); // Amps

  // Electrical properties
  const batteryV = 7.4;
  
  // BJT (L298N) drop calculation: V_drop is non-linear but modeled as ~1.0V (high-side) + ~0.8V (low-side) + current-based increase
  const bjtDropHigh = 0.95 + (currentLoad - 1.0) * 0.4;
  const bjtDropLow = 0.85 + (currentLoad - 1.0) * 0.3;
  const bjtDropTotal = bjtDropHigh + bjtDropLow;
  const bjtOutputV = Math.max(0, batteryV - bjtDropTotal);
  const bjtPowerLost = bjtDropTotal * currentLoad; // Watts lost as heat

  // MOSFET (TB6612FNG) drop calculation: V_drop = I * R
  const rdsOn = 0.5; // Ohms
  const mosfetDropTotal = currentLoad * rdsOn;
  const mosfetOutputV = Math.max(0, batteryV - mosfetDropTotal);
  const mosfetPowerLost = mosfetDropTotal * currentLoad; // Watts lost as heat

  return (
    <div className={`bg-slate-900/60 border border-white/5 text-slate-300 ${isFullscreen ? 'p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between space-y-8 bg-transparent border-none' : 'p-4 rounded-2xl space-y-4'}`}>
      
      {/* Header (hidden in fullscreen overlay) */}
      {!isFullscreen && (
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            ⚡ H-Bridge Transistor Power Loss Diagram
          </h4>
          <div className="flex gap-2 items-center">
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="text-[9px] bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
              >
                <span>⛶</span> Maximize
              </button>
            )}
            <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 font-mono text-[9px]">
              <button
                onClick={() => setActiveDriver('BJT')}
                className={`px-2 py-0.5 rounded transition ${activeDriver === 'BJT' ? 'bg-green-600 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                L298N (BJT)
              </button>
              <button
                onClick={() => setActiveDriver('MOSFET')}
                className={`px-2 py-0.5 rounded transition ${activeDriver === 'MOSFET' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                TB6612 (MOS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header for Fullscreen View */}
      {isFullscreen && (
        <div className="flex justify-end items-center">
          <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 font-mono text-[10px]">
            <button
              onClick={() => setActiveDriver('BJT')}
              className={`px-3 py-1 rounded transition ${activeDriver === 'BJT' ? 'bg-green-600 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              L298N (BJT)
            </button>
            <button
              onClick={() => setActiveDriver('MOSFET')}
              className={`px-3 py-1 rounded transition ${activeDriver === 'MOSFET' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TB6612 (MOSFET)
            </button>
          </div>
        </div>
      )}

      <div className={`flex gap-6 ${isFullscreen ? 'flex-col lg:flex-row flex-1 items-stretch' : 'flex-col'}`}>
        
        {/* Interactive Diagram Area */}
        <div className={`flex-1 bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center relative ${isFullscreen ? 'min-h-[320px]' : 'min-h-[210px]'}`}>
          <svg 
            viewBox="0 0 400 210" 
            className={`w-full h-auto font-mono text-[9px] select-none ${isFullscreen ? 'max-w-[700px]' : 'max-w-[550px]'}`}
          >
            {/* Battery input */}
            <text x="25" y="40" fill="#e2e8f0" fontWeight="bold">BATTERY</text>
            <text x="25" y="55" fill="#22c55e" className="text-xs font-bold">{batteryV.toFixed(1)}V</text>
            <circle cx="50" cy="75" r="10" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
            <text x="50" y="78" fill="#22c55e" textAnchor="middle" fontWeight="bold">+</text>

            {/* Path from battery */}
            <line x1="60" y1="75" x2="110" y2="75" stroke="#f97316" strokeWidth="2.5" />

            {/* High-Side switch / transistor */}
            <g transform="translate(110, 45)">
              <rect x="0" y="0" width="70" height="60" rx="5" fill="#1e293b" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <text x="35" y="12" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontSize="7" fontWeight="bold">HIGH-SIDE</text>
              
              {activeDriver === 'BJT' ? (
                // BJT Symbol
                <g>
                  {/* Base line */}
                  <line x1="20" y1="35" x2="35" y2="35" stroke="#4ade80" strokeWidth="1.5" />
                  <line x1="35" y1="25" x2="35" y2="45" stroke="#4ade80" strokeWidth="2.5" />
                  {/* Collector */}
                  <line x1="35" y1="28" x2="50" y2="20" stroke="#f97316" strokeWidth="1.8" />
                  <line x1="50" y1="20" x2="50" y2="30" stroke="#f97316" strokeWidth="1.8" />
                  {/* Emitter */}
                  <line x1="35" y1="42" x2="50" y2="50" stroke="#f97316" strokeWidth="1.8" />
                  <polygon points="43,45 50,50 48,42" fill="#f97316" />
                  {/* Voltage Drop Bubble */}
                  <rect x="3" y="22" width="22" height="12" rx="3" fill="#ef4444" />
                  <text x="14" y="31" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">-{bjtDropHigh.toFixed(2)}V</text>
                </g>
              ) : (
                // MOSFET Symbol
                <g>
                  {/* Gate line */}
                  <line x1="20" y1="35" x2="33" y2="35" stroke="#60a5fa" strokeWidth="1.5" />
                  <line x1="33" y1="25" x2="33" y2="45" stroke="#60a5fa" strokeWidth="2" />
                  {/* Channel bars */}
                  <line x1="38" y1="25" x2="38" y2="45" stroke="#f97316" strokeWidth="2.5" strokeDasharray="3,2" />
                  {/* Drain */}
                  <line x1="38" y1="28" x2="50" y2="28" stroke="#f97316" strokeWidth="1.8" />
                  {/* Source */}
                  <line x1="38" y1="42" x2="50" y2="42" stroke="#f97316" strokeWidth="1.8" />
                  {/* Resistance bubble */}
                  <rect x="3" y="22" width="26" height="12" rx="3" fill="#3b82f6" />
                  <text x="16" y="31" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="bold">0.25&Omega;</text>
                </g>
              )}
            </g>

            {/* Path to motor */}
            <line x1="180" y1="75" x2="220" y2="75" stroke="#f97316" strokeWidth="2.5" />

            {/* Motor representation */}
            <g transform="translate(220, 55)">
              <circle cx="20" cy="20" r="17" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
              <text x="20" y="24" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">M</text>
              <text x="20" y="47" fill="#a1a1aa" fontSize="7" textAnchor="middle" fontWeight="bold">DC MOTOR</text>
              <text x="20" y="56" fill="#f59e0b" fontSize="8" textAnchor="middle" fontWeight="bold">
                {activeDriver === 'BJT' ? bjtOutputV.toFixed(2) : mosfetOutputV.toFixed(2)}V
              </text>
            </g>

            {/* Path to Low-Side driver */}
            <line x1="240" y1="105" x2="240" y2="135" stroke="#f97316" strokeWidth="2.5" />
            <line x1="240" y1="135" x2="180" y2="135" stroke="#f97316" strokeWidth="2.5" />

            {/* Low-Side switch / transistor */}
            <g transform="translate(110, 105)">
              <rect x="0" y="0" width="70" height="60" rx="5" fill="#1e293b" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              <text x="35" y="12" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontSize="7" fontWeight="bold">LOW-SIDE</text>
              
              {activeDriver === 'BJT' ? (
                // BJT Symbol
                <g>
                  {/* Base line */}
                  <line x1="20" y1="35" x2="35" y2="35" stroke="#4ade80" strokeWidth="1.5" />
                  <line x1="35" y1="25" x2="35" y2="45" stroke="#4ade80" strokeWidth="2.5" />
                  {/* Collector */}
                  <line x1="35" y1="28" x2="50" y2="20" stroke="#f97316" strokeWidth="1.8" />
                  {/* Emitter */}
                  <line x1="35" y1="42" x2="50" y2="50" stroke="#f97316" strokeWidth="1.8" />
                  <polygon points="43,45 50,50 48,42" fill="#f97316" />
                  {/* Voltage Drop Bubble */}
                  <rect x="3" y="22" width="22" height="12" rx="3" fill="#ef4444" />
                  <text x="14" y="31" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">-{bjtDropLow.toFixed(2)}V</text>
                </g>
              ) : (
                // MOSFET Symbol
                <g>
                  {/* Gate line */}
                  <line x1="20" y1="35" x2="33" y2="35" stroke="#60a5fa" strokeWidth="1.5" />
                  <line x1="33" y1="25" x2="33" y2="45" stroke="#60a5fa" strokeWidth="2" />
                  {/* Channel bars */}
                  <line x1="38" y1="25" x2="38" y2="45" stroke="#f97316" strokeWidth="2.5" strokeDasharray="3,2" />
                  {/* Drain */}
                  <line x1="38" y1="28" x2="50" y2="28" stroke="#f97316" strokeWidth="1.8" />
                  {/* Source */}
                  <line x1="38" y1="42" x2="50" y2="42" stroke="#f97316" strokeWidth="1.8" />
                  {/* Resistance bubble */}
                  <rect x="3" y="22" width="26" height="12" rx="3" fill="#3b82f6" />
                  <text x="16" y="31" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="bold">0.25&Omega;</text>
                </g>
              )}
            </g>

            {/* Path to ground */}
            <line x1="110" y1="135" x2="60" y2="135" stroke="#f97316" strokeWidth="2.5" />
            <line x1="60" y1="135" x2="60" y2="155" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Ground symbol */}
            <line x1="50" y1="155" x2="70" y2="155" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="53" y1="159" x2="67" y2="159" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="57" y1="163" x2="63" y2="163" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="60" y="173" fill="rgba(255,255,255,0.25)" textAnchor="middle" fontSize="8">GND</text>
          </svg>
        </div>

        {/* Info panel */}
        <div className={`flex flex-col justify-center gap-3 shrink-0 ${isFullscreen ? 'w-[360px]' : 'w-full'}`}>
          
          {/* Load Slider */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl font-mono text-[9px]">
            <div className="flex justify-between mb-0.5 font-bold">
              <span className="text-orange-400">Motor Current Load (I):</span>
              <span className="text-white font-bold">{currentLoad.toFixed(1)}A</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={currentLoad}
              onChange={(e) => setCurrentLoad(parseFloat(e.target.value))}
              className="w-full accent-green-600 h-1 bg-black/40 rounded-lg cursor-pointer"
            />
          </div>

          {/* Numerical math data */}
          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl font-serif italic text-[11px] space-y-2 leading-relaxed">
            <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase not-italic font-mono">
              Power Loss Comparison
            </p>
            {activeDriver === 'BJT' ? (
              <div className="space-y-1.5 text-slate-400">
                <div>
                  <span className="text-white font-bold not-italic font-sans text-[10px]">1. Junction Voltage Drops:</span><br />
                  &nbsp;&nbsp;V_high = <span className="not-italic font-mono text-[9px]">{bjtDropHigh.toFixed(2)}V</span> (Saturation)<br />
                  &nbsp;&nbsp;V_low = <span className="not-italic font-mono text-[9px]">{bjtDropLow.toFixed(2)}V</span> (Saturation)<br />
                  &nbsp;&nbsp;<span className="text-red-400 font-bold">V_drop_total = <span className="not-italic font-mono text-[9px]">{bjtDropTotal.toFixed(2)}V</span></span>
                </div>
                <div>
                  <span className="text-white font-bold not-italic font-sans text-[10px]">2. Effective Motor Voltage:</span><br />
                  &nbsp;&nbsp;V_motor = V_bat - V_drop_total<br />
                  &nbsp;&nbsp;= {batteryV} - {bjtDropTotal.toFixed(2)} = <span className="text-green-400 font-bold not-italic font-mono text-[9px]">{bjtOutputV.toFixed(2)}V</span>
                </div>
                <div className="border-t border-white/5 pt-1.5 mt-1 text-slate-300">
                  <span className="text-red-400 font-bold not-italic font-sans text-[10px]">3. Heat Dissipated (Watts):</span><br />
                  &nbsp;&nbsp;P_loss = V_drop_total &middot; I<br />
                  &nbsp;&nbsp;= {bjtDropTotal.toFixed(2)}V &middot; {currentLoad.toFixed(1)}A = <span className="text-red-400 font-bold not-italic font-mono text-[9px]">{bjtPowerLost.toFixed(2)}W</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-slate-400">
                <div>
                  <span className="text-white font-bold not-italic font-sans text-[10px]">1. Ohmic Channel Resistance:</span><br />
                  &nbsp;&nbsp;R_high = <span className="not-italic font-mono text-[9px]">0.25&Omega;</span> (R_ds on)<br />
                  &nbsp;&nbsp;R_low = <span className="not-italic font-mono text-[9px]">0.25&Omega;</span> (R_ds on)<br />
                  &nbsp;&nbsp;<span className="text-blue-400 font-bold">R_ds_total = <span className="not-italic font-mono text-[9px]">0.50&Omega;</span></span>
                </div>
                <div>
                  <span className="text-white font-bold not-italic font-sans text-[10px]">2. Effective Motor Voltage:</span><br />
                  &nbsp;&nbsp;V_drop_total = I &middot; R_ds_total<br />
                  &nbsp;&nbsp;= {currentLoad.toFixed(1)}A &middot; 0.5&Omega; = <span className="text-blue-300 not-italic font-mono text-[9px]">{mosfetDropTotal.toFixed(2)}V</span><br />
                  &nbsp;&nbsp;V_motor = {batteryV} - {mosfetDropTotal.toFixed(2)} = <span className="text-green-400 font-bold not-italic font-mono text-[9px]">{mosfetOutputV.toFixed(2)}V</span>
                </div>
                <div className="border-t border-white/5 pt-1.5 mt-1 text-slate-300">
                  <span className="text-blue-400 font-bold not-italic font-sans text-[10px]">3. Heat Dissipated (Watts):</span><br />
                  &nbsp;&nbsp;P_loss = V_drop_total &middot; I<br />
                  &nbsp;&nbsp;= {mosfetDropTotal.toFixed(2)}V &middot; {currentLoad.toFixed(1)}A = <span className="text-blue-400 font-bold not-italic font-mono text-[9px]">{mosfetPowerLost.toFixed(2)}W</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
