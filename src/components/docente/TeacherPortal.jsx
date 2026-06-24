import React, { useState, useEffect } from 'react';

// School supplies inventory
const SUPPLIES = {
  arduino: "Placa Arduino Uno R3 y cable USB",
  l298n: "Módulo Puente H L298N (LM298)",
  ldr: "Fotorresistencias (LDR)",
  r1000: "Resistencias de 1000 ohm (Café-Negro-Rojo)",
  r470: "Resistencias de 470 ohm (Amarillo-Violeta-Café)",
  leds: "LED de colores",
  jumpersMM: "Jumpers Macho-Macho 15 cm",
  jumpersMH: "Jumpers Macho-Hembra 20 cm",
  proto: "Protoboard de 860 puntos",
  motors: "Motores amarillos con sus respectivas ruedas",
  bat9v: "Batería 9 V (alcalina o recargable)",
  batHolder: "Portabatería para 4 pilas AA (6 V) con cables",
  switch: "Interruptor basculante de 2 pines",
  flashlight: "Linterna LED portátil recargable o con pilas",
  tape: "Cinta aislante"
};

const SYLLABUS = [
  {
    week: 0,
    title: "Clase 0: Fundamentos y Conceptos Previos",
    preReading: "Qué es la tecnología y un ejemplo de robot o automatización en la vida diaria.",
    objectives: [
      "Comprender la diferencia entre un microcontrolador y una computadora.",
      "Identificar las partes principales de la placa Arduino Uno.",
      "Reconocer las entradas y salidas en un sistema de control."
    ],
    materials: [SUPPLIES.arduino],
    socratic: [
      { q: "¿Qué diferencia hay entre una licuadora y un robot?", a: "El robot toma decisiones autónomas según sus sensores; la licuadora solo gira cuando presionas físicamente un botón." },
      { q: "¿Dónde reside el 'cerebro' del robot en nuestra placa?", a: "En el chip negro alargado (microcontrolador) ubicado al centro de la placa Arduino." }
    ],
    tips: "Utiliza analogías humanas: los sensores son los ojos, el Arduino es el cerebro, y los motores son los músculos. Asegúrate de que los estudiantes entiendan que el Arduino no funciona sin instrucciones (código).",
    reminder: `Recordar a los alumnos traer: ${SUPPLIES.arduino} y sus laptops para la carga de código.`
  },
  {
    week: 1,
    title: "Clase 1: Mi Primer Código (Blink y Carga)",
    preReading: "Concepto básico de un algoritmo (paso a paso ordenado para lavarse los dientes, vestirse, etc.).",
    objectives: [
      "Aprender a conectar el Arduino a la computadora vía USB.",
      "Configurar el puerto COM en SteamMaker Blocks.",
      "Cargar el programa de parpadeo (Blink) al LED integrado de la placa."
    ],
    materials: [SUPPLIES.arduino],
    socratic: [
      { q: "Si el código tiene una orden de encendido y otra de apagado, ¿por qué el LED parpadea para siempre?", a: "Porque el bloque principal 'loop' repite las instrucciones una y otra vez de forma infinita." },
      { q: "¿Qué pasaría si eliminamos los bloques de espera (delay)?", a: "El LED parecerá encendido fijo. El Arduino procesa tan rápido que el ojo humano no puede ver el parpadeo a esa velocidad." }
    ],
    tips: "El error común esta semana es no elegir el puerto COM correcto. Muestra en pantalla cómo identificar el puerto desconectando y volviendo a conectar el cable USB.",
    reminder: `Recordar a los alumnos traer: ${SUPPLIES.arduino}. No se requiere material extra para la próxima simulación.`
  },
  {
    week: 2,
    title: "Clase 2: Salidas Digitales (LED Externo)",
    preReading: "Qué es un conductor eléctrico y para qué sirve una protoboard.",
    objectives: [
      "Comprender el concepto de voltajes digitales (HIGH = 5V, LOW = 0V).",
      "Reconocer cómo fluye la corriente por los canales internos de una protoboard.",
      "Aprender a proteger un LED usando una resistencia adecuada."
    ],
    materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.leds, SUPPLIES.r470, SUPPLIES.jumpersMM],
    socratic: [
      { q: "¿Por qué el LED se quema si lo conectamos directamente a 5V sin resistencia?", a: "La resistencia limita la cantidad de corriente que pasa. Sin ella, pasa demasiada electricidad y daña el LED." },
      { q: "¿Cómo sabemos en qué dirección conectar el LED?", a: "La patita más larga es el positivo (ánodo) y va hacia la señal digital; la patita corta es el negativo (cátodo) y va a tierra (GND)." }
    ],
    tips: "Enfatiza que la protoboard tiene canales horizontales y verticales. Si conectan ambas patas del LED en la misma línea, causarán un cortocircuito en el componente y no encenderá.",
    reminder: "Para la próxima semana estudiaremos las fotorresistencias. No se requiere traer componentes físicos aún (sesión de simulación)."
  },
  {
    week: 3,
    title: "Clase 3: Señales Analógicas (LDR y Divisor de Voltaje)",
    preReading: "Cómo funciona el ojo humano y cómo se comporta una fotorresistencia con la luz y la sombra.",
    objectives: [
      "Comprender la diferencia entre señales digitales (0 y 1) y analógicas (rango continuo 0-1023).",
      "Interpretar la lectura de luz usando los canales A0 y A1 del robot.",
      "Calcular el error de posición de la luz mediante la resta de sensores."
    ],
    materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.jumpersMM],
    socratic: [
      { q: "Si la linterna brilla exactamente en medio de los dos sensores, ¿cuánto dará la resta de luz (A0 - A1)?", a: "Dará cero (o un valor muy cercano), porque ambos lados leen la misma cantidad de luz." },
      { q: "Si el robot gira a la derecha, ¿es porque el sensor izquierdo lee más o menos luz que el derecho?", a: "El sensor derecho lee más luz, por lo tanto el error es negativo, obligando al robot a girar al lado donde hay más luz." }
    ],
    tips: "Utiliza el simulador estático en la pizarra proyectada para mover la luz y pedir a los alumnos que calculen mentalmente la resta antes de que aparezca en pantalla.",
    reminder: "No hay entregables físicos para la siguiente semana. Revisar el concepto de umbral."
  },
  {
    week: 4,
    title: "Clase 4: Lógica Condicional (Umbral de Luz a LED)",
    preReading: "Qué es un umbral o límite y ejemplos de límites en la vida diaria (temperatura corporal, velocidad).",
    objectives: [
      "Programar condicionales lógicos avanzados (si... entonces... si no).",
      "Calcular un umbral de luz ambiental óptimo para el robot.",
      "Controlar una salida digital en base a una entrada analógica configurada."
    ],
    materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.leds, SUPPLIES.r470, SUPPLIES.jumpersMM],
    socratic: [
      { q: "¿Cómo sabemos qué número poner como umbral de luz?", a: "Medimos la luz de la habitación a oscuras y con la linterna encendida, y elegimos un valor intermedio (ejemplo: 500)." }
    ],
    tips: "Ayúdales a entender que un umbral demasiado bajo hará que el LED esté prendido siempre por la luz de la ventana, y uno muy alto requerirá pegar la linterna al sensor.",
    reminder: "La próxima semana entraremos a motores. Estudiar qué es la polaridad eléctrica."
  },
  {
    week: 5,
    title: "Clase 5: Motores y Ensamble Mecánico (Hardware)",
    preReading: "Qué es la polaridad en un motor DC y cómo se puede construir un chasis base.",
    objectives: [
      "Comprender el funcionamiento de los motores DC y del módulo Puente H.",
      "Cortar el chasis base de cartón/pasta de cuaderno ($15cm x 12cm$) y pegar los motores.",
      "Fijar las placas de Arduino Uno R3, Puente H y el portabaterías al chasis.",
      "Realizar el cableado eléctrico de potencia de los motores y el interruptor."
    ],
    materials: [
      SUPPLIES.arduino, SUPPLIES.l298n, SUPPLIES.motors, SUPPLIES.batHolder, SUPPLIES.switch, SUPPLIES.tape
    ],
    socratic: [
      { q: "¿Por qué no podemos conectar los motores amarillos directamente a los pines de Arduino?", a: "Porque los motores exigen mucha corriente eléctrica. El Arduino solo puede dar un poco; si los conectamos directo, podemos quemar la placa." }
    ],
    tips: "Supervisa el corte del chasis y el pegado de motores con silicona. Asegúrate de que las llantas no toquen el cartón y giren libremente. No se sube código hoy.",
    reminder: `⚠️ ¡ATENCIÓN DOCENTE! Para la próxima semana necesitamos montar los sensores. Recuerde pedir obligatoriamente: protoboard, fotorresistencias, resistencias de 1000 ohms y jumpers Macho-Macho y Macho-Hembra.`
  },
  {
    week: 6,
    title: "Clase 6: Montaje de Sensores y Conexiones (Hardware)",
    preReading: "Qué es un divisor de voltaje y cómo se conectan tierras comunes en robótica.",
    objectives: [
      "Fijar la protoboard de sensores en la parte frontal del robot.",
      "Armar el circuito divisor de voltaje (LDRs + resistencias de 1000 ohms) en la protoboard.",
      "Conectar las lecturas analógicas A0/A1 y unir todas las tierras comunes (GND).",
      "Realizar el conexionado lógico final de las señales de control IN1-IN4."
    ],
    materials: [
      SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.jumpersMM, SUPPLIES.jumpersMH
    ],
    socratic: [
      { q: "¿Por qué es obligatorio unir la tierra (GND) de la batería con la de Arduino?", a: "Porque todos los componentes del circuito necesitan la misma referencia eléctrica de 0 voltios para poder entenderse y enviar señales correctas." }
    ],
    tips: "Revisa exhaustivamente que las resistencias de 1000 ohms estén conectadas a GND y que las LDRs estén a 5V. El robot debe quedar físicamente completo hoy.",
    reminder: `⚠️ ¡ATENCIÓN DOCENTE! La próxima clase es la programación final y calibración en pista. Recuerde pedir a los alumnos traer: su laptop con SteamMaker Blocks, cable USB y una linterna.`
  },
  {
    week: 7,
    title: "Clase 7: Lógica del Seguidor y Calibración (Software)",
    preReading: "Repaso general de la lógica condicional (si... entonces... si no) en la toma de decisiones.",
    objectives: [
      "Comprender la lógica algorítmica del robot mediante el diagrama de flujo interactivo.",
      "Escribir el código en bloques (lectura, cálculo de error y condicionales) en SteamMaker Blocks.",
      "Cargar el firmware al Arduino y realizar la calibración de umbrales y desvíos de motores en pista."
    ],
    materials: [
      SUPPLIES.arduino, SUPPLIES.flashlight
    ],
    socratic: [
      { q: "El robot sigue la luz pero se desvía constantemente a un lado o tiembla. ¿Cómo lo calibramos?", a: "Ajustando el valor de desvío de los motores (velocidades base) en el código y el umbral analógico para filtrar la luz de la habitación." }
    ],
    tips: "Si el robot retrocede ante la luz, indica que la polaridad de motores o lógica está invertida. Pide a los alumnos cruzar los cables del motor en el Puente H o cambiar la lógica en el código.",
    reminder: "¡Felicidades! Los robots están listos. Organice carreras de laberintos de luz."
  }
];

export default function TeacherPortal() {
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [pinError, setPinError] = useState(false);
  
  // Date planner states
  const [startDate, setStartDate] = useState("2026-08-10");
  const [calculatedDates, setCalculatedDates] = useState([]);
  const [activeWeekTab, setActiveWeekTab] = useState(0);

  // Load auth state from localStorage
  useEffect(() => {
    const isAuth = localStorage.getItem("teacher_authorized") === "true";
    if (isAuth) {
      setAuthorized(true);
    }
  }, []);

  // Calculate dates based on start date
  useEffect(() => {
    if (!startDate) return;
    const start = new Date(startDate + "T00:00:00");
    const dates = SYLLABUS.map((item, idx) => {
      const current = new Date(start);
      current.setDate(start.getDate() + idx * 7);
      return current.toLocaleDateString("es-EC", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    });
    setCalculatedDates(dates);
  }, [startDate]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === "steam2026") {
      setAuthorized(true);
      setPinError(false);
      localStorage.setItem("teacher_authorized", "true");
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const handleLogout = () => {
    setAuthorized(false);
    localStorage.removeItem("teacher_authorized");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-md p-8 bg-slate-950 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(249,115,22,0.15)] flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-orange rounded-2xl shadow-[0_0_20px_rgba(255,171,25,0.4)] flex items-center justify-center text-3xl mb-6">
            🎓
          </div>
          <h2 className="text-xl font-display font-black text-white tracking-tight text-center">
            Acceso Exclusivo para Docentes
          </h2>
          <p className="mt-2 text-xs text-white/50 text-center font-semibold font-mono tracking-wider uppercase mb-8">
            Academia Seguidor de Luz
          </p>

          <form onSubmit={handlePinSubmit} className="w-full space-y-6">
            {pinError && (
              <div className="p-3 text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded-xl font-mono text-center font-semibold">
                ⚠️ PIN Incorrecto. Inténtalo de nuevo.
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="pin" className="block text-[10px] font-black text-white/50 uppercase tracking-widest font-mono text-center">
                Ingresa el PIN de Acceso
              </label>
              <input
                id="pin"
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange text-white outline-none transition-all font-mono text-lg tracking-widest placeholder-white/10"
                placeholder="••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-brand-orange hover:bg-brand-orange/95 text-black font-black rounded-xl transition-all active:scale-[0.98] uppercase tracking-wider text-xs shadow-md"
            >
              Validar Acceso ➔
            </button>
            <div className="text-center pt-2">
              <a href="/" className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline">
                Volver a la Página Principal
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
      
      {/* Top Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm">
            🎓
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-slate-800 tracking-tight">
              Portal del Docente: Planificación
            </h1>
            <p className="text-xs text-slate-500 font-semibold font-sans">
              Planifica tu semestre, revisa los materiales escolares y las guías de preguntas socráticas.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <a href="/" className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-xl text-xs transition border border-slate-200 active:scale-95 uppercase tracking-wider">
            Página del Curso
          </a>
          <button 
            onClick={handleLogout}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-xs transition border border-red-200 active:scale-95 uppercase tracking-wider"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Grid: Planner & Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Date Planner & Alerts */}
        <section className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-display font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>📅</span> Planificador de Clases
            </h2>
            <p className="text-xs text-slate-500 leading-normal font-sans font-medium mt-1">
              Selecciona la fecha de inicio del curso (Semana 1) para calcular el cronograma completo de las 8 semanas.
            </p>
          </div>

          {/* Date Selector Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-xs space-y-3">
            <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
              Fecha de Inicio del Curso
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none text-slate-750 font-bold text-sm"
            />
            <span className="text-[10px] text-slate-500 font-semibold italic block text-center">
              Recomendado: Segunda semana de Agosto (ej. 10 de Agosto de 2026).
            </span>
          </div>

          <hr className="border-slate-100" />

          {/* Weekly calculated dates & reminders */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
              🗓️ Agenda del Semestre y Recordatorios
            </h3>
            
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {SYLLABUS.map((item, idx) => {
                const dateStr = calculatedDates[idx] || "";
                return (
                  <button
                    key={item.week}
                    onClick={() => setActiveWeekTab(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 ${
                      activeWeekTab === idx 
                        ? 'bg-blue-50 border-brand-blue shadow-sm' 
                        : 'bg-white border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                      <span className={activeWeekTab === idx ? 'text-brand-blue' : 'text-slate-500'}>
                        Semana {item.week}
                      </span>
                      <span className="text-slate-400 font-mono">
                        Clase {item.week}
                      </span>
                    </div>
                    
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">
                      {item.title}
                    </h4>

                    {dateStr && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100/50 border border-slate-150 px-2 py-0.5 rounded-lg self-start">
                        📅 {dateStr}
                      </span>
                    )}

                    {/* Active week alert preview */}
                    {item.week < 7 && (
                      <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                        <span className="text-xs leading-none">⚠️</span>
                        <div className="text-[9px] text-amber-800 leading-normal font-sans font-semibold">
                          <strong>Avisar hoy:</strong> Pedir materiales de la Clase {item.week + 1}.
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Guide Viewer (Dynamic based on selected week) */}
        <section className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          
          {/* Active Week Header */}
          <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 border border-brand-blue/20 px-2.5 py-1 rounded-full">
                Semana {SYLLABUS[activeWeekTab].week}
              </span>
              <h2 className="text-xl font-display font-black text-slate-800 tracking-tight mt-3">
                {SYLLABUS[activeWeekTab].title}
              </h2>
            </div>
            
            {calculatedDates[activeWeekTab] && (
              <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
                📅 {calculatedDates[activeWeekTab]}
              </span>
            )}
          </div>

          {/* Pre-reading block */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1.5">
            <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest block">📚 Lectura Previa Obligatoria para el Estudiante</span>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              {SYLLABUS[activeWeekTab].preReading}
            </p>
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">🎯 Objetivos de la Sesión</h3>
            <ul className="space-y-1.5 text-xs text-slate-700 font-sans font-medium pl-4 list-disc">
              {SYLLABUS[activeWeekTab].objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Required Materials list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">🛠️ Lista de Materiales de la Semana</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SYLLABUS[activeWeekTab].materials.map((mat, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700">
                  <span className="text-[#e6950f]">✔</span>
                  <span>{mat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crossed alerts reminder block */}
          {SYLLABUS[activeWeekTab].week < 7 && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <span className="text-2xl leading-none">⚠️</span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Recordatorio de Materiales para la Clase Siguiente</h4>
                <p className="text-xs text-amber-950 font-semibold leading-relaxed">
                  Al finalizar la clase de hoy, recuerde obligatoriamente avisar a los alumnos que traigan los siguientes materiales para la clase de la próxima semana:
                </p>
                <div className="p-3 bg-white/70 border border-amber-300 rounded-xl text-xs font-black text-amber-900 mt-2">
                  {SYLLABUS[activeWeekTab].reminder}
                </div>
              </div>
            </div>
          )}

          {/* Socratic Questions */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">❓ Guía de Preguntas Socráticas (Uso de Simuladores)</h3>
            <div className="space-y-3">
              {SYLLABUS[activeWeekTab].socratic.map((soc, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-brand-orange font-black text-sm">P:</span>
                    <strong className="text-slate-800 leading-snug">{soc.q}</strong>
                  </div>
                  <div className="pl-6 flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="text-brand-green font-bold text-sm">R:</span>
                    <p className="leading-relaxed font-semibold italic">{soc.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Calibration / Tips */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
              <span>💡</span> Notas Didácticas y de Calibración
            </h3>
            <p className="text-xs text-slate-650 leading-relaxed font-sans font-medium">
              {SYLLABUS[activeWeekTab].tips}
            </p>
          </div>

        </section>

      </div>

    </div>
  );
}
