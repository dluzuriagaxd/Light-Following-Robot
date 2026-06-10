import React, { useState, useEffect, useRef } from 'react';

export default function KinematicsMiniSim({ isFullscreen = false, onMaximize = null }) {
  const [x, setX] = useState(0); // robot x position (grid units)
  const [y, setY] = useState(0); // robot y position (grid units)
  const [angle, setAngle] = useState(0); // heading angle in radians
  const [vl, setVl] = useState(50); // Left wheel velocity
  const [vr, setVr] = useState(30); // Right wheel velocity (different speeds for arc)
  const [dt, setDt] = useState(0.5); // time step (seconds)
  const [showGrid, setShowGrid] = useState(true);
  const [showCoords, setShowCoords] = useState(true);
  const [showVector, setShowVector] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ref to store current physics values to avoid stale closures in the loop
  const stateRef = useRef({ x: 0, y: 0, angle: 0, accum: 0, path: [{ x: 0, y: 0 }] });
  const [renderPath, setRenderPath] = useState([{ x: 0, y: 0 }]);

  const animRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Constants based on layout state
  const WHEEL_BASE = 40; // Wheel base 'd' in units
  const svgSize = isFullscreen ? 400 : 300;
  const cx = svgSize / 2; // SVG Center X
  const cy = svgSize / 2; // SVG Center Y
  const SCALE = isFullscreen ? 1.5 : 1.0; // scale factor to fit coordinate grid

  // Linear and Angular calculations
  const linearV = (vl + vr) / 2;
  const angularW = (vl - vr) / WHEEL_BASE;

  // Analytical kinematic integration to get exact trajectory points
  const getNextState = (xVal, yVal, angleVal, vlVal, vrVal, dtStep) => {
    const v = (vlVal + vrVal) / 2;
    const w = (vlVal - vrVal) / WHEEL_BASE;

    if (Math.abs(w) < 0.001) {
      // Straight line movement
      return {
        x: xVal + v * Math.cos(angleVal) * dtStep,
        y: yVal + v * Math.sin(angleVal) * dtStep,
        angle: angleVal
      };
    } else {
      // Exact circular arc movement (removes Euler discretization drift)
      const nextAngle = angleVal + w * dtStep;
      const nx = xVal + (v / w) * (Math.sin(nextAngle) - Math.sin(angleVal));
      const ny = yVal - (v / w) * (Math.cos(nextAngle) - Math.cos(angleVal));
      return { x: nx, y: ny, angle: nextAngle };
    }
  };

  // Perform a single step of dt
  const step = () => {
    const s = stateRef.current;
    const next = getNextState(s.x, s.y, s.angle, vl, vr, dt);
    
    s.x = next.x;
    s.y = next.y;
    s.angle = next.angle;
    s.path = [...s.path, { x: s.x, y: s.y }];
    if (s.path.length > 150) s.path.shift();

    setX(s.x);
    setY(s.y);
    setAngle(s.angle);
    setRenderPath([...s.path]);
  };

  // Reset path when dt changes so it doesn't leave disconnected artifacts
  useEffect(() => {
    if (!isPlaying) {
      stateRef.current.path = [{ x: stateRef.current.x, y: stateRef.current.y }];
      setRenderPath([{ x: stateRef.current.x, y: stateRef.current.y }]);
    }
  }, [dt, isPlaying]);

  // Preset commands
  const applyPreset = (cmd) => {
    switch (cmd) {
      case 'F': setVl(55); setVr(55); break;
      case 'B': setVl(-55); setVr(-55); break;
      case 'L': setVl(15); setVr(55); break;
      case 'R': setVl(55); setVr(15); break;
      case 'I': setVl(-35); setVr(35); break;
      case 'J': setVl(35); setVr(-35); break;
      case 'S': setVl(0); setVr(0); break;
      default: break;
    }
  };

  const reset = () => {
    stateRef.current = { x: 0, y: 0, angle: 0, accum: 0, path: [{ x: 0, y: 0 }] };
    setX(0);
    setY(0);
    setAngle(0);
    setRenderPath([{ x: 0, y: 0 }]);
    setIsPlaying(false);
    lastTimeRef.current = null;
  };

  // Smooth 60 FPS animation loop
  useEffect(() => {
    if (isPlaying) {
      const loop = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const frameDt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
        lastTimeRef.current = timestamp;

        const s = stateRef.current;
        
        // 1. Advance the continuous simulation position smoothly at 60 FPS
        const next = getNextState(s.x, s.y, s.angle, vl, vr, frameDt);
        s.x = next.x;
        s.y = next.y;
        s.angle = next.angle;

        // 2. Accumulate time to drop a path sample mark exactly at selected dt intervals
        s.accum += frameDt;
        if (s.accum >= dt) {
          s.path = [...s.path, { x: s.x, y: s.y }];
          if (s.path.length > 150) s.path.shift();
          s.accum = 0; // reset accumulator
        }

        setX(s.x);
        setY(s.y);
        setAngle(s.angle);
        setRenderPath([...s.path]);

        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, vl, vr, dt]);

  // Keep stateRef synced when resetting or updating values manually
  useEffect(() => {
    if (!isPlaying) {
      stateRef.current.x = x;
      stateRef.current.y = y;
      stateRef.current.angle = angle;
    }
  }, [x, y, angle, isPlaying]);

  return (
    <div className={`bg-slate-900/60 border border-white/5 text-slate-300 ${isFullscreen ? 'p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between space-y-8 bg-transparent border-none' : 'p-5 rounded-2xl space-y-6'}`}>
      
      {/* Header */}
      {!isFullscreen && (
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            🧮 Discrete-State Step Simulator
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
              vector svg
            </span>
          </div>
        </div>
      )}

      <div className={`flex gap-6 ${isFullscreen ? 'flex-col lg:flex-row flex-1 items-stretch' : 'flex-col'}`}>
        
        {/* Left Side: Coordinate Plane (Vector SVG) */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${isFullscreen ? 'justify-between' : ''}`}>
          <div 
            className={`bg-black/40 rounded-xl p-2 border border-white/5 relative flex items-center justify-center w-full aspect-square ${isFullscreen ? 'max-w-[600px] max-h-[600px]' : 'max-w-[500px] max-h-[500px]'}`}
          >
            <svg 
              viewBox={`0 0 ${svgSize} ${svgSize}`} 
              className="rounded-lg shadow-inner bg-slate-950 w-full h-full"
            >
              {/* SVG Grid */}
              {showGrid && (
                <g>
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />
                </g>
              )}

              {/* Coordinate Axes */}
              <line x1="0" y1={cy} x2={svgSize} y2={cy} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <line x1={cx} y1="0" x2={cx} y2={svgSize} stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
              <text x={svgSize - 10} y={cy - 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">X</text>
              <text x={cx + 4} y="12" fill="rgba(255,255,255,0.3)" fontSize="8">Y</text>
              <text x={cx + 4} y={cy + 12} fill="rgba(255,255,255,0.2)" fontSize="8">0,0</text>

              {/* Path Polyline */}
              {renderPath.length > 1 && (
                <path
                  d={`M ${renderPath.map(p => `${cx + p.x * SCALE} ${cy + p.y * SCALE}`).join(' L ')}`}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Path Sample Marks (Shows discrete delta time steps) */}
              {renderPath.map((p, idx) => (
                <circle
                  key={idx}
                  cx={cx + p.x * SCALE}
                  cy={cy + p.y * SCALE}
                  r="2.5"
                  fill={idx === renderPath.length - 1 ? '#60a5fa' : '#f97316'}
                />
              ))}

              {/* Robot Icon */}
              <g transform={`translate(${cx + x * SCALE}, ${cy + y * SCALE}) rotate(${(angle * 180) / Math.PI})`}>
                {/* Body */}
                <circle cx="0" cy="0" r="14" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                {/* Wheels */}
                <rect x="-8" y="-17" width="16" height="4" rx="1" fill="#ea580c" />
                <rect x="-8" y="13" width="16" height="4" rx="1" fill="#ea580c" />
                {/* Heading Arrow */}
                {showVector && (
                  <g>
                    <line x1="0" y1="0" x2="22" y2="0" stroke="#60a5fa" strokeWidth="2" />
                    <polygon points="22,-3 28,0 22,3" fill="#60a5fa" />
                  </g>
                )}
              </g>

              {/* Live coordinates tooltip */}
              {showCoords && (
                <text x={cx + x * SCALE + 18} y={cy + y * SCALE - 6} fill="#cbd5e1" fontSize="9" fontWeight="bold">
                  ({x.toFixed(1)}, {y.toFixed(1)})
                </text>
              )}
            </svg>
          </div>

          {/* Preset Buttons */}
          <div className="w-full max-w-[300px] space-y-1">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Commands (HC-05 codes)</div>
            <div className="grid grid-cols-4 gap-1.5 font-mono">
              {[
                { label: 'F (Fwd)', cmd: 'F' },
                { label: 'B (Bwd)', cmd: 'B' },
                { label: 'L (Left)', cmd: 'L' },
                { label: 'R (Right)', cmd: 'R' },
                { label: 'Q (Spin L)', cmd: 'I' },
                { label: 'E (Spin R)', cmd: 'J' },
                { label: 'S (Stop)', cmd: 'S' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.cmd)}
                  className="px-1.5 py-1 text-[8px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/5 transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={reset}
                className="px-1.5 py-1 text-[8px] font-black uppercase tracking-wider bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded border border-red-500/20 transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Step Calculations & Mathematics */}
        <div className={`w-full flex flex-col gap-4 font-sans ${isFullscreen ? 'w-[400px] justify-between shrink-0' : 'w-full'}`}>
          
          {/* Velocity Sliders */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/5 border border-white/5 rounded-xl font-mono text-[9px]">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-orange-400 font-bold">Left V (v<sub>L</sub>):</span>
                <span className="text-white font-bold">{vl}</span>
              </div>
              <input type="range" min="-100" max="100" value={vl} onChange={(e) => setVl(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-black/40 rounded-lg cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-orange-400 font-bold">Right V (v<sub>R</sub>):</span>
                <span className="text-white font-bold">{vr}</span>
              </div>
              <input type="range" min="-100" max="100" value={vr} onChange={(e) => setVr(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-black/40 rounded-lg cursor-pointer" />
            </div>
            <div className="col-span-2">
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-yellow-400 font-bold">Time Step (&Delta;t):</span>
                <span className="text-white font-bold">{dt.toFixed(2)}s</span>
              </div>
              <input type="range" min="0.05" max="1.5" step="0.05" value={dt} onChange={(e) => setDt(parseFloat(e.target.value))}
                className="w-full accent-yellow-400 h-1 bg-black/40 rounded-lg cursor-pointer" />
            </div>
          </div>

          {/* Mathematical Trace (Beautifully structured equations) */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4 font-sans text-xs">
            <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono">Mathematical Integration Trace</p>
            
            <div className="space-y-3">
              {/* Linear Velocity Equation */}
              <div>
                <span className="text-slate-400 font-semibold">1. Linear Speed:</span>
                <div className="flex items-center gap-2 font-serif italic text-xs my-2 justify-start bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-orange-400 font-bold not-italic">v</span> = 
                  <div className="flex flex-col items-center mx-1">
                    <span className="border-b border-white/20 pb-0.5 px-1 font-semibold">v<sub>L</sub> + v<sub>R</sub></span>
                    <span className="pt-0.5 font-semibold">2</span>
                  </div>
                  <span className="not-italic">=</span>
                  <div className="flex flex-col items-center mx-1">
                    <span className="border-b border-white/20 pb-0.5 px-1">{vl} + {vr}</span>
                    <span className="pt-0.5">2</span>
                  </div>
                  <span className="not-italic">=</span>
                  <span className="text-green-400 font-bold not-italic">{linearV.toFixed(1)} u/s</span>
                </div>
              </div>

              {/* Angular Velocity Equation */}
              <div>
                <span className="text-slate-400 font-semibold">2. Angular Velocity:</span>
                <div className="flex items-center gap-2 font-serif italic text-xs my-2 justify-start bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  <span className="text-orange-400 font-bold not-italic">&omega;</span> = 
                  <div className="flex flex-col items-center mx-1">
                    <span className="border-b border-white/20 pb-0.5 px-1 font-semibold">v<sub>L</sub> - v<sub>R</sub></span>
                    <span className="pt-0.5 font-semibold">d</span>
                  </div>
                  <span className="not-italic">=</span>
                  <div className="flex flex-col items-center mx-1">
                    <span className="border-b border-white/20 pb-0.5 px-1">{vl} - {vr}</span>
                    <span className="pt-0.5">{WHEEL_BASE}</span>
                  </div>
                  <span className="not-italic">=</span>
                  <span className="text-green-400 font-bold not-italic">{angularW.toFixed(3)} rad/s</span>
                </div>
              </div>

              {/* Exact Circular Arc Integration (Traced) */}
              <div className="space-y-1 bg-black/30 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">3. Exact Analytical State Updates</span>
                
                {Math.abs(angularW) < 0.001 ? (
                  <div className="font-serif italic text-[11px] text-slate-300 space-y-1.5 mt-2">
                    <div className="text-yellow-400 not-italic font-mono text-[9px]">Moving in a straight line (&omega; &approx; 0):</div>
                    <div>x<sub>t + &Delta;t</sub> = x<sub>t</sub> + <span className="not-italic">v</span> &middot; cos(&theta;<sub>t</sub>) &middot; &Delta;t</div>
                    <div>&nbsp;&nbsp;= {x.toFixed(1)} + {linearV.toFixed(1)} &middot; {Math.cos(angle).toFixed(2)} &middot; {dt} = <span className="text-green-400 font-bold not-italic">{(x + linearV * Math.cos(angle) * dt).toFixed(1)}</span></div>
                    <div>y<sub>t + &Delta;t</sub> = y<sub>t</sub> + <span className="not-italic">v</span> &middot; sin(&theta;<sub>t</sub>) &middot; &Delta;t</div>
                    <div>&nbsp;&nbsp;= {y.toFixed(1)} + {linearV.toFixed(1)} &middot; {Math.sin(angle).toFixed(2)} &middot; {dt} = <span className="text-green-400 font-bold not-italic">{(y + linearV * Math.sin(angle) * dt).toFixed(1)}</span></div>
                  </div>
                ) : (
                  <div className="font-serif italic text-[11px] text-slate-300 space-y-2.5 mt-2">
                    <div className="text-yellow-400 not-italic font-mono text-[9px]">Moving in a circular arc (&omega; &ne; 0):</div>
                    <div>
                      &theta;<sub>t + &Delta;t</sub> = &theta;<sub>t</sub> + &omega; &middot; &Delta;t<br />
                      &nbsp;&nbsp;= {angle.toFixed(2)} + {angularW.toFixed(3)} &middot; {dt} = <span className="text-green-400 font-bold not-italic">{(angle + angularW * dt).toFixed(2)} rad</span>
                    </div>
                    <div>
                      x<sub>t + &Delta;t</sub> = x<sub>t</sub> + 
                      <div className="inline-flex flex-col items-center mx-1 align-middle text-[9.5px]">
                        <span className="border-b border-white/20 pb-0.5 not-italic">v</span>
                        <span className="pt-0.5">&omega;</span>
                      </div>
                      &middot; (sin(&theta;<sub>t+&Delta;t</sub>) - sin(&theta;<sub>t</sub>))<br />
                      &nbsp;&nbsp;= {x.toFixed(1)} + { (linearV/angularW).toFixed(1) } &middot; ({Math.sin(angle + angularW*dt).toFixed(2)} - {Math.sin(angle).toFixed(2)})<br />
                      &nbsp;&nbsp;= <span className="text-green-400 font-bold not-italic">{(x + (linearV/angularW) * (Math.sin(angle + angularW*dt) - Math.sin(angle))).toFixed(1)}</span>
                    </div>
                    <div>
                      y<sub>t + &Delta;t</sub> = y<sub>t</sub> - 
                      <div className="inline-flex flex-col items-center mx-1 align-middle text-[9.5px]">
                        <span className="border-b border-white/20 pb-0.5 not-italic">v</span>
                        <span className="pt-0.5">&omega;</span>
                      </div>
                      &middot; (cos(&theta;<sub>t+&Delta;t</sub>) - cos(&theta;<sub>t</sub>))<br />
                      &nbsp;&nbsp;= {y.toFixed(1)} - { (linearV/angularW).toFixed(1) } &middot; ({Math.cos(angle + angularW*dt).toFixed(2)} - {Math.cos(angle).toFixed(2)})<br />
                      &nbsp;&nbsp;= <span className="text-green-400 font-bold not-italic">{(y - (linearV/angularW) * (Math.cos(angle + angularW*dt) - Math.cos(angle))).toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Buttons & Checkboxes */}
          <div className="space-y-3">
            <div className="flex gap-2 font-mono">
              <button
                onClick={step}
                disabled={isPlaying}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition uppercase ${isPlaying ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'}`}
              >
                👣 Single Step
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition uppercase cursor-pointer ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-4 flex-wrap text-[10px] p-2.5 bg-black/20 border border-white/5 rounded-xl justify-center font-bold">
              {[
                { id: 'grid', label: 'Show Grid', val: showGrid, set: setShowGrid },
                { id: 'coords', label: 'Show (x, y) Labels', val: showCoords, set: setShowCoords },
                { id: 'vec', label: 'Heading Vector', val: showVector, set: setShowVector },
              ].map(item => (
                <label key={item.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={(e) => item.set(e.target.checked)}
                    className="rounded border-white/10 bg-black/40 text-orange-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
