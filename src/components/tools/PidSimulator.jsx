import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION CONSTANTS (Matching Original) ---
const PPM = 10;
const SVG_SCALE = 0.25;
const SENSOR_DIST_PX = 598 * SVG_SCALE;
const SENSOR_PITCH = 0.9525 * PPM;
const TRACK_WIDTH = 165;

const PidSimulator = () => {
    // --- UI Reactive State ---
    const [isRunning, setIsRunning] = useState(false);
    const [timeScale, setTimeScale] = useState(1.0);

    const [kp, setKp] = useState(0.08);
    const [kd, setKd] = useState(2.2);
    const [ki, setKi] = useState(0.005);
    const [enKp, setEnKp] = useState(true);
    const [enKd, setEnKd] = useState(true);
    const [enKi, setEnKi] = useState(true);
    const [baseVel, setBaseVel] = useState(150);

    const [sysPwr, setSysPwr] = useState(1.0);
    const [sysTurn, setSysTurn] = useState(0.9);
    const [sysInertia, setSysInertia] = useState(0.95);

    const [stats, setStats] = useState({ err: 0, pos: 3500, vL: 0, vR: 0, outOfTrack: false });
    const [leds, setLeds] = useState(new Array(8).fill(false));

    // --- Physics & Drawing Refs ---
    const trackCanvasRef = useRef(null);
    const botCanvasRef = useRef(null);
    const graphCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const requestRef = useRef();

    const trackOffset = useRef({ x: 0, y: 0 });

    const botRef = useRef({
        x: 600, y: 100, ang: Math.PI,
        vL: 0, vR: 0,
        sens: [0, 0, 0, 0, 0, 0, 0, 0],
        pos: 3500, lastErr: 0, intBuff: []
    });

    const historyRef = useRef({ t: [], err: [], adj: [] });
    const simTimeRef = useRef(0);

    const svgPaths = {
        chassis: new Path2D("M 298.74206,465.05562 V 699.38633 H 128.66332 v 151.1811 H 657.79717 V 699.38633 H 487.71843 V 465.05562 A 11.338583,11.338583 0 0 0 476.37985,453.71704 H 459.37198 V 245.84302 h 94.48819 A 18.897638,18.897638 0 0 0 572.7578,226.94538 V 196.70916 A 18.897638,18.897638 0 0 0 553.86017,177.81153 H 232.60032 a 18.897638,18.897638 0 0 0 -18.89763,18.89763 v 30.23622 a 18.897638,18.897638 0 0 0 18.89763,18.89764 h 94.48819 v 207.87402 h -17.00787 a 11.338583,11.338583 0 0 0 -11.33858,11.33858 z"),
        wheelL: new Path2D("M 15.277486,933.71699 H 109.76568 V 688.04775 H 15.277486 Z"),
        wheelR: new Path2D("M 676.69481,688.04775 V 933.71699 H 771.183 V 688.04775 Z")
    };

    // --- Helper: Draw Track Centered ---
    const drawTrackCentered = (ctx, w, h) => {
        const offX = w / 2 - 600;
        const offY = h / 2 - 350;
        trackOffset.current = { x: offX, y: offY };

        ctx.fillStyle = '#1a1a1a'; // Deep Grey Background
        ctx.fillRect(0, 0, w, h);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.0 * PPM;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255,255,255,0.4)'; // Subtle white glow
        ctx.strokeStyle = '#ffffff'; // White Track

        ctx.save();
        ctx.translate(offX, offY);
        ctx.beginPath();
        ctx.moveTo(900, 100); ctx.lineTo(300, 100);
        ctx.bezierCurveTo(100, 100, 100, 400, 300, 400);
        ctx.lineTo(500, 400);
        ctx.bezierCurveTo(600, 400, 600, 600, 800, 600);
        ctx.bezierCurveTo(1100, 600, 1100, 100, 900, 100);
        ctx.stroke();
        ctx.restore();
        ctx.shadowBlur = 0;
    };

    // --- Logic: Read Sensors ---
    const readSensors = (trackCtx) => {
        const b = botRef.current;
        let width = 7 * SENSOR_PITCH;
        let startY = -width / 2;
        let cx = Math.cos(b.ang);
        let cy = Math.sin(b.ang);
        let num = 0, den = 0;
        const newLeds = [];

        for (let i = 0; i < 8; i++) {
            let lat = startY + (i * SENSOR_PITCH);
            let sx = b.x + (SENSOR_DIST_PX * cx) + (lat * -cy);
            let sy = b.y + (SENSOR_DIST_PX * cy) + (lat * cx);

            let val = 0;
            if (sx > 0 && sx < trackCtx.canvas.width && sy > 0 && sy < trackCtx.canvas.height) {
                const px = trackCtx.getImageData(Math.floor(sx), Math.floor(sy), 1, 1).data;
                if (px[1] > 200) val = 1000; // Adjusted for white track (high contrast)
            }
            b.sens[i] = val;
            newLeds.push(val > 500);
            if (val > 0) { num += val * (i * 1000); den += val; }
        }
        setLeds(newLeds);
        if (den > 0) { b.pos = num / den; }
    };

    // --- Logic: Update Physics ---
    const updatePhysics = (trackCtx) => {
        readSensors(trackCtx);
        const b = botRef.current;

        const currentKp = enKp ? kp : 0;
        const currentKd = enKd ? kd : 0;
        const currentKi = enKi ? ki : 0;

        let sum = b.sens.reduce((a, b) => a + b, 0);
        let outOfTrack = false;
        if (sum < 500) {
            outOfTrack = true;
            if (b.lastErr > 0) b.pos = 7000; else b.pos = 0;
        }

        let err = b.pos - 3500;
        let P = err;
        let D = err - b.lastErr;
        b.intBuff.push(err);
        if (b.intBuff.length > 20) b.intBuff.shift();
        let I = b.intBuff.reduce((a, b) => a + b, 0);

        let adj = (currentKp * P) + (currentKd * D) + (currentKi * I);
        b.lastErr = err;

        if (adj > baseVel) adj = baseVel;
        if (adj < -baseVel) adj = -baseVel;

        let targetL = baseVel - adj;
        let targetR = baseVel + adj;

        let k = 1.0 - sysInertia;
        if (k < 0.01) k = 0.01;

        b.vL = b.vL * (1 - k) + targetL * k;
        b.vR = b.vR * (1 - k) + targetR * k;

        let maxSpeed = (80 * PPM) * sysPwr;
        let vL_px = (b.vL / 255) * maxSpeed;
        let vR_px = (b.vR / 255) * maxSpeed;
        let vLin = (vL_px + vR_px) / 2;
        let vAng = ((vR_px - vL_px) / TRACK_WIDTH) * sysTurn;

        let dt = 0.016 * timeScale;
        simTimeRef.current += dt;

        b.ang += vAng * dt;
        b.x += Math.cos(b.ang) * vLin * dt;
        b.y += Math.sin(b.ang) * vLin * dt;

        historyRef.current.t.push(simTimeRef.current);
        historyRef.current.err.push(err);
        historyRef.current.adj.push(adj);
        if (historyRef.current.t.length > 500) {
            historyRef.current.t.shift();
            historyRef.current.err.shift();
            historyRef.current.adj.shift();
        }

        setStats({ err: Math.round(err), pos: Math.round(b.pos), vL: Math.round(b.vL), vR: Math.round(b.vR), outOfTrack });
    };

    // --- Rendering: Main Bot & Track ---
    const renderAll = () => {
        const b = botRef.current;
        if (!botCanvasRef.current) return;
        const botCtx = botCanvasRef.current.getContext('2d');
        botCtx.clearRect(0, 0, botCtx.canvas.width, botCtx.canvas.height);

        botCtx.save();
        botCtx.translate(b.x, b.y);
        botCtx.rotate(b.ang + Math.PI / 2);
        botCtx.scale(SVG_SCALE, SVG_SCALE);
        botCtx.translate(-393, -810);

        // Brand Orange Wheels
        botCtx.fillStyle = '#f97316';
        botCtx.fill(svgPaths.wheelL);
        botCtx.fill(svgPaths.wheelR);

        // Dark Chassis with Brand Orange Accents (Stroke)
        botCtx.fillStyle = 'rgba(26,26,26,0.98)';
        botCtx.strokeStyle = '#f97316';
        botCtx.lineWidth = 6;
        botCtx.fill(svgPaths.chassis);
        botCtx.stroke(svgPaths.chassis);

        let sensY = 212; let sensX = 393;
        let w = (7 * SENSOR_PITCH) / SVG_SCALE;
        for (let i = 0; i < 8; i++) {
            let lat = (-w / 2) + (i * (SENSOR_PITCH / SVG_SCALE));
            botCtx.beginPath(); botCtx.arc(sensX + lat, sensY, 15, 0, Math.PI * 2);
            // Active sensor: Brand Orange, Inactive: Dark grey
            botCtx.fillStyle = b.sens[i] > 500 ? '#f97316' : '#333';
            botCtx.fill();
            if (b.sens[i] > 500) {
                botCtx.shadowBlur = 10;
                botCtx.shadowColor = '#f97316';
                botCtx.fill();
                botCtx.shadowBlur = 0;
            }
        }
        botCtx.restore();

        renderGraph();
    };

    const renderGraph = () => {
        if (!graphCanvasRef.current) return;
        const cv = graphCanvasRef.current;
        const cx = cv.getContext('2d');
        const w = cv.width, h = cv.height;
        cx.clearRect(0, 0, w, h);
        cx.strokeStyle = '#333'; cx.beginPath(); cx.moveTo(0, h / 2); cx.lineTo(w, h / 2); cx.stroke();


        if (historyRef.current.err.length < 2) return;
        cx.strokeStyle = '#f97316'; cx.lineWidth = 2; cx.beginPath();
        let step = w / historyRef.current.err.length;
        historyRef.current.err.forEach((v, i) => {
            let y = (h / 2) - (v * 0.04);
            if (i === 0) cx.moveTo(i * step, y); else cx.lineTo(i * step, y);
        });
        cx.stroke();

        cx.strokeStyle = 'rgba(0,255,255,0.3)'; cx.lineWidth = 1; cx.beginPath();
        historyRef.current.adj.forEach((v, i) => {
            let y = (h / 2) - (v * 0.4);
            if (i === 0) cx.moveTo(i * step, y); else cx.lineTo(i * step, y);
        });
        cx.stroke();
    };

    // --- Animation Loop ---
    const loop = () => {
        if (!isRunning) return;
        if (!trackCanvasRef.current) return;
        const trackCtx = trackCanvasRef.current.getContext('2d', { willReadFrequently: true });
        updatePhysics(trackCtx);
        renderAll();
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        if (isRunning) requestRef.current = requestAnimationFrame(loop);
        else cancelAnimationFrame(requestRef.current);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isRunning, kp, kd, ki, enKp, enKd, enKi, baseVel, sysPwr, sysTurn, sysInertia, timeScale]);

    // --- Initial Setup & Resize ---
    useEffect(() => {
        const handleResize = () => {
            const tCanvas = trackCanvasRef.current;
            const bCanvas = botCanvasRef.current;
            const gCanvas = graphCanvasRef.current;
            if (!tCanvas || !bCanvas || !gCanvas) return;

            const w = window.innerWidth;
            const h = window.innerHeight;

            tCanvas.width = bCanvas.width = gCanvas.width = w;
            tCanvas.height = bCanvas.height = h;
            gCanvas.height = 250; // Enlarged from 180

            drawTrackCentered(tCanvas.getContext('2d'), w, h);

            const newOffX = w / 2 - 600;
            const newOffY = h / 2 - 350;

            if (simTimeRef.current === 0) {
                botRef.current.x = 600 + newOffX;
                botRef.current.y = 100 + newOffY;
                botRef.current.ang = Math.PI;
            }

            renderAll();
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const resetSim = () => {
        setIsRunning(false);
        const w = window.innerWidth;
        const h = window.innerHeight;
        const offX = w / 2 - 600;
        const offY = h / 2 - 350;

        botRef.current = {
            ...botRef.current,
            x: 600 + offX,
            y: 100 + offY,
            ang: Math.PI,
            vL: 0, vR: 0, lastErr: 0, intBuff: []
        };
        simTimeRef.current = 0;
        historyRef.current = { t: [], err: [], adj: [] };
        renderAll();
    };

    return (
        <div className="w-screen h-screen bg-[#1a1a1a] text-white font-mono overflow-hidden select-none relative">

            {/* Viewport */}
            <div id="view" ref={containerRef} className="absolute inset-0">
                <canvas ref={trackCanvasRef} className="absolute inset-0" />
                <canvas ref={botCanvasRef} className="absolute inset-0" />

                {stats.outOfTrack && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/90 border border-white/20 p-8 rounded-2xl font-black text-white z-50 shadow-2xl backdrop-blur-md">
                        ¡SALIDA DE PISTA!
                    </div>
                )}

                {/* HUD (Top Right) */}
                <div className="absolute top-8 right-8 bg-black/40 backdrop-blur-xl p-6 border border-white/10 rounded-3xl text-[11px] text-[#888] pointer-events-none space-y-2 z-40 min-w-[180px]">
                    <div className="flex justify-between items-center">
                        <span className="font-bold tracking-widest text-white/40">ERROR</span>
                        <span className="text-[#f97316] font-black text-lg tracking-tighter">{stats.err}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold tracking-widest text-white/40">POS</span>
                        <span className="text-white font-black text-lg tracking-tighter">{stats.pos}</span>
                    </div>
                    <div className="pt-3 border-t border-white/5 flex justify-between gap-4 text-[10px] uppercase font-black tracking-widest text-white/20">
                        <span>L: {stats.vL}</span> <span>R: {stats.vR}</span>
                    </div>
                </div>

                {/* Graph Area (Bottom Left) - Enlarged and with Legends */}
                <div className="absolute bottom-6 left-6 right-6 lg:left-96 lg:right-8 h-[250px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden z-40 hidden sm:block">
                    <div className="absolute top-4 left-6 flex gap-6 text-[10px] font-black tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-1 bg-[#f97316]"></span>
                            <span className="text-white/40">Error Real</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-1 bg-[rgba(0,255,255,0.3)]"></span>
                            <span className="text-white/40">Ajuste PID</span>
                        </div>
                    </div>
                    <canvas ref={graphCanvasRef} className="w-full h-full" />
                </div>
            </div>

            {/* Floating Control Panel (Now on the Left and Always Expanded) */}
            <div className="absolute left-8 top-24 bottom-32 w-80 bg-black/40 backdrop-blur-3xl border border-white/10 p-6 flex flex-col gap-6 rounded-[2rem] z-50 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-white text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-[#f97316] rounded-full animate-pulse"></span>
                        Panel de Control
                    </h2>
                    <div className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/30 tracking-widest">
                        SIM V1.1
                    </div>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsRunning(!isRunning)} className={`p-4 rounded-2xl font-black cursor-pointer uppercase transition-all flex flex-col items-center justify-center gap-1 ${isRunning ? 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10' : 'bg-[#f97316] text-black shadow-lg shadow-[#f97316]/20 hover:scale-105 active:scale-95'}`}>
                        <span className="text-[10px] tracking-widest">{isRunning ? 'Pausar' : 'Iniciar'}</span>
                    </button>
                    <button onClick={resetSim} className="bg-white/5 text-white/80 border border-white/10 p-4 rounded-2xl font-black cursor-pointer uppercase hover:bg-red-500 hover:text-white transition-all flex flex-col items-center justify-center gap-1 active:scale-95">
                        <span className="text-[10px] tracking-widest">Reset</span>
                    </button>
                </div>

                {/* Time Scale */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-black text-white/40 mb-3 uppercase tracking-tighter">
                        <span>Escala Temporal</span> <span className="text-white bg-[#f97316] px-2 py-0.5 rounded-full text-[9px]">{timeScale.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={timeScale} onChange={(e) => setTimeScale(parseFloat(e.target.value))} onDoubleClick={() => setTimeScale(1.0)} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#f97316]" />
                </div>

                {/* PID Section */}
                <div className="space-y-4 px-1">
                    <div className="text-white/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                        PID TUNING CONSTANTS
                    </div>
                    <ControlRow label="Kp" checked={enKp} onToggle={() => setEnKp(!enKp)} value={kp} onChange={setKp} step={0.01} max={0.5} defaultValue={0.08} />
                    <ControlRow label="Kd" checked={enKd} onToggle={() => setEnKd(!enKd)} value={kd} onChange={setKd} step={0.1} max={10} defaultValue={2.2} />
                    <ControlRow label="Ki" checked={enKi} onToggle={() => setEnKi(!enKi)} value={ki} onChange={setKi} step={0.001} max={0.05} defaultValue={0.005} />

                    <div className="flex justify-between items-center pt-4 border-t border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        <span>Vel. Crucero</span>
                        <input type="number" value={baseVel} onChange={(e) => setBaseVel(parseFloat(e.target.value))} className="bg-black/20 border border-white/10 text-[#f97316] w-20 p-2.5 rounded-xl text-right font-black text-xs" />
                    </div>
                </div>

                {/* Physics Tuning - Now Powered by Sliders */}
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-6">
                    <div className="text-white/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2">
                        🔬 AJUSTES DE FÍSICA
                    </div>


                    <div className="space-y-4">
                        <PhysicsSlider label="Power Gain" value={sysPwr} onChange={setSysPwr} min={0.1} max={3.0} step={0.1} defaultValue={1.0} />
                        <PhysicsSlider label="Turn Ratio" value={sysTurn} onChange={setSysTurn} min={0.1} max={5.0} step={0.1} defaultValue={0.9} />
                        <PhysicsSlider label="Inertia" value={sysInertia} onChange={setSysInertia} min={0} max={0.99} step={0.01} defaultValue={0.95} />
                    </div>
                </div>

                {/* Sensor Visualizer (Mini) */}
                <div className="flex gap-2 h-1 bg-white/5 rounded-full overflow-hidden mt-auto">
                    {leds.map((on, i) => <div key={i} className={`flex-1 transition-all duration-75 ${on ? 'bg-[#f97316]' : 'bg-transparent'}`} />)}
                </div>
            </div>
        </div>
    );
};

const ControlRow = ({ label, checked, onToggle, value, onChange, step, min = 0, max = 5, defaultValue }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
            <label className="flex items-center gap-3 cursor-pointer text-white/60 group">
                <input type="checkbox" checked={checked} onChange={onToggle} className="accent-[#f97316] cursor-pointer w-4 h-4 rounded-md" />
                <span className="group-hover:text-white transition-colors">{label}</span>
            </label>
            <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="bg-transparent text-[#f97316] w-16 text-right font-black text-xs border-none focus:ring-0" />
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            onDoubleClick={() => onChange(defaultValue)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#f97316]"
        />
    </div>
);

const PhysicsSlider = ({ label, value, onChange, min, max, step, defaultValue }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase text-white/40">
            <span>{label}</span>
            <span className="text-white font-mono">{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            onDoubleClick={() => onChange(defaultValue)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
        />
    </div>
);

export default PidSimulator;
