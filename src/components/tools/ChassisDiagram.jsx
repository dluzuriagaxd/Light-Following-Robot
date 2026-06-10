import React, { useState } from 'react';

export default function ChassisDiagram({ isFullscreen = false, onMaximize = null }) {
  const [angle, setAngle] = useState(30); // in degrees
  const [showWheelbase, setShowWheelbase] = useState(true);
  const [showRadius, setShowRadius] = useState(true);
  const [showHeading, setShowHeading] = useState(true);
  const [showCenter, setShowCenter] = useState(true);

  // Constants for rendering
  const cx = 200;
  const cy = 150;
  const r = 60; // Robot radius on diagram
  const wWidth = 16;
  const wHeight = 44;
  
  // Math rotation direction: positive angles rotate counter-clockwise (upward in SVG)
  const radAngle = (-angle * Math.PI) / 180;

  // Wheel offset positions relative to center before rotation
  const leftWheelOffset = { x: 0, y: -r - wWidth / 2 };
  const rightWheelOffset = { x: 0, y: r + wWidth / 2 };

  // Rotate a point around center
  const rotatePoint = (px, py, rad) => {
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  const lwPos = rotatePoint(cx + leftWheelOffset.x, cy + leftWheelOffset.y, radAngle);
  const rwPos = rotatePoint(cx + rightWheelOffset.x, cy + rightWheelOffset.y, radAngle);
  const headingPos = rotatePoint(cx + r + 25, cy, radAngle);

  return (
    <div className={`bg-slate-900/60 border border-white/5 text-slate-300 ${isFullscreen ? 'p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between space-y-8 bg-transparent border-none' : 'p-5 rounded-2xl space-y-5'}`}>
      
      {/* Header */}
      {!isFullscreen && (
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            📏 Interactive Dimensions Visualizer
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
            <span className="text-[9px] bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
              2D Plane
            </span>
          </div>
        </div>
      )}

      <div className={`flex gap-6 ${isFullscreen ? 'flex-col lg:flex-row flex-1 items-stretch' : 'flex-col'}`}>
        {/* Render Area */}
        <div className={`flex-1 bg-black/40 rounded-xl p-4 border border-white/5 flex items-center justify-center relative ${isFullscreen ? 'min-h-[360px]' : 'min-h-[260px]'}`}>
          <svg 
            viewBox="0 0 400 300" 
            className={`w-full h-auto font-mono text-[10px] ${isFullscreen ? 'max-w-[700px]' : 'max-w-[550px]'}`}
          >
            {/* Grid */}
            <defs>
              <pattern id="chassisGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#chassisGrid)" />

            {/* Coordinate Axis */}
            <line x1="40" y1={cy} x2="360" y2={cy} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1={cx} y1="30" x2={cx} y2="270" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x="365" y={cy + 4} fill="rgba(255,255,255,0.3)" textAnchor="start">X</text>
            <text x={cx} y="25" fill="rgba(255,255,255,0.3)" textAnchor="middle">Y</text>

            {/* Robot Group (Rotates counter-clockwise for positive angles) */}
            <g transform={`rotate(${-angle}, ${cx}, ${cy})`}>
              {/* Robot Chassis Body */}
              <circle cx={cx} cy={cy} r={r} fill="rgba(30, 41, 59, 0.7)" stroke="#64748b" strokeWidth="2.5" />
              
              {/* Left Wheel */}
              <rect
                x={cx - wHeight / 2}
                y={cy - r - wWidth}
                width={wHeight}
                height={wWidth}
                rx="4"
                fill="#ea580c"
                stroke="#ff7849"
                strokeWidth="1.5"
              />

              {/* Right Wheel */}
              <rect
                x={cx - wHeight / 2}
                y={cy + r}
                width={wHeight}
                height={wWidth}
                rx="4"
                fill="#ea580c"
                stroke="#ff7849"
                strokeWidth="1.5"
              />

              {/* Left Wheel Radius Indicator */}
              {showRadius && (
                <g>
                  <line x1={cx} y1={cy - r - wWidth/2} x2={cx + wHeight/2} y2={cy - r - wWidth/2} stroke="#facc15" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy - r - wWidth/2} r="2" fill="#facc15" />
                </g>
              )}

              {/* Heading line inside chassis */}
              <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
            </g>

            {/* --- Vector / Dimension Overlays (Calculated outside rotated group to avoid text flipping) --- */}

            {/* Center (x, y) */}
            {showCenter && (
              <g>
                <circle cx={cx} cy={cy} r="4" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
                <text x={cx + 8} y={cy - 8} fill="#3b82f6" fontWeight="bold">Center (x, y)</text>
              </g>
            )}

            {/* Wheelbase d Dimension Line */}
            {showWheelbase && (
              <g>
                <path
                  d={`M ${lwPos.x} ${lwPos.y} L ${rwPos.x} ${rwPos.y}`}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <circle cx={lwPos.x} cy={lwPos.y} r="3" fill="#ef4444" />
                <circle cx={rwPos.x} cy={rwPos.y} r="3" fill="#ef4444" />
                <text
                  x={(lwPos.x + rwPos.x) / 2 + 12}
                  y={(lwPos.y + rwPos.y) / 2 + 4}
                  fill="#fca5a5"
                  fontWeight="bold"
                  textAnchor="start"
                >
                  Wheelbase (d)
                </text>
              </g>
            )}

            {/* Wheel Radius r Label */}
            {showRadius && (
              <g>
                {/* Rotated point for radius label */}
                {(() => {
                  const radPos = rotatePoint(cx + wHeight/4, cy - r - wWidth/2 - 12, radAngle);
                  return (
                    <text x={radPos.x} y={radPos.y} fill="#fde047" fontWeight="bold" textAnchor="middle">
                      r
                    </text>
                  );
                })()}
              </g>
            )}

            {/* Heading Angle Indicator */}
            {showHeading && (
              <g>
                {/* Heading Arrow */}
                <line x1={cx} y1={cy} x2={headingPos.x} y2={headingPos.y} stroke="#60a5fa" strokeWidth="2.5" />
                <polygon
                  points={`${headingPos.x},${headingPos.y} ${rotatePoint(cx + r + 15, cy - 5, radAngle).x},${rotatePoint(cx + r + 15, cy - 5, radAngle).y} ${rotatePoint(cx + r + 15, cy + 5, radAngle).x},${rotatePoint(cx + r + 15, cy + 5, radAngle).y}`}
                  fill="#60a5fa"
                />
                
                {/* Arc for Angle theta */}
                <path
                  d={`M ${cx + 35} ${cy} A 35 35 0 ${Math.abs(angle) > 180 ? 1 : 0} ${angle < 0 ? 1 : 0} ${cx + 35 * Math.cos(radAngle)} ${cy + 35 * Math.sin(radAngle)}`}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                />
                
                {/* Theta text label */}
                {(() => {
                  const labelPos = rotatePoint(cx + 46, cy - 4, radAngle / 2);
                  return (
                    <text x={labelPos.x} y={labelPos.y} fill="#93c5fd" fontWeight="bold" textAnchor="middle" className="font-serif italic">
                      &theta;
                    </text>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Control Panel */}
        <div className={`space-y-4 shrink-0 flex flex-col justify-center ${isFullscreen ? 'w-[320px]' : 'w-full'}`}>
          {/* Sliders */}
          <div className="space-y-3 p-3 bg-white/5 border border-white/5 rounded-xl">
            <div>
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-blue-400 font-bold">Heading Angle (<span className="font-serif italic">&theta;</span>):</span>
                <span className="text-white font-bold">{angle}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 rounded-full bg-black/40 cursor-pointer"
              />
            </div>
          </div>

          {/* Visibility Checkboxes */}
          <div className="space-y-2 p-3 bg-white/5 border border-white/5 rounded-xl">
            <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono">
              Toggle Overlays
            </p>
            {[
              { id: 'wheelbase', label: 'Wheelbase (d)', val: showWheelbase, set: setShowWheelbase, color: 'text-red-400' },
              { id: 'radius', label: 'Wheel Radius (r)', val: showRadius, set: setShowRadius, color: 'text-yellow-400' },
              { id: 'heading', label: 'Orientation (θ)', val: showHeading, set: setShowHeading, color: 'text-blue-400' },
              { id: 'center', label: 'Center (x, y)', val: showCenter, set: setShowCenter, color: 'text-sky-400' },
            ].map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="rounded border-white/10 bg-black/40 text-orange-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className={item.color}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
