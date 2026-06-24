import React, { useState, useEffect, useRef, useCallback } from 'react';

// Canvas size
const FIELD_W = 800;
const FIELD_H = 500;

// Robot physical rendering dimensions (Scaled up to 0.11 for larger size)
const SCALE = 0.11; 
const ROBOT_W = 529 * SCALE;
const ROBOT_H = 673 * SCALE;
const WHEELBASE = 60; // Adjusted for 0.11 scale

// CSS Styles for Scratch Aesthetic
const scratchStyles = `
  .scratch-page {
    background-color: #f0f4f8;
    color: #1e293b;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
  }
  .scratch-card {
    background: white;
    border: 3px solid #e2e8f0;
    border-radius: 24px;
    box-shadow: 0 4px 0 #e2e8f0;
  }
  .scratch-panel-header {
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #475569;
    border-bottom: 2px solid #f1f5f9;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .scratch-btn {
    font-weight: 800;
    border-radius: 16px;
    padding: 10px 16px;
    transition: all 0.08s ease;
    cursor: pointer;
    user-select: none;
    text-align: center;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
  }
  .scratch-btn-blue {
    background-color: #4c97ff;
    color: white;
    border-color: #3375d6;
    border-bottom: 5px solid #3375d6;
  }
  .scratch-btn-blue:hover {
    transform: translateY(1px);
    border-bottom-width: 4px;
  }
  .scratch-btn-blue:active {
    transform: translateY(3px);
    border-bottom-width: 1px;
  }
  .scratch-btn-orange {
    background-color: #ffab19;
    color: white;
    border-color: #d98f0d;
    border-bottom: 5px solid #d98f0d;
  }
  .scratch-btn-orange:hover {
    transform: translateY(1px);
    border-bottom-width: 4px;
  }
  .scratch-btn-orange:active {
    transform: translateY(3px);
    border-bottom-width: 1px;
  }
  .scratch-btn-green {
    background-color: #5cb85c;
    color: white;
    border-color: #459645;
    border-bottom: 5px solid #459645;
  }
  .scratch-btn-green:hover {
    transform: translateY(1px);
    border-bottom-width: 4px;
  }
  .scratch-btn-green:active {
    transform: translateY(3px);
    border-bottom-width: 1px;
  }
  .scratch-btn-red {
    background-color: #ff6680;
    color: white;
    border-color: #d9415c;
    border-bottom: 5px solid #d9415c;
  }
  .scratch-btn-red:hover {
    transform: translateY(1px);
    border-bottom-width: 4px;
  }
  .scratch-btn-red:active {
    transform: translateY(3px);
    border-bottom-width: 1px;
  }
  .scratch-btn-gray {
    background-color: #eceff2;
    color: #475569;
    border-color: #cbd5e1;
    border-bottom: 5px solid #cbd5e1;
  }
  .scratch-btn-gray:hover {
    transform: translateY(1px);
    border-bottom-width: 4px;
  }
  .scratch-btn-gray:active {
    transform: translateY(3px);
    border-bottom-width: 1px;
  }
  .scratch-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 10px;
    border-radius: 9999px;
    background: #e2e8f0;
    outline: none;
    cursor: pointer;
  }
  .scratch-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ffab19;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .scratch-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  .scratch-slider-blue::-webkit-slider-thumb {
    background: #4c97ff;
  }
  .scratch-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .scratch-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 9999px;
  }
  .scratch-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
    border: 2px solid #f1f5f9;
  }
  .scratch-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

// Helper to set canvas physical size based on CSS size & DPR (Prevents pixelation)
const setupCanvas = (canvas, logicalW, logicalH) => {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const displayW = canvas.clientWidth;
  const displayH = canvas.clientHeight;
  
  if (displayW === 0 || displayH === 0) return null;
  
  const physicalW = Math.round(displayW * dpr);
  const physicalH = Math.round(displayH * dpr);
  
  if (canvas.width !== physicalW || canvas.height !== physicalH) {
    canvas.width = physicalW;
    canvas.height = physicalH;
  }
  return { dpr, displayW, displayH, scaleX: displayW / logicalW, scaleY: displayH / logicalH };
};

// Robot SVG Path & details drawing helper
const drawRobotBody = (ctx, strokeColor = '#4c97ff') => {
  // Draw Wheel slots as reference
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(15, 688, 94, 245);
  ctx.fillRect(676, 688, 94, 245);

  // Draw Chassis Main Path
  const chassisPath = new Path2D(
    "M 298.74206,465.05562 V 699.38633 H 128.66332 v 151.1811 H 657.79717 V 699.38633 H 487.71843 V 465.05562 A 11.338583,11.338583 0 0 0 476.37985,453.71704 H 459.37198 V 245.84302 h 94.48819 A 18.897638,18.897638 0 0 0 572.7578,226.94538 V 196.70916 A 18.897638,18.897638 0 0 0 553.86017,177.81153 H 232.60032 a 18.897638,18.897638 0 0 0 -18.89763,18.89763 v 30.23622 a 18.897638,18.897638 0 0 0 18.89763,18.89764 h 94.48819 v 207.87402 h -17.00787 a 11.338583,11.338583 0 0 0 -11.33858,11.33858 z"
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fill(chassisPath);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 10;
  ctx.stroke(chassisPath);

  // Draw Yellow TT Motors on sides
  ctx.fillStyle = '#ffab19';
  ctx.fillRect(85, 680, 45, 120);
  ctx.fillRect(655, 680, 45, 120);

  // L298N driver block in the center
  ctx.fillStyle = '#ff6680';
  ctx.fillRect(320, 520, 150, 130);
  ctx.strokeStyle = '#ff3355';
  ctx.lineWidth = 4;
  ctx.strokeRect(320, 520, 150, 130);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('L298N', 395, 595);

  // Arduino Board in the center upper
  ctx.fillStyle = '#006466';
  ctx.fillRect(300, 280, 190, 200);
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.strokeRect(300, 280, 190, 200);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('UNO R3', 395, 385);
};

export default function LightSimulator() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  
  const mainSimContainerRef = useRef(null);
  const mainRectRef = useRef(null);
  const staticRectRef = useRef(null);
  const numberLineRef = useRef(null);

  // Pista de Pruebas states
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'theory'
  const [worldMode, setWorldMode] = useState('ideal'); // 'ideal' | 'real'
  const [diferenciaBase, setDiferenciaBase] = useState(0); 
  const [umbral, setUmbral] = useState(50); 
  const [useFilter, setUseFilter] = useState(true); 
  const [useNoise, setUseNoise] = useState(true); 
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [lightMode, setLightMode] = useState('drag'); // 'drag' | 'follow'

  // Zoom & Pan for Main Simulator Canvas
  const [zoomMain, setZoomMain] = useState(1.0);
  const [panMain, setPanMain] = useState({ x: 0, y: 0 });
  const [followRobot, setFollowRobot] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });

  // Live telemetry states (for visual output panel)
  const [telemetry, setTelemetry] = useState({
    sIzquierdo: 100,
    sDerecho: 100,
    resta: 0,
    action: 'detenido',
    leftPwm: 0,
    rightPwm: 0,
  });

  // History for the scrolling plotter graph (holds difference values, maps [-1024, 1024])
  const [plotHistory, setPlotHistory] = useState(Array(60).fill(0));

  // --- Static Simulator (Entrenamiento Lógico) States ---
  const staticCanvasRef = useRef(null);
  const staticDraggingRef = useRef(false);
  const [staticLightX, setStaticLightX] = useState(0);
  const [staticWorldMode, setStaticWorldMode] = useState('ideal');
  const [staticZoom, setStaticZoom] = useState(1.5);
  const [noiseTick, setNoiseTick] = useState(0);
  const [showNumberLine, setShowNumberLine] = useState(false);

  // --- Step-by-step logic progression states ---
  const [logicStep, setLogicStep] = useState(1);
  const [step2Fixed, setStep2Fixed] = useState(false); // Umbral
  const [step3Fixed, setStep3Fixed] = useState(false); // Luz Mínima
  const [step4Fixed, setStep4Fixed] = useState(false); // Luz Máxima
  const [step5Fixed, setStep5Fixed] = useState(false); // Calibración desfase
  const [step6Fixed, setStep6Fixed] = useState(false); // Promediación
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState('flowchart'); // 'flowchart' | 'code' | 'oscilloscope'

  // Step 3 specific states
  const [luzMinimaThreshold, setLuzMinimaThreshold] = useState(300);
  const [luzAmbiental, setLuzAmbiental] = useState(350);
  const [step3Choice, setStep3Choice] = useState(null); // null | 'A' | 'B'
  const [simularTemblor, setSimularTemblor] = useState(false); // deactivated by default

  // States for logical simulator redesign
  const [revealFlowchart, setRevealFlowchart] = useState(false);
  const [showTeacherGuide, setShowTeacherGuide] = useState(false);

  // Step 6 dual real-time graphs history
  const [staticRawHistory, setStaticRawHistory] = useState(Array(60).fill(0));
  const [staticFilteredHistory, setStaticFilteredHistory] = useState(Array(60).fill(0));

  // Fullscreen main simulator
  const handleFullscreenMain = () => {
    const el = mainSimContainerRef.current;
    if (el) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen().catch(err => console.error("Error entering fullscreen:", err));
      }
    }
  };

  // Reset steps and fixes when switching step
  useEffect(() => {
    setStep2Fixed(logicStep > 2);
    setStep3Fixed(logicStep > 3);
    setStep4Fixed(logicStep > 4);
    setStep5Fixed(logicStep > 5);
    setStep6Fixed(logicStep > 6);
    setRevealFlowchart(false); // Reset flowchart reveal status
    setStep3Choice(null); // Reset choice
    
    if (logicStep === 2) {
      setUmbral(0); // Start at 0 in Step 2 to show shaking
    } else if (logicStep > 2) {
      setUmbral(50); // Set standard threshold for subsequent steps
    }
    
    // Force right tab to oscilloscope in Step 6
    if (logicStep === 6) {
      setRightPanelTab('oscilloscope');
    } else if (rightPanelTab === 'oscilloscope') {
      setRightPanelTab('flowchart');
    }
  }, [logicStep]);

  // Sync step2Fixed dynamically in Step 2 based on umbral
  useEffect(() => {
    if (logicStep === 2) {
      setStep2Fixed(umbral > 0);
    }
  }, [umbral, logicStep]);

  // Fluctuates readings in real mode for the static simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setNoiseTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Calculate static telemetry (with real-time noise tick)
  const staticTelemetry = React.useMemo(() => {
    let readL = 200;
    let readR = 200;
    
    if (!flashlightOn) {
      // Simulate low ambient light (flashlight off)
      const ambient = logicStep >= 3 ? luzAmbiental : 200;
      readL = ambient;
      readR = ambient;
    } else {
      // Proportional math for LDR readings:
      // Base intensity scales with staticZoom (1.0 to 2.5)
      // Higher zoom = closer distance = higher reading
      const baseIntensity = 350 + (staticZoom - 1.0) * 350; // 350 to 875
      
      // Horizontal displacement sensitivity (spans [-1023, 1023])
      const sensitivity = 3.5;
      
      // Calculate readings (Left A0, Right A1)
      readL = baseIntensity - (staticLightX * sensitivity);
      readR = baseIntensity + (staticLightX * sensitivity);
    }
    
    // Mismatch and noise are ONLY present in Steps 5 & 6 (or when explicitly testing staticWorldMode real)
    const activeMismatch = (logicStep >= 5 || staticWorldMode === 'real');
    const activeNoise = (logicStep === 6 || (staticWorldMode === 'real' && logicStep >= 5));
    
    if (activeMismatch) {
      readL -= 35;
      readR += 35;
    }
    
    // Clean resta is calculated without random noise fluctuations (to represent the filtered output)
    const cleanL = Math.max(0, Math.min(1023, Math.round(readL)));
    const cleanR = Math.max(0, Math.min(1023, Math.round(readR)));
    const cleanResta = cleanL - cleanR;

    if (activeNoise && !step6Fixed) {
      // Random noise fluctuations
      const noiseValL = (Math.sin(noiseTick * 1.3) * 12) + (Math.cos(noiseTick * 0.7) * 6);
      const noiseValR = (Math.cos(noiseTick * 1.1) * 12) + (Math.sin(noiseTick * 0.9) * 6);
      readL += noiseValL;
      readR += noiseValR;
    }
    
    readL = Math.max(0, Math.min(1023, Math.round(readL)));
    readR = Math.max(0, Math.min(1023, Math.round(readR)));
    
    const resta = readL - readR;
    
    let action = 'avanzar recto';
    // In Step 1, threshold is always 0. In Step 2, it is controlled by umbral.
    const staticUmbral = logicStep === 1 ? 0 : umbral;
    const staticDiferenciaBase = step5Fixed ? -70 : 0;
    const minThreshold = logicStep >= 3 ? luzMinimaThreshold : 300;
    const maxThreshold = 850;
    
    // Decision Logic based on current logicStep and fixes applied
    const hasMinLightCheck = (logicStep >= 3 && step3Fixed);
    const hasMaxLightCheck = (logicStep >= 4 && step4Fixed);
    
    if (hasMinLightCheck && readL < minThreshold && readR < minThreshold) {
      action = 'detenido (sin luz)';
    } else if (hasMaxLightCheck && readL > maxThreshold && readR > maxThreshold) {
      action = 'detenido (llegó)';
    } else {
      const calibratedDiff = resta - staticDiferenciaBase;
      if (calibratedDiff > staticUmbral) {
        action = 'girar izquierda';
      } else if (calibratedDiff < -staticUmbral) {
        action = 'girar derecha';
      } else {
        action = 'avanzar recto';
      }
    }
    
    return {
      readL,
      readR,
      resta,
      cleanResta,
      action,
    };
  }, [staticLightX, staticWorldMode, noiseTick, staticZoom, logicStep, step2Fixed, step3Fixed, step4Fixed, step5Fixed, step6Fixed, flashlightOn, umbral, luzAmbiental, luzMinimaThreshold]);

  // Append static history for Step 6 plotter
  useEffect(() => {
    if (activeTab !== 'theory') return;
    setStaticRawHistory(prev => [...prev.slice(1), staticTelemetry.resta]);
    setStaticFilteredHistory(prev => [...prev.slice(1), staticTelemetry.cleanResta]);
  }, [noiseTick, activeTab, staticTelemetry]);

  // Coordinate mapping from screen/CSS canvas position to 800x500 logical space
  const getLogicalMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = mainRectRef.current || canvas.getBoundingClientRect();
    
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    
    const scaleX = rect.width / FIELD_W;
    const scaleY = rect.height / FIELD_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (rect.width - FIELD_W * scale) / 2;
    const offsetY = (rect.height - FIELD_H * scale) / 2;
    
    let x = (cssX - offsetX) / scale;
    let y = (cssY - offsetY) / scale;
    
    if (zoomMain > 1.0) {
      if (followRobot) {
        const r = stateRef.current?.robot;
        if (r) {
          x = (x - FIELD_W / 2) / zoomMain + r.x;
          y = (y - FIELD_H / 2) / zoomMain + r.y;
        }
      } else {
        x = (x - FIELD_W / 2) / zoomMain + FIELD_W / 2 - panMain.x;
        y = (y - FIELD_H / 2) / zoomMain + FIELD_H / 2 - panMain.y;
      }
    }
    
    return { x, y };
  }, [zoomMain, followRobot, panMain]);

  // Drag light in static simulator
  const getStaticLogicalMouseX = (e, canvas) => {
    const rect = staticRectRef.current || canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const scaleX = rect.width / 500;
    const scaleY = rect.height / 300;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (rect.width - 500 * scale) / 2;
    
    return (cssX - offsetX) / scale;
  };

  const handleStaticMouseDown = (e) => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    staticRectRef.current = rect;
    staticDraggingRef.current = true;
    
    const mouseX = getStaticLogicalMouseX(e, canvas);
    const lx = 250 + staticLightX;
    
    if (Math.abs(mouseX - lx) < 30) {
      staticDraggingRef.current = true;
    }
  };
  
  const handleStaticMouseMove = (e) => {
    if (!staticDraggingRef.current) return;
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const mouseX = getStaticLogicalMouseX(e, canvas);
    const newX = Math.max(-220, Math.min(220, mouseX - 250));
    setStaticLightX(newX);
  };
  
  const handleStaticMouseUp = () => {
    staticDraggingRef.current = false;
    staticRectRef.current = null;
  };

  const handleThresholdMouseDown = (e, side) => {
    e.preventDefault();
    const bar = numberLineRef.current;
    if (!bar) return;
    
    const diffBase = (logicStep >= 5 && step5Fixed) ? -70 : 0;
    const rect = bar.getBoundingClientRect();
    const centerPct = (diffBase + 300) / 600;
    const center = rect.left + rect.width * centerPct;
    const width300 = rect.width / 2; // 300 units is half of the 600 unit width
    
    const handleMouseMove = (moveEvent) => {
      const mouseX = moveEvent.clientX;
      const deltaX = Math.abs(mouseX - center);
      
      let newUmbral = Math.round((deltaX / width300) * 300);
      newUmbral = Math.max(0, Math.min(200, newUmbral));
      setUmbral(newUmbral);
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Render Static Simulator Canvas (HD & DPR)
  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const W = 500;
    const H = 300;
    
    const layout = setupCanvas(canvas, W, H);
    if (!layout) return;
    const { dpr, scaleX, scaleY } = layout;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (layout.displayW - W * scale) / 2;
    const offsetY = (layout.displayH - H * scale) / 2;
    
    ctx.save();
    // Clear the entire physical canvas to avoid smearing trails
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Draw background (representation of a floor)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, W, H);    // Soft grid scroll and shake
    const isMovingForward = !staticTelemetry.action.startsWith('detenido');

    // Grid scrolling logic:
    // When turning, grid should shift horizontally to simulate pivot rotation.
    let scrollX = 0;
    let scrollY = 0;
    if (isMovingForward) {
      scrollY = (noiseTick * 6) % 20;
      if (staticTelemetry.action === 'girar izquierda') {
        scrollX = (noiseTick * 4.5) % 20;
      } else if (staticTelemetry.action === 'girar derecha') {
        scrollX = -(noiseTick * 4.5) % 20;
      }
    }
    
    let shouldShake = false;
    const currentUmbral = logicStep === 1 ? 0 : umbral;
    if (simularTemblor && flashlightOn && currentUmbral === 0 && Math.abs(staticLightX) > 0) {
      shouldShake = true;
    }
    
    let gridShakeX = 0;
    let robotShakeX = 0;
    let robotShakeAngle = 0;
    
    if (shouldShake) {
      gridShakeX = Math.sin(noiseTick * 2.2) * 5;
      robotShakeX = Math.cos(noiseTick * 2.2) * 6;
      robotShakeAngle = Math.sin(noiseTick * 2.2) * 0.12;
    }

    // Steer angle based on action (tilts the robot visually)
    let steerAngle = 0;
    if (staticTelemetry.action === 'girar izquierda') {
      steerAngle = -0.3; // -17 degrees
    } else if (staticTelemetry.action === 'girar derecha') {
      steerAngle = 0.3; // +17 degrees
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    // Render vertical grid lines (with horizontal slide offset)
    const gridOffsetX = (scrollX + gridShakeX) % 20;
    for (let x = gridOffsetX; x < W; x += 20) {
      ctx.beginPath(); 
      ctx.moveTo(x, 0); 
      ctx.lineTo(x, H); 
      ctx.stroke();
    }
    // Render horizontal grid lines
    const gridOffsetY = scrollY % 20;
    for (let y = gridOffsetY; y < H; y += 20) {
      ctx.beginPath(); 
      ctx.moveTo(0, y); 
      ctx.lineTo(W, y); 
      ctx.stroke();
    }
    
    const rx = W / 2;
    const ry = H - 60;
    const baseScale = 0.2;
    const ldrXOffset = 43 * baseScale;
    const ldrYOffset = 334 * baseScale;
    
    // Draw robot chassis scaled and translated (with wiggling shake & steer angle)
    ctx.save();
    ctx.translate(rx + robotShakeX, ry);
    ctx.rotate(robotShakeAngle + steerAngle);
    ctx.scale(staticZoom * baseScale, staticZoom * baseScale);
    ctx.translate(-393.23, -514.19); // Translate to the center of the chassis vector model
    drawRobotBody(ctx, '#4c97ff');
    
    // Draw Left and Right LDR sensor values on chassis
    const intensityL = staticTelemetry.readL / 1023;
    ctx.fillStyle = `rgb(${Math.round(intensityL * 255)}, ${Math.round(intensityL * 255)}, 0)`;
    ctx.beginPath();
    ctx.arc(350, 180, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffab19';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    const intensityR = staticTelemetry.readR / 1023;
    ctx.fillStyle = `rgb(${Math.round(intensityR * 255)}, ${Math.round(intensityR * 255)}, 0)`;
    ctx.beginPath();
    ctx.arc(436, 180, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffab19';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Sensor pin labels A0/A1
    ctx.fillStyle = intensityL > 0.6 ? '#000' : '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A0', 350, 186);
    
    ctx.fillStyle = intensityR > 0.6 ? '#000' : '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A1', 436, 186);
    
    ctx.restore(); // end of robot chassis scaling
    
    // Draw flashlight beam
    const lx = rx + staticLightX;
    const ly = 45;
    
    if (flashlightOn) {
      const angle = robotShakeAngle + steerAngle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const scaleTot = staticZoom * baseScale;
      
      const leftTransX = 350 - 393.23;
      const leftTransY = 180 - 514.19;
      const rightTransX = 436 - 393.23;
      const rightTransY = 180 - 514.19;
      
      const leftWorldX = rx + robotShakeX + (leftTransX * cosA - leftTransY * sinA) * scaleTot;
      const leftWorldY = ry + (leftTransX * sinA + leftTransY * cosA) * scaleTot;
      
      const rightWorldX = rx + robotShakeX + (rightTransX * cosA - rightTransY * sinA) * scaleTot;
      const rightWorldY = ry + (rightTransX * sinA + rightTransY * cosA) * scaleTot;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(leftWorldX, leftWorldY);
      ctx.moveTo(lx, ly);
      ctx.lineTo(rightWorldX, rightWorldY);
      ctx.strokeStyle = 'rgba(255, 171, 25, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
      
      // Flashlight glow
      const glow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 95);
      glow.addColorStop(0, 'rgba(255, 235, 150, 0.75)');
      glow.addColorStop(0.4, 'rgba(255, 171, 25, 0.35)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, 95, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Flashlight body
    ctx.fillStyle = flashlightOn ? '#fffbeb' : '#334155';
    ctx.strokeStyle = flashlightOn ? '#ffab19' : '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lx, ly, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(flashlightOn ? '🔦' : '🔌', lx, ly + 3.5);
    
    // Draw distance label in cm
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffab19';
    ctx.fillText(`${(staticLightX / 15.0).toFixed(1)} cm`, lx, ly - 15);
    
    ctx.restore();
  }, [staticLightX, staticWorldMode, staticZoom, staticTelemetry, activeTab, flashlightOn, noiseTick, logicStep, step2Fixed, step3Choice, step3Fixed, umbral, simularTemblor]);

  // Initial state helper
  const initState = useCallback(() => ({
    robot: {
      x: FIELD_W / 2,
      y: FIELD_H / 2 + 100,
      angle: -Math.PI / 2, 
      vx: 0,
      vy: 0,
      omega: 0,
    },
    light: {
      x: FIELD_W / 2,
      y: FIELD_H / 2 - 100,
      isDragging: false,
    },
    sensorLeft: { x: 0, y: 0, value: 100 },
    sensorRight: { x: 0, y: 0, value: 100 },
  }), []);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  // Quick reset of robot position only (Home button)
  const handleGoHome = () => {
    const s = stateRef.current;
    if (s) {
      s.robot.x = FIELD_W / 2;
      s.robot.y = FIELD_H / 2 + 100;
      s.robot.angle = -Math.PI / 2;
      s.robot.vx = 0;
      s.robot.vy = 0;
      s.robot.omega = 0;
    }
    setPlotHistory(Array(60).fill(0));
  };

  // Reset simulation completely
  const handleReset = () => {
    stateRef.current = initState();
    setPlotHistory(Array(60).fill(0));
    setZoomMain(1.0);
    setPanMain({ x: 0, y: 0 });
    setFollowRobot(false);
  };

  const handleWorldModeChange = (mode) => {
    setWorldMode(mode);
    if (mode === 'ideal') {
      setDiferenciaBase(0);
      setUseNoise(false);
    } else {
      setDiferenciaBase(0); // Mismatched (uncalibrated)
      setUseNoise(true);
    }
  };

  // Main canvas interaction
  const handleMouseDown = (e) => {
    const s = stateRef.current;
    if (!s) return;

    const { x: mouseX, y: mouseY } = getLogicalMousePos(e);
    const dist = Math.sqrt((mouseX - s.light.x) ** 2 + (mouseY - s.light.y) ** 2);

    if (lightMode === 'drag' && dist < 30) {
      s.light.isDragging = true;
    } else if (zoomMain > 1.0 && !followRobot) {
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panMain.x,
        panY: panMain.y
      };
    }
  };

  const handleMouseMove = (e) => {
    const s = stateRef.current;
    if (!s) return;

    if (s.light.isDragging) {
      const { x: mouseX, y: mouseY } = getLogicalMousePos(e);
      s.light.x = Math.max(15, Math.min(FIELD_W - 15, mouseX));
      s.light.y = Math.max(15, Math.min(FIELD_H - 15, mouseY));
    } else if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPanMain({
        x: panStartRef.current.panX + dx / zoomMain,
        y: panStartRef.current.panY + dy / zoomMain
      });
    } else if (lightMode === 'follow') {
      const { x: mouseX, y: mouseY } = getLogicalMousePos(e);
      s.light.x = Math.max(15, Math.min(FIELD_W - 15, mouseX));
      s.light.y = Math.max(15, Math.min(FIELD_H - 15, mouseY));
    }
  };

  const handleMouseUp = () => {
    const s = stateRef.current;
    if (s) s.light.isDragging = false;
    isPanningRef.current = false;
  };

  // Physical simulation logic loop
  const update = useCallback((dt) => {
    const s = stateRef.current;
    if (!s) return;

    const r = s.robot;
    const l = s.light;

    const sensorDistFront = 37;
    const sensorDistSide = 6.0;

    const sL_x = r.x + sensorDistFront * Math.cos(r.angle) + sensorDistSide * Math.sin(r.angle);
    const sL_y = r.y + sensorDistFront * Math.sin(r.angle) - sensorDistSide * Math.cos(r.angle);

    const sR_x = r.x + sensorDistFront * Math.cos(r.angle) - sensorDistSide * Math.sin(r.angle);
    const sR_y = r.y + sensorDistFront * Math.sin(r.angle) + sensorDistSide * Math.cos(r.angle);

    s.sensorLeft.x = sL_x;
    s.sensorLeft.y = sL_y;
    s.sensorRight.x = sR_x;
    s.sensorRight.y = sR_y;

    const dL = Math.sqrt((sL_x - l.x) ** 2 + (sL_y - l.y) ** 2);
    const dR = Math.sqrt((sR_x - l.x) ** 2 + (sR_y - l.y) ** 2);

    const vecL_x = (l.x - sL_x) / (dL || 1);
    const vecL_y = (l.y - sL_y) / (dL || 1);
    const cosL = vecL_x * Math.cos(r.angle) + vecL_y * Math.sin(r.angle);

    const vecR_x = (l.x - sR_x) / (dR || 1);
    const vecR_y = (l.y - sR_y) / (dR || 1);
    const cosR = vecR_x * Math.cos(r.angle) + vecR_y * Math.sin(r.angle);

    const scaleFactor = 160;
    let readL = 1023 * (scaleFactor / (dL + scaleFactor)) * Math.max(0.12, cosL);
    let readR = 1023 * (scaleFactor / (dR + scaleFactor)) * Math.max(0.12, cosR);

    if (worldMode === 'real') {
      readL -= 35;
      readR += 35;

      if (useNoise) {
        const noiseL = (Math.random() - 0.5) * 32;
        const noiseR = (Math.random() - 0.5) * 32;

        if (useFilter) {
          readL += noiseL / 10;
          readR += noiseR / 10;
        } else {
          readL += noiseL;
          readR += noiseR;
        }
      }
    }

    readL = Math.max(0, Math.min(1023, Math.round(readL)));
    readR = Math.max(0, Math.min(1023, Math.round(readR)));

    s.sensorLeft.value = readL;
    s.sensorRight.value = readR;

    const resta = readL - readR;

    let action = 'adelante';
    let targetLeftPwm = 255;
    let targetRightPwm = 255;
    const luzMinima = 300;
    const luzMaxima = 850;

    if (readL < luzMinima && readR < luzMinima) {
      action = 'detenido (sin luz)';
      targetLeftPwm = 0;
      targetRightPwm = 0;
    } else if (readL > luzMaxima && readR > luzMaxima) {
      action = 'detenido (llegó)';
      targetLeftPwm = 0;
      targetRightPwm = 0;
    } else if (resta > (diferenciaBase + umbral)) {
      action = 'izquierda';
      targetLeftPwm = -100; 
      targetRightPwm = 255; 
    } else if (resta < (diferenciaBase - umbral)) {
      action = 'derecha';
      targetLeftPwm = 255;  
      targetRightPwm = -100; 
    }

    const avgDist = (dL + dR) / 2;
    if (avgDist < 65 && action !== 'detenido (sin luz)' && action !== 'detenido (llegó)') {
      targetLeftPwm = 0;
      targetRightPwm = 0;
      action = 'detenido (llegó)';
    }

    const maxV = 110 * speedMultiplier;
    const vL = (targetLeftPwm / 255) * maxV;
    const vR = (targetRightPwm / 255) * maxV;

    const linV = (vL + vR) / 2;
    const angV = (vL - vR) / WHEELBASE;

    r.angle += angV * dt;
    r.x += Math.cos(r.angle) * linV * dt;
    r.y += Math.sin(r.angle) * linV * dt;

    r.x = Math.max(20, Math.min(FIELD_W - 20, r.x));
    r.y = Math.max(20, Math.min(FIELD_H - 20, r.y));

    setTelemetry({
      sIzquierdo: readL,
      sDerecho: readR,
      resta: Math.round(resta),
      action,
      leftPwm: Math.round(targetLeftPwm),
      rightPwm: Math.round(targetRightPwm),
    });

    setPlotHistory(prev => [...prev.slice(1), resta]);
  }, [worldMode, diferenciaBase, umbral, useFilter, useNoise, speedMultiplier, lightMode]);

  // Main canvas render routine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    if (!s) return;

    const r = s.robot;
    const l = s.light;

    const layout = setupCanvas(canvas, FIELD_W, FIELD_H);
    if (!layout) return;
    const { dpr, scaleX, scaleY } = layout;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (layout.displayW - FIELD_W * scale) / 2;
    const offsetY = (layout.displayH - FIELD_H * scale) / 2;

    ctx.save();
    // Clear the entire physical canvas to avoid smearing trails
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(dpr, dpr);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Zoom & Pan transformation
    if (zoomMain > 1.0) {
      ctx.translate(FIELD_W / 2, FIELD_H / 2);
      ctx.scale(zoomMain, zoomMain);
      if (followRobot) {
        ctx.translate(-r.x, -r.y);
      } else {
        ctx.translate(-FIELD_W / 2 + panMain.x, -FIELD_H / 2 + panMain.y);
      }
    }

    // Draw background grid (Dark Slate floor representation)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 20; x < FIELD_W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD_H); ctx.stroke();
    }
    for (let y = 20; y < FIELD_H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD_W, y); ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, FIELD_W, FIELD_H);

    // Light ray cones
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(s.sensorLeft.x, s.sensorLeft.y);
    ctx.moveTo(l.x, l.y);
    ctx.lineTo(s.sensorRight.x, s.sensorRight.y);
    ctx.strokeStyle = 'rgba(255, 171, 25, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();

    // Flashlight glow
    const lightGlow = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, 110);
    lightGlow.addColorStop(0, 'rgba(255, 235, 150, 0.75)');
    lightGlow.addColorStop(0.3, 'rgba(255, 171, 25, 0.35)');
    lightGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 110, 0, Math.PI * 2);
    ctx.fill();

    // Flashlight bulb
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#ffab19';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡', l.x, l.y + 4);

    // Robot body
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle + Math.PI / 2);
    ctx.scale(SCALE, SCALE);
    ctx.translate(-393.23, -514.19); // Translate to the center of the chassis vector model
    drawRobotBody(ctx, '#4c97ff');

    // Draw sensor readings A0 & A1 on chassis
    const ldrIntensityL = (s.sensorLeft.value / 1023) * 255;
    ctx.fillStyle = `rgb(${Math.round(ldrIntensityL)}, ${Math.round(ldrIntensityL)}, 0)`;
    ctx.beginPath(); ctx.arc(350, 180, 25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffab19'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = ldrIntensityL > 150 ? '#000' : '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('A0', 350, 186);

    const ldrIntensityR = (s.sensorRight.value / 1023) * 255;
    ctx.fillStyle = `rgb(${Math.round(ldrIntensityR)}, ${Math.round(ldrIntensityR)}, 0)`;
    ctx.beginPath(); ctx.arc(436, 180, 25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffab19'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = ldrIntensityR > 150 ? '#000' : '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('A1', 436, 186);

    ctx.restore(); // end of robot translate

    ctx.restore();
  }, [worldMode, zoomMain, panMain, followRobot]);

  // Main animation frame loop trigger
  useEffect(() => {
    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      update(dt);
      render();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [update, render]);

  return (
    <div className="w-screen h-screen scratch-page overflow-hidden flex flex-row select-none p-4 gap-4">
      {/* Inject custom Scratch styles */}
      <style>{scratchStyles}</style>

      {activeTab === 'simulator' ? (
        /* ==================== TAB 1: PISTA DE PRUEBAS ==================== */
        <>
          {/* COLUMN 1: LEFT SIDEBAR (Controls & Navigation) */}
          <aside className="w-[320px] scratch-card p-5 shrink-0 flex flex-col gap-5 scratch-scrollbar overflow-y-auto">
            
            {/* Navigation & Tab selectors */}
            <div className="flex flex-col gap-3">
              <a href="/" className="scratch-btn scratch-btn-gray w-full font-bold text-xs uppercase tracking-wider">
                ← Volver al Curso
              </a>
              
              <div className="flex flex-col gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setActiveTab('simulator')} 
                  className={`scratch-btn ${activeTab === 'simulator' ? 'scratch-btn-blue text-white' : 'text-slate-650 hover:text-slate-800 bg-transparent'}`}
                >
                  🎮 Pista de Pruebas
                </button>
                <button 
                  onClick={() => setActiveTab('theory')} 
                  className={`scratch-btn ${activeTab === 'theory' ? 'scratch-btn-blue text-white' : 'text-slate-650 hover:text-slate-800 bg-transparent'}`}
                >
                  🧠 Entrenamiento Lógico
                </button>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Pista de Pruebas configs */}
            <div className="flex-1 flex flex-col gap-5">
              <section className="space-y-2">
                <span className="scratch-panel-header block">🌍 Configurar Entorno</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => handleWorldModeChange('ideal')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition ${worldMode === 'ideal' ? 'bg-white text-[#4c97ff] border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Mundo Ideal
                  </button>
                  <button
                    onClick={() => handleWorldModeChange('real')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition ${worldMode === 'real' ? 'bg-white text-[#4c97ff] border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Mundo Real
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic font-semibold leading-normal">
                  {worldMode === 'ideal' 
                    ? '☀️ Sin ruido ni descalibración física. Resta = 0 en el centro.'
                    : '⚠️ Sensores con desfase real (-70) y ruido eléctrico.'}
                </p>
              </section>

              <section className="space-y-2">
                <span className="scratch-panel-header block">🔦 Control de Linterna</span>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setLightMode('drag')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition ${lightMode === 'drag' ? 'bg-white text-brand-orange border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Arrastrar Foco
                  </button>
                  <button
                    onClick={() => setLightMode('follow')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition ${lightMode === 'follow' ? 'bg-white text-brand-orange border border-slate-200 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Seguir Mouse
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <span className="scratch-panel-header block">🎛️ Calibración de Variables</span>
                
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Estado de Sensores:</span>
                    <span className="text-brand-orange font-mono font-bold text-xs">
                      {worldMode === 'real' ? 'Desalineados' : 'Ideales'}
                    </span>
                  </div>
                  
                  {worldMode === 'real' ? (
                    <div className="space-y-2 pt-1">
                      {diferenciaBase !== -70 ? (
                        <>
                          <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 leading-tight">
                            ❌ Desfase detectado: -70 (El robot dará vueltas)
                          </div>
                          <button
                            onClick={() => setDiferenciaBase(-70)}
                            className="scratch-btn scratch-btn-blue w-full py-1.5 text-[10px] uppercase font-black tracking-wider"
                          >
                            🛠️ Calibrar Sensores
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] text-emerald-650 font-bold flex items-center gap-1 leading-tight">
                            ✅ Calibración compensada (-70 aplicado)
                          </div>
                          <button
                            onClick={() => setDiferenciaBase(0)}
                            className="scratch-btn scratch-btn-gray w-full py-1.5 text-[10px] uppercase font-black tracking-wider"
                          >
                            Resetear Calibración
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-semibold pt-1 leading-tight">
                      🤖 Calibración no requerida. Los sensores leen la luz con simetría perfecta.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Sensibilidad (Umbral):</span>
                    <span className="text-brand-orange font-mono font-bold text-xs">{umbral}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={umbral}
                    onChange={(e) => setUmbral(parseInt(e.target.value))}
                    onDoubleClick={() => setUmbral(50)}
                    className="scratch-slider"
                    title="Doble clic para restablecer a 50"
                  />
                  <span className="text-[9px] text-slate-500 block leading-tight">
                    Zona muerta para evitar oscilaciones innecesarias.
                  </span>
                </div>
              </section>

              {worldMode === 'real' && (
                <section className="space-y-2">
                  <span className="scratch-panel-header block">📈 Suavizar Señal</span>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useFilter}
                      onChange={(e) => setUseFilter(e.target.checked)}
                      className="rounded border-slate-300 text-brand-green accent-brand-green w-4 h-4 cursor-pointer"
                    />
                    <span>Filtro de Promedio (100 muestras)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useNoise}
                      onChange={(e) => setUseNoise(e.target.checked)}
                      className="rounded border-slate-300 text-brand-red accent-[#ff6680] w-4 h-4 cursor-pointer"
                    />
                    <span>Ruido Eléctrico (Habitación)</span>
                  </label>
                </section>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button onClick={handleGoHome} className="scratch-btn scratch-btn-orange w-full">
                  🏠 Volver al Inicio
                </button>
                <button onClick={handleReset} className="scratch-btn scratch-btn-gray w-full">
                  🔄 Reiniciar Pista
                </button>
              </div>
            </div>
          </aside>

          {/* COLUMN 2: CENTER AREA (Simulation View) */}
          <main className="flex-1 scratch-card p-5 flex flex-col justify-between overflow-hidden relative">
            <div ref={mainSimContainerRef} className="flex-1 flex flex-col justify-between items-center relative w-full h-full">
              {/* Canvas Stage */}
              <div className="flex-1 w-full bg-[#0f172a] rounded-2xl border-4 border-slate-350 overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className={`w-full h-full block ${lightMode === 'follow' ? 'cursor-none' : 'cursor-default'}`}
                />
                
                {/* Floating Proyect Tool Bar */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 border border-slate-300 p-2 rounded-2xl shadow-md backdrop-blur-xs select-none">
                  <button
                    onClick={() => setZoomMain(z => Math.min(3.0, z + 0.25))}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 active:scale-90 text-sm flex items-center justify-center"
                    title="Acercar Zoom"
                  >
                    🔍+
                  </button>
                  <button
                    onClick={() => setZoomMain(z => Math.max(1.0, z - 0.25))}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 active:scale-90 text-sm flex items-center justify-center"
                    title="Alejar Zoom"
                  >
                    🔍-
                  </button>
                  <button
                    onClick={() => { setZoomMain(1.0); setPanMain({ x: 0, y: 0 }); }}
                    className="px-2 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 active:scale-90 text-[10px] flex items-center justify-center"
                  >
                    Reset
                  </button>
                  <span className="w-px h-5 bg-slate-300" />
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={followRobot}
                      onChange={(e) => setFollowRobot(e.target.checked)}
                      className="rounded border-slate-300 text-brand-blue w-3.5 h-3.5"
                    />
                    <span>Seguir Robot</span>
                  </label>
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreenMain}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl transition select-none active:scale-95 text-xs font-black shadow-md border border-slate-300"
                  title="Pantalla Completa"
                >
                  🖥️ Pantalla Completa
                </button>

                {/* Zoom & Pan indicator label */}
                {zoomMain > 1.0 && (
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white rounded-lg px-2 py-1 text-[9px] font-mono pointer-events-none">
                    Zoom: {zoomMain.toFixed(2)}x | Pan: ({Math.round(panMain.x)}, {Math.round(panMain.y)})cm
                    {!followRobot && " [Arrastra el fondo para mover la cámara]"}
                  </div>
                )}
              </div>

              {/* Dynamic footnote */}
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider text-center mt-3 shrink-0">
                🔦 {lightMode === 'drag' ? 'Haz clic y arrastra la linterna en el lienzo para guiar al robot.' : 'Mueve el puntero dentro de la pista y el robot lo seguirá.'}
              </p>
            </div>
          </main>

          {/* COLUMN 3: RIGHT SIDEBAR (Telemetry & Monitor) */}
          <aside className="w-[320px] scratch-card p-5 shrink-0 flex flex-col gap-4 scratch-scrollbar overflow-y-auto">
            <span className="scratch-panel-header block">📊 Lecturas del Robot</span>

            {/* Sensor readings */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
                <span className="text-[9px] font-black text-brand-blue uppercase tracking-wider block mb-1">Sensor Izq (A0)</span>
                <span className="text-lg font-black text-blue-700 font-mono">{telemetry.sIzquierdo}</span>
              </div>
              <div className="p-3 bg-green-50 border-2 border-green-200 rounded-2xl text-center">
                <span className="text-[9px] font-black text-brand-green uppercase tracking-wider block mb-1">Sensor Der (A1)</span>
                <span className="text-lg font-black text-green-700 font-mono">{telemetry.sDerecho}</span>
              </div>
            </div>

            {/* Formula box */}
            <div className="p-4 bg-[#fffbeb] border-3 border-[#ffe0b2] rounded-2xl text-center space-y-1 shadow-sm">
              <span className="text-[10px] font-black text-[#e6950f] uppercase tracking-wider block">Resta (A0 - A1)</span>
              <span className="text-3xl font-black text-brand-orange font-mono block">
                {telemetry.resta >= 0 ? `+${telemetry.resta}` : telemetry.resta}
              </span>
              <div className="text-[9px] font-bold text-[#b27914] leading-tight space-y-1.5">
                <div>Giro activo si sale del umbral:</div>
                <span className="text-brand-orange bg-white px-2 py-0.5 rounded-lg font-mono text-[10px] border border-orange-200 inline-block font-bold">
                  [{diferenciaBase - umbral} a {diferenciaBase + umbral}]
                </span>
                <div className="text-slate-500 text-[8.5px] mt-1 font-semibold leading-normal pt-1 border-t border-[#ffe0b2]/50">
                  ⚠️ Solo gira si hay luz suficiente: al menos un sensor debe marcar <span className="font-bold text-slate-700">entre 300 y 850</span>. De lo contrario, se detiene.
                </div>
              </div>
            </div>

            {/* Motors */}
            <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
              <span className="text-[10px] font-black text-slate-550 uppercase tracking-widest block mb-1">⚙️ Motores</span>
              <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-black">
                <div className="p-2 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">MOTOR IZQ</span>
                  <span className={telemetry.leftPwm > 0 ? 'text-green-600' : telemetry.leftPwm < 0 ? 'text-orange-500' : 'text-slate-450'}>
                    {telemetry.leftPwm > 0 ? `ADELANTE` : telemetry.leftPwm < 0 ? `ATRÁS` : 'PARADO'}
                  </span>
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">MOTOR DER</span>
                  <span className={telemetry.rightPwm > 0 ? 'text-green-600' : telemetry.rightPwm < 0 ? 'text-orange-500' : 'text-slate-450'}>
                    {telemetry.rightPwm > 0 ? `ADELANTE` : telemetry.rightPwm < 0 ? `ATRÁS` : 'PARADO'}
                  </span>
                </div>
              </div>
              
              <div className={`p-2 rounded-xl text-center font-bold text-[10px] uppercase tracking-wider text-white shadow-sm border ${
                telemetry.action === 'izquierda' ? 'bg-[#4c97ff] border-blue-600' :
                telemetry.action === 'derecha' ? 'bg-[#9966ff] border-purple-600' :
                telemetry.action.startsWith('detenido') ? 'bg-[#ff6680] border-red-650 animate-pulse' : 'bg-[#5cb85c] border-green-650'
              }`}>
                Acción: {telemetry.action}
              </div>
            </div>

            {/* Scrolling Monitor Graph */}
            <div className="flex-1 flex flex-col min-h-[140px] bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden p-3 shadow-inner">
              <span className="text-[9px] font-black text-slate-550 uppercase tracking-widest block mb-2">📈 Monitor Serie: Resta LDR</span>
              <div className="flex-1 relative flex items-center justify-center bg-white rounded-lg border border-slate-200">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                  
                  {(() => {
                    const upperY = 50 - ((diferenciaBase + umbral) / 300) * 45;
                    const lowerY = 50 - ((diferenciaBase - umbral) / 300) * 45;
                    return (
                      <>
                        <rect x="0" y={Math.min(upperY, lowerY)} width="100" height={Math.max(2, Math.abs(upperY - lowerY))} fill="rgba(255,171,25,0.06)" />
                        <line x1="0" y1={upperY} x2="100" y2={upperY} stroke="rgba(255,171,25,0.35)" strokeWidth="0.5" strokeDasharray="3,3" />
                        <line x1="0" y1={lowerY} x2="100" y2={lowerY} stroke="rgba(255,171,25,0.35)" strokeWidth="0.5" strokeDasharray="3,3" />
                      </>
                    );
                  })()}

                  <polyline
                    fill="none"
                    stroke="#4c97ff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={plotHistory.map((val, idx) => {
                      const x = (idx / (plotHistory.length - 1)) * 100;
                      const y = Math.max(0, Math.min(100, 50 - (val / 300) * 45));
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                </svg>
                <div className="absolute left-1 top-1 text-[8px] text-slate-400 font-mono font-bold bg-white/80 px-1 border border-slate-100 rounded">+300</div>
                <div className="absolute left-1 bottom-1 text-[8px] text-slate-400 font-mono font-bold bg-white/80 px-1 border border-slate-100 rounded">-300</div>
                <div className="absolute left-1 top-[43%] text-[8px] text-slate-400 font-mono bg-white/80 px-1">0</div>
                <div className="absolute right-1 top-1 text-[8px] text-slate-600 bg-slate-100 border border-slate-200 px-1 rounded font-mono font-bold">
                  {telemetry.resta}
                </div>
              </div>
            </div>

            {/* Speed selector */}
            <div className="space-y-1 shrink-0">
              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">🏎️ Velocidad</span>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-center text-[9px] font-black">
                {[{ label: 'Lento', val: 0.5 }, { label: 'Normal', val: 1.0 }, { label: 'Rápido', val: 1.5 }].map(sp => (
                  <button
                    key={sp.label}
                    onClick={() => setSpeedMultiplier(sp.val)}
                    className={`py-1 rounded-lg transition active:scale-95 ${speedMultiplier === sp.val ? 'bg-white text-slate-800 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-700 bg-transparent'}`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </>
      ) : (
        /* ==================== TAB 2: ENTRENAMIENTO LÓGICO ==================== */
        <>
          {/* COLUMN 1: LEFT SIDEBAR (Step Selection & Lab Settings) */}
          <aside className="w-[320px] scratch-card p-5 shrink-0 flex flex-col justify-between scratch-scrollbar overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Back & Switch */}
              <div className="flex flex-col gap-3">
                <a href="/" className="scratch-btn scratch-btn-gray w-full font-bold text-xs uppercase tracking-wider">
                  ← Volver al Curso
                </a>
                
                <div className="flex flex-col gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button 
                    onClick={() => setActiveTab('simulator')} 
                    className="scratch-btn text-slate-650 hover:text-slate-800 bg-transparent py-2 text-xs"
                  >
                    🎮 Pista de Pruebas
                  </button>
                  <button 
                    onClick={() => setActiveTab('theory')} 
                    className="scratch-btn scratch-btn-blue text-white py-2 text-xs"
                  >
                    🧠 Entrenamiento Lógico
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Step Navigation vertically */}
              <div className="space-y-2">
                <span className="scratch-panel-header block">🧠 Pasos de Aprendizaje</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { s: 1, label: 'Lógica básica' },
                    { s: 2, label: 'Tolerancia' },
                    { s: 3, label: 'Luz mínima' },
                    { s: 4, label: 'Luz máxima' },
                    { s: 5, label: 'Calibración' },
                    { s: 6, label: 'Filtro promedio' },
                  ].map(item => (
                    <button
                      key={item.s}
                      onClick={() => setLogicStep(item.s)}
                      className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between active:scale-95 ${
                        logicStep === item.s
                          ? 'bg-blue-50 border-brand-blue shadow-xs text-brand-blue'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span className="text-[9px] font-black block leading-none">Paso {item.s}</span>
                      <span className="text-[8px] font-bold block mt-1 truncate leading-none">{item.label}</span>
                      {logicStep === item.s && (
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-blue rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Lab configuration */}
              <div className="space-y-4">
                <span className="scratch-panel-header block">🔬 Controles del Laboratorio</span>
                
                {/* Flashlight ON/OFF */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-650">Linterna:</span>
                  <button
                    onClick={() => setFlashlightOn(!flashlightOn)}
                    className={`scratch-btn py-1 px-3 text-[10px] ${flashlightOn ? 'scratch-btn-orange' : 'scratch-btn-gray'}`}
                  >
                    {flashlightOn ? 'Encendida' : 'Apagada'}
                  </button>
                </div>

                {/* Light position */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Posición Linterna:</span>
                    <span className="font-mono text-brand-orange">{(staticLightX / 15.0).toFixed(1)} cm</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={staticLightX}
                    onChange={(e) => setStaticLightX(parseInt(e.target.value))}
                    onDoubleClick={() => setStaticLightX(0)}
                    className="scratch-slider"
                    title="Doble clic para centrar la linterna"
                  />
                </div>

                {/* Distance to light */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Distancia a Linterna:</span>
                    <span className="font-mono text-brand-blue">{(3.0 - staticZoom).toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={staticZoom}
                    onChange={(e) => setStaticZoom(parseFloat(e.target.value))}
                    onDoubleClick={() => setStaticZoom(1.5)}
                    className="scratch-slider scratch-slider-blue"
                    title="Doble clic para restablecer a 1.5 m"
                  />
                </div>

                {/* Ambient Light and Minimum Threshold Sliders for step >= 3 */}
                {logicStep >= 3 && (
                  <>
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-bold text-slate-650">
                        <span>Luz Ambiental (Oscuridad):</span>
                        <span className="font-mono text-brand-orange">{luzAmbiental}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="600"
                        value={luzAmbiental}
                        onChange={(e) => setLuzAmbiental(parseInt(e.target.value))}
                        onDoubleClick={() => setLuzAmbiental(350)}
                        className="scratch-slider"
                        title="Doble clic para restablecer a 350"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-655">
                        <span>Umbral Luz Mínima:</span>
                        <span className="font-mono text-brand-blue">{luzMinimaThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="600"
                        value={luzMinimaThreshold}
                        onChange={(e) => setLuzMinimaThreshold(parseInt(e.target.value))}
                        onDoubleClick={() => setLuzMinimaThreshold(300)}
                        className="scratch-slider scratch-slider-blue"
                        title="Doble clic para restablecer a 300"
                      />
                    </div>
                  </>
                )}

                {/* Environment Mode selection (Steps >= 5) */}
                {logicStep >= 5 && (
                  <div className="space-y-1.5 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                    <span className="text-[10px] font-black text-blue-700 uppercase block mb-1">Modelo de Sensores</span>
                    <div className="grid grid-cols-2 gap-1.5 bg-white p-0.5 rounded-xl border border-blue-200">
                      <button
                        onClick={() => setStaticWorldMode('ideal')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition ${staticWorldMode === 'ideal' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Lecturas Ideales
                      </button>
                      <button
                        onClick={() => setStaticWorldMode('real')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition ${staticWorldMode === 'real' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Lecturas Reales
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Guide drawer button at bottom */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => setShowTeacherGuide(true)}
                className="scratch-btn scratch-btn-green w-full flex items-center justify-center gap-2 text-xs py-2"
              >
                <span>📖</span> Guía del Docente
              </button>
            </div>
          </aside>

          {/* COLUMN 2: CENTER MAIN AREA (Static Simulator View) */}
          <main className="flex-1 scratch-card p-5 flex flex-col justify-between overflow-hidden relative">
            {/* Header info */}
            <div className="space-y-1 border-b border-slate-100 pb-3 shrink-0 flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4c97ff] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block">
                  Desafío Lógico - Paso {logicStep}
                </span>
                <h2 className="text-base font-black text-slate-800">
                  {logicStep === 1 && "1. Lógica Condicional Básica"}
                  {logicStep === 2 && "2. Zona Muerta (Umbral de Tolerancia)"}
                  {logicStep === 3 && "3. Luz de Habitación (Luz Mínima)"}
                  {logicStep === 4 && "4. Parada de Proximidad (Luz Máxima)"}
                  {logicStep === 5 && "5. Desfase Físico (Calibración)"}
                  {logicStep === 6 && "6. Ruido Analógico y Promedio"}
                </h2>
                <p className="text-[11px] text-slate-500 leading-normal font-semibold max-w-[550px]">
                  {logicStep === 1 && "El robot compara los sensores analógicos A0 y A1 para avanzar recto o girar."}
                  {logicStep === 2 && "El robot necesita un umbral de tolerancia para evitar temblores ante pequeñas desviaciones."}
                  {logicStep === 3 && "En la oscuridad, ambos sensores leen bajo. Evita que el robot ande sin luz."}
                  {logicStep === 4 && "Al estar bajo la linterna, ambos sensores leen muy alto. Detén el robot al llegar."}
                  {logicStep === 5 && "Los sensores reales leen diferente (desfase de -70). Corrígelo en el código."}
                  {logicStep === 6 && "Las lecturas reales tienen ruido eléctrico. Promedia 100 muestras para estabilizar."}
                </p>
              </div>
              
              <button
                onClick={() => setShowTeacherGuide(true)}
                className="scratch-btn bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#2e7d32] border border-[#a5d6a7] text-[10px] font-black py-1 px-3 flex items-center gap-1.5 transition active:scale-95 shrink-0"
              >
                <span>💡</span> Guía de Aula
              </button>
            </div>

            {/* Static simulator canvas */}
            <div className="flex-1 w-full bg-[#0f172a] rounded-2xl border-4 border-slate-350 overflow-hidden relative shadow-inner my-3 flex items-center justify-center min-h-[180px]">
              <canvas
                ref={staticCanvasRef}
                width={500}
                height={300}
                onMouseDown={handleStaticMouseDown}
                onMouseMove={handleStaticMouseMove}
                onMouseUp={handleStaticMouseUp}
                onMouseLeave={handleStaticMouseUp}
                className="w-full h-full rounded-2xl cursor-grab active:cursor-grabbing"
              />
              
              <button 
                onClick={() => setStaticLightX(0)}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 hover:bg-white text-slate-700 rounded-xl text-[10px] font-black border border-slate-300 shadow-md transition active:scale-95"
              >
                Centrar Foco 🔦
              </button>

              {logicStep === 3 && !flashlightOn && !step3Fixed && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center z-25 rounded-2xl">
                  {step3Choice === null ? (
                    <div className="bg-white border-4 border-slate-300 rounded-2xl p-4 max-w-sm shadow-2xl space-y-3">
                      <span className="text-2xl">🔌</span>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Habitación a oscuras / Luz Ambiental
                      </h3>
                      <p className="text-[10px] text-slate-550 font-bold leading-normal">
                        Si apagamos la linterna, los sensores leen solo la luz ambiental (igual a {luzAmbiental}). Como ambos leen igual, la Resta = 0. ¿Qué hará el seguidor de luz?
                      </p>
                      <div className="flex flex-col gap-2 pt-2 w-full">
                        <button 
                          onClick={() => setStep3Choice('A')}
                          className="scratch-btn scratch-btn-gray py-2 text-[10px]"
                        >
                          A) Se detiene automáticamente porque no hay luz.
                        </button>
                        <button 
                          onClick={() => setStep3Choice('B')}
                          className="scratch-btn scratch-btn-blue py-2 text-[10px]"
                        >
                          B) Sigue avanzando recto a ciegas (Resta = 0).
                        </button>
                      </div>
                    </div>
                  ) : step3Choice === 'A' ? (
                    <div className="bg-white border-4 border-red-300 rounded-2xl p-4 max-w-sm shadow-2xl space-y-3">
                      <span className="text-2xl">✕</span>
                      <h3 className="text-xs font-black text-red-700 uppercase">Respuesta Incorrecta</h3>
                      <p className="text-[10px] text-slate-550 font-bold leading-normal">
                        ¡No! El robot no es inteligente por sí mismo. Si la Resta = 0 y no hemos programado una parada de seguridad, la lógica básica le ordenará avanzar recto a ciegas.
                      </p>
                      <button 
                        onClick={() => setStep3Choice(null)}
                        className="scratch-btn scratch-btn-red py-1.5 px-4 text-[10px] w-full"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border-4 border-emerald-300 rounded-2xl p-4 max-w-sm shadow-2xl space-y-3">
                      <span className="text-2xl">🎉</span>
                      <h3 className="text-xs font-black text-emerald-700 uppercase">¡Respuesta Correcta!</h3>
                      <p className="text-[10px] text-slate-550 font-bold leading-normal">
                        ¡Exacto! Al ser Resta = 0, el robot cree que la luz está al frente y avanza recto a ciegas. ¡Esto agotará la batería o hará que choque en la oscuridad!
                      </p>
                      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-[9px] text-emerald-800 font-semibold leading-normal">
                          Mira al robot avanzar a ciegas en el simulador. Ahora aplica la solución para detenerlo.
                        </p>
                      </div>
                      <div className="flex justify-center w-full">
                        <button 
                          onClick={() => {
                            setStep3Fixed(true);
                            setStep3Choice(null);
                          }}
                          className="scratch-btn scratch-btn-green py-2 px-4 text-[10px] font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full border border-emerald-700 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          Aplicar Parada de Seguridad 🔧
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {logicStep === 4 && staticTelemetry.readL > 850 && staticTelemetry.readR > 850 && !step4Fixed && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center z-25 rounded-2xl">
                  <div className="bg-white border-4 border-red-300 rounded-2xl p-4 max-w-sm shadow-2xl space-y-3 animate-fade-in">
                    <span className="text-2xl">💥</span>
                    <h3 className="text-xs font-black text-red-755 uppercase tracking-wider">
                      ¡Colisión con la Linterna!
                    </h3>
                    <p className="text-[10px] text-slate-555 font-bold leading-normal">
                      El robot ha llegado a la meta (ambos sensores leen luz intensa &gt; 850) pero sigue empujando con fuerza. Necesitamos programar una condición para apagar los motores al llegar.
                    </p>
                    <div className="flex justify-center w-full pt-1">
                      <button 
                        onClick={() => {
                          setStep4Fixed(true);
                        }}
                        className="scratch-btn scratch-btn-green py-2 px-4 text-[10px] font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full border border-emerald-700 shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        Aplicar Parada en Meta 🏁
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive HTML Number Line below canvas */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shrink-0 mb-3 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-black">
                <span className="text-slate-555 uppercase tracking-widest">Recta Numérica de Error (Resta LDR)</span>
                <span className="font-mono text-brand-orange bg-white px-2 py-0.5 border border-slate-200 rounded-lg shadow-2xs">
                  Diferencia: {staticTelemetry.resta >= 0 ? `+${staticTelemetry.resta}` : staticTelemetry.resta}
                </span>
              </div>
              
              <div className="h-7 relative flex items-center">
                <div ref={numberLineRef} className="w-full h-1.5 bg-slate-200 rounded-full relative">
                  <div className="absolute left-[50%] -translate-x-1/2 w-0.5 h-3 bg-slate-400" />
                  <span className="absolute left-[50%] -translate-x-1/2 top-3 text-[8px] font-bold text-slate-400">0</span>
                  
                  {/* Calibrated center marker */}
                  {logicStep >= 5 && step5Fixed && (
                    <>
                      <div className="absolute w-0.5 h-3 bg-emerald-400" style={{ left: `${((-70 + 300) / 600) * 100}%`, transform: 'translateX(-50%)' }} />
                      <span className="absolute top-3 text-[8px] font-bold text-emerald-600" style={{ left: `${((-70 + 300) / 600) * 100}%`, transform: 'translateX(-50%)' }}>-70</span>
                    </>
                  )}
                  
                  {/* Shaded dynamic tolerance area (Step >= 2) */}
                  {logicStep >= 2 && umbral > 0 && (() => {
                    const diffBase = (logicStep >= 5 && step5Fixed) ? -70 : 0;
                    const leftPct = ((diffBase - umbral + 300) / 600) * 100;
                    const widthPct = ((umbral * 2) / 600) * 100;
                    return (
                      <div 
                        className="absolute h-full bg-[#ffb74d]/30 border-x border-[#ffab19]/40"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`
                        }}
                      >
                        <span className="absolute left-0 -top-3.5 text-[8px] font-black text-[#b27914] -translate-x-1/2">{diffBase - umbral}</span>
                        <span className="absolute right-0 -top-3.5 text-[8px] font-black text-[#b27914] translate-x-1/2">{diffBase + umbral > 0 ? '+' : ''}{diffBase + umbral}</span>
                      </div>
                    );
                  })()}

                  {/* Symmetric thresholds draggable handles (Step >= 2) */}
                  {logicStep >= 2 && (() => {
                    const diffBase = (logicStep >= 5 && step5Fixed) ? -70 : 0;
                    const leftPct = ((diffBase - umbral + 300) / 600) * 100;
                    const rightPct = ((diffBase + umbral + 300) / 600) * 100;
                    return (
                      <>
                        {/* Left handle */}
                        <div 
                          onMouseDown={(e) => handleThresholdMouseDown(e, 'left')}
                          onDoubleClick={() => setUmbral(0)}
                          className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md cursor-ew-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                          style={{
                            left: `calc(${leftPct}% - 8px)`,
                            top: '-5px',
                            zIndex: 30
                          }}
                          title="Arrastra para ajustar umbral izquierdo (doble clic para reset a 0)"
                        >
                          <span className="text-[8px] text-white font-bold font-sans">◀</span>
                        </div>

                        {/* Right handle */}
                        <div 
                          onMouseDown={(e) => handleThresholdMouseDown(e, 'right')}
                          onDoubleClick={() => setUmbral(0)}
                          className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-md cursor-ew-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                          style={{
                            left: `calc(${rightPct}% - 8px)`,
                            top: '-5px',
                            zIndex: 30
                          }}
                          title="Arrastra para ajustar umbral derecho (doble clic para reset a 0)"
                        >
                          <span className="text-[8px] text-white font-bold font-sans">▶</span>
                        </div>
                      </>
                    );
                  })()}

                  <span className="absolute left-0 top-2.5 text-[7px] font-bold text-slate-400">-300 (Der)</span>
                  <span className="absolute right-0 top-2.5 text-[7px] font-bold text-slate-400">+300 (Izq)</span>

                  {(() => {
                    const percentage = ((staticTelemetry.resta + 300) / 600) * 100;
                    const clampedPercent = Math.max(0, Math.min(100, percentage));
                    
                    return (
                      <div 
                        className="absolute w-3.5 h-3.5 bg-brand-orange border-2 border-white rounded-full shadow-md -translate-y-1/3 transition-all duration-75 flex items-center justify-center"
                        style={{ left: `${clampedPercent}%`, transform: 'translate(-50%, -35%)' }}
                      >
                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Step Problem & Fix action buttons */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shrink-0 flex flex-col justify-center min-h-[76px]">
              {logicStep === 1 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-xs font-black text-emerald-800 block">🏁 LÓGICA DE COMPARACIÓN ACTIVA</span>
                    <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                      El robot responde a las comparaciones básicas del Mundo Ideal. Mueve la linterna en los controles o en el canvas central.
                    </p>
                  </div>
                </div>
              )}

              {logicStep === 2 && (() => {
                if (umbral === 0) {
                  return (
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-black text-orange-850 block">⚠️ ALERTA DE OSCILACIÓN ("BULEBRÍN")</span>
                        <p className="text-[9px] text-orange-755 leading-normal font-semibold">
                          La linterna está descentrada. Sin zona muerta, el robot oscila girando frenéticamente de lado a lado. Arrastra los cursores en la recta numérica (abajo) hacia los lados para añadir un umbral de tolerancia.
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-black text-emerald-800 block">✅ ¡ZONA MUERTA APLICADA (±{umbral})!</span>
                        <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                          Con el umbral de tolerancia establecido, diferencias pequeñas son ignoradas y el robot avanza recto de forma estable. (Doble clic en los cursores para resetear a 0).
                        </p>
                      </div>
                      <button 
                        onClick={() => setUmbral(0)} 
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-[8px] font-bold rounded text-slate-700 transition"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                }
              })()}

              {logicStep === 3 && (() => {
                if (!step3Fixed) {
                  return (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9.5px] font-bold text-slate-500 leading-normal block">
                        🔌 Apaga la linterna en el panel de la izquierda para ver qué hace el robot en la oscuridad.
                      </span>
                    </div>
                  );
                } else {
                  const isStopped = staticTelemetry.action === 'detenido (sin luz)';
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-emerald-800">✅ ¡PARADA DE SEGURIDAD PROTEGIDA!</span>
                        <button 
                          onClick={() => { setStep3Fixed(false); setStep3Choice(null); }} 
                          className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 border border-slate-300 text-[8px] font-bold rounded text-slate-700 transition"
                        >
                          Quitar Corrección
                        </button>
                      </div>
                      
                      {isStopped ? (
                        <div className="p-2.5 bg-green-100 border border-green-300 rounded-xl text-center animate-pulse">
                          <span className="text-[10px] font-black text-green-800 block">
                            🎉 ¡Bingo! El robot se detuvo con la luz ambiental porque el umbral de luz mínima ({luzMinimaThreshold}) es mayor que la luz ambiental ({luzAmbiental}).
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <span className="text-[9.5px] font-semibold text-amber-800 block">
                            💡 La linterna está apagada y el robot sigue avanzando. Ajusta el Umbral de Luz Mínima en la columna izquierda hacia arriba (mayor que {luzAmbiental}) para ver cómo se detiene.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              })()}

              {logicStep === 4 && (() => {
                const isProblemActive = !step4Fixed && staticTelemetry.readL > 850 && staticTelemetry.readR > 850;
                if (isProblemActive) {
                  return (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-black text-red-800 block">💥 ALERTA DE COLISIÓN EN META</span>
                        <p className="text-[9px] text-red-755 leading-normal font-semibold">
                          El robot está bajo la linterna (&gt;850). Sigue empujando hacia adelante y dañará los motores físicos.
                        </p>
                      </div>
                      <button
                        onClick={() => setStep4Fixed(true)}
                        className="scratch-btn scratch-btn-red text-[10px] py-1.5 px-3 font-black shrink-0"
                      >
                        🔧 Parada Luz Máxima (&gt;850)
                      </button>
                    </div>
                  );
                } else if (step4Fixed) {
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-black text-emerald-800 block">✅ ¡LLEGADA CON PARADA DE META!</span>
                        <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                          Los motores se detienen limpiamente cuando ambos sensores leen luz intensa, asegurando el final de la pista.
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep4Fixed(false)} 
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-355 border border-slate-300 text-[8px] font-bold rounded text-slate-700 transition"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500">Mueve el slider "Distancia a Linterna" al máximo (2.5m, muy cerca) para probar.</span>
                    </div>
                  );
                }
              })()}

              {logicStep === 5 && (() => {
                const isProblemActive = !step5Fixed && staticWorldMode === 'real' && Math.abs(staticLightX) < 10;
                if (isProblemActive) {
                  return (
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-black text-orange-855 block">⚠️ DESCALIBRACIÓN FÍSICA DETECTADA</span>
                        <p className="text-[9px] text-orange-755 leading-normal font-semibold">
                          Con el foco centrado, la resta física da -70 en vez de 0. El robot gira creyendo que hay luz a la derecha.
                        </p>
                      </div>
                      <button
                        onClick={() => setStep5Fixed(true)}
                        className="scratch-btn scratch-btn-orange text-[10px] py-1.5 px-3 font-black shrink-0"
                      >
                        🔧 Calibrar Offset (-70)
                      </button>
                    </div>
                  );
                } else if (step5Fixed) {
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-black text-emerald-800 block">✅ ¡DESFASE FÍSICO COMPENSADO!</span>
                        <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                          Restamos (-70) en el código. El robot vuelve a tener 0 en el centro físico de la linterna y avanza recto.
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep5Fixed(false)} 
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-355 border border-slate-300 text-[8px] font-bold rounded text-slate-700 transition"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500">Activa "Lecturas Reales" en los controles izquierdos para ver la descalibración física.</span>
                    </div>
                  );
                }
              })()}

              {logicStep === 6 && (() => {
                const isProblemActive = !step6Fixed && staticWorldMode === 'real';
                if (isProblemActive) {
                  return (
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-black text-orange-855 block">⚠️ RUIDO ELÉCTRICO SIN FILTRAR</span>
                        <p className="text-[9px] text-orange-755 leading-normal font-semibold">
                          La señal analógica oscila erráticamente, causando giros e inestabilidad brusca constante.
                        </p>
                      </div>
                      <button
                        onClick={() => setStep6Fixed(true)}
                        className="scratch-btn scratch-btn-green text-[10px] py-1.5 px-3 font-black shrink-0"
                      >
                        🔧 Activar Filtro Promedio
                      </button>
                    </div>
                  );
                } else if (step6Fixed) {
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-250 rounded-xl flex items-center justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-black text-emerald-800 block">✅ ¡FILTRO DE PROMEDIO ACTIVO!</span>
                        <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                          Se promedian 100 lecturas. La señal es suave y limpia, permitiendo un manejo estable del robot.
                        </p>
                      </div>
                      <button 
                        onClick={() => setStep6Fixed(false)} 
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-355 border border-slate-300 text-[8px] font-bold rounded text-slate-700 transition"
                      >
                        Quitar
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-slate-500">Activa "Lecturas Reales" a la izquierda para simular el ruido del ambiente.</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Step Prev/Next footer */}
            <div className="flex justify-between items-center gap-4 mt-3 shrink-0">
              <button
                disabled={logicStep === 1}
                onClick={() => setLogicStep(s => s - 1)}
                className="scratch-btn scratch-btn-gray disabled:opacity-40 py-1.5"
              >
                ← Anterior
              </button>
              
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest font-mono">
                Paso {logicStep} de 6
              </div>

              <button
                disabled={logicStep === 6}
                onClick={() => setLogicStep(s => s + 1)}
                className="scratch-btn scratch-btn-blue disabled:opacity-40 py-1.5"
              >
                Siguiente →
              </button>
            </div>
          </main>

          {/* COLUMN 3: RIGHT SIDEBAR (Flow, C++ Code, Oscilloscope) */}
          <aside className="w-[320px] scratch-card p-5 shrink-0 flex flex-col gap-4 scratch-scrollbar overflow-y-auto font-sans">
            {/* Tab Swappers */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setRightPanelTab('flowchart')}
                className={`py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                  rightPanelTab === 'flowchart' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                📊 Flujo
              </button>
              <button
                onClick={() => setRightPanelTab('code')}
                className={`py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                  rightPanelTab === 'code' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                💻 C++
              </button>
              <button
                onClick={() => setRightPanelTab('oscilloscope')}
                className={`py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                  rightPanelTab === 'oscilloscope' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                📈 Graficar
              </button>
            </div>

            {/* TAB CONTENT: Flowchart */}
            {rightPanelTab === 'flowchart' && (
              <div className="flex-1 flex flex-col justify-start items-center p-2.5 text-center h-full overflow-y-auto scratch-scrollbar">
                {!revealFlowchart ? (
                  <div className="my-auto space-y-3 p-4">
                    <span className="text-3xl block">📊</span>
                    <h3 className="text-xs font-black text-slate-700">El Diagrama de Flujo está oculto</h3>
                    <p className="text-[9.5px] text-slate-500 font-semibold leading-normal font-sans">
                      Intenta razonar cómo debería tomar decisiones el robot antes de ver la solución.
                    </p>
                    <button
                      onClick={() => setRevealFlowchart(true)}
                      className="scratch-btn scratch-btn-blue text-[10px] py-1.5 px-3"
                    >
                      Revelar Lógica 📊
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex-1 flex flex-col justify-start items-center gap-1.5 py-1">
                    {/* START */}
                    <div className="w-22 py-1 bg-emerald-100 border-2 border-emerald-400 rounded-full text-center text-[9px] font-black text-emerald-800 shrink-0">
                      ● INICIO
                    </div>
                    <div className="text-[9px] text-slate-400 font-black leading-none">↓</div>

                    {/* PROCESS: Read LDRs */}
                    <div className="w-36 py-1 bg-slate-50 border border-slate-350 text-center text-[8.5px] font-black text-slate-700 rounded-xl leading-tight shrink-0">
                      Leer Sensor Izq (A0)<br />
                      Leer Sensor Der (A1)<br />
                      <span className="text-[7.5px] text-slate-500 font-bold block mt-0.5">Resta = A0 - A1 ({staticTelemetry.resta})</span>
                    </div>
                    <div className="text-[9px] text-slate-400 font-black leading-none">↓</div>
                    
                    {/* CONDITIONAL: Light Minimum (Steps >= 3) */}
                    {logicStep >= 3 && (
                      <div className="flex flex-col items-center w-full shrink-0">
                        <div className="relative w-18 h-18 flex items-center justify-center">
                          <div className={`absolute w-12 h-12 border rotate-45 transition-all ${
                            staticTelemetry.action === 'detenido (sin luz)'
                              ? 'bg-red-50 border-brand-red ring-1 ring-red-200'
                              : 'bg-white border-slate-300'
                          }`} />
                          <span className={`z-10 text-[7.5px] font-black text-center leading-tight -rotate-45 ${staticTelemetry.action === 'detenido (sin luz)' ? 'text-brand-red' : 'text-slate-600'}`}>
                            ¿A0 &lt; 300<br />y A1 &lt; 300?
                          </span>
                          {staticTelemetry.action === 'detenido (sin luz)' && (
                            <div className="absolute left-[62px] text-[7.5px] font-black text-[#ff6680] bg-red-50 border border-red-200 px-1 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                              Sí ➔ [PARAR]
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400 font-black leading-none -mt-1.5 z-10">↓ No</div>
                      </div>
                    )}

                    {/* CONDITIONAL: Proximity Stop (Steps >= 4) */}
                    {logicStep >= 4 && (
                      <div className="flex flex-col items-center w-full shrink-0">
                        <div className="relative w-18 h-18 flex items-center justify-center">
                          <div className={`absolute w-12 h-12 border rotate-45 transition-all ${
                            staticTelemetry.action === 'detenido (llegó)'
                              ? 'bg-red-50 border-brand-red ring-1 ring-red-200'
                              : 'bg-white border-slate-300'
                          }`} />
                          <span className={`z-10 text-[7.5px] font-black text-center leading-tight -rotate-45 ${staticTelemetry.action === 'detenido (llegó)' ? 'text-brand-red' : 'text-slate-600'}`}>
                            ¿A0 &gt; 850<br />y A1 &gt; 850?
                          </span>
                          {staticTelemetry.action === 'detenido (llegó)' && (
                            <div className="absolute left-[62px] text-[7.5px] font-black text-[#ff6680] bg-red-50 border border-red-200 px-1 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                              Sí ➔ [PARAR]
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-400 font-black leading-none -mt-1.5 z-10">↓ No</div>
                      </div>
                    )}

                    {/* CONDITIONAL: Resta == 0 (Or inside threshold zone) -> Straight (Avanzar Recto) */}
                    {(() => {
                      const isStraight = staticTelemetry.action === 'avanzar recto';
                      const staticUmbral = (logicStep >= 2 && step2Fixed) ? 50 : 0;
                      const staticDiferenciaBase = (logicStep >= 5 && step5Fixed) ? -70 : 0;
                      const calibratedDiff = staticTelemetry.resta - staticDiferenciaBase;
                      const inZone = Math.abs(calibratedDiff) <= staticUmbral;
                      
                      return (
                        <div className="flex flex-col items-center w-full shrink-0">
                          <div className="relative w-20 h-18 flex items-center justify-center">
                            <div className={`absolute w-13 h-13 border rotate-45 transition-all ${
                              isStraight ? 'bg-green-50 border-brand-green ring-1 ring-green-200' : 'bg-white border-slate-300'
                            }`} />
                            <span className={`z-10 text-[7px] font-black text-center leading-tight -rotate-45 ${isStraight ? 'text-brand-green' : 'text-slate-650'}`}>
                              {staticUmbral > 0 ? (
                                <>¿|{logicStep >= 5 ? 'RestaCalibrada' : 'Resta'}| &lt;= 50?</>
                              ) : (
                                <>¿{logicStep >= 5 ? 'RestaCalibrada' : 'Resta'} == 0?</>
                              )}
                            </span>
                            {isStraight && (
                              <div className="absolute left-[62px] text-[7.5px] font-black text-brand-green bg-green-50 border border-green-200 px-1 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                                Sí ➔ [RECTO]
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 font-black leading-none -mt-1 z-10">↓ No</div>
                        </div>
                      );
                    })()}

                    {/* CONDITIONAL: Left Turn (calibratedDiff > staticUmbral) */}
                    {(() => {
                      const isLeft = staticTelemetry.action === 'girar izquierda';
                      const staticUmbral = (logicStep >= 2 && step2Fixed) ? 50 : 0;
                      const staticDiferenciaBase = (logicStep >= 5 && step5Fixed) ? -70 : 0;
                      const calibratedDiff = staticTelemetry.resta - staticDiferenciaBase;
                      
                      return (
                        <div className="flex flex-col items-center w-full shrink-0">
                          <div className="relative w-20 h-18 flex items-center justify-center">
                            <div className={`absolute w-13 h-13 border rotate-45 transition-all ${
                              isLeft ? 'bg-blue-50 border-brand-blue ring-1 ring-blue-200' : 'bg-white border-slate-300'
                            }`} />
                            <span className={`z-10 text-[7px] font-black text-center leading-tight -rotate-45 ${isLeft ? 'text-brand-blue' : 'text-slate-650'}`}>
                              ¿{logicStep >= 5 ? 'RestaCalibrada' : 'Resta'} &gt; {staticUmbral}?
                            </span>
                            {isLeft && (
                              <div className="absolute left-[62px] text-[7.5px] font-black text-brand-blue bg-blue-50 border border-blue-200 px-1 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                                Sí ➔ [GIRAR IZQ]
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 font-black leading-none -mt-1 z-10">↓ No</div>
                        </div>
                      );
                    })()}

                    {/* CONDITIONAL: Right Turn (calibratedDiff < -staticUmbral) */}
                    {(() => {
                      const isRight = staticTelemetry.action === 'girar derecha';
                      const staticUmbral = (logicStep >= 2 && step2Fixed) ? 50 : 0;
                      
                      return (
                        <div className="flex flex-col items-center w-full shrink-0">
                          <div className="relative w-20 h-18 flex items-center justify-center">
                            <div className={`absolute w-13 h-13 border rotate-45 transition-all ${
                              isRight ? 'bg-purple-50 border-brand-purple ring-1 ring-purple-200' : 'bg-white border-slate-300'
                            }`} />
                            <span className={`z-10 text-[7px] font-black text-center leading-tight -rotate-45 ${isRight ? 'text-brand-purple' : 'text-slate-655'}`}>
                              ¿{logicStep >= 5 ? 'RestaCalibrada' : 'Resta'} &lt; -{staticUmbral}?
                            </span>
                            {isRight && (
                              <div className="absolute left-[62px] text-[7.5px] font-black text-brand-purple bg-purple-50 border border-purple-200 px-1 py-0.5 rounded shadow-xs whitespace-nowrap z-20">
                                Sí ➔ [GIRAR DER]
                              </div>
                            )}
                          </div>
                          
                          <div className="text-[9px] text-slate-400 font-black leading-none -mt-1 z-10">↓</div>
                          
                          <div className="w-18 py-1 bg-emerald-100 border-2 border-emerald-400 rounded-full text-center text-[9px] font-black text-emerald-800 mt-1 shrink-0">
                            ● FIN
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Arduino Code */}
            {rightPanelTab === 'code' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block shrink-0">
                  📄 Código Fuente Arduino (C++)
                </span>
                
                <div className="flex-1 bg-slate-900 border-2 border-slate-350 rounded-2xl overflow-hidden p-3 flex flex-col mt-2">
                  <pre className="flex-1 font-mono text-[9px] leading-relaxed text-[#22c55e] overflow-auto scratch-scrollbar whitespace-pre">
                    {logicStep === 1 && `void loop() {
  // 1. Leer sensores analógicos
  SensorL = analogRead(A0);
  SensorR = analogRead(A1);

  // 2. Calcular diferencia (Resta)
  Resta = SensorL - SensorR;

  // 3. Comparación básica
  if (Resta > 0) {
    izquierda();
  } else if (Resta < 0) {
    derecha();
  } else {
    adelante();
  }
}`}
                    {logicStep === 2 && `void loop() {
  SensorL = analogRead(A0);
  SensorR = analogRead(A1);

  Resta = SensorL - SensorR;

  // Evaluar con Umbral de tolerancia
  if (Resta > ${step2Fixed ? '50' : '0'}) {
    izquierda();
  } else if (Resta < ${step2Fixed ? '-50' : '0'}) {
    derecha();
  } else {
    adelante();
  }
}`}
                    {logicStep === 3 && `void loop() {
  SensorL = analogRead(A0);
  SensorR = analogRead(A1);
  Resta = SensorL - SensorR;

  // Control a oscuras
  ${step3Fixed ? 'if (SensorL < 300 && SensorR < 300) {\n    detener(); // Sin luz\n  } else ' : ''}if (Resta > ${step2Fixed ? '50' : '0'}) {
    izquierda();
  } else if (Resta < ${step2Fixed ? '-50' : '0'}) {
    derecha();
  } else {
    adelante();
  }
}`}
                    {logicStep === 4 && `void loop() {
  SensorL = analogRead(A0);
  SensorR = analogRead(A1);
  Resta = SensorL - SensorR;

  if (SensorL < 300 && SensorR < 300) {
    detener(); // Sin luz
  } ${step4Fixed ? 'else if (SensorL > 850 && SensorR > 850) {\n    detener(); // Llegó a la linterna\n  } ' : ''}else if (Resta > ${step2Fixed ? '50' : '0'}) {
    izquierda();
  } else if (Resta < ${step2Fixed ? '-50' : '0'}) {
    derecha();
  } else {
    adelante();
  }
}`}
                    {logicStep === 5 && `// Calibración de desfase
void loop() {
  SensorL = analogRead(A0);
  SensorR = analogRead(A1);

  // Compensar diferencia física de sensores
  Resta = SensorL - SensorR;
  ${step5Fixed ? 'int RestaCalibrada = Resta - (-70); // Calibrado' : 'int RestaCalibrada = Resta; // Descalibrado'}

  if (SensorL < 300 && SensorR < 300) {
    detener(); 
  } else if (SensorL > 850 && SensorR > 850) {
    detener(); 
  } else if (RestaCalibrada > ${step2Fixed ? '50' : '0'}) {
    izquierda();
  } else if (RestaCalibrada < ${step2Fixed ? '-50' : '0'}) {
    derecha();
  } else {
    adelante();
  }
}`}
                    {logicStep === 6 && `void loop() {
  // Promediar 100 muestras para eliminar ruido
  long sumL = 0, sumR = 0;
  ${step6Fixed 
    ? 'for(int i=0; i<100; i++) {\n    sumL += analogRead(A0);\n    sumR += analogRead(A1);\n  }\n  SensorL = sumL / 100;\n  SensorR = sumR / 100;' 
    : 'SensorL = analogRead(A0);\n  SensorR = analogRead(A1);'}

  Resta = SensorL - SensorR;
  int RestaCalibrada = Resta - ${step5Fixed ? '(-70)' : '0'};

  if (SensorL < 300 && SensorR < 300) {
    detener();
  } else if (SensorL > 850 && SensorR > 850) {
    detener(); 
  } else if (RestaCalibrada > ${step2Fixed ? '50' : '0'}) {
    izquierda();
  } else if (RestaCalibrada < ${step2Fixed ? '-50' : '0'}) {
    derecha();
  } else {
    adelante();
  }
}`}
                  </pre>
                </div>
              </div>
            )}
            
            {/* TAB CONTENT: Static Oscilloscope / Real-time Graph */}
            {rightPanelTab === 'oscilloscope' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden h-full">
                
                {/* Step 1: Direction-Tinted Bar Chart Gauge */}
                {logicStep === 1 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden font-sans">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                        📊 Comparador de Sensores Direccional
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        Los sensores envían voltajes según la luz. La resta decide el giro del robot.
                      </p>
                    </div>
                    
                    {(() => {
                      const { readL, readR, resta } = staticTelemetry;
                      const isLeft = resta > 0;
                      const isRight = resta < 0;
                      
                      let cardBg = "bg-emerald-50 border-emerald-300";
                      let titleColor = "text-emerald-850";
                      let actionLabel = "Avanzar Recto ↑";
                      let actionBg = "bg-emerald-555 border-emerald-600";
                      
                      if (isLeft) {
                        cardBg = "bg-blue-50 border-blue-300";
                        titleColor = "text-blue-800";
                        actionLabel = "Giro Izquierda ↺";
                        actionBg = "bg-blue-500 border-blue-600";
                      } else if (isRight) {
                        cardBg = "bg-purple-50 border-purple-300";
                        titleColor = "text-purple-800";
                        actionLabel = "Giro Derecha ↻";
                        actionBg = "bg-purple-500 border-purple-600";
                      }
                      
                      return (
                        <div className={`flex-1 border-3 rounded-2xl p-4 flex flex-col justify-between my-3 relative min-h-[200px] shadow-sm transition-all duration-300 ${cardBg}`}>
                          {/* Dual Bar Charts */}
                          <div className="flex justify-around items-end h-32 relative mt-2">
                            {/* Left Bar (A0) */}
                            <div className="flex flex-col items-center gap-1.5 w-12 z-10">
                              <div className="w-6 bg-slate-200 border border-slate-300 rounded-md h-24 flex items-end overflow-hidden">
                                <div 
                                  className={`w-full transition-all duration-155 ${isLeft ? 'bg-blue-500' : 'bg-slate-400'}`}
                                  style={{ height: `${(readL / 1023) * 100}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-slate-655">A0 (Izq)</span>
                              <span className="text-[9px] font-mono font-bold text-slate-800">{readL}</span>
                            </div>
                            
                            {/* Center Formula Box */}
                            <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs w-20 self-center">
                              <span className="text-[7px] font-black text-slate-400 uppercase">Resta</span>
                              <span className={`text-base font-black font-mono ${titleColor}`}>
                                {resta >= 0 ? `+${resta}` : resta}
                              </span>
                            </div>
                            
                            {/* Right Bar (A1) */}
                            <div className="flex flex-col items-center gap-1.5 w-12 z-10">
                              <div className="w-6 bg-slate-200 border border-slate-300 rounded-md h-24 flex items-end overflow-hidden">
                                <div 
                                  className={`w-full transition-all duration-155 ${isRight ? 'bg-purple-500' : 'bg-slate-400'}`}
                                  style={{ height: `${(readR / 1023) * 100}%` }}
                                />
                              </div>
                              <span className="text-[8px] font-black text-slate-655">A1 (Der)</span>
                              <span className="text-[9px] font-mono font-bold text-slate-800">{readR}</span>
                            </div>
                          </div>
                          
                          {/* Action indicator at bottom */}
                          <div className={`p-1.5 rounded-xl text-center font-black text-[10px] uppercase tracking-wider text-white border shadow-sm transition-all duration-300 ${actionBg}`}>
                            {actionLabel}
                          </div>
                        </div>
                      );
                    })()}

                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-650 cursor-pointer select-none my-1 px-1">
                      <input
                        type="checkbox"
                        checked={simularTemblor}
                        onChange={(e) => setSimularTemblor(e.target.checked)}
                        className="rounded border-slate-300 text-brand-orange accent-[#ffab19] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Simular inestabilidad en curvas (Tembladera)</span>
                    </label>
                    
                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚖️ <strong>Balanza analógica:</strong> Si el sensor izquierdo A0 tiene más luz, la resta es positiva (gira a la izquierda). Si A1 tiene más luz, es negativa (gira a la derecha).
                    </div>
                  </div>
                )}

                {/* Step 2: Oscilloscope with dynamic Threshold shading */}
                {logicStep === 2 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden font-sans">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                        📈 Umbral y Estabilidad (Osciloscopio)
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        La gráfica muestra la resta de luz y cómo el umbral evita el movimiento oscilatorio.
                      </p>
                    </div>
                    
                    <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-2.5 flex flex-col shadow-inner my-3 relative min-h-[180px] overflow-hidden">
                      {/* Distorted-free HTML Labels */}
                      <div className="absolute left-2.5 top-2 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none">
                        +1023 (Izq)
                      </div>
                      <div className="absolute left-2.5 top-[48%] -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none">
                        0 (Centro)
                      </div>
                      <div className="absolute left-2.5 bottom-2 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none">
                        -1023 (Der)
                      </div>

                      {/* Threshold horizontal line label overlays */}
                      {umbral > 0 && (
                        <>
                          <div 
                            className="absolute right-14 text-[8px] font-mono font-bold text-amber-655 bg-white/90 px-1.5 py-0.5 rounded border border-amber-200 shadow-3xs pointer-events-none select-none z-10"
                            style={{ top: `calc(${50 - (umbral / 1024) * 45}% - 8px)` }}
                          >
                            +{umbral}
                          </div>
                          <div 
                            className="absolute right-14 text-[8px] font-mono font-bold text-amber-655 bg-white/90 px-1.5 py-0.5 rounded border border-amber-200 shadow-3xs pointer-events-none select-none z-10"
                            style={{ top: `calc(${50 + (umbral / 1024) * 45}% - 8px)` }}
                          >
                            -{umbral}
                          </div>
                        </>
                      )}

                      {/* Legend and current value */}
                      <div className="absolute right-2.5 top-2.5 bg-white/95 border border-slate-200 rounded-xl p-2 text-[8.5px] font-bold text-slate-655 flex flex-col gap-1.5 shadow-2xs z-10 pointer-events-none leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-0.5 bg-[#ff6680] block" />
                          <span>Resta (Error): <strong className="font-mono text-slate-800 font-black">{staticTelemetry.resta >= 0 ? `+${staticTelemetry.resta}` : staticTelemetry.resta}</strong></span>
                        </div>
                        {umbral > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-2.5 bg-[#ffab19]/25 border-y border-dashed border-[#ffab19]/40 block" />
                            <span>Tolerancia: <strong className="font-mono text-amber-600 font-black">±{umbral}</strong></span>
                          </div>
                        )}
                      </div>

                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Center zero axis */}
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#94a3b8" strokeWidth="1" />
                        
                        {/* Upper and lower boundaries */}
                        <line x1="0" y1="5" x2="100" y2="5" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="95" x2="100" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />

                        {/* Threshold region */}
                        {umbral > 0 && (
                          <>
                            {(() => {
                              const upperY = 50 - (umbral / 1024) * 45;
                              const lowerY = 50 - (-umbral / 1024) * 45;
                              const h = Math.abs(upperY - lowerY);
                              return (
                                <>
                                  <rect x="0" y={upperY} width="100" height={h} fill="rgba(251, 191, 36, 0.12)" />
                                  <line x1="0" y1={upperY} x2="100" y2={upperY} stroke="rgba(251, 191, 36, 0.45)" strokeWidth="0.8" strokeDasharray="3,3" />
                                  <line x1="0" y1={lowerY} x2="100" y2={lowerY} stroke="rgba(251, 191, 36, 0.45)" strokeWidth="0.8" strokeDasharray="3,3" />
                                </>
                              );
                            })()}
                          </>
                        )}
                        
                        {/* Signal path */}
                        <polyline
                          fill="none"
                          stroke="#ff6680"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={staticRawHistory.map((val, idx) => {
                            const x = (idx / (staticRawHistory.length - 1)) * 100;
                            const y = 50 - (val / 1024) * 45;
                            return x + "," + y;
                          }).join(' ')}
                        />
                      </svg>
                    </div>
                    
                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚙️ <strong>Zona Muerta:</strong> {umbral === 0 ? "Sin umbral, cualquier desbalance por mínimo que sea genera giros violentos (bulebrín)." : `Con umbral activo de ±${umbral}, el robot ignora pequeñas diferencias de luz y avanza recto.`}
                    </div>
                  </div>
                )}

                {/* Step 3: Step Function Plotter */}
                {logicStep === 3 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden font-sans">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                        📈 Función de Paso: Luz Mínima
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        Gráfico del estado de motores (0 = Detenido, 1 = Activo) según el nivel de luz.
                      </p>
                    </div>
                    
                    <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-center my-3 relative min-h-[220px] shadow-inner">
                      <div className="flex-1 relative w-full h-44">
                        <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet">
                          {/* Coordinates grids / helper lines */}
                          <line x1="50" y1="30" x2="280" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />
                          <line x1="50" y1="115" x2="280" y2="115" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2" />

                          {(() => {
                            const xMin = 50 + (luzMinimaThreshold / 1023) * 230;
                            const currentLight = (staticTelemetry.readL + staticTelemetry.readR) / 2;
                            const xCurrent = 50 + (currentLight / 1023) * 230;
                            const currentY = (step3Fixed && currentLight < luzMinimaThreshold) ? 115 : 30;

                            let path = "";
                            if (step3Fixed) {
                              path = `M 50,115 L ${xMin},115 L ${xMin},30 L 280,30`;
                            } else {
                              path = `M 50,30 L 280,30`;
                            }

                            return (
                              <>
                                {/* Shading zones */}
                                {step3Fixed && (
                                  <>
                                    {/* Parado (Stopped) Shading */}
                                    <rect x="50" y="30" width={xMin - 50} height="85" fill="rgba(239, 68, 68, 0.04)" />
                                    {/* Activo (Active) Shading */}
                                    <rect x={xMin} y="30" width={280 - xMin} height="85" fill="rgba(76, 151, 255, 0.06)" />
                                  </>
                                )}

                                {/* X Axis ticks and labels */}
                                <line x1="50" y1="115" x2="50" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="50" y="132" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">0 (Oscuridad)</text>

                                <line x1="280" y1="115" x2="280" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="280" y="132" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">1023 (Luz Máx)</text>

                                {/* Step function path */}
                                <path d={path} fill="none" stroke="#4c97ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Threshold indicator line & text */}
                                {step3Fixed && (
                                  <>
                                    <line x1={xMin} y1="30" x2={xMin} y2="115" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                                    <line x1={xMin} y1="115" x2={xMin} y2="120" stroke="#ef4444" strokeWidth="1.5" />
                                    <text x={xMin} y="143" fill="#ef4444" fontSize="8" fontWeight="black" textAnchor="middle">
                                      Mínimo ({luzMinimaThreshold})
                                    </text>
                                  </>
                                )}

                                {/* Y Axis ticks and labels */}
                                {/* State 0 (Parado) */}
                                <line x1="45" y1="115" x2="50" y2="115" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="40" y="118" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">0 (Parado)</text>

                                {/* State 1 (Activo) */}
                                <line x1="45" y1="30" x2="50" y2="30" stroke="#94a3b8" strokeWidth="1.5" />
                                <text x="40" y="33" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="end">1 (Activo)</text>

                                {/* Solid Axes */}
                                {/* Y-axis */}
                                <line x1="50" y1="20" x2="50" y2="115" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                                {/* X-axis */}
                                <line x1="50" y1="115" x2="290" y2="115" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

                                {/* Axis Titles */}
                                <text x="290" y="111" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="end">Luz Promedio LDR</text>
                                <text x="46" y="16" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="end">Motor</text>

                                {/* Current position dashed line & tracker dot */}
                                <line x1={xCurrent} y1="20" x2={xCurrent} y2="115" stroke="#ffab19" strokeWidth="1" strokeDasharray="3,3" />
                                <circle cx={xCurrent} cy={currentY} r="5" fill="#ffab19" stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
                                
                                {/* Floating tooltip above the dot */}
                                <rect x={xCurrent - 28} y={currentY - 20} width="56" height="13" rx="3" fill="#fffbeb" stroke="#d97706" strokeWidth="0.8" />
                                <text x={xCurrent} y={currentY - 10} fill="#b45309" fontSize="7" fontWeight="black" textAnchor="middle">
                                  Luz: {Math.round(currentLight)}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚙️ <strong>Función de Paso:</strong> {step3Fixed 
                        ? `Si la luz ambiental cae por debajo de ${luzMinimaThreshold}, los motores se apagan (estado 0). Si es igual o mayor, se activan (estado 1).`
                        : "Sin la parada de seguridad, la función de paso está siempre en 1 (Motores Activos), sin importar la oscuridad."}
                    </div>
                  </div>
                )}

                {/* Step 4: LDR Absolute Bar Charts */}
                {logicStep === 4 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden font-sans">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                        📊 Niveles Absolutos de Luz (LDR)
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        Nivel absoluto de luz en cada LDR. Las líneas punteadas muestran los límites críticos de parada.
                      </p>
                    </div>
                    
                    <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-center my-3 relative min-h-[220px] shadow-inner">
                      <div className="flex justify-around items-end h-40 relative">
                        {/* Guides */}
                        {/* Min Light Limit (300) */}
                        <div className="absolute w-full border-t-2 border-dashed border-red-400/40 top-[70%] left-0">
                          <span className="absolute right-0 -top-2.5 text-[7px] font-black text-brand-red bg-white px-1">Mínimo (300)</span>
                        </div>
                        
                        {/* Max Light Limit (850) */}
                        <div className="absolute w-full border-t-2 border-dashed border-orange-400/40 top-[17%] left-0">
                          <span className="absolute right-0 -top-2.5 text-[7px] font-black text-brand-orange bg-white px-1">Máximo (850)</span>
                        </div>
                        
                        {/* Bar A0 */}
                        <div className="flex flex-col items-center gap-1.5 w-12 z-10">
                          <div className="w-full bg-slate-150 border border-slate-200 rounded-lg h-32 flex items-end overflow-hidden">
                            <div 
                              className={"w-full rounded-b-md transition-all " + (
                                staticTelemetry.readL < 300 
                                  ? 'bg-red-400' 
                                  : staticTelemetry.readL > 850 
                                    ? 'bg-amber-400 animate-pulse' 
                                    : 'bg-blue-400'
                              )}
                              style={{ height: ((staticTelemetry.readL / 1023) * 100) + "%" }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-black text-slate-700">A0: {staticTelemetry.readL}</span>
                        </div>
                        
                        {/* Bar A1 */}
                        <div className="flex flex-col items-center gap-1.5 w-12 z-10">
                          <div className="w-full bg-slate-150 border border-slate-200 rounded-lg h-32 flex items-end overflow-hidden">
                            <div 
                              className={"w-full rounded-b-md transition-all " + (
                                staticTelemetry.readR < 300 
                                  ? 'bg-red-400' 
                                  : staticTelemetry.readR > 850 
                                    ? 'bg-amber-400 animate-pulse' 
                                    : 'bg-purple-400'
                              )}
                              style={{ height: ((staticTelemetry.readR / 1023) * 100) + "%" }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-black text-slate-700">A1: {staticTelemetry.readR}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚙️ <strong>Control Lógico:</strong> Si ambos sensores superan 850 (línea superior), el robot detecta que llegó muy cerca de la linterna y se detiene.
                    </div>
                  </div>
                )}

                {/* Step 5: Raw vs. Calibrated Signal */}
                {logicStep === 5 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden font-sans">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block">
                        ⚖️ Comparación de Calibración (Offset)
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        Se compara la resta bruta contra la resta calibrada para compensar el desbalance de fábrica de -70.
                      </p>
                    </div>
                    
                    <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col justify-around my-3 relative min-h-[220px] shadow-inner">
                      {/* Raw Resta Meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                          <span>Resta Bruta (A0 - A1)</span>
                          <span className="font-mono text-red-500 font-black">{staticTelemetry.resta}</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-lg relative overflow-hidden border border-slate-200 flex items-center">
                          <div className="absolute left-[50%] -translate-x-1/2 w-0.5 h-full bg-slate-350" />
                          <div 
                            className="h-full bg-red-400/80 rounded-sm"
                            style={{
                              left: staticTelemetry.resta >= 0 ? '50%' : "calc(50% - " + Math.min(50, (Math.abs(staticTelemetry.resta) / 1023) * 50) + "%)",
                              width: Math.min(50, (Math.abs(staticTelemetry.resta) / 1023) * 50) + "%",
                              position: 'absolute'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Calibrated Resta Meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                          <span>Resta Calibrada (Bruta - (-70))</span>
                          <span className="font-mono text-emerald-600 font-black">
                            {staticTelemetry.resta - (step5Fixed ? -70 : 0)}
                          </span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-lg relative overflow-hidden border border-slate-200 flex items-center">
                          <div className="absolute left-[50%] -translate-x-1/2 w-0.5 h-full bg-slate-355" />
                          {(() => {
                            const val = staticTelemetry.resta - (step5Fixed ? -70 : 0);
                            return (
                              <div 
                                className="h-full bg-emerald-400/80 rounded-sm"
                                style={{
                                  left: val >= 0 ? '50%' : "calc(50% - " + Math.min(50, (Math.abs(val) / 1023) * 50) + "%)",
                                  width: Math.min(50, (Math.abs(val) / 1023) * 50) + "%",
                                  position: 'absolute'
                                }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚙️ <strong>Calibración:</strong> {!step5Fixed ? "El desfase de -70 hace creer al robot que la linterna está a la derecha, por lo que gira erróneamente en el centro." : "Con el offset compensado, la resta calibrada vuelve a dar 0 en el centro físico de la linterna."}
                    </div>
                  </div>
                )}

                {/* Step 6: Noise (Pink) vs. Filtered Average (Blue) */}
                {logicStep === 6 && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="space-y-1 shrink-0">
                      <span className="text-[9px] font-black text-slate-455 uppercase tracking-wider block">
                        📈 Filtro Analógico (Ruido vs Promedio)
                      </span>
                      <p className="text-[9px] text-slate-500 font-semibold leading-normal font-sans">
                        Señal ruidosa sin filtrar (rosa) comparada con la señal filtrada promediando 100 muestras (azul).
                      </p>
                    </div>
                    
                    {/* SVG Graph */}
                    <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden p-2.5 flex flex-col shadow-inner my-3 relative min-h-[220px]">
                      {/* Distorted-free HTML scale overlays */}
                      <div className="absolute left-2.5 top-2.5 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none z-10">
                        +300
                      </div>
                      <div className="absolute left-2.5 top-[50%] -translate-y-1/2 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none z-10">
                        0 (Centro)
                      </div>
                      <div className="absolute left-2.5 bottom-2.5 text-[8px] font-mono font-bold text-slate-400 select-none pointer-events-none z-10">
                        -300
                      </div>

                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Center zero axis */}
                        <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                        
                        {/* Upper and lower zoom boundaries */}
                        <line x1="0" y1="6" x2="100" y2="6" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2,2" />
                        <line x1="0" y1="94" x2="100" y2="94" stroke="#f1f5f9" strokeWidth="0.5" strokeDasharray="2,2" />

                        {/* Raw signal history path (Red/Pink) */}
                        <polyline
                          fill="none"
                          stroke="#ff6680"
                          strokeWidth={step6Fixed ? "0.4" : "0.8"}
                          strokeOpacity={step6Fixed ? "0.45" : "0.95"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={staticRawHistory.map((val, idx) => {
                            const x = (idx / (staticRawHistory.length - 1)) * 100;
                            // Zoom Y axis scale (limit to -300 to +300)
                            const y = Math.max(6, Math.min(94, 50 - (val / 300) * 44));
                            return x + "," + y;
                          }).join(' ')}
                        />

                        {/* Filtered signal history path (Blue) */}
                        {step6Fixed && (
                          <polyline
                            fill="none"
                            stroke="#4c97ff"
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={staticFilteredHistory.map((val, idx) => {
                              const x = (idx / (staticFilteredHistory.length - 1)) * 100;
                              // Zoom Y axis scale (limit to -300 to +300)
                              const y = Math.max(6, Math.min(94, 50 - (val / 300) * 44));
                              return x + "," + y;
                            }).join(' ')}
                          />
                        )}
                      </svg>
                      
                      {/* Legend Overlay */}
                      <div className="absolute right-2.5 bottom-2.5 bg-white/90 border border-slate-200 rounded-lg p-1.5 text-[8px] flex flex-col gap-1 shadow-xs pointer-events-none z-10 leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-0.5 bg-[#ff6680] inline-block" />
                          <span className="font-bold text-slate-700">Resta Ruidosa</span>
                        </div>
                        {step6Fixed && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-0.5 bg-[#4c97ff] inline-block" />
                            <span className="font-bold text-slate-700">Filtro Promedio</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-[#fffbeb] border border-orange-200 rounded-xl text-[9px] text-[#b27914] leading-normal font-sans font-semibold shrink-0">
                      ⚡ <strong>Promediación analógica:</strong> En el Paso 6, promediar 100 lecturas remueve las interferencias, convirtiendo la ruidosa línea rosa en la suave línea azul.
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Readouts panel inside right bar */}
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 shrink-0">
              <span className="text-[10px] font-black text-slate-450 uppercase block">Telemetría Estática</span>
              
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-black">
                <div className="bg-white p-2 border border-slate-200 rounded-xl text-center">
                  <span className="text-blue-500 block text-[8px]">Sensor Izq (A0)</span>
                  <span className="text-sm font-mono text-blue-700">{staticTelemetry.readL}</span>
                </div>
                <div className="bg-white p-2 border border-slate-200 rounded-xl text-center">
                  <span className="text-green-500 block text-[8px]">Sensor Der (A1)</span>
                  <span className="text-sm font-mono text-green-700">{staticTelemetry.readR}</span>
                </div>
              </div>

              <div className="bg-[#fffbeb] p-2 border border-[#ffe0b2] rounded-xl text-center">
                <span className="text-brand-orange block text-[8px]">Resta (A0 - A1)</span>
                <span className="text-lg font-mono text-brand-orange font-black">
                  {staticTelemetry.resta >= 0 ? "+" + staticTelemetry.resta : staticTelemetry.resta}
                </span>
                <span className="text-[8px] font-bold block text-slate-500 mt-0.5">
                  Lógica: <span className="uppercase text-brand-purple">{staticTelemetry.action}</span>
                </span>
              </div>
            </div>

          </aside>
          
          {/* Teacher's Guide Sliding Drawer ("Guía del Docente") */}
          {showTeacherGuide && (
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
                onClick={() => setShowTeacherGuide(false)}
              />
              
              {/* Drawer Content */}
              <div className="fixed right-0 top-0 bottom-0 w-[420px] max-w-full bg-white border-l-4 border-[#5cb85c] shadow-2xl flex flex-col p-6 z-50 animate-slide-in font-sans">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎓</span>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Guía del Docente</h3>
                      <span className="text-[9px] font-bold text-[#5cb85c] bg-[#e8f5e9] px-2 py-0.5 rounded-md">Paso {logicStep}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTeacherGuide(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-205 text-slate-500 hover:text-slate-800 transition flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Scrollable Contents */}
                <div className="flex-1 overflow-y-auto scratch-scrollbar pr-1 space-y-5 text-slate-700">
                  
                  {/* Step Title */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-[#4c97ff] mb-1">
                      {logicStep === 1 && "Paso 1: Lógica Condicional Básica"}
                      {logicStep === 2 && "Paso 2: Zona Muerta y Tolerancia"}
                      {logicStep === 3 && "Paso 3: Luz de Habitación (Luz Mínima)"}
                      {logicStep === 4 && "Paso 4: Parada de Proximidad (Luz Máxima)"}
                      {logicStep === 5 && "Paso 5: Desfase Físico (Calibración)"}
                      {logicStep === 6 && "Paso 6: Ruido Analógico y Promedio"}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-550 leading-relaxed italic">
                      {logicStep === 1 && "Explicación conceptual de la resta de sensores para decidir giros simples de motores."}
                      {logicStep === 2 && "Comprensión de la inestabilidad física (bulebrín) generada por la falta de un umbral de tolerancia."}
                      {logicStep === 3 && "Protección para evitar que el robot gire o avance sin rumbo cuando la habitación está a oscuras."}
                      {logicStep === 4 && "Detención automática del robot al detectar que ha alcanzado directamente la meta o linterna."}
                      {logicStep === 5 && "Compensación por software de las diferencias de manufactura física entre las fotorresistencias."}
                      {logicStep === 6 && "Filtrado digital de fluctuaciones de voltaje externas para estabilizar el comportamiento final."}
                    </p>
                  </div>
                  
                  <hr className="border-slate-100" />
                  
                  {/* Socratic Questions Section */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">❓ Preguntas Socráticas de Aula</h5>
                    
                    {logicStep === 1 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: Si la linterna brilla exactamente en medio de los dos sensores, ¿cuánto dará la resta (A0 - A1)?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Debería dar cero (o muy cerca), porque ambos sensores reciben la misma intensidad lumínica."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Por qué una Resta positiva (&gt; 0) le dice al robot que gire a la izquierda?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Resta &gt; 0 significa que A0 (Izq) lee más luz que A1 (Der). Dado que la luz está del lado izquierdo, el robot gira a la izquierda para seguirla."
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {logicStep === 2 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: ¿Qué le pasa al robot en el canvas cuando la linterna está un poquito desalineada y no hay umbral (Tolerancia desactivada)?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "El robot y el suelo vibran de lado a lado bruscamente. Intenta corregir giros constantemente incluso por diferencias insignificantes."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Cómo ayuda el umbral de ±50 a calmar este temblor (bulebrín)?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Crea una 'zona muerta' donde las pequeñas diferencias se ignoran, permitiendo al robot seguir avanzando recto."
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {logicStep === 3 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: Si apagamos la linterna (habitación a oscuras), ¿por qué las lecturas caen por debajo de 300?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Porque las LDRs tienen alta resistencia en la oscuridad, reduciendo el voltaje analógico medido por el Arduino."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Por qué es mala idea dejar que el robot gire si la resta da algo en la oscuridad?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Porque chocaría o daría vueltas sin sentido gastando pilas. Sin una fuente de luz clara, es mejor que se detenga."
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {logicStep === 4 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: ¿Cómo sabe el robot que ya llegó muy cerca de la linterna en comparación a cuando está lejos?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Cuando está lejos, los valores son bajos o moderados. Al estar muy cerca, ambos sensores se saturan por encima de 850."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Qué condiciones lógicas deben cumplirse simultáneamente para activar la parada por proximidad?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Que A0 sea mayor que 850 Y que A1 también sea mayor que 850 (es decir, luz intensa en ambos sensores simultáneamente)."
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {logicStep === 5 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: Con la linterna centrada en modo 'Lecturas Reales', ¿por qué la resta da -70 en vez de 0?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Por tolerancias físicas de fabricación. Ninguna fotorresistencia ni circuito es 100% idéntico a otro."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Cómo solucionamos este error sin tener que soldar nuevos componentes en el robot?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Calibrando en el código: restamos el desfase medido (-70) al cálculo de la diferencia antes de tomar decisiones."
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {logicStep === 6 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P1: Si la linterna está fija, ¿por qué la señal bruta (rosa) baila tanto en el osciloscopio?</strong>
                          <p className="text-slate-605 font-semibold italic pl-3 border-l-2 border-brand-green font-sans">
                            "Debido al ruido eléctrico ambiental, variaciones térmicas en los cables e interferencias de los motores."
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[10.5px]">
                          <strong className="text-slate-800 block">P2: ¿Cómo suaviza el promedio de 100 lecturas la señal final en el Arduino?</strong>
                          <p className="text-slate-600 font-semibold italic pl-3 border-l-2 border-brand-green">
                            "Las fluctuaciones rápidas hacia arriba y abajo se compensan entre sí al promediarse, dejando una señal estable (azul)."
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <hr className="border-slate-100" />
                  
                  {/* Pedagogical Tip */}
                  <div className="p-4 bg-[#e8f5e9] border border-[#a5d6a7] rounded-2xl text-[10px] text-[#1b5e20] leading-normal font-semibold space-y-1 shadow-2xs">
                    <span className="block font-black text-xs">💡 Recomendación de Aula:</span>
                    <p>
                      {logicStep === 1 && "Pida a los alumnos tapar un sensor con la mano y predecir hacia dónde girará el robot. Haga que observen el equilibrio de la balanza."}
                      {logicStep === 2 && "Haga notar cómo el robot 'tiembla' mecánicamente (efecto bulebrín) en el canvas central si desactivan el umbral en la simulación."}
                      {logicStep === 3 && "Apague la linterna en los controles de laboratorio izquierdos y debata por qué el robot no debería andar solo en la oscuridad."}
                      {logicStep === 4 && "Use el deslizador de distancia para colocar la luz a 2.5m (máxima intensidad) y observe cómo los dos termómetros de luz superan el umbral superior."}
                      {logicStep === 5 && "Active 'Lecturas Reales' y muestre cómo el desbalance desvía al robot. Luego presione el botón de Calibrar para ver cómo compensa la resta."}
                      {logicStep === 6 && "Muestre cómo el osciloscopio dibuja la señal rosa ruidosa y cómo el filtro de promediado la convierte en una trayectoria azul limpia."}
                    </p>
                  </div>
                  
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
