import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChassisDiagram from './ChassisDiagram';
import KinematicsMiniSim from './KinematicsMiniSim';
import CollisionMiniSim from './CollisionMiniSim';
import TransistorLossDiagram from './TransistorLossDiagram';
import BatteryChemistrySim from './BatteryChemistrySim';
import LanguageSwitcher from '../LanguageSwitcher';

// ============================================================
//  SOCCER JR. SIMULATOR
//  Simulador interactivo de fútbol de robots
//  - Control por teclado (WASD / flechas)
//  - Física de balón: inercia, rebotes, fricción
//  - Colisión robot-balón
//  - Selector de driver (L293D vs L298N) con diferencia de eficiencia real
//  - Indicador de batería 18650 2S
//  - Consola BT (muestra comandos simulados)
//  - Marcador con detección de gol
// ============================================================

const FIELD_W = 800;
const FIELD_H = 520;
const GOAL_W = 16;
const GOAL_H = 140;
const ROBOT_R = 22;
const BALL_R = 12;
const FRICTION_BALL = 0.985;
const FRICTION_ROBOT = 0.82;
const RESTITUTION_WALL = 0.6;
const RESTITUTION_GOAL = 0.3;
const MAX_ROBOT_SPEED = 160; // px/s

// Driver characteristics
const DRIVERS = {
  L293D: { name: 'Shield L293D', efficiency: 0.80, color: '#4ade80', voltDrop: '~1.4V', maxSpeed: '80%', icon: '🟢' },
  L298N: { name: 'Módulo L298N', efficiency: 0.70, color: '#facc15', voltDrop: '~2.0V', maxSpeed: '70%', icon: '🟡' },
};

// 18650 2S battery simulation
const BATTERY_FULL_MV = 8400;
const BATTERY_WARN_MV = 6800;
const BATTERY_CRIT_MV = 6400;
const BATTERY_CAPACITY = 3000; // mAh (virtual)

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

const SoccerSimulator = () => {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const lastTimeRef = useRef(null);

  const [score, setScore] = useState({ home: 0, away: 0 });
  const [goalMsg, setGoalMsg] = useState(null);
  const [driver, setDriver] = useState('L298N');
  const [batteryMv, setBatteryMv] = useState(BATTERY_FULL_MV);
  const [batteryPct, setBatteryPct] = useState(100);
  const [btConsole, setBtConsole] = useState([]);
  const [currentCmd, setCurrentCmd] = useState('S');
  const [pwmInfo, setPwmInfo] = useState({ izq: 0, der: 0 });
  const [isRunning, setIsRunning] = useState(true);
  const [motorStats, setMotorStats] = useState({ izq: 0, der: 0 });
  const [batteryLow, setBatteryLow] = useState(false);
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'theory'
  const [fullscreenWidget, setFullscreenWidget] = useState(null); // 'chassis' | 'kinematics' | 'collision' | 'transistor' | 'battery' | null
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find(c => c.trim().startsWith('locale='));
    if (localeCookie) setLocale(localeCookie.split('=')[1]);
  }, []);

  // ---- Initialize game state ----
  const initState = useCallback(() => ({
    robot: {
      x: FIELD_W / 2 - 120,
      y: FIELD_H / 2,
      angle: 0, // radians, 0 = right
      vx: 0,
      vy: 0,
      omega: 0,
    },
    ball: {
      x: FIELD_W / 2,
      y: FIELD_H / 2,
      vx: 0,
      vy: 0,
    },
    battery: BATTERY_FULL_MV,
    goalCooldown: 0,
  }), []);

  useEffect(() => {
    stateRef.current = initState();
  }, [initState]);

  // ---- BT Console logger ----
  const logBt = useCallback((cmd) => {
    const labels = { F: 'Avanzar', B: 'Retroceder', L: 'Giro Izq', R: 'Giro Der', S: 'Stop', I: 'Giro Brusco Izq', J: 'Giro Brusco Der' };
    setBtConsole(prev => {
      const entry = `[TX] CMD: ${cmd} — ${labels[cmd] || '?'}`;
      return [entry, ...prev.slice(0, 6)];
    });
    setCurrentCmd(cmd);
  }, []);

  // ---- Key Handling ----
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(k)) e.preventDefault();
      keysRef.current[k] = true;
    };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ---- Physics Update ----
  const update = useCallback((dt) => {
    const s = stateRef.current;
    if (!s) return;
    const drv = DRIVERS[driver];
    const batCrit = s.battery < BATTERY_CRIT_MV;

    // --- Keyboard → command ---
    const k = keysRef.current;
    let cmd = 'S';
    let velL = 0, velR = 0;
    const maxV = MAX_ROBOT_SPEED * drv.efficiency;

    if (!batCrit) {
      if (k['arrowup'] || k['w']) { cmd = 'F'; velL = maxV; velR = maxV; }
      else if (k['arrowdown'] || k['s']) { cmd = 'B'; velL = -maxV; velR = -maxV; }
      else if (k['arrowleft'] || k['a']) { cmd = 'L'; velL = 0; velR = maxV * 0.8; }
      else if (k['arrowright'] || k['d']) { cmd = 'R'; velL = maxV * 0.8; velR = 0; }
      else if (k['q']) { cmd = 'I'; velL = -maxV * 0.7; velR = maxV * 0.7; }
      else if (k['e']) { cmd = 'J'; velL = maxV * 0.7; velR = -maxV * 0.7; }
    }

    // --- Robot differential drive physics ---
    const WHEEL_BASE = ROBOT_R * 2.2;
    const linV = (velL + velR) / 2;
    const angV = (velL - velR) / WHEEL_BASE;

    s.robot.angle += angV * dt;
    const targetVx = Math.cos(s.robot.angle) * linV;
    const targetVy = Math.sin(s.robot.angle) * linV;

    // Inertia (slew rate)
    s.robot.vx = s.robot.vx * FRICTION_ROBOT + targetVx * (1 - FRICTION_ROBOT);
    s.robot.vy = s.robot.vy * FRICTION_ROBOT + targetVy * (1 - FRICTION_ROBOT);

    s.robot.x += s.robot.vx * dt;
    s.robot.y += s.robot.vy * dt;

    // Clamp robot to field
    const margin = 14;
    const goalTopY = (FIELD_H - GOAL_H) / 2;
    const goalBotY = goalTopY + GOAL_H;

    s.robot.x = clamp(s.robot.x, margin + ROBOT_R, FIELD_W - margin - ROBOT_R);
    s.robot.y = clamp(s.robot.y, margin + ROBOT_R, FIELD_H - margin - ROBOT_R);

    // --- Ball physics ---
    s.ball.vx *= FRICTION_BALL;
    s.ball.vy *= FRICTION_BALL;
    s.ball.x += s.ball.vx * dt;
    s.ball.y += s.ball.vy * dt;

    // Ball-wall collision
    const wallL = margin + BALL_R;
    const wallR = FIELD_W - margin - BALL_R;
    const wallT = margin + BALL_R;
    const wallB = FIELD_H - margin - BALL_R;

    // Left wall (away goal area)
    if (s.ball.x < wallL) {
      if (s.ball.y >= goalTopY && s.ball.y <= goalBotY) {
        // GOAL! home scores
        return { goal: 'home' };
      }
      s.ball.x = wallL; s.ball.vx *= -RESTITUTION_WALL;
    }
    if (s.ball.x > wallR) {
      if (s.ball.y >= goalTopY && s.ball.y <= goalBotY) {
        return { goal: 'away' };
      }
      s.ball.x = wallR; s.ball.vx *= -RESTITUTION_WALL;
    }
    if (s.ball.y < wallT) { s.ball.y = wallT; s.ball.vy *= -RESTITUTION_WALL; }
    if (s.ball.y > wallB) { s.ball.y = wallB; s.ball.vy *= -RESTITUTION_WALL; }

    // Ball-robot collision
    const dx = s.ball.x - s.robot.x;
    const dy = s.ball.y - s.robot.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < ROBOT_R + BALL_R) {
      const nx = dx / d, ny = dy / d;
      const overlap = (ROBOT_R + BALL_R) - d;
      s.ball.x += nx * overlap;
      s.ball.y += ny * overlap;
      const relV = (s.robot.vx * nx + s.robot.vy * ny);
      const pushForce = Math.max(relV * 1.6, 40);
      s.ball.vx += nx * pushForce;
      s.ball.vy += ny * pushForce;
    }

    // --- Battery drain ---
    const motorLoad = (Math.abs(velL) + Math.abs(velR)) / (2 * MAX_ROBOT_SPEED);
    const drainRate = 0.5 + motorLoad * 3.0; // mV per second
    s.battery = Math.max(BATTERY_CRIT_MV - 100, s.battery - drainRate * dt);

    const pct = Math.max(0, Math.min(100, ((s.battery - BATTERY_CRIT_MV) / (BATTERY_FULL_MV - BATTERY_CRIT_MV)) * 100));
    setBatteryMv(Math.round(s.battery));
    setBatteryPct(Math.round(pct));
    setBatteryLow(s.battery < BATTERY_WARN_MV);
    setMotorStats({ izq: Math.round(Math.abs(velL / maxV) * 255), der: Math.round(Math.abs(velR / maxV) * 255) });

    // Update BT console if cmd changed
    if (cmd !== s._lastCmd) {
      logBt(cmd);
      s._lastCmd = cmd;
      setPwmInfo({ izq: Math.round(Math.abs(velL / maxV) * 255), der: Math.round(Math.abs(velR / maxV) * 255) });
    }

    if (s.goalCooldown > 0) s.goalCooldown -= dt;
    return null;
  }, [driver, logBt]);

  // ---- Render ----
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    if (!s) return;

    // === Field ===
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    // Grass stripes
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent';
      ctx.fillRect(i * (FIELD_W / 8), 0, FIELD_W / 8, FIELD_H);
    }

    // Field lines
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;

    // Border
    const m = 14;
    ctx.strokeRect(m, m, FIELD_W - m * 2, FIELD_H - m * 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(FIELD_W / 2, m);
    ctx.lineTo(FIELD_W / 2, FIELD_H - m);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Goals
    const goalTopY = (FIELD_H - GOAL_H) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    // Left goal
    ctx.fillRect(0, goalTopY, m + GOAL_W, GOAL_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeRect(0, goalTopY, m + GOAL_W, GOAL_H);
    // Right goal
    ctx.fillRect(FIELD_W - m - GOAL_W, goalTopY, m + GOAL_W, GOAL_H);
    ctx.strokeRect(FIELD_W - m - GOAL_W, goalTopY, m + GOAL_W, GOAL_H);

    // Goal labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AWAY', m / 2 + 4, FIELD_H / 2);
    ctx.fillText('HOME', FIELD_W - m / 2 - 4, FIELD_H / 2);

    // Penalty areas
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeRect(m, (FIELD_H - 180) / 2, 70, 180);
    ctx.strokeRect(FIELD_W - m - 70, (FIELD_H - 180) / 2, 70, 180);

    // === Robot ===
    const r = s.robot;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;

    // Body
    const drv = DRIVERS[driver];
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-ROBOT_R, -ROBOT_R, ROBOT_R * 2, ROBOT_R * 2, 6);
    ctx.fill();

    ctx.strokeStyle = drv.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Front indicator (direction arrow)
    ctx.fillStyle = drv.color;
    ctx.beginPath();
    ctx.moveTo(ROBOT_R - 4, 0);
    ctx.lineTo(ROBOT_R + 8, -6);
    ctx.lineTo(ROBOT_R + 8, 6);
    ctx.closePath();
    ctx.fill();

    // HC-05 BT chip indicator
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-8, -8, 6, 6);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BT', -5, -4);

    // Wheels
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-ROBOT_R - 4, -ROBOT_R, 5, ROBOT_R * 0.8);
    ctx.fillRect(-ROBOT_R - 4, ROBOT_R * 0.2, 5, ROBOT_R * 0.8);
    ctx.fillRect(ROBOT_R - 1, -ROBOT_R, 5, ROBOT_R * 0.8);
    ctx.fillRect(ROBOT_R - 1, ROBOT_R * 0.2, 5, ROBOT_R * 0.8);

    ctx.restore();

    // === Ball ===
    const b = s.ball;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;

    // Ball body
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(b.x - 3, b.y - 3, 2, b.x, b.y, BALL_R);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fill();

    // Ball pentagon pattern
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // === Goal Flash ===
    if (s.goalCooldown > 0) {
      const alpha = s.goalCooldown / 1.5;
      ctx.fillStyle = `rgba(250,204,21,${alpha * 0.3})`;
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    }
  }, [driver]);

  // ---- Game Loop ----
  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    let prevGoalSide = null;

    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const result = update(dt);
      if (result?.goal && stateRef.current.goalCooldown <= 0) {
        const side = result.goal;
        stateRef.current.goalCooldown = 1.5;
        setScore(prev => ({ ...prev, [side]: prev[side] + 1 }));
        setGoalMsg('⚽ ¡GOOOOL!');
        setTimeout(() => setGoalMsg(null), 2000);
        // Reset positions
        setTimeout(() => {
          if (stateRef.current) {
            stateRef.current.ball = { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0 };
            stateRef.current.robot = { ...stateRef.current.robot, x: FIELD_W / 2 - 120, y: FIELD_H / 2, vx: 0, vy: 0 };
          }
        }, 1200);
      }

      render();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, update, render]);

  const resetGame = () => {
    stateRef.current = initState();
    setScore({ home: 0, away: 0 });
    setGoalMsg(null);
    lastTimeRef.current = null;
  };

  const getBatColor = () => {
    if (batteryMv < BATTERY_CRIT_MV) return '#ef4444';
    if (batteryMv < BATTERY_WARN_MV) return '#f59e0b';
    return '#4ade80';
  };

  const batV = (batteryMv / 1000).toFixed(2);

  return (
    <div className="w-screen h-screen bg-[#0a0f1e] text-white font-mono overflow-hidden select-none flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <a href="/" className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            {locale === 'es' ? '← Volver' : '← Back'}
          </a>
          <span className="w-px h-4 bg-white/10" />
          <h1 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
            {locale === 'es' ? '⚽ Soccer Jr. Simulador' : '⚽ Soccer Jr. Simulator'}
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
          <button 
            onClick={() => setActiveTab('simulator')} 
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'simulator' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}
          >
            {locale === 'es' ? '🎮 Simulador' : '🎮 Simulator'}
          </button>
          <button 
            onClick={() => setActiveTab('theory')} 
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'theory' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'}`}
          >
            {locale === 'es' ? '📖 Teoría y Código' : '📖 Theory & Code'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
          <LanguageSwitcher client:load />
          <span>WASD / ↑↓←→ — Q/E: Giro brusco</span>
        </div>
      </header>

      {activeTab === 'simulator' ? (
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT PANEL — Controls */}
          <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col gap-4 p-5 overflow-y-auto shrink-0">

            {/* Driver Selector */}
            <section className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                {locale === 'es' ? '🔌 Seleccionar Driver' : '🔌 Select Driver'}
              </p>
              {Object.entries(DRIVERS).map(([key, drv]) => (
                <button
                  key={key}
                  onClick={() => setDriver(key)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${driver === key ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black" style={{ color: drv.color }}>{drv.icon} {drv.name}</span>
                    {driver === key && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">ACTIVO</span>}
                  </div>
                  <div className="mt-1 text-[9px] text-white/40 space-y-0.5">
                    <div>Eficiencia: <span style={{ color: drv.color }}>{(drv.efficiency * 100).toFixed(0)}%</span></div>
                    <div>Caída de voltaje: <span className="text-white/60">{drv.voltDrop}</span></div>
                    <div>Velocidad máx: <span style={{ color: drv.color }}>{drv.maxSpeed}</span></div>
                  </div>
                </button>
              ))}
              <p className="text-[8px] text-white/20 italic leading-relaxed">
                El L298N usa transistores bipolares Darlington que generan ~2V de caída interna. Con batería de 7.4V, los motores solo reciben ~5.4V efectivos.
              </p>
            </section>

            <hr className="border-white/5" />

            {/* Battery */}
            <section className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">🔋 Batería 18650 2S</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/50">Voltaje:</span>
                  <span className="font-black text-sm" style={{ color: getBatColor() }}>{batV} V</span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${batteryPct}%`, background: getBatColor() }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/30">
                  <span>6.4V Crítico</span>
                  <span className="font-black" style={{ color: getBatColor() }}>{batteryPct}%</span>
                  <span>8.4V Máx</span>
                </div>
                {batteryLow && (
                  <div className="text-[9px] text-amber-400 font-black animate-pulse">
                    ⚠️ Batería baja — cargar pronto
                  </div>
                )}
                {batteryMv < BATTERY_CRIT_MV && (
                  <div className="text-[9px] text-red-400 font-black animate-pulse">
                    🛑 ¡CRÍTICO! Motores desactivados
                  </div>
                )}
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Motor PWM */}
            <section className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">⚙️ Salida Motores (PWM)</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'IZQUIERDO', val: motorStats.izq }, { label: 'DERECHO', val: motorStats.der }].map(m => (
                  <div key={m.label} className="p-2 bg-white/5 rounded-lg border border-white/5 text-center">
                    <p className="text-[8px] text-white/40 uppercase tracking-widest">{m.label}</p>
                    <p className="text-lg font-black" style={{ color: DRIVERS[driver].color }}>{m.val}</p>
                    <p className="text-[8px] text-white/20">/ 255</p>
                    <div className="w-full h-1 bg-black/40 rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(m.val / 255) * 100}%`, background: DRIVERS[driver].color }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-white/5" />

            {/* BT Console */}
            <section className="space-y-2 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">📡 Consola Bluetooth HC-05</p>
              <div className="p-3 rounded-xl bg-black/60 border border-blue-500/20 font-mono text-[9px] space-y-0.5 min-h-[120px]">
                {btConsole.length === 0 && <p className="text-white/20 italic">Esperando comandos...</p>}
                {btConsole.map((line, i) => (
                  <div key={i} className={`transition-opacity ${i === 0 ? 'text-blue-300' : 'text-white/20'}`}>{line}</div>
                ))}
              </div>
            </section>

            <hr className="border-white/5" />

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsRunning(v => !v)}
                className={`p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isRunning ? 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10' : 'bg-green-500 text-black shadow-lg shadow-green-500/20 hover:scale-105'}`}
              >
                {isRunning ? (locale === 'es' ? 'Pausar' : 'Pause') : (locale === 'es' ? 'Reanudar' : 'Resume')}
              </button>
              <button
                onClick={resetGame}
                className="p-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/5 text-white/40 border border-white/10 hover:bg-red-500 hover:text-white transition-all"
              >
                Reset
              </button>
            </div>
          </aside>

          {/* CENTER — Field */}
          <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4 relative">

            {/* Scoreboard */}
            <div className="flex items-center gap-8 bg-black/60 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10">
              <div className="text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-widest">HOME</p>
                <p className="text-4xl font-black text-white">{score.home}</p>
              </div>
              <div className="text-white/20 font-black text-2xl">VS</div>
              <div className="text-center">
                <p className="text-[8px] text-white/30 uppercase tracking-widest">AWAY</p>
                <p className="text-4xl font-black text-white">{score.away}</p>
              </div>
            </div>

            {/* Field Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={FIELD_W}
                height={FIELD_H}
                className="rounded-2xl shadow-2xl shadow-black/60 border border-white/10"
              />
              {/* Goal overlay */}
              {goalMsg && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-5xl font-black text-white bg-black/60 backdrop-blur-md px-10 py-6 rounded-3xl border border-yellow-400/40 shadow-2xl shadow-yellow-400/20 animate-bounce">
                    {goalMsg}
                  </div>
                </div>
              )}
              {/* Battery critical overlay */}
              {batteryMv < BATTERY_CRIT_MV && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-red-900/20 rounded-2xl">
                  <div className="text-2xl font-black text-red-400 bg-black/80 px-8 py-4 rounded-2xl border border-red-500/40 animate-pulse">
                    🔋 BATERÍA CRÍTICA — RECARGA
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard guide */}
            <div className="flex items-center gap-6 text-[9px] text-white/30 font-mono">
              {[['W / ↑', 'Avanzar'], ['S / ↓', 'Retroceder'], ['A / ←', 'Giro Izq'], ['D / →', 'Giro Der'], ['Q', 'Giro Brusco Izq'], ['E', 'Giro Brusco Der']].map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/60 border border-white/10 font-black text-[9px]">{k}</kbd>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </main>

          {/* RIGHT PANEL — Info */}
          <aside className="w-64 bg-black/40 backdrop-blur-xl border-l border-white/5 flex flex-col gap-4 p-5 overflow-y-auto shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">📊 Info en Tiempo Real</p>

            {/* Current command */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
              <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1">Comando Activo</p>
              <p className="text-4xl font-black" style={{ color: DRIVERS[driver].color }}>{currentCmd}</p>
              <p className="text-[9px] text-white/40 mt-1">{{ F: 'AVANZAR', B: 'RETROCEDER', L: 'GIRO IZQ', R: 'GIRO DER', S: 'STOP', I: 'G. BRUSCO IZQ', J: 'G. BRUSCO DER' }[currentCmd]}</p>
            </div>

            {/* Driver comparison */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">⚡ Diferencia de Drivers</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-3">
                {Object.entries(DRIVERS).map(([key, drv]) => (
                  <div key={key} className={`space-y-1 ${driver !== key ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between text-[9px]">
                      <span style={{ color: drv.color }}>{drv.icon} {drv.name}</span>
                      <span className="text-white/60">{(drv.efficiency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${drv.efficiency * 100}%`, background: drv.color }} />
                    </div>
                    <p className="text-[8px] text-white/30">Veloc. real: {(MAX_ROBOT_SPEED * drv.efficiency).toFixed(0)} px/s</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Physics info */}
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">🧠 Física del Robot</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[9px] text-white/40 space-y-2 leading-relaxed">
                <p>🔄 <strong className="text-white/60">Tracción diferencial:</strong> Dos ruedas independientes controlan velocidad lineal y angular.</p>
                <p>⏱️ <strong className="text-white/60">Inercia (slew rate):</strong> Los motores no aceleran instantáneamente — cuida los plásticos.</p>
                <p>⚽ <strong className="text-white/60">Colisión elástica:</strong> La pelota recibe un impulso proporcional a la velocidad del robot.</p>
              </div>
            </div>

            {/* Telemetry tip */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[9px] text-blue-300/60 leading-relaxed mt-auto">
              💡 <strong className="text-blue-300/80">Post-Match:</strong> Conecta el USB al Arduino y escribe <code className="bg-white/5 px-1 rounded">D</code> en el monitor serie para volcar el log CSV del partido.
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-[#070b15] p-6 md:p-12 font-sans select-text">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Main Title */}
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-2">
                {locale === 'es' ? 'Teoría Técnica y Código' : 'Technical Theory & Code Explanations'}
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                {locale === 'es' 
                  ? 'Explora las leyes de la física, matemática del chasis diferencial, electrónica de potencia y la arquitectura del código detrás de la simulación del Soccer Jr.' 
                  : 'Explore the physics laws, differential drive mathematics, power electronics, and software architecture behind the Soccer Jr. robot simulation.'}
              </p>
            </div>

            {/* Section 1: Differential Drive */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                  <span>🤖</span> {locale === 'es' ? '1. Cinemática de Tracción Diferencial' : '1. Differential Drive Kinematics'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {locale === 'es' 
                    ? <React.Fragment>El robot Soccer Jr. usa una configuración de <strong>tracción diferencial</strong>. Consiste en dos ruedas independientes de radio <code className="text-orange-400">r</code> separadas por una distancia <code className="text-orange-400">d</code> (el ancho o <em>wheelbase</em>). Al comandar diferentes velocidades a la rueda izquierda (<code className="text-orange-400">v_L</code>) y derecha (<code className="text-orange-400">v_R</code>), controlamos el giro y la traslación del robot en el plano 2D.</React.Fragment>
                    : <React.Fragment>The Soccer Jr. robot uses a <strong>differential drive</strong> layout. It consists of two independent wheels of radius <code className="text-orange-400">r</code> separated by a distance <code className="text-orange-400">d</code> (the track width or <em>wheelbase</em>). By commanding different speeds to the left wheel (<code className="text-orange-400">v_L</code>) and the right wheel (<code className="text-orange-400">v_R</code>), we control the robot's heading and translation over a 2D plane.</React.Fragment>
                  }
                </p>
              </div>

              {/* Chassis Diagram Widget */}
              <ChassisDiagram onMaximize={() => setFullscreenWidget('chassis')} />

              <div className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  To calculate the overall chassis velocities, the simulator averages wheel speeds for translation and computes their difference for rotation:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">Chassis Linear Speed (v)</span>
                    <div className="flex items-center gap-3 font-mono text-sm justify-center py-2 bg-black/40 rounded-lg">
                      <span className="text-orange-400 font-bold">v</span>
                      <span>=</span>
                      <div className="flex flex-col items-center">
                        <span className="border-b border-white/20 px-2 pb-0.5 text-slate-200 font-bold">v<sub>L</sub> + v<sub>R</sub></span>
                        <span className="pt-0.5 text-slate-200">2</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-mono">Chassis Angular Speed (ω)</span>
                    <div className="flex items-center gap-3 font-mono text-sm justify-center py-2 bg-black/40 rounded-lg">
                      <span className="text-orange-400 font-bold">ω</span>
                      <span>=</span>
                      <div className="flex flex-col items-center">
                        <span className="border-b border-white/20 px-2 pb-0.5 text-slate-200 font-bold font-mono">v<sub>L</sub> - v<sub>R</sub></span>
                        <span className="pt-0.5 text-slate-200">d</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-4 border border-white/5 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Discrete-Time State Integration (Euler)</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    At each time interval <code className="text-yellow-400">&Delta;t</code>, the simulator updates the coordinates (<code className="text-sky-300">x, y</code>) and the heading angle (<code className="text-sky-300">&theta;</code>) of the robot on the field:
                  </p>
                  <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-orange-300 space-y-1 text-center max-w-sm mx-auto">
                    <div>x<sub>t + &Delta;t</sub> = x<sub>t</sub> + v &middot; cos(&theta;) &middot; &Delta;t</div>
                    <div>y<sub>t + &Delta;t</sub> = y<sub>t</sub> + v &middot; sin(&theta;) &middot; &Delta;t</div>
                    <div>&theta;<sub>t + &Delta;t</sub> = &theta;<sub>t</sub> + &omega; &middot; &Delta;t</div>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed mt-2">
                    <strong>Friction & Inertia (Slew Rate):</strong> Real motors cannot accelerate instantly. To mimic mass, target velocities are smoothed out dynamically over time using a coefficient of friction &mu; = 82%:
                    <code className="block bg-black/30 p-2 rounded mt-2 font-mono text-slate-300">v_actual = v_actual * &mu; + v_target * (1 - &mu;)</code>
                  </p>
                </div>
              </div>

              {/* Kinematics Mini Simulator */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {locale === 'es' ? '🎮 Laboratorio de Cinemática: Graficador Paso a Paso' : '🎮 Kinematics Lab: Step-by-Step State Plotter'}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {locale === 'es' 
                    ? <React.Fragment>Prueba configurar las velocidades de las ruedas y haz clic en <strong>"Paso a Paso"</strong> para ver cómo las coordenadas, velocidades y ángulos trigonométricos se calculan en tiempo real en el plano cartesiano.</React.Fragment>
                    : <React.Fragment>Try configuring wheel velocities and clicking <strong>"Single Step"</strong> to watch the coordinates, velocities, and trigonometric angle updates calculate in real-time on the coordinate plane.</React.Fragment>
                  }
                </p>
                <KinematicsMiniSim onMaximize={() => setFullscreenWidget('kinematics')} />
              </div>
            </section>

            {/* Section 2: Collisions */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                  <span>⚽</span> {locale === 'es' ? '2. Colisiones de Cuerpos Rígidos y Transferencia de Impulso' : '2. Rigid Body Collisions & Impulse Transfer'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {locale === 'es' 
                    ? 'El robot y la pelota se modelan como círculos rígidos 2D. Las colisiones físicas ocurren en dos etapas distintas:'
                    : 'The robot and ball are modeled as 2D rigid circles. Physical collisions occur in two distinct stages:'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-orange-400 block uppercase tracking-wider text-[10px] font-mono">1. Overlap Correction</span>
                  <p className="leading-relaxed">
                    If distance <code className="text-slate-300 font-mono">d &lt; R + r</code>, the circles are overlapping. The simulator calculates the collision normal vector <code className="text-red-400 font-mono">n</code> and pushes the ball out of the robot's radius boundary.
                  </p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="font-bold text-orange-400 block uppercase tracking-wider text-[10px] font-mono">2. Velocity Impulse Transfer</span>
                  <p className="leading-relaxed">
                    Upon contact, relative velocity is projected onto normal vector <code className="text-red-400 font-mono">n</code>. The ball receives a kinetic push proportional to this velocity, scaled by the driver's restitution multiplier:
                    <code className="block bg-black/30 p-1.5 rounded mt-1 font-mono text-[9px]">V_ball = V_ball + n &middot; (V_rel &middot; restitution)</code>
                  </p>
                </div>
              </div>

              {/* Collision Sandbox Widget */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  🎮 Collision Sandbox: Interactive Vector Plotter
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Drag the robot to manually bump the ball, or click <strong>"Launch Impact"</strong> to run a dynamic linear collision. Toggle checkboxes to see the normal contact line (<code className="text-red-400">n</code>) and impulse computations.
                </p>
                <CollisionMiniSim onMaximize={() => setFullscreenWidget('collision')} />
              </div>
            </section>

            {/* Section 3: Electronics */}
            <section className="space-y-4">
              <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                <span>🔌</span> {locale === 'es' ? '3. Caídas de Voltaje en Controladores de Motores' : '3. Motor Controller Voltage Drops'}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {locale === 'es' 
                  ? 'Una de las lecciones de hardware más importantes en robótica es que los drivers de motores desperdician energía. Este simulador modela con precisión los perfiles de eficiencia de chips comunes. Usa el modelo de transistor interactivo abajo para analizar cómo la carga de corriente afecta la caída de voltaje y la disipación de calor.'
                  : 'One of the most important hardware lessons in student robotics is that motor drivers waste energy. This simulator accurately models the efficiency profiles of common chips. Use the interactive transistor model below to analyze how current load affects voltage drop and heat dissipation.'
                }
              </p>

              <TransistorLossDiagram onMaximize={() => setFullscreenWidget('transistor')} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-sm text-green-400">🔌 Darlington BJT Drivers (L298N / L293D)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Older bridges like the L298N and L293D use Bipolar Junction Transistors (BJTs). These act as constant diodes, dropping a fixed voltage (V<sub>CE sat</sub>) which turns directly into heat.
                  </p>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                    <li><strong>L298N Datasheet:</strong> Total drop of <strong>~1.8V - 2.0V</strong> at 1A current.</li>
                    <li><strong>L293D Datasheet:</strong> Total drop of <strong>~1.4V - 2.6V</strong> at 600mA current.</li>
                    <li><strong>Impact:</strong> With a 7.4V battery, motors only receive ~5.4V, limiting real speed to ~70%.</li>
                  </ul>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-xl border border-white/5 space-y-2">
                  <h4 className="font-bold text-sm text-blue-400">⚡ Modern MOSFET Drivers (TB6612FNG)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Modern chips use MOSFET transistors. MOSFETs act as small resistors (R<sub>DS on</sub>) rather than fixed voltage drops.
                  </p>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                    <li><strong>TB6612FNG Datasheet:</strong> Internal resistance is only <strong>0.5 &Omega;</strong>.</li>
                    <li><strong>Impulse drop:</strong> V = I &middot; R = 1A &middot; 0.5&Omega; = <strong>0.5V</strong> drop.</li>
                    <li><strong>Impact:</strong> Motors receive over 90% of battery potential, making it much more efficient.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4: Battery */}
            <section className="space-y-4">
              <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                <span>🔋</span> {locale === 'es' ? '4. Química de Baterías de Ion-Litio (18650 2S)' : '4. Lithium-Ion Battery Chemistry (18650 2S)'}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {locale === 'es' 
                  ? 'El robot funciona con un pack de baterías de Ion-Litio 2S (2 celdas en serie). Ajusta los controles abajo para explorar cómo el Estado de Carga (SoC), el consumo de corriente de los motores y la resistencia interna de las celdas interactúan para crear caídas de voltaje y pérdidas térmicas.'
                  : 'The robot is powered by a 2S (2-cell series) Lithium-Ion battery pack. Adjust the sliders below to explore how State of Charge (SoC), motor current draw, and internal cell resistance interact to create voltage sag and thermal losses.'
                }
              </p>

              <BatteryChemistrySim onMaximize={() => setFullscreenWidget('battery')} />
            </section>

            {/* Section 5: Code Architecture */}
            <section className="space-y-4">
              <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                <span>💻</span> {locale === 'es' ? '5. Arquitectura del Código del Simulador' : '5. Simulator Code Architecture'}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {locale === 'es' 
                  ? 'La simulación está programada en JavaScript/React y se renderiza en un Canvas HTML5 2D muy rápido.'
                  : 'The simulation is coded in JavaScript/React and rendered on a fast HTML5 2D Canvas.'
                }
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {locale === 'es' ? 'El Bucle de Simulación' : 'The Simulation Loop'}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {locale === 'es'
                      ? <span>Para mantener las actualizaciones de físicas fluidas, usamos <code>requestAnimationFrame</code> apuntando a 60 FPS. Para prevenir "stale closures" en React, el estado de la física se almacena en un <code>stateRef</code> mutable:</span>
                      : <span>To maintain smooth physics updates, we use <code>requestAnimationFrame</code> targeting 60 FPS. To prevent stale closures in React, the physics state is stored in a mutable <code>stateRef</code>:</span>
                    }
                  </p>
                  <pre className="bg-black/60 p-4 rounded-xl border border-white/5 font-mono text-xs overflow-x-auto text-left leading-relaxed text-slate-300">
                    <code>
                      <span className="text-purple-400">const</span> <span className="text-blue-300">loop</span> = (<span className="text-orange-300">timestamp</span>) =&gt; {"{"}<br />
                      &nbsp;&nbsp;<span className="text-purple-400">if</span> (!<span className="text-blue-300">lastTimeRef</span>.<span className="text-blue-300">current</span>) <span className="text-blue-300">lastTimeRef</span>.<span className="text-blue-300">current</span> = <span className="text-blue-300">timestamp</span>;<br />
                      &nbsp;&nbsp;<span className="text-purple-400">const</span> <span className="text-blue-300">dt</span> = Math.min((<span className="text-blue-300">timestamp</span> - <span className="text-blue-300">lastTimeRef</span>.<span className="text-blue-300">current</span>) / 1000, 0.05);<br />
                      &nbsp;&nbsp;<span className="text-blue-300">lastTimeRef</span>.<span className="text-blue-300">current</span> = <span className="text-blue-300">timestamp</span>;<br /><br />
                      &nbsp;&nbsp;<span className="text-purple-400">const</span> <span className="text-blue-300">result</span> = <span className="text-blue-300">update</span>(<span className="text-blue-300">dt</span>); <span className="text-green-500">// Run kinematic step and collisions</span><br />
                      &nbsp;&nbsp;<span className="text-blue-300">render</span>(); <span className="text-green-500">// Draw current frame to canvas</span><br />
                      &nbsp;&nbsp;<span className="text-blue-300">animRef</span>.<span className="text-blue-300">current</span> = <span className="text-blue-300">requestAnimationFrame</span>(<span className="text-blue-300">loop</span>);<br />
                      {"}"};
                    </code>
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {locale === 'es' ? 'Emulación de Enlace Serial Arduino' : 'Arduino Serial Link Emulation'}
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {locale === 'es'
                      ? "El simulador mapea entradas de teclado a códigos ASCII de un solo carácter, imitando cómo el transceptor Bluetooth HC-05 envía comandos al ATmega328P del Arduino:"
                      : "The simulator maps key inputs to single ASCII character codes, mimicking how the HC-05 Bluetooth transceiver sends commands to the Arduino's ATmega328P:"
                    }
                  </p>
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 font-mono text-xs space-y-1">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">Keyboard input</span>
                      <span className="text-orange-400 font-bold">ASCII Command</span>
                      <span className="text-slate-400">Motor Action</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span>W / ↑ (ArrowUp)</span>
                      <span className="text-orange-400 font-bold">'F'</span>
                      <span>Left V: 100% | Right V: 100% (Forward)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>S / ↓ (ArrowDown)</span>
                      <span className="text-orange-400 font-bold">'B'</span>
                      <span>Left V: -100% | Right V: -100% (Backward)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>A / ← (ArrowLeft)</span>
                      <span className="text-orange-400 font-bold">'L'</span>
                      <span>Left V: 0% | Right V: 80% (Pivots Left)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>D / → (ArrowRight)</span>
                      <span className="text-orange-400 font-bold">'R'</span>
                      <span>Left V: 80% | Right V: 0% (Pivots Right)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Q / E (Spin)</span>
                      <span className="text-orange-400 font-bold">'I' / 'J'</span>
                      <span>Opposite wheel rotation (Sharp Spin)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* References */}
            <section className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                {locale === 'es' ? 'Hojas de Datos y Referencias' : 'Datasheets & References'}
              </h4>
              <ul className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed">
                <li>STMicroelectronics, <em>L298 Dual Full-Bridge Driver Datasheet</em>, DocID 1773. <a href="https://www.sparkfun.com/datasheets/Robotics/L298_H_Bridge.pdf" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{locale === 'es' ? 'Ver PDF' : 'Access PDF'}</a></li>
                <li>Texas Instruments, <em>L293D Quadruple Half-H Drivers Datasheet</em>, SLRS008C. <a href="https://www.ti.com/lit/ds/symlink/l293d.pdf" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{locale === 'es' ? 'Ver PDF' : 'Access PDF'}</a></li>
                <li>Siegwart, R., Nourbakhsh, I. R., & Scaramuzza, D. (2011). <em>Introduction to Autonomous Mobile Robots</em>. MIT Press.</li>
                <li>Samsung SDI, <em>Samsung INR18650-25R Li-Ion Battery Technical Specification</em>.</li>
              </ul>
            </section>

          </div>
        </div>
      )}

      {/* Fullscreen Overlay Sandbox */}
      {fullscreenWidget && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/98 backdrop-blur-md p-4 md:p-8 overflow-y-auto flex flex-col items-center select-none animate-in fade-in duration-200">
          <div className="w-full max-w-5xl flex flex-col h-full gap-4">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-orange-400 font-mono">
                {fullscreenWidget === 'chassis' && (locale === 'es' ? '📏 Sandbox de Dimensiones' : '📏 Chassis Dimensions Sandbox')}
                {fullscreenWidget === 'kinematics' && (locale === 'es' ? '🧮 Sandbox de Cinemática' : '🧮 Kinematic Equations Sandbox')}
                {fullscreenWidget === 'collision' && (locale === 'es' ? '💥 Sandbox de Vectores de Colisión' : '💥 2D Collision Vector Sandbox')}
                {fullscreenWidget === 'transistor' && (locale === 'es' ? '⚡ Sandbox de Pérdida de Transistores' : '⚡ Transistor Power Loss Sandbox')}
                {fullscreenWidget === 'battery' && (locale === 'es' ? '🔋 Sandbox de Caída de Voltaje' : '🔋 Battery Voltage Sag Sandbox')}
              </h2>
              <button 
                onClick={() => setFullscreenWidget(null)}
                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-white rounded-xl transition text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                {locale === 'es' ? '← Cerrar' : '← Close Sandbox'}
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex items-center justify-center p-2 bg-[#090e1a]/85 border border-white/5 rounded-3xl shadow-2xl">
              {fullscreenWidget === 'chassis' && <ChassisDiagram isFullscreen={true} />}
              {fullscreenWidget === 'kinematics' && <KinematicsMiniSim isFullscreen={true} />}
              {fullscreenWidget === 'collision' && <CollisionMiniSim isFullscreen={true} />}
              {fullscreenWidget === 'transistor' && <TransistorLossDiagram isFullscreen={true} />}
              {fullscreenWidget === 'battery' && <BatteryChemistrySim isFullscreen={true} />}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SoccerSimulator;
