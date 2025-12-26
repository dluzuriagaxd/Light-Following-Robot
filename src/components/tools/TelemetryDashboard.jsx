import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import Papa from 'papaparse';

// Register Chart.js components and plugins
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

// Vertical Line Cursor Plugin (Shared across charts)
const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
        if (chart.tooltip?._active?.length) {
            const x = chart.tooltip._active[0].element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;
            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

ChartJS.register(verticalLinePlugin);

const TelemetryDashboard = () => {
    const [data, setData] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [showGuide, setShowGuide] = useState(false);
    const chartsRef = useRef({});

    // Synchronize Hover across all charts
    const syncHover = (event, elements, chart) => {
        if (elements.length > 0) {
            const index = elements[0].index;
            Object.values(chartsRef.current).forEach((targetChart) => {
                if (targetChart && targetChart !== chart) {
                    const meta = targetChart.getDatasetMeta(0);
                    const point = meta.data[index];

                    if (point) {
                        const activeElements = targetChart.data.datasets.map((_, i) => ({
                            datasetIndex: i,
                            index: index
                        }));

                        targetChart.setActiveElements(activeElements);

                        const tooltip = targetChart.tooltip;
                        if (tooltip) {
                            tooltip.setActiveElements(activeElements, { x: point.x, y: point.y });
                        }
                    }
                    targetChart.update('none');
                }
            });
        }
    };

    const syncZoom = (e) => {
        const { min, max } = e.chart.scales.x;
        Object.values(chartsRef.current).forEach((chart) => {
            if (chart && chart !== e.chart) {
                chart.options.scales.x.min = min;
                chart.options.scales.x.max = max;
                chart.update('none');
            }
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileInfo({ name: file.name, points: 0 });
        Papa.parse(file, {
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data;
                if (rows.length < 2) return;
                const telemetryData = {
                    labels: [], pos: [], setpoint: [], error: [],
                    p: [], iTerm: [], d: [],
                    mL: [], mR: []
                };
                const SETPOINT = 3500;
                const step = Math.max(1, Math.floor(rows.length / 5000));
                let parsedCount = 0;
                for (let i = 1; i < rows.length; i += step) {
                    const row = rows[i];
                    if (row.length < 5) continue;

                    const pos = row[1] || 0;
                    telemetryData.labels.push(parsedCount);
                    telemetryData.pos.push(pos);
                    telemetryData.setpoint.push(SETPOINT);
                    telemetryData.error.push(SETPOINT - pos);
                    telemetryData.p.push(row[2] || 0);
                    telemetryData.iTerm.push(row[3] || 0);
                    telemetryData.d.push(row[4] || 0);
                    telemetryData.mL.push(row[6] || 0);
                    telemetryData.mR.push(row[7] || row[6] || 0);
                    parsedCount++;
                }
                setData(telemetryData);
                setFileInfo(prev => ({ ...prev, points: parsedCount }));
            }
        });
    };

    const resetZoom = () => {
        Object.values(chartsRef.current).forEach((chart) => {
            if (chart) chart.resetZoom();
        });
    };

    const commonOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        onHover: (event, elements, chart) => syncHover(event, elements, chart),
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: '#94a3b8',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 6,
                    padding: 8,
                    font: { size: 9, weight: 'bold' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                titleColor: '#e2e8f0',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true,
            },
            zoom: {
                pan: { enabled: true, mode: 'x', onPan: syncZoom },
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x', onZoom: syncZoom }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: { color: '#475569', font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                ticks: { color: '#475569', font: { size: 9 } }
            }
        },
    }), []);

    return (
        <div className="flex flex-col h-screen w-screen bg-neutral-900 text-[#cbd5e1] overflow-hidden">

            {/* Header */}
            <header className="h-12 bg-black border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <a href="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver
                    </a>
                    <span className="w-px h-4 bg-white/10"></span>
                    <h1 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Análisis de Sesión</h1>
                </div>

                <div className="flex items-center gap-4">
                    {fileInfo && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-mono">
                            <span className="text-cyan-400 opacity-50 uppercase tracking-tighter">DATA:</span>
                            <span className="text-white/60 truncate max-w-[200px]">{fileInfo.name}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${showGuide ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'}`}
                        >
                            {showGuide ? 'Ocultar Guía' : 'Ver Guía'}
                        </button>
                        <label className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-500/20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            {data ? 'Cambiar CSV' : 'Cargar CSV'}
                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                </div>
            </header>

            {/* Workspace Area */}
            <div className="flex flex-1 overflow-hidden relative">
                <main className="flex-1 flex flex-col min-w-0 bg-transparent">
                    {!data ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-black border border-white/5 flex items-center justify-center mb-8 shadow-2xl backdrop-blur-3xl">
                                <svg className="w-8 h-8 text-cyan-500/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Esperando Telemetría</h2>
                            <p className="text-slate-500 max-w-xs font-bold text-[10px] uppercase tracking-widest leading-relaxed">Carga el log desde el panel superior</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Chart 1: Tracking/Error */}
                            <div className="flex-1 min-h-0 border-b border-white/5 p-2 flex flex-col relative group">
                                <div className="absolute top-3 left-6 flex items-center gap-2 z-10 pointer-events-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Sistema de Sensores / Posición</span>
                                </div>
                                <div className="flex-1">
                                    <Line ref={(ref) => (chartsRef.current['pos'] = ref)} options={commonOptions}
                                        data={{
                                            labels: data.labels,
                                            datasets: [
                                                { label: 'Error', data: data.error, borderColor: '#ef4444', pointRadius: 0, borderWidth: 1.5, tension: 0.1 },
                                                { label: 'Posición', data: data.pos, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.05)', fill: true, pointRadius: 0, borderWidth: 1, tension: 0.1 }
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Chart 2: PID Terms */}
                            <div className="flex-1 min-h-0 border-b border-white/5 p-2 flex flex-col relative group">
                                <div className="absolute top-3 left-6 flex items-center gap-2 z-10 pointer-events-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Términos del Controlador PID</span>
                                </div>
                                <div className="flex-1">
                                    <Line ref={(ref) => (chartsRef.current['pid'] = ref)} options={commonOptions}
                                        data={{
                                            labels: data.labels,
                                            datasets: [
                                                { label: 'P (Proporcional)', data: data.p, borderColor: '#fbbf24', pointRadius: 0, borderWidth: 1.5 },
                                                { label: 'I (Integral)', data: data.iTerm, borderColor: '#22d3ee', pointRadius: 0, borderWidth: 1.5 },
                                                { label: 'D (Derivativo)', data: data.d, borderColor: '#a3e635', pointRadius: 0, borderWidth: 1.5 }
                                            ]
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Chart 3: Motors */}
                            <div className="flex-1 min-h-0 p-2 flex flex-col relative group">
                                <div className="absolute top-3 left-6 flex items-center gap-2 z-10 pointer-events-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Salida de Motores (PWM)</span>
                                </div>
                                <button onClick={resetZoom} className="absolute top-3 right-6 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100 z-10">
                                    Reset Zoom
                                </button>
                                <div className="flex-1">
                                    <Line ref={(ref) => (chartsRef.current['motors'] = ref)} options={commonOptions}
                                        data={{
                                            labels: data.labels,
                                            datasets: [
                                                { label: 'Motor Izq', data: data.mL, borderColor: '#f97316', pointRadius: 0, borderWidth: 2, tension: 0.1 },
                                                { label: 'Motor Der', data: data.mR, borderColor: '#a855f7', pointRadius: 0, borderWidth: 2, tension: 0.1 }
                                            ]
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Sidebar */}
                <aside className={`${showGuide ? 'w-80 border-l' : 'w-0 border-none'} bg-black/40 backdrop-blur-xl border-white/5 transition-all duration-500 shrink-0 flex flex-col overflow-hidden`}>
                    <div className="p-8 space-y-12 h-full overflow-y-auto w-80">
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-8 pb-4 border-b border-cyan-500/20">Guía de Interpretación</h3>
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-xs font-black text-cyan-500">01</span>
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs">El Setpoint</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        El centro de la línea se sitúa en <span className="text-cyan-400 font-bold">3500</span>. La curva de error muestra la desviación instantánea. El objetivo es que el error tienda a cero.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-xs font-black text-pink-500">02</span>
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Análisis Dinámico</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        Observa los términos P, I, D. Un término P alto corrige rápido pero oscila. El término D suaviza. El término I elimina el error estacionario.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-xs font-black text-lime-500">03</span>
                                        <h4 className="text-white font-black uppercase tracking-widest text-xs">Saturación</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        Si los motores tocan <span className="text-lime-400 font-bold">255</span> de forma constante, el robot está al límite de velocidad o necesita una base de PWM menor para girar mejor.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="p-5 bg-white/5 rounded-2xl text-[11px] font-bold text-slate-400 italic leading-relaxed">
                                ⚙️ Tip: El cursor sincronizado te permite ver exactamente qué hacían los motores en el momento de un pico de error.
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TelemetryDashboard;
