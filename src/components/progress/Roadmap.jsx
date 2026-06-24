import React, { useState, useEffect } from 'react';

const ROADMAP_STEPS = [
  {
    week: 0,
    title: "Semana 1: Clase 0",
    name: "Fundamentos y Conceptos Previos",
    icon: "🤖",
    slug: "01-fundamentos/00-conceptos-previos",
    color: "border-blue-300 hover:border-brand-blue text-blue-700 bg-blue-50/50 hover:bg-blue-50",
    completedColor: "bg-brand-blue border-brand-blue text-white shadow-[0_4px_20px_rgba(76,151,255,0.4)]",
    desc: "Aprende qué es el cerebro de nuestro robot (Arduino) y cómo entiende el mundo."
  },
  {
    week: 1,
    title: "Semana 2: Clase 1",
    name: "Mi Primer Código (Blink)",
    icon: "💻",
    slug: "01-fundamentos/01-blink",
    color: "border-blue-300 hover:border-brand-blue text-blue-700 bg-blue-50/50 hover:bg-blue-50",
    completedColor: "bg-brand-blue border-brand-blue text-white shadow-[0_4px_20px_rgba(76,151,255,0.4)]",
    desc: "Carga tu primer programa en bloques a la placa y haz parpadear el LED integrado."
  },
  {
    week: 2,
    title: "Semana 3: Clase 2",
    name: "Salidas Digitales (LED Externo)",
    icon: "💡",
    slug: "01-fundamentos/02-led-externo",
    color: "border-blue-300 hover:border-brand-blue text-blue-700 bg-blue-50/50 hover:bg-blue-50",
    completedColor: "bg-brand-blue border-brand-blue text-white shadow-[0_4px_20px_rgba(76,151,255,0.4)]",
    desc: "Aprende a cablear en la protoboard y encender luces controlando voltajes."
  },
  {
    week: 3,
    title: "Semana 4: Clase 3",
    name: "Señales Analógicas (LDR)",
    icon: "🔦",
    slug: "02-sensores/03-divisor-voltaje",
    color: "border-green-300 hover:border-brand-green text-green-700 bg-green-50/50 hover:bg-green-50",
    completedColor: "bg-brand-green border-brand-green text-white shadow-[0_4px_20px_rgba(15,189,120,0.4)]",
    desc: "Usa sensores para leer valores de luz continuos y calcular el error en cm."
  },
  {
    week: 4,
    title: "Semana 5: Clase 4",
    name: "Lógica Condicional (LDR -> LED)",
    icon: "⚙️",
    slug: "02-sensores/04-control-led-ldr",
    color: "border-green-300 hover:border-brand-green text-green-700 bg-green-50/50 hover:bg-green-50",
    completedColor: "bg-brand-green border-brand-green text-white shadow-[0_4px_20px_rgba(15,189,120,0.4)]",
    desc: "Programa decisiones lógicas para encender un LED cuando detecte oscuridad."
  },
  {
    week: 5,
    title: "Semana 6: Clase 5",
    name: "Motores y Puente H (Actuadores)",
    icon: "🏎️",
    slug: "03-motores/05-puente-h-motores",
    color: "border-purple-300 hover:border-brand-purple text-purple-700 bg-purple-50/50 hover:bg-purple-50",
    completedColor: "bg-brand-purple border-brand-purple text-white shadow-[0_4px_20px_rgba(182,102,255,0.4)]",
    desc: "Entiende cómo se controla la velocidad y dirección física de las llantas."
  },
  {
    week: 6,
    title: "Semana 7: Clase 6",
    name: "Ensamblaje de Chasis y Motores",
    icon: "🛠️",
    slug: "04-armado/06-ensamblaje-chasis",
    color: "border-orange-300 hover:border-brand-orange text-orange-700 bg-orange-50/50 hover:bg-orange-50",
    completedColor: "bg-brand-orange border-brand-orange text-white shadow-[0_4px_20px_rgba(255,171,25,0.4)]",
    desc: "Fase de hardware: Construye tu chasis y monta el motor de tracción y baterías."
  },
  {
    week: 7,
    title: "Semana 8: Clase 7",
    name: "Integración Final y Calibración",
    icon: "🎉",
    slug: "04-armado/07-integracion-final",
    color: "border-orange-300 hover:border-brand-orange text-orange-700 bg-orange-50/50 hover:bg-orange-50",
    completedColor: "bg-brand-orange border-brand-orange text-white shadow-[0_4px_20px_rgba(255,171,25,0.4)]",
    desc: "Conecta sensores, sube el código definitivo y calíbralo con tu linterna física."
  }
];

export default function Roadmap() {
  const [completedLessons, setCompletedLessons] = useState({});

  useEffect(() => {
    const progress = {};
    ROADMAP_STEPS.forEach(step => {
      const key = `lesson-${step.slug.replace(/\//g, "-")}`;
      const completedKey = `completed-${key}`;
      const val1 = localStorage.getItem(key);
      const val2 = localStorage.getItem(completedKey);
      progress[step.slug] = val1 === 'completed' || val1 === 'true' || val2 === 'completed' || val2 === 'true';
    });
    setCompletedLessons(progress);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-brand-orange bg-amber-50 border border-orange-200 px-3 py-1 rounded-full">
          🗺️ Ruta del Robot
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mt-3">
          Camino de Aprendizaje
        </h2>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mt-2 font-medium">
          Completa cada clase para avanzar en el roadmap interactivo. ¡Al final de la ruta tendrás tu robot seguidor de luz ensamblado y calibrado!
        </p>
      </div>

      {/* Grid Roadmap Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {ROADMAP_STEPS.map((step, idx) => {
          const isDone = completedLessons[step.slug];
          return (
            <a
              key={step.week}
              href={`/curso/${step.slug}`}
              className={`group flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left active:scale-[0.98] ${
                isDone ? step.completedColor : step.color
              }`}
            >
              {/* Header inside node */}
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase tracking-wider ${isDone ? 'text-white/80' : 'text-slate-400'}`}>
                  {step.title}
                </span>
                {isDone ? (
                  <span className="w-6 h-6 bg-white/20 border border-white/40 rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Icon Circle */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm transition-transform group-hover:scale-105 ${
                isDone ? 'bg-white/20 text-white' : 'bg-white border border-slate-150'
              }`}>
                {step.icon}
              </div>

              {/* Title & Desc */}
              <h3 className={`text-base font-extrabold leading-snug tracking-tight mb-2 ${isDone ? 'text-white' : 'text-slate-800'}`}>
                {step.name}
              </h3>
              <p className={`text-[11px] leading-relaxed font-medium font-sans ${
                isDone ? 'text-white/80' : 'text-slate-500'
              }`}>
                {step.desc}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
