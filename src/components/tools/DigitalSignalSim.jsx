import React, { useState, useEffect, useRef } from 'react';

// Default block positions (assembled)
const originalPositions = {
  'bloque-forever-contenedor': { x: 375, y: 150 },
  'bloque-led-high':          { x: 391, y: 218 },
  'bloque-wait-1':            { x: 391, y: 264 },
  'bloque-led-low':           { x: 391, y: 310 },
  'bloque-wait-2':            { x: 391, y: 356 }
};

// Exploded positions (separated)
const explodedPositions = {
  'bloque-forever-contenedor': { x: 120, y: 150 },
  'bloque-led-high':          { x: 340, y: 80 },
  'bloque-wait-1':            { x: 340, y: 150 },
  'bloque-led-low':           { x: 340, y: 220 },
  'bloque-wait-2':            { x: 340, y: 290 }
};

export default function DigitalSignalSim() {
  const [isRunning, setIsRunning] = useState(true);
  const [delayMs, setDelayMs] = useState(1000); // delay in ms
  const [activeState, setActiveState] = useState(0); // 0: HIGH_EXEC, 1: HIGH_DELAY, 2: LOW_EXEC, 3: LOW_DELAY
  const [actualVoltage, setActualVoltage] = useState(5.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('blocks'); // 'cpp' | 'blocks'
  
  // Interactive zoom & pan states for the blocks canvas
  const [blocksZoom, setBlocksZoom] = useState(1.8);
  const [blocksPan, setBlocksPan] = useState({ x: 0, y: 0 });
  const blocksZoomRef = useRef(1.8);
  const blocksPanRef = useRef({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  
  const animationFrameRef = useRef(null);
  const stateTimerRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  // State variables for smooth voltage transitions
  const targetVoltageRef = useRef(5.0);
  const actualVoltageRef = useRef(5.0);
  
  // Waveform buffer for oscilloscope scroll
  const bufferRef = useRef([]);
  const maxBufferSize = 300;

  // Persistent block positions
  const blockPositionsRef = useRef(JSON.parse(JSON.stringify(originalPositions)));

  // Sync zoom and pan refs for the event handlers
  useEffect(() => {
    blocksZoomRef.current = blocksZoom;
  }, [blocksZoom]);

  useEffect(() => {
    blocksPanRef.current = blocksPan;
  }, [blocksPan]);

  // Initialize buffer with starting voltage
  useEffect(() => {
    bufferRef.current = Array(maxBufferSize).fill(5.0);
  }, []);

  // Block body scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Sync state and voltage target
  useEffect(() => {
    if (activeState === 0 || activeState === 1) {
      targetVoltageRef.current = 5.0;
    } else {
      targetVoltageRef.current = 0.0;
    }
  }, [activeState]);

  // Main simulation and canvas rendering loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (timestamp) => {
      const dt = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 1. Update Simulation State Machine (only if running)
      if (isRunning) {
        stateTimerRef.current += dt;
        
        let currentDuration = 200; // Duration for execution commands (digitalWrite)
        if (activeState === 1 || activeState === 3) {
          currentDuration = delayMs; // Duration for delays
        }

        if (stateTimerRef.current >= currentDuration) {
          stateTimerRef.current = 0;
          setActiveState((prev) => (prev + 1) % 4);
        }
      }

      // 2. Smoothly transition actual voltage to target voltage
      const interpolationFactor = 1 - Math.exp(-0.012 * dt);
      actualVoltageRef.current += (targetVoltageRef.current - actualVoltageRef.current) * Math.min(interpolationFactor, 1);
      setActualVoltage(actualVoltageRef.current);

      // 3. Scroll Oscilloscope (only if running)
      if (isRunning) {
        bufferRef.current.push(actualVoltageRef.current);
        if (bufferRef.current.length > maxBufferSize) {
          bufferRef.current.shift();
        }
      }

      // 4. Draw Oscilloscope to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const W = rect.width;
        const H = rect.height;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Clean slate: Light background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Draw grid lines: Light grey
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        const gridCols = 10;
        for (let i = 1; i < gridCols; i++) {
          const x = (i / gridCols) * W;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }

        // Horizontal grid lines
        const gridRows = 6;
        for (let i = 1; i < gridRows; i++) {
          const y = (i / gridRows) * H;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        // Reference lines (5V and 0V): Dashed
        const paddingBottom = 42;
        const paddingTop = 20;
        const v5_y = H - ((5.0 / 5.5) * (H - (paddingBottom + paddingTop)) + paddingBottom);
        const v0_y = H - ((0.0 / 5.5) * (H - (paddingBottom + paddingTop)) + paddingBottom);

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        
        // 5V Line
        ctx.beginPath();
        ctx.moveTo(0, v5_y);
        ctx.lineTo(W, v5_y);
        ctx.stroke();

        // 0V Line
        ctx.beginPath();
        ctx.moveTo(0, v0_y);
        ctx.lineTo(W, v0_y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Signal Trace: Scratch Blue
        if (bufferRef.current.length > 1) {
          const activeColor = '#4c97ff'; // Scratch blue
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          bufferRef.current.forEach((val, index) => {
            const x = (index / (maxBufferSize - 1)) * W;
            const y = H - ((val / 5.5) * (H - (paddingBottom + paddingTop)) + paddingBottom);
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }

        // Oscilloscope Text Labels
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        ctx.fillText('5V (ALTO)', 8, v5_y - 4);
        ctx.fillText('0V (BAJO)', 8, v0_y - 4);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isRunning, delayMs, activeState]);

  // Event handlers for dragging SVG blocks and panning the canvas
  useEffect(() => {
    if (viewMode !== 'blocks') return;

    const svg = svgRef.current;
    if (!svg) return;

    let selectedElement = null;
    let offset = { x: 0, y: 0 };
    
    let isPanningCanvas = false;
    let startScreenCoord = { x: 0, y: 0 };
    let startPan = { x: 0, y: 0 };

    function getMousePosition(evt) {
      const CTM = svg.getScreenCTM();
      if (evt.touches && evt.touches.length > 0) {
        evt = evt.touches[0];
      }
      return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
      };
    }

    function startDrag(evt) {
      let target = evt.target;
      let isBlock = false;
      
      // Search for draggable SVG groups
      while (target && target !== svg) {
        if (target.classList && target.classList.contains('draggable')) {
          selectedElement = target;
          isBlock = true;
          break;
        }
        target = target.parentNode;
      }

      const clientX = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientY : evt.clientY;

      if (isBlock && selectedElement) {
        evt.preventDefault();
        const coord = getMousePosition(evt);
        let transform = selectedElement.transform.baseVal;
        if (transform.numberOfItems === 0 || transform.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
          let translate = svg.createSVGTransform();
          translate.setTranslate(0, 0);
          selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }
        
        const trans = transform.getItem(0);
        offset.x = coord.x - trans.matrix.e;
        offset.y = coord.y - trans.matrix.f;

        // Bring element to the front visually
        selectedElement.parentNode.appendChild(selectedElement);
      } else {
        // Dragging the background: Panning the canvas
        isPanningCanvas = true;
        startScreenCoord = { x: clientX, y: clientY };
        startPan = { x: blocksPanRef.current.x, y: blocksPanRef.current.y };
      }
    }

    function drag(evt) {
      if (selectedElement) {
        evt.preventDefault();
        const coord = getMousePosition(evt);
        const trans = selectedElement.transform.baseVal.getItem(0);
        trans.setTranslate(coord.x - offset.x, coord.y - offset.y);
      } else if (isPanningCanvas) {
        evt.preventDefault();
        const clientX = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientY : evt.clientY;
        
        const screenDx = clientX - startScreenCoord.x;
        const screenDy = clientY - startScreenCoord.y;
        
        const rect = svg.getBoundingClientRect();
        const svgToScreenScaleX = rect.width / (1000 / blocksZoomRef.current);
        const svgToScreenScaleY = rect.height / (700 / blocksZoomRef.current);
        
        setBlocksPan({
          x: startPan.x + (screenDx / svgToScreenScaleX),
          y: startPan.y + (screenDy / svgToScreenScaleY)
        });
      }
    }

    function endDrag(evt) {
      if (selectedElement) {
        const trans = selectedElement.transform.baseVal.getItem(0);
        blockPositionsRef.current[selectedElement.id] = {
          x: trans.matrix.e,
          y: trans.matrix.f
        };
        selectedElement = null;
      }
      isPanningCanvas = false;
    }

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    svg.addEventListener('touchstart', startDrag, { passive: false });
    svg.addEventListener('touchmove', drag, { passive: false });
    svg.addEventListener('touchend', endDrag);

    return () => {
      svg.removeEventListener('mousedown', startDrag);
      svg.removeEventListener('mousemove', drag);
      svg.removeEventListener('mouseup', endDrag);
      svg.removeEventListener('mouseleave', endDrag);

      svg.removeEventListener('touchstart', startDrag);
      svg.removeEventListener('touchmove', drag);
      svg.removeEventListener('touchend', endDrag);
    };
  }, [viewMode]);

  // Bind mouse wheel to zoom (with preventDefault to avoid scrolling the page, unless Ctrl is held)
  useEffect(() => {
    if (viewMode !== 'blocks') return;

    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) return; // Allow browser page zoom / pinch-zoom
      e.preventDefault();
      const zoomFactor = 0.08;
      const direction = e.deltaY < 0 ? 1 : -1;
      
      setBlocksZoom(prev => {
        const newZoom = prev + direction * zoomFactor;
        return Math.max(0.4, Math.min(2.5, newZoom));
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [viewMode]);

  // Block toolbar actions
  const handleAssemble = () => {
    blockPositionsRef.current = JSON.parse(JSON.stringify(originalPositions));
    Object.keys(originalPositions).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('transform', `translate(${originalPositions[id].x}, ${originalPositions[id].y})`);
      }
    });
    setBlocksZoom(1.8);
    setBlocksPan({ x: 0, y: 0 });
  };

  const handleExplode = () => {
    blockPositionsRef.current = JSON.parse(JSON.stringify(explodedPositions));
    Object.keys(explodedPositions).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute('transform', `translate(${explodedPositions[id].x}, ${explodedPositions[id].y})`);
      }
    });
    setBlocksZoom(1.8);
    setBlocksPan({ x: 0, y: 0 });
  };

  const handleDownloadSvg = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    
    const cleanSvg = svgEl.cloneNode(true);
    cleanSvg.setAttribute('width', '1000');
    cleanSvg.setAttribute('height', '700');
    
    const svgString = new XMLSerializer().serializeToString(cleanSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL;
    const blobURL = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobURL;
    a.download = 'bloques_programacion_blink.svg';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(blobURL);
  };

  // Helper to get active stroke & fill settings for high contrast SVG block selection
  const getBlockPathProps = (blockId, defaultFill, defaultStroke, stepId) => {
    const isActive = isRunning && activeState === stepId;
    return {
      fill: defaultFill,
      stroke: isActive ? '#ffffff' : defaultStroke,
      strokeWidth: isActive ? 3 : 1,
      style: isActive ? { filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.95))' } : {}
    };
  };

  // Derived calculations for visual telemetry
  const frequencyHz = 1000 / (2 * (delayMs + 200));

  // Center-focused SVG viewBox calculation for zoom and pan
  const viewBoxWidth = 1000 / blocksZoom;
  const viewBoxHeight = 700 / blocksZoom;
  const viewBoxX = 500 - 500 / blocksZoom - blocksPan.x;
  const viewBoxY = 350 - 350 / blocksZoom - blocksPan.y;

  // C++ Code Lines
  const codeLines = [
    { text: "void setup() {", isExec: false },
    { text: "  pinMode(13, OUTPUT); // Pin 13 como Salida", isExec: false },
    { text: "}", isExec: false },
    { text: "", isExec: false },
    { text: "void loop() {", isExec: false },
    { text: "  digitalWrite(13, HIGH); // Envía 5V (ALTO)", isExec: true, stepId: 0 },
    { text: `  delay(${delayMs});         // Mantiene por ${delayMs}ms`, isExec: true, stepId: 1 },
    { text: "  digitalWrite(13, LOW);  // Envía 0V (BAJO)", isExec: true, stepId: 2 },
    { text: `  delay(${delayMs});         // Mantiene por ${delayMs}ms`, isExec: true, stepId: 3 },
    { text: "}", isExec: false }
  ];

  return (
    <div 
      ref={containerRef}
      className={`font-sans transition-all duration-300 w-full ${
        isFullscreen 
          ? 'fixed inset-0 z-[100] w-screen min-h-screen rounded-none border-none p-2 md:p-4 flex flex-col justify-between bg-[#f0f4f8] text-slate-800 overflow-y-auto' 
          : 'my-8 p-5 bg-slate-100 border-3 border-slate-200 rounded-3xl shadow-[0_4px_0_#cbd5e1] text-slate-800 overflow-hidden'
      }`}
    >
      {/* Scope CSS Styles for Scratch Aesthetic compatibility */}
      <style>{`
        .scratch-card-digital {
          background: white;
          border: 3px solid #e2e8f0;
          border-radius: 24px;
          box-shadow: 0 4px 0 #e2e8f0;
          transition: all 0.2s ease;
        }
        .scratch-panel-header-digital {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #475569;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .scratch-btn-digital {
          font-weight: 800;
          border-radius: 16px;
          padding: 8px 14px;
          transition: all 0.08s ease;
          cursor: pointer;
          user-select: none;
          text-align: center;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid transparent;
        }
        .scratch-btn-blue-digital {
          background-color: #4c97ff;
          color: white;
          border-color: #3375d6;
          border-bottom: 4px solid #3375d6;
        }
        .scratch-btn-blue-digital:hover {
          transform: translateY(1px);
          border-bottom-width: 3px;
        }
        .scratch-btn-blue-digital:active {
          transform: translateY(2.5px);
          border-bottom-width: 1px;
        }
        .scratch-btn-orange-digital {
          background-color: #ffab19;
          color: white;
          border-color: #d98f0d;
          border-bottom: 4px solid #d98f0d;
        }
        .scratch-btn-orange-digital:hover {
          transform: translateY(1px);
          border-bottom-width: 3px;
        }
        .scratch-btn-orange-digital:active {
          transform: translateY(2.5px);
          border-bottom-width: 1px;
        }
        .scratch-btn-gray-digital {
          background-color: #eceff2;
          color: #475569;
          border-color: #cbd5e1;
          border-bottom: 4px solid #cbd5e1;
        }
        .scratch-btn-gray-digital:hover {
          transform: translateY(1px);
          border-bottom-width: 3px;
        }
        .scratch-btn-gray-digital:active {
          transform: translateY(2.5px);
          border-bottom-width: 1px;
        }
        .scratch-btn-green-digital {
          background-color: #5cb85c;
          color: white;
          border-color: #459645;
          border-bottom: 4px solid #459645;
        }
        .scratch-btn-green-digital:hover {
          transform: translateY(1px);
          border-bottom-width: 3px;
        }
        .scratch-btn-green-digital:active {
          transform: translateY(2.5px);
          border-bottom-width: 1px;
        }
        .scratch-slider-digital {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 9999px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
        }
        .scratch-slider-digital::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffab19;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .scratch-slider-digital::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .canvas-grid-light-digital {
          background-color: #F5F7F9;
          background-image: radial-gradient(#D3D6DB 1.5px, transparent 1.5px);
          background-size: 20px 20px;
        }
      `}</style>
      
      {/* Simulation Header controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 shrink-0 ${
        isFullscreen ? 'pb-2 mb-2' : 'pb-4 mb-4'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4c97ff] animate-pulse shadow-[0_0_8px_rgba(76,151,255,0.4)]" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Simulador de Señales Digitales (Pin 13)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            Analiza cómo cambia el voltaje de salida digital según las instrucciones del código de control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`scratch-btn-digital active:scale-95 flex items-center gap-1.5 ${
              isRunning ? 'scratch-btn-orange-digital' : 'scratch-btn-green-digital'
            }`}
          >
            {isRunning ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
                Pausar
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Iniciar
              </>
            )}
          </button>

          <button
            onClick={() => {
              setActiveState(0);
              stateTimerRef.current = 0;
              actualVoltageRef.current = 5.0;
              targetVoltageRef.current = 5.0;
              bufferRef.current = Array(maxBufferSize).fill(5.0);
            }}
            className="scratch-btn-digital scratch-btn-gray-digital"
          >
            Reiniciar
          </button>

          <button
            onClick={toggleFullscreen}
            className="scratch-btn-digital scratch-btn-gray-digital flex items-center gap-1.5"
            title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
          >
            {isFullscreen ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4.5 4.5M9 9V4.5M9 9H4.5M15 9l4.5-4.5M15 9V4.5M15 9h4.5M9 15l-4.5 4.5M9 15v4.5M9 15H4.5M15 15l4.5 4.5M15 15v4.5M15 15h4.5" />
                </svg>
                Salir
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
                </svg>
                Pantalla Completa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Layout - xl Split for Inline, responsive grid columns for Fullscreen */}
      <div className={`grid ${
        isFullscreen 
          ? 'grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 my-2 overflow-y-auto lg:overflow-hidden' 
          : 'grid-cols-1 xl:grid-cols-2 gap-6'
      }`}>
        
        {/* PANEL 1: Code / Blocks Editor */}
        <div className={`scratch-card-digital flex flex-col min-h-[380px] ${
          isFullscreen ? 'col-span-1 lg:col-span-5 h-full min-h-0 p-3 md:p-4' : 'p-5'
        }`}>
          {/* Editor Header with Tab Switching */}
          <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-100 gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
              📄 Código y Lógica
            </span>
            
            {/* C++ vs Blocks Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('cpp')}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 ${
                  viewMode === 'cpp' 
                    ? 'bg-[#4c97ff] text-white font-black shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                C++
              </button>
              <button
                onClick={() => setViewMode('blocks')}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-150 ${
                  viewMode === 'blocks' 
                    ? 'bg-[#4c97ff] text-white font-black shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bloques
              </button>
            </div>
          </div>

          {/* Editor Viewport */}
          {viewMode === 'cpp' ? (
            <div className="flex-1 font-mono text-[11px] overflow-y-auto bg-slate-50 border-2 border-slate-150 rounded-2xl p-3.5 space-y-1.5 custom-scrollbar">
              {codeLines.map((line, idx) => {
                const isActive = line.isExec && activeState === line.stepId;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2.5 py-0.5 px-2 rounded transition-all duration-150 ${
                      isActive 
                        ? 'bg-sky-50 text-sky-850 font-semibold border-l-3 border-sky-500 shadow-[inset_4px_0_12px_rgba(14,165,233,0.05)]' 
                        : 'text-slate-500 border-l-3 border-transparent'
                    }`}
                  >
                    <span className="w-4 text-right text-slate-400 select-none text-[9px] pt-0.5">
                      {idx + 1}
                    </span>
                    <span className={`whitespace-pre ${isActive ? 'font-bold' : ''}`}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 border-2 border-slate-150 rounded-2xl overflow-hidden">
              {/* Blocks controls strip */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b border-slate-200 shrink-0 gap-2 flex-wrap">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">
                  Lienzo Vectorial
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={handleExplode}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded text-[8px] font-bold uppercase tracking-wider shadow-xs"
                    title="Separar bloques en el espacio de trabajo"
                  >
                    Separar
                  </button>
                  <button
                    onClick={handleAssemble}
                    className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 rounded text-[8px] font-bold uppercase tracking-wider shadow-xs"
                    title="Ensamblar bloques automáticamente"
                  >
                    Ensamblar
                  </button>
                  <button
                    onClick={handleDownloadSvg}
                    className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600 rounded text-[8px] font-bold uppercase tracking-wider shadow-xs"
                    title="Descargar diagrama de bloques como SVG limpio"
                  >
                    Descargar SVG
                  </button>
                </div>
              </div>

              {/* Blocks Interactive Canvas */}
              <div className={`flex-1 canvas-grid-light-digital relative overflow-hidden ${
                isFullscreen ? 'min-h-0' : 'min-h-[260px]'
              }`}>
                <svg 
                  ref={svgRef}
                  id="workspace-svg" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-full h-full cursor-grab active:cursor-grabbing" 
                  viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
                >
                  <defs>
                    <filter id="block-shadow" x="-5%" y="-5%" width="115%" height="115%">
                      <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.18" />
                    </filter>
                    
                    <style>{`
                      .block-text { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13.5px; font-weight: bold; fill: #FFFFFF; user-select: none; }
                      .dropdown-text { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; fill: #FFFFFF; user-select: none; }
                      .input-text { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13.5px; fill: #111111; text-anchor: middle; user-select: none; }
                    `}</style>
                  </defs>

                  {/* 1. BLOQUE: on start (Removido - No necesario para esta lección) */}

                  {/* 2. BLOQUE: forever */}
                  <g 
                    id="bloque-forever-contenedor" 
                    className="draggable" 
                    filter="url(#block-shadow)"
                    transform={`translate(${blockPositionsRef.current['bloque-forever-contenedor'].x}, ${blockPositionsRef.current['bloque-forever-contenedor'].y})`}
                  >
                    <path 
                      d="M 0,24 C 0,10 15,0 45,0 C 75,0 90,10 95,24 L 160,24 A 4,4 0 0 1 164,28 L 164,64 A 4,4 0 0 1 160,68 L 60,68 C 58,68 56,70 54,72 L 50,78 C 48,80 44,80 42,78 L 38,72 C 36,70 34,68 32,68 L 16,68 L 16,252 L 32,252 C 34,252 36,254 38,256 L 42,262 C 44,264 48,264 50,262 L 54,256 C 56,254 58,252 60,252 L 160,252 A 4,4 0 0 1 164,256 L 164,268 A 4,4 0 0 1 160,272 L 4,272 A 4,4 0 0 1 0,268 Z" 
                      fill="#FF9F1C" 
                      stroke="#E08600" 
                      strokeWidth="1" 
                    />
                    <text x="16" y="52" className="block-text">forever</text>
                  </g>

                  {/* 3. SUB-BLOQUE: set built-in LED to HIGH */}
                  <g 
                    id="bloque-led-high" 
                    className="draggable" 
                    filter="url(#block-shadow)"
                    transform={`translate(${blockPositionsRef.current['bloque-led-high'].x}, ${blockPositionsRef.current['bloque-led-high'].y})`}
                  >
                    <path 
                      d="M 0,0 L 16,0 C 18,0 20,2 22,4 L 26,10 C 28,12 32,12 34,10 L 38,4 C 40,2 42,0 44,0 L 246,0 A 4,4 0 0 1 250,4 L 250,42 A 4,4 0 0 1 246,46 L 44,46 C 42,46 40,48 38,50 L 34,56 C 32,58 28,58 26,56 L 22,50 C 20,48 18,46 16,46 L 4,46 A 4,4 0 0 1 0,42 Z" 
                      {...getBlockPathProps('bloque-led-high', '#4C97FF', '#3373CC', 0)}
                    />
                    <text x="12" y="28" className="block-text">set built-in LED to</text>
                    <g transform="translate(145, 8)">
                      <rect width="90" height="30" rx="4" fill="#2872E2" stroke="#1F5BB8" strokeWidth="1" />
                      <text x="12" y="20" className="dropdown-text">HIGH</text>
                      <polygon points="70,12 78,12 74,18" fill="#FFFFFF" />
                    </g>
                  </g>

                  {/* 4. SUB-BLOQUE: wait 1 secs (First) */}
                  <g 
                    id="bloque-wait-1" 
                    className="draggable" 
                    filter="url(#block-shadow)"
                    transform={`translate(${blockPositionsRef.current['bloque-wait-1'].x}, ${blockPositionsRef.current['bloque-wait-1'].y})`}
                  >
                    <path 
                      d="M 0,0 L 16,0 C 18,0 20,2 22,4 L 26,10 C 28,12 32,12 34,10 L 38,4 C 40,2 42,0 44,0 L 186,0 A 4,4 0 0 1 190,4 L 190,42 A 4,4 0 0 1 186,46 L 44,46 C 42,46 40,48 38,50 L 34,56 C 32,58 28,58 26,56 L 22,50 C 20,48 18,46 16,46 L 4,46 A 4,4 0 0 1 0,42 Z" 
                      {...getBlockPathProps('bloque-wait-1', '#FF9F1C', '#E08600', 1)}
                    />
                    <text x="12" y="28" className="block-text">wait</text>
                    <g transform="translate(50, 8)">
                      <rect width="42" height="30" rx="15" fill="#FFFFFF" stroke="#D3D6DB" strokeWidth="1" />
                      <text x="21" y="20" className="input-text">1</text>
                    </g>
                    <g transform="translate(100, 8)">
                      <rect width="80" height="30" rx="4" fill="#E08600" />
                      <text x="12" y="20" className="dropdown-text">secs</text>
                      <polygon points="60,12 68,12 64,18" fill="#FFFFFF" />
                    </g>
                  </g>

                  {/* 5. SUB-BLOQUE: set built-in LED to LOW */}
                  <g 
                    id="bloque-led-low" 
                    className="draggable" 
                    filter="url(#block-shadow)"
                    transform={`translate(${blockPositionsRef.current['bloque-led-low'].x}, ${blockPositionsRef.current['bloque-led-low'].y})`}
                  >
                    <path 
                      d="M 0,0 L 16,0 C 18,0 20,2 22,4 L 26,10 C 28,12 32,12 34,10 L 38,4 C 40,2 42,0 44,0 L 246,0 A 4,4 0 0 1 250,4 L 250,42 A 4,4 0 0 1 246,46 L 44,46 C 42,46 40,48 38,50 L 34,56 C 32,58 28,58 26,56 L 22,50 C 20,48 18,46 16,46 L 4,46 A 4,4 0 0 1 0,42 Z" 
                      {...getBlockPathProps('bloque-led-low', '#4C97FF', '#3373CC', 2)}
                    />
                    <text x="12" y="28" className="block-text">set built-in LED to</text>
                    <g transform="translate(145, 8)">
                      <rect width="90" height="30" rx="4" fill="#2872E2" stroke="#1F5BB8" strokeWidth="1" />
                      <text x="12" y="20" className="dropdown-text">LOW</text>
                      <polygon points="70,12 78,12 74,18" fill="#FFFFFF" />
                    </g>
                  </g>

                  {/* 6. SUB-BLOQUE: wait 1 secs (Second) */}
                  <g 
                    id="bloque-wait-2" 
                    className="draggable" 
                    filter="url(#block-shadow)"
                    transform={`translate(${blockPositionsRef.current['bloque-wait-2'].x}, ${blockPositionsRef.current['bloque-wait-2'].y})`}
                  >
                    <path 
                      d="M 0,0 L 16,0 C 18,0 20,2 22,4 L 26,10 C 28,12 32,12 34,10 L 38,4 C 40,2 42,0 44,0 L 186,0 A 4,4 0 0 1 190,4 L 190,42 A 4,4 0 0 1 186,46 L 44,46 C 42,46 40,48 38,50 L 34,56 C 32,58 28,58 26,56 L 22,50 C 20,48 18,46 16,46 L 4,46 A 4,4 0 0 1 0,42 Z" 
                      {...getBlockPathProps('bloque-wait-2', '#FF9F1C', '#E08600', 3)}
                    />
                    <text x="12" y="28" className="block-text">wait</text>
                    <g transform="translate(50, 8)">
                      <rect width="42" height="30" rx="15" fill="#FFFFFF" stroke="#D3D6DB" strokeWidth="1" />
                      <text x="21" y="20" className="input-text">1</text>
                    </g>
                    <g transform="translate(100, 8)">
                      <rect width="80" height="30" rx="4" fill="#E08600" />
                      <text x="12" y="20" className="dropdown-text">secs</text>
                      <polygon points="60,12 68,12 64,18" fill="#FFFFFF" />
                    </g>
                  </g>
                </svg>

                {/* Floating Canvas Navigation Overlay Controls */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20">
                  <button
                    onClick={() => setBlocksZoom(prev => Math.min(2.5, prev + 0.15))}
                    className="w-7 h-7 bg-white hover:bg-slate-55 border-2 border-slate-200 text-slate-700 font-extrabold rounded-lg flex items-center justify-center text-sm shadow-sm active:scale-95 transition-transform"
                    title="Aumentar Zoom"
                  >
                    ＋
                  </button>
                  <button
                    onClick={() => setBlocksZoom(prev => Math.max(0.4, prev - 0.15))}
                    className="w-7 h-7 bg-white hover:bg-slate-55 border-2 border-slate-200 text-slate-700 font-extrabold rounded-lg flex items-center justify-center text-sm shadow-sm active:scale-95 transition-transform"
                    title="Reducir Zoom"
                  >
                    －
                  </button>
                  <button
                    onClick={() => {
                      setBlocksZoom(1.8);
                      setBlocksPan({ x: 0, y: 0 });
                    }}
                    className="w-7 h-7 bg-white hover:bg-slate-55 border-2 border-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center text-xs shadow-sm active:scale-95 transition-transform"
                    title="Restablecer vista (Zoom 1.8x)"
                  >
                    🏠
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 2: Oscilloscope */}
        <div className={`scratch-card-digital flex flex-col min-h-[380px] ${
          isFullscreen ? 'col-span-1 lg:col-span-4 h-full min-h-0 p-3 md:p-4' : 'p-5'
        }`}>
          <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
              📈 Osciloscopio (Voltaje vs Tiempo)
            </span>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-sky-600 font-mono bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Sonda CH1: Pin 13
            </div>
          </div>

          <div className={`relative flex-1 bg-white rounded-2xl overflow-hidden border-2 border-slate-150 flex flex-col justify-between ${
            isFullscreen ? 'min-h-0' : 'min-h-[180px]'
          }`}>
            <canvas 
              ref={canvasRef} 
              className="w-full h-full min-h-[160px]"
            />

            {/* Float values on top of scope screen */}
            <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500 font-bold bg-white/95 border border-slate-200 rounded px-2 py-1 flex flex-col gap-0.5 shadow-sm">
              <div className="flex justify-between gap-4">
                <span>VMAX:</span> <span>5.00 V</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>VMIN:</span> <span>0.00 V</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>FREQ:</span> <span>{frequencyHz.toFixed(2)} Hz</span>
              </div>
            </div>

            {/* Oscilloscope bottom strip */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-mono text-slate-500 bg-white/95 border border-slate-200 rounded-lg px-2 py-1 shadow-sm font-bold">
              <span>Escala: 1.00V / Div</span>
              <span>Medición: <strong className="text-[#4c97ff] font-extrabold">{actualVoltage.toFixed(2)}V</strong></span>
            </div>
          </div>

          {/* Slider to adjust speed (delay) */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Tiempo de Espera (Delay):</span>
              <span className="text-[#4c97ff] font-black font-mono">{delayMs} ms ({ (delayMs/1000).toFixed(1) }s)</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={delayMs}
              onChange={(e) => setDelayMs(Number(e.target.value))}
              onDoubleClick={() => setDelayMs(1000)}
              className="scratch-slider-digital"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold font-mono">
              <span>Rápido (100ms)</span>
              <span>Lento (2000ms)</span>
            </div>
          </div>
        </div>

        {/* PANEL 3: Arduino Board Output */}
        <div className={`scratch-card-digital flex flex-col ${
          isFullscreen 
            ? 'col-span-1 lg:col-span-3 h-full min-h-0 flex p-3 md:p-4' 
            : 'hidden'
        }`}>
          <div className="flex items-center justify-between mb-3 shrink-0 pb-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
              🧠 Hardware (Placa Arduino Uno)
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-wider uppercase font-mono transition-colors ${
              actualVoltage > 2.5 
                ? 'bg-amber-100 border border-amber-300 text-amber-600' 
                : 'bg-slate-100 border border-slate-200 text-slate-400'
            }`}>
              LED L: {actualVoltage > 2.5 ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className={`flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-center relative overflow-hidden ${
            isFullscreen ? 'min-h-0' : 'min-h-[220px]'
          }`}>
            {/* Visual background grid effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Glowing atmosphere from the LED */}
            <div 
              className="absolute w-44 h-44 rounded-full bg-amber-400 pointer-events-none blur-[40px] transition-all duration-75"
              style={{ 
                opacity: (actualVoltage / 5.0) * 0.22,
                transform: 'translate(45px, -35px)' 
              }}
            />

            {/* Arduino board SVG illustration */}
            <svg viewBox="0 0 240 180" className="w-full max-w-[220px] aspect-[4/3] drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] z-10">
              {/* Board body */}
              <rect x="10" y="10" width="220" height="160" rx="12" fill="#0c2530" stroke="#143c4e" strokeWidth="2.5" />
              
              {/* Gold border tracks */}
              <rect x="14" y="14" width="212" height="152" rx="10" fill="none" stroke="#b49348" strokeWidth="0.8" opacity="0.35" />

              {/* USB Port */}
              <rect x="2" y="30" width="36" height="42" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="2" y="34" width="32" height="34" rx="1" fill="#475569" />
              
              {/* DC Power Jack */}
              <rect x="6" y="110" width="45" height="36" rx="2" fill="#0f172a" />
              <rect x="6" y="116" width="38" height="24" rx="1" fill="#1e293b" />

              {/* ATmega328P Microcontroller Chip */}
              <rect x="90" y="95" width="105" height="28" rx="2" fill="#181f25" stroke="#2a353e" strokeWidth="1" />
              <text x="142.5" y="112" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1.5">ATMEGA328P</text>
              {/* Chip Pins */}
              {[...Array(14)].map((_, i) => (
                <g key={i}>
                  <rect x={94 + i * 7.2} y="91" width="3" height="4" fill="#cbd5e1" />
                  <rect x={94 + i * 7.2} y="123" width="3" height="4" fill="#cbd5e1" />
                </g>
              ))}

              {/* Header Socket - Digital Pins */}
              <rect x="70" y="15" width="140" height="10" rx="1" fill="#0f172a" />
              {[...Array(10)].map((_, i) => (
                <rect key={i} x={74 + i * 13.2} y="18" width="4" height="4" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
              ))}
              <text x="202" y="29" fill="#cbd5e1" fontSize="7" fontWeight="bold" fontFamily="monospace">13</text>
              <text x="189" y="29" fill="#cbd5e1" fontSize="7" fontWeight="bold" fontFamily="monospace">GND</text>
              
              {/* Connection glow wire */}
              <line x1="202" y1="20" x2="202" y2="40" stroke={actualVoltage > 2.5 ? '#b49348' : '#334155'} strokeWidth="1" strokeDasharray="2,2" />

              {/* Power ON Green LED */}
              <circle cx="62" cy="144" r="2.5" fill="#10b981" />
              <circle cx="62" cy="144" r="5" fill="#10b981" opacity="0.4" />
              <text x="62" y="154" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">ON</text>

              {/* Integrated LED "L" */}
              <g transform="translate(182, 45)">
                <text x="-8" y="6" fill="#cbd5e1" fontSize="9" fontWeight="black" fontFamily="monospace">L</text>
                <rect x="-2" y="-2" width="10" height="6" rx="1" fill="#475569" />
                <rect 
                  x="0" 
                  y="-1" 
                  width="6" 
                  height="4" 
                  rx="0.5" 
                  fill={actualVoltage > 2.5 ? '#f59e0b' : '#78350f'} 
                  stroke={actualVoltage > 2.5 ? '#fef08a' : '#451a03'}
                  strokeWidth="0.5"
                  className="transition-all duration-75"
                />
                
                {actualVoltage > 2.5 && (
                  <circle 
                    cx="3" 
                    cy="1" 
                    r="8" 
                    fill="url(#amberGlow)" 
                    opacity={(actualVoltage / 5.0)}
                  />
                )}
              </g>

              {/* Define Glow Gradients */}
              <defs>
                <radialGradient id="amberGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>
              </defs>

              <text x="120" y="55" fill="rgba(255,255,255,0.06)" fontSize="16" fontWeight="black" textAnchor="middle" fontFamily="sans-serif" letterSpacing="2">ARDUINO UNO</text>
            </svg>
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-500 italic font-semibold shrink-0">
            El LED "L" parpadea gracias a que el Pin 13 cambia entre 5V y 0V.
          </p>
        </div>

      </div>

      {/* Educational Footer notes - Hidden in fullscreen mode to save vertical height */}
      {!isFullscreen && (
        <div className="mt-3 p-3.5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#4c97ff] font-mono block">
              💡 Lección de Señal Digital
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              Una <strong>señal digital</strong> solo tiene dos estados posibles: <strong>ALTO</strong> (5V, representando un 1 lógico) y <strong>BAJO</strong> (0V, representando un 0 lógico). La transición rápida entre estos estados dibuja la "onda cuadrada" que ves en el osciloscopio.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
