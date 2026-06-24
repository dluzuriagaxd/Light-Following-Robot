import React, { useState, useEffect, useRef } from 'react';

export default function CollisionMiniSim({ isFullscreen = false, onMaximize = null }) {
  // Constants based on screen state
  const ROBOT_R = 25;
  const BALL_R = 15;
  const CANVAS_W = isFullscreen ? 600 : 400;
  const CANVAS_H = isFullscreen ? 300 : 200;

  // Mass state variables
  const [Mr, setMr] = useState(3.0); // Robot Mass (kg)
  const [Mb, setMb] = useState(1.0); // Ball Mass (kg)

  // Default logical positions (Y is mathematically UP from bottom)
  const getInitRobotPos = () => isFullscreen ? { x: 120, y: 150 } : { x: 80, y: 100 };
  const getInitBallPos = () => isFullscreen ? { x: 380, y: 150 } : { x: 250, y: 100 };

  const [robotPos, setRobotPos] = useState(getInitRobotPos);
  const [ballPos, setBallPos] = useState(getInitBallPos);
  
  // Launch parameters (initial config)
  const [robotSpeed, setRobotSpeed] = useState(140); // px/s
  const [robotAngle, setRobotAngle] = useState(0);   // degrees (-180 to 180)
  const [ballSpeed, setBallSpeed] = useState(0);     // px/s
  const [ballAngle, setBallAngle] = useState(0);     // degrees (-180 to 180)
  
  // Last dragged positions to return to on Reset
  const [lastDragRobotPos, setLastDragRobotPos] = useState(getInitRobotPos);
  const [lastDragBallPos, setLastDragBallPos] = useState(getInitBallPos);

  // Running velocities during simulation
  const [activeRobotVel, setActiveRobotVel] = useState({ x: 140, y: 0 });
  const [activeBallVel, setActiveBallVel] = useState({ x: 0, y: 0 });
  
  // Settings
  const [restitution, setRestitution] = useState(0.8); // e (0.2 to 1.0)
  const [showNormal, setShowNormal] = useState(true);
  const [showVelocities, setShowVelocities] = useState(true);
  const [showOverlap, setShowOverlap] = useState(true);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [dragTarget, setDragTarget] = useState(null); // 'robot' | 'ball' | null

  // Fading overlay state for collision normal
  const [impactOpacity, setImpactOpacity] = useState(0);
  const [collisionPoint, setCollisionPoint] = useState(null);
  const [collisionNormal, setCollisionNormal] = useState({ x: 1, y: 0 });
  
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const cssSizeRef = useRef({ width: CANVAS_W, height: CANVAS_H });

  // Math conversions
  const radR = (robotAngle * Math.PI) / 180;
  const radB = (ballAngle * Math.PI) / 180;

  // Collision math values (for live trace panel)
  const dx = ballPos.x - robotPos.x;
  const dy = ballPos.y - robotPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const isColliding = dist < (ROBOT_R + BALL_R);
  
  // Normal Vector components
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;
  const overlap = isColliding ? (ROBOT_R + BALL_R) - dist : 0;

  // Read current velocities. True Cartesian Math: +Y is UP.
  const currentRobotVel = isSimulating 
    ? activeRobotVel 
    : { x: robotSpeed * Math.cos(radR), y: robotSpeed * Math.sin(radR) };
  const currentBallVel = isSimulating 
    ? activeBallVel 
    : { x: ballSpeed * Math.cos(radB), y: ballSpeed * Math.sin(radB) };

  // Relative velocity along normal vector
  const relVx = currentRobotVel.x - currentBallVel.x;
  const relVy = currentRobotVel.y - currentBallVel.y;
  const relVNormal = relVx * nx + relVy * ny; // Projection

  // Impulse J calculation
  const impulseForce = relVNormal > 0 ? ((1 + restitution) * relVNormal) / ((1/Mr) + (1/Mb)) : 0;

  // Dynamic simulation loop
  useEffect(() => {
    if (isSimulating) {
      let lastTime = performance.now();
      
      const updatePhysics = (time) => {
        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        
        let rx = robotPos.x + activeRobotVel.x * dt;
        let ry = robotPos.y + activeRobotVel.y * dt;
        let bx = ballPos.x + activeBallVel.x * dt;
        let by = ballPos.y + activeBallVel.y * dt;
        
        // Decay impact opacity
        setImpactOpacity(o => Math.max(0, o - dt * 2.0)); // Fades out in 0.5s

        // Wall boundaries for robot (elastic bounce with damping)
        if (rx < ROBOT_R) {
          rx = ROBOT_R; setActiveRobotVel(v => ({ ...v, x: -v.x * 0.8 }));
        } else if (rx > CANVAS_W - ROBOT_R) {
          rx = CANVAS_W - ROBOT_R; setActiveRobotVel(v => ({ ...v, x: -v.x * 0.8 }));
        }
        if (ry < ROBOT_R) { // Floor (Y=0 is bottom in math coords)
          ry = ROBOT_R; setActiveRobotVel(v => ({ ...v, y: -v.y * 0.8 }));
        } else if (ry > CANVAS_H - ROBOT_R) { // Ceiling
          ry = CANVAS_H - ROBOT_R; setActiveRobotVel(v => ({ ...v, y: -v.y * 0.8 }));
        }

        // Wall boundaries for ball (elastic bounce with damping)
        if (bx < BALL_R) {
          bx = BALL_R; setActiveBallVel(v => ({ ...v, x: -v.x * 0.85 }));
        } else if (bx > CANVAS_W - BALL_R) {
          bx = CANVAS_W - BALL_R; setActiveBallVel(v => ({ ...v, x: -v.x * 0.85 }));
        }
        if (by < BALL_R) {
          by = BALL_R; setActiveBallVel(v => ({ ...v, y: -v.y * 0.85 }));
        } else if (by > CANVAS_H - BALL_R) {
          by = CANVAS_H - BALL_R; setActiveBallVel(v => ({ ...v, y: -v.y * 0.85 }));
        }

        // Apply friction/drag to velocities
        setActiveRobotVel(v => ({ x: v.x * 0.985, y: v.y * 0.985 }));
        setActiveBallVel(v => ({ x: v.x * 0.982, y: v.y * 0.982 }));

        // Collision check
        const curDx = bx - rx;
        const curDy = by - ry;
        const curDist = Math.sqrt(curDx * curDx + curDy * curDy);
        
        if (curDist < (ROBOT_R + BALL_R)) {
          const curNx = curDx / curDist;
          const curNy = curDy / curDist;
          
          // Resolve overlap immediately along normal vector (mass weighted)
          const curOverlap = (ROBOT_R + BALL_R) - curDist;
          bx += curNx * curOverlap * (Mb / (Mr + Mb));
          by += curNy * curOverlap * (Mb / (Mr + Mb));
          rx -= curNx * curOverlap * (Mr / (Mr + Mb));
          ry -= curNy * curOverlap * (Mr / (Mr + Mb));
          
          // Relative velocity calculation
          const relVxCur = activeRobotVel.x - activeBallVel.x;
          const relVyCur = activeRobotVel.y - activeBallVel.y;
          const relVNormalCur = relVxCur * curNx + relVyCur * curNy;
          
          if (relVNormalCur > 0) { // Moving towards each other
            // Elastic collision impulse
            const impulse = ((1 + restitution) * relVNormalCur) / ((1/Mr) + (1/Mb));
            const finalImpulse = Math.max(impulse, 50); // Minimum collision bump
            
            setActiveRobotVel({
              x: activeRobotVel.x - (curNx * finalImpulse) / Mr,
              y: activeRobotVel.y - (curNy * finalImpulse) / Mr
            });
            setActiveBallVel({
              x: activeBallVel.x + (curNx * finalImpulse) / Mb,
              y: activeBallVel.y + (curNy * finalImpulse) / Mb
            });

            // Record collision point and normal for visual overlay
            setCollisionPoint({
              x: rx + curNx * ROBOT_R,
              y: ry + curNy * ROBOT_R
            });
            setCollisionNormal({ x: curNx, y: curNy });
            setImpactOpacity(1.0);
          }
        }

        setRobotPos({ x: rx, y: ry });
        setBallPos({ x: bx, y: by });

        // Stop simulation if both slide to a near standstill
        const rSpeedSq = activeRobotVel.x * activeRobotVel.x + activeRobotVel.y * activeRobotVel.y;
        const bSpeedSq = activeBallVel.x * activeBallVel.x + activeBallVel.y * activeBallVel.y;
        if (rSpeedSq < 2 && bSpeedSq < 2) {
          setIsSimulating(false);
        }
        
        if (isSimulating) {
          loopRef.current = requestAnimationFrame(updatePhysics);
        }
      };
      
      loopRef.current = requestAnimationFrame(updatePhysics);
    } else {
      cancelAnimationFrame(loopRef.current);
    }
    return () => cancelAnimationFrame(loopRef.current);
  }, [isSimulating, activeRobotVel, activeBallVel, restitution, robotPos, ballPos, CANVAS_W, CANVAS_H, Mr, Mb]);

  // Handle Drag & Drop to position robot or ball
  const handleMouseDown = (e) => {
    if (isSimulating) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const myScreen = (e.clientY - rect.top) * scaleY;
    const my = CANVAS_H - myScreen; // Convert screen to logical Y
    
    const distRobot = Math.hypot(mx - robotPos.x, my - robotPos.y);
    const distBall = Math.hypot(mx - ballPos.x, my - ballPos.y);
    
    if (distRobot < ROBOT_R) {
      setDragTarget('robot');
    } else if (distBall < BALL_R) {
      setDragTarget('ball');
    }
  };

  const handleMouseMove = (e) => {
    if (!dragTarget || isSimulating) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const myScreen = (e.clientY - rect.top) * scaleY;
    const my = CANVAS_H - myScreen; // Convert screen to logical Y
    
    if (dragTarget === 'robot') {
      const newRx = Math.max(ROBOT_R, Math.min(CANVAS_W - ROBOT_R, mx));
      const newRy = Math.max(ROBOT_R, Math.min(CANVAS_H - ROBOT_R, my));
      
      // Resolve overlap
      const dx = ballPos.x - newRx;
      const dy = ballPos.y - newRy;
      const dist = Math.hypot(dx, dy);
      if (dist < (ROBOT_R + BALL_R)) {
        const nx = dx / dist;
        const ny = dy / dist;
        const newBx = Math.max(BALL_R, Math.min(CANVAS_W - BALL_R, newRx + nx * (ROBOT_R + BALL_R)));
        const newBy = Math.max(BALL_R, Math.min(CANVAS_H - BALL_R, newRy + ny * (ROBOT_R + BALL_R)));
        setBallPos({ x: newBx, y: newBy });
      }
      setRobotPos({ x: newRx, y: newRy });
    } else if (dragTarget === 'ball') {
      const newBx = Math.max(BALL_R, Math.min(CANVAS_W - BALL_R, mx));
      const newBy = Math.max(BALL_R, Math.min(CANVAS_H - BALL_R, my));
      
      // Resolve overlap
      const dx = newBx - robotPos.x;
      const dy = newBy - robotPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < (ROBOT_R + BALL_R)) {
        const nx = dx / dist;
        const ny = dy / dist;
        const newRx = Math.max(ROBOT_R, Math.min(CANVAS_W - ROBOT_R, newBx - nx * (ROBOT_R + BALL_R)));
        const newRy = Math.max(ROBOT_R, Math.min(CANVAS_H - ROBOT_R, newBy - ny * (ROBOT_R + BALL_R)));
        setRobotPos({ x: newRx, y: newRy });
      }
      setBallPos({ x: newBx, y: newBy });
    }
  };

  const handleMouseUp = () => {
    if (dragTarget) {
      setLastDragRobotPos({ x: robotPos.x, y: robotPos.y });
      setLastDragBallPos({ x: ballPos.x, y: ballPos.y });
      setDragTarget(null);
    }
  };

  const triggerImpact = () => {
    // Launch using parameters from current positions
    const rxVel = robotSpeed * Math.cos(radR);
    const ryVel = robotSpeed * Math.sin(radR);
    const bxVel = ballSpeed * Math.cos(radB);
    const byVel = ballSpeed * Math.sin(radB);
    
    setRobotPos(lastDragRobotPos);
    setBallPos(lastDragBallPos);
    setActiveRobotVel({ x: rxVel, y: ryVel });
    setActiveBallVel({ x: bxVel, y: byVel });
    setImpactOpacity(0);
    setIsSimulating(true);
  };

  const reset = () => {
    setRobotPos(lastDragRobotPos);
    setBallPos(lastDragBallPos);
    setActiveRobotVel({ x: robotSpeed * Math.cos(radR), y: robotSpeed * Math.sin(radR) });
    setActiveBallVel({ x: ballSpeed * Math.cos(radB), y: ballSpeed * Math.sin(radB) });
    setIsSimulating(false);
    setImpactOpacity(0);
  };

  // Track actual CSS size for crisp Retina scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initial size
    const rect = canvas.getBoundingClientRect();
    cssSizeRef.current = { width: rect.width || CANVAS_W, height: rect.height || CANVAS_H };
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          cssSizeRef.current = {
            width: entry.contentRect.width,
            height: entry.contentRect.height
          };
        }
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [CANVAS_W, CANVAS_H]);

  // Canvas drawing effect (Converting Math coordinates to Screen coordinates internally)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Setup for High-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const cw = cssSizeRef.current.width;
    const ch = cssSizeRef.current.height;
    
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    
    ctx.save();
    ctx.scale(targetW / CANVAS_W, targetH / CANVAS_H);
    
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Math to Screen Y mapping
    const sY = (logicalY) => CANVAS_H - logicalY;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 20; x < CANVAS_W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 20; y < CANVAS_H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }
    
    // Axes labels
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '9px monospace';
    ctx.fillText('+Y', 4, 12);
    ctx.fillText('+X', CANVAS_W - 16, CANVAS_H - 4);
    ctx.fillText('(0,0)', 4, CANVAS_H - 4);

    // Draw Overlap Boundaries
    if (showOverlap && (isColliding || impactOpacity > 0)) {
      const activeOpacity = isColliding ? 0.15 : impactOpacity * 0.15;
      ctx.strokeStyle = `rgba(239, 68, 68, ${activeOpacity})`;
      ctx.fillStyle = `rgba(239, 68, 68, ${activeOpacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(robotPos.x, sY(robotPos.y), ROBOT_R + BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw Robot
    ctx.save();
    ctx.translate(robotPos.x, sY(robotPos.y));
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#3b82f6'; // Robot color
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, ROBOT_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw Ball
    ctx.save();
    ctx.translate(ballPos.x, sY(ballPos.y));
    ctx.beginPath();
    ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, BALL_R);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Pattern
    ctx.fillStyle = '#22c55e'; // Ball color
    ctx.beginPath(); ctx.arc(0, 0, BALL_R * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Draw Fading Collision Normal Vector
    if (showNormal && (isColliding || impactOpacity > 0)) {
      const activeOpacity = isColliding ? 1.0 : impactOpacity;
      const pt = collisionPoint || { x: robotPos.x + nx * ROBOT_R, y: robotPos.y + ny * ROBOT_R };
      const norm = collisionNormal;

      ctx.strokeStyle = `rgba(239, 68, 68, ${activeOpacity})`;
      ctx.lineWidth = 1.5;
      
      const arrowLength = 30;
      // In math coords:
      const ax = pt.x + norm.x * arrowLength;
      const ay = pt.y + norm.y * arrowLength;
      
      ctx.beginPath();
      ctx.moveTo(pt.x, sY(pt.y));
      ctx.lineTo(ax, sY(ay));
      ctx.stroke();
      
      // Arrowhead mapped to screen
      // Normal angle in math:
      const normAngle = Math.atan2(norm.y, norm.x);
      ctx.save();
      ctx.translate(ax, sY(ay));
      ctx.rotate(-normAngle); // Screen rotation is opposite
      ctx.fillStyle = `rgba(239, 68, 68, ${activeOpacity})`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-8, -4);
      ctx.fill();
      ctx.restore();

      // Dotted normal line
      ctx.strokeStyle = `rgba(239, 68, 68, ${activeOpacity * 0.3})`;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pt.x - norm.x * 120, sY(pt.y - norm.y * 120));
      ctx.lineTo(pt.x + norm.x * 120, sY(pt.y + norm.y * 120));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(252, 165, 165, ${activeOpacity})`;
      ctx.font = 'bold 8px monospace';
      ctx.fillText('Normal (n)', pt.x + norm.x * 20 - 15, sY(pt.y + norm.y * 20) - 8);
    }

    // Draw Velocity Vectors (Always preview or active)
    if (showVelocities) {
      // Robot Velocity Vector
      const rxSpeed = Math.sqrt(currentRobotVel.x * currentRobotVel.x + currentRobotVel.y * currentRobotVel.y);
      if (rxSpeed > 5) {
        ctx.strokeStyle = isSimulating ? '#3b82f6' : 'rgba(59, 130, 246, 0.4)';
        ctx.setLineDash(isSimulating ? [] : [3, 2]);
        ctx.lineWidth = 2;
        const scaleVel = 0.3;
        const vx = robotPos.x + currentRobotVel.x * scaleVel;
        const vy = robotPos.y + currentRobotVel.y * scaleVel;
        ctx.beginPath();
        ctx.moveTo(robotPos.x, sY(robotPos.y));
        ctx.lineTo(vx, sY(vy));
        ctx.stroke();
        ctx.setLineDash([]);
        
        const vAngle = Math.atan2(currentRobotVel.y, currentRobotVel.x);
        ctx.save();
        ctx.translate(vx, sY(vy));
        ctx.rotate(-vAngle);
        ctx.fillStyle = isSimulating ? '#3b82f6' : 'rgba(59, 130, 246, 0.5)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 4); ctx.lineTo(-8, -4); ctx.fill();
        ctx.restore();
      }

      // Ball Velocity Vector
      const ballSpeed = Math.sqrt(currentBallVel.x * currentBallVel.x + currentBallVel.y * currentBallVel.y);
      if (ballSpeed > 5) {
        ctx.strokeStyle = isSimulating ? '#22c55e' : 'rgba(34, 197, 110, 0.4)';
        ctx.setLineDash(isSimulating ? [] : [3, 2]);
        ctx.lineWidth = 2;
        const scaleVel = 0.3;
        const vx = ballPos.x + currentBallVel.x * scaleVel;
        const vy = ballPos.y + currentBallVel.y * scaleVel;
        ctx.beginPath();
        ctx.moveTo(ballPos.x, sY(ballPos.y));
        ctx.lineTo(vx, sY(vy));
        ctx.stroke();
        ctx.setLineDash([]);
        
        const vAngle = Math.atan2(currentBallVel.y, currentBallVel.x);
        ctx.save();
        ctx.translate(vx, sY(vy));
        ctx.rotate(-vAngle);
        ctx.fillStyle = isSimulating ? '#22c55e' : 'rgba(34, 197, 110, 0.5)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 4); ctx.lineTo(-8, -4); ctx.fill();
        ctx.restore();
      }
    }
    
    ctx.restore(); // Restore high-dpi scaling

  }, [robotPos, ballPos, currentRobotVel, currentBallVel, showNormal, showVelocities, showOverlap, dist, nx, ny, isColliding, impactOpacity, collisionPoint, collisionNormal, isSimulating, CANVAS_W, CANVAS_H]);

  return (
    <div className={`bg-slate-900/60 border border-white/5 text-slate-300 ${isFullscreen ? 'p-6 md:p-8 rounded-3xl h-full flex flex-col justify-between space-y-8 bg-transparent border-none' : 'p-5 rounded-2xl space-y-6'}`}>
      
      {/* Header */}
      {!isFullscreen && (
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            💥 Collision Impulse Vector Visualizer
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
            <span className="text-[9px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-bold font-mono">
              2D Sandbox
            </span>
          </div>
        </div>
      )}

      <div className={`flex gap-6 ${isFullscreen ? 'flex-col lg:flex-row flex-1 items-stretch' : 'flex-col'}`}>
        
        {/* Left: Canvas Area */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-4 font-mono text-[9px] ${isFullscreen ? 'justify-between' : ''}`}>
          <div 
            className="bg-black/40 rounded-xl p-2 border border-white/5 relative cursor-grab active:cursor-grabbing select-none w-full flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas 
              ref={canvasRef} 
              className={`rounded-lg shadow-inner bg-slate-950 w-full h-auto aspect-[2/1] ${isFullscreen ? 'max-w-[800px]' : 'max-w-[550px]'}`} 
            />
            <div className="absolute top-4 left-4 text-[8px] bg-black/60 px-2 py-1 rounded text-white/40 pointer-events-none">
              Drag robot or ball to set launch positions
            </div>
          </div>

          {/* Stepper Buttons & Sliders */}
          <div className={`w-full flex gap-3 justify-center ${isFullscreen ? 'max-w-[500px]' : 'max-w-[400px]'}`}>
            <button
              onClick={triggerImpact}
              disabled={isSimulating}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition uppercase ${isSimulating ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed' : 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 cursor-pointer'}`}
            >
              🚀 Launch Impact
            </button>
            <button
              onClick={reset}
              className="py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold tracking-wider transition uppercase cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: Calculations & Controls */}
        <div className={`w-full flex flex-col gap-4 font-sans text-xs shrink-0 ${isFullscreen ? 'w-[420px] justify-between' : 'w-full'}`}>
          
          {/* Launch Parameters Card */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono border-b border-white/5 pb-2">
              ⚙️ Physics Sandbox Config
            </h5>

            {/* Restitution */}
            <div>
              <div className="flex justify-between text-[10px] mb-1 font-mono">
                <span className="text-red-400 font-bold">Restitution Coefficient (<span className="font-serif italic">e</span>):</span>
                <span className="text-white font-bold">{restitution.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={restitution}
                onChange={(e) => setRestitution(parseFloat(e.target.value))}
                onDoubleClick={() => setRestitution(0.8)}
                className="w-full accent-red-500 h-1 bg-black/40 rounded-lg cursor-pointer"
              />
            </div>

            {/* Masses */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono text-blue-400">
                  <span>Robot Mass (<span className="font-serif italic">m<sub>R</sub></span>)</span>
                  <span className="text-white">{Mr} kg</span>
                </div>
                <input type="range" min="0.5" max="10" step="0.5" value={Mr} onChange={(e) => setMr(parseFloat(e.target.value))} onDoubleClick={() => setMr(3.0)} disabled={isSimulating} className="w-full accent-blue-500 h-1 bg-black/40 rounded-lg cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-1 font-mono text-green-400">
                  <span>Ball Mass (<span className="font-serif italic">m<sub>B</sub></span>)</span>
                  <span className="text-white">{Mb} kg</span>
                </div>
                <input type="range" min="0.5" max="10" step="0.5" value={Mb} onChange={(e) => setMb(parseFloat(e.target.value))} onDoubleClick={() => setMb(1.0)} disabled={isSimulating} className="w-full accent-green-500 h-1 bg-black/40 rounded-lg cursor-pointer" />
              </div>
            </div>

            {/* Robot Launch */}
            <div className="border-t border-white/5 pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-blue-400 uppercase font-mono">Robot Vector (Initial)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                    <span>Speed:</span>
                    <span className="text-white">{robotSpeed} px/s</span>
                  </div>
                  <input type="range" min="0" max="250" step="10" value={robotSpeed} onChange={(e) => setRobotSpeed(parseInt(e.target.value))} onDoubleClick={() => setRobotSpeed(140)} disabled={isSimulating} className="w-full accent-blue-500 h-1 bg-black/40 rounded-lg cursor-pointer disabled:opacity-50" />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                    <span>Angle (<span className="font-serif italic">&theta;</span>):</span>
                    <span className="text-white">{robotAngle}°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="5" value={robotAngle} onChange={(e) => setRobotAngle(parseInt(e.target.value))} onDoubleClick={() => setRobotAngle(0)} disabled={isSimulating} className="w-full accent-blue-500 h-1 bg-black/40 rounded-lg cursor-pointer disabled:opacity-50" />
                </div>
              </div>
            </div>

            {/* Ball Launch */}
            <div className="border-t border-white/5 pt-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-green-400 uppercase font-mono">Ball Vector (Initial)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                    <span>Speed:</span>
                    <span className="text-white">{ballSpeed} px/s</span>
                  </div>
                  <input type="range" min="0" max="250" step="10" value={ballSpeed} onChange={(e) => setBallSpeed(parseInt(e.target.value))} onDoubleClick={() => setBallSpeed(0)} disabled={isSimulating} className="w-full accent-green-500 h-1 bg-black/40 rounded-lg cursor-pointer disabled:opacity-50" />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-0.5">
                    <span>Angle (<span className="font-serif italic">&theta;</span>):</span>
                    <span className="text-white">{ballAngle}°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="5" value={ballAngle} onChange={(e) => setBallAngle(parseInt(e.target.value))} onDoubleClick={() => setBallAngle(0)} disabled={isSimulating} className="w-full accent-green-500 h-1 bg-black/40 rounded-lg cursor-pointer disabled:opacity-50" />
                </div>
              </div>
            </div>

          </div>

          {/* Mathematical Trace (Beautiful equations) */}
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3 font-sans">
            <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono">2D Impulse Equation Trace</p>
            
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 font-semibold">1. Separation Geometry:</span>
                <div className="bg-black/40 p-2 rounded-lg border border-white/5 font-serif italic text-[11px] text-slate-300 mt-1 space-y-0.5">
                  <div>&Delta;x = b<sub>x</sub> - r<sub>x</sub> = <span className="not-italic font-mono text-[9px] text-slate-400">{dx.toFixed(1)} px</span></div>
                  <div>&Delta;y = b<sub>y</sub> - r<sub>y</sub> = <span className="not-italic font-mono text-[9px] text-slate-400">{dy.toFixed(1)} px</span></div>
                  <div className="border-t border-white/5 pt-1 mt-1 font-bold flex justify-between">
                    <span>d = &radic;(&Delta;x² + &Delta;y²) =</span>
                    <span className={isColliding ? "text-red-400 not-italic font-mono text-[9px] animate-pulse" : "not-italic font-mono text-[9px] text-green-400"}>{dist.toFixed(1)} px</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">2. Normal Vector (<span className="font-serif italic font-bold">n</span>):</span>
                <div className="flex items-center gap-2 font-serif italic text-[11px] my-1 bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                  <span className="text-red-400 font-bold">n</span> = 
                  <span>(&Delta;x/d, &Delta;y/d)</span> <span className="not-italic">=</span>
                  <span className="text-green-400 font-bold font-mono text-[9px] not-italic">({nx.toFixed(2)}, {ny.toFixed(2)})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">3. Momentum Transfer Impulse (<span className="font-serif italic font-bold">J</span>):</span>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1 text-slate-300 font-serif italic text-[11px]">
                  <div>V<sub>R</sub> = <span className="font-mono text-[9px] not-italic text-slate-400">({currentRobotVel.x.toFixed(0)}, {currentRobotVel.y.toFixed(0)}) px/s</span></div>
                  <div>V<sub>B</sub> = <span className="font-mono text-[9px] not-italic text-slate-400">({currentBallVel.x.toFixed(0)}, {currentBallVel.y.toFixed(0)}) px/s</span></div>
                  <div>V<sub>rel_n</sub> = (V<sub>R</sub> - V<sub>B</sub>) &middot; n = <span className="font-mono text-[9px] not-italic text-slate-400">{relVNormal.toFixed(1)} px/s</span></div>
                  
                  <div className="border-t border-white/5 pt-1 mt-1">
                    <span className="text-slate-400 not-italic text-xs font-semibold">Impulse Scalar (J):</span>
                    <div className="flex items-center gap-2 my-1">
                      <span>J = (1+e) &middot; V<sub>rel_n</sub> / (1/m<sub>R</sub> + 1/m<sub>B</sub>)</span>
                    </div>
                    <div className="text-green-400 font-bold not-italic font-mono text-[9px] bg-black/40 p-1.5 rounded">
                      J = (1 + {restitution.toFixed(2)}) &middot; {relVNormal.toFixed(1)} / (1/{Mr} + 1/{Mb}) = {impulseForce.toFixed(1)} N&middot;s
                    </div>
                  </div>
                  
                  <div className="border-t border-white/5 pt-1.5 mt-1 leading-relaxed">
                    <span className="text-white font-bold not-italic text-xs">Post-Collision Velocities:</span><br />
                    V<sub>R_new</sub> = V<sub>R</sub> - n &middot; J / m<sub>R</sub> = <span className="text-blue-400 font-mono not-italic text-[9px]">({(currentRobotVel.x - nx * impulseForce / Mr).toFixed(0)}, {(currentRobotVel.y - ny * impulseForce / Mr).toFixed(0)})</span><br />
                    V<sub>B_new</sub> = V<sub>B</sub> + n &middot; J / m<sub>B</sub> = <span className="text-green-400 font-mono not-italic text-[9px]">({(currentBallVel.x + nx * impulseForce / Mb).toFixed(0)}, {(currentBallVel.y + ny * impulseForce / Mb).toFixed(0)})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkbox controls */}
          <div className="flex gap-2.5 flex-wrap text-[9px] p-2.5 bg-black/20 border border-white/5 rounded-xl justify-center font-bold font-mono">
            {[
              { id: 'normal', label: 'Normal Vector', val: showNormal, set: setShowNormal },
              { id: 'vels', label: 'Velocity Vectors', val: showVelocities, set: setShowVelocities },
              { id: 'overlap', label: 'Overlap Radius', val: showOverlap, set: setShowOverlap },
            ].map(item => (
              <label key={item.id} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="rounded border-white/10 bg-black/40 text-red-500 focus:ring-0 w-3 h-3 cursor-pointer"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
