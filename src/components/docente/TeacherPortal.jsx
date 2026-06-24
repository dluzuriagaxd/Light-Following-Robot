import React, { useState, useEffect, useCallback } from 'react';
import { getBrowserClient } from '../../lib/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  tape: "Cinta aislante",
};

const SYLLABUS = [
  { week: 0, title: "Clase 0: Fundamentos y Conceptos Previos", slug: "01-fundamentos/00-conceptos-previos", preReading: "Qué es la tecnología y un ejemplo de robot o automatización en la vida diaria.", objectives: ["Comprender la diferencia entre un microcontrolador y una computadora.", "Identificar las partes principales de la placa Arduino Uno.", "Reconocer las entradas y salidas en un sistema de control."], materials: [SUPPLIES.arduino], socratic: [{ q: "¿Qué diferencia hay entre una licuadora y un robot?", a: "El robot toma decisiones autónomas según sus sensores; la licuadora solo gira cuando presionas físicamente un botón." }, { q: "¿Dónde reside el 'cerebro' del robot en nuestra placa?", a: "En el chip negro alargado (microcontrolador) ubicado al centro de la placa Arduino." }], tips: "Utiliza analogías humanas: los sensores son los ojos, el Arduino es el cerebro, y los motores son los músculos.", reminder: `Recordar traer: ${SUPPLIES.arduino} y laptops.` },
  { week: 1, title: "Clase 1: Mi Primer Código (Blink y Carga)", slug: "01-fundamentos/01-registro-tinkercad", preReading: "Concepto básico de un algoritmo.", objectives: ["Conectar el Arduino a la computadora vía USB.", "Configurar el entorno de programación.", "Cargar el programa Blink al LED integrado."], materials: [SUPPLIES.arduino], socratic: [{ q: "Si el código tiene encendido y apagado, ¿por qué el LED parpadea para siempre?", a: "Porque el bloque 'loop' repite las instrucciones infinitamente." }], tips: "El error más común es no elegir el puerto correcto.", reminder: `Traer: ${SUPPLIES.arduino}.` },
  { week: 2, title: "Clase 2: Salidas Digitales (LED Externo)", slug: "01-fundamentos/02-blink-tinkercad", preReading: "Qué es un conductor eléctrico y para qué sirve una protoboard.", objectives: ["Comprender voltajes digitales (HIGH = 5V, LOW = 0V).", "Reconocer los canales internos de una protoboard.", "Proteger un LED usando una resistencia adecuada."], materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.leds, SUPPLIES.r470, SUPPLIES.jumpersMM], socratic: [{ q: "¿Por qué el LED se quema sin resistencia?", a: "La resistencia limita la corriente. Sin ella, pasa demasiada electricidad y daña el LED." }], tips: "Enfatiza que la protoboard tiene canales horizontales y verticales.", reminder: "No se requiere componentes físicos para la próxima sesión." },
  { week: 3, title: "Clase 3: Señales Analógicas (LDR)", slug: "02-sensores/04-divisor-voltaje-tinkercad", preReading: "Cómo funciona el ojo humano y cómo se comporta una fotorresistencia.", objectives: ["Comprender la diferencia entre señales digitales y analógicas.", "Interpretar la lectura de luz usando canales A0 y A1.", "Calcular el error de posición mediante la resta de sensores."], materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.jumpersMM], socratic: [{ q: "Si la linterna brilla en el centro, ¿cuánto da la resta A0 - A1?", a: "Cero, porque ambos lados leen la misma cantidad de luz." }], tips: "Utiliza el simulador en la pizarra para mover la luz y pedir cálculos mentales.", reminder: "No hay entregables físicos. Revisar el concepto de umbral." },
  { week: 4, title: "Clase 4: Lógica Condicional (Umbral)", slug: "02-sensores/05-fotoresistencia-tinkercad", preReading: "Qué es un umbral y ejemplos en la vida diaria.", objectives: ["Programar condicionales lógicos.", "Calcular un umbral de luz óptimo.", "Controlar una salida digital con entrada analógica."], materials: [SUPPLIES.arduino, SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.leds, SUPPLIES.r470, SUPPLIES.jumpersMM], socratic: [{ q: "¿Cómo sabemos qué número poner como umbral?", a: "Medimos la luz a oscuras y con linterna, y elegimos un valor intermedio." }], tips: "Un umbral muy bajo = LED siempre encendido. Uno muy alto = necesita la linterna pegada.", reminder: "La próxima semana: motores. Estudiar polaridad eléctrica." },
  { week: 5, title: "Clase 5: Motores y Ensamble Mecánico", slug: "03-motores/07-puente-h-motores", preReading: "Qué es la polaridad en un motor DC.", objectives: ["Comprender los motores DC y el módulo Puente H.", "Construir y pegar el chasis base.", "Realizar el cableado eléctrico de potencia."], materials: [SUPPLIES.arduino, SUPPLIES.l298n, SUPPLIES.motors, SUPPLIES.batHolder, SUPPLIES.switch, SUPPLIES.tape], socratic: [{ q: "¿Por qué no conectamos los motores directamente al Arduino?", a: "Los motores exigen mucha corriente. El Arduino no puede darla y se quemaría." }], tips: "Supervisa que las llantas giren libremente. No se sube código hoy.", reminder: `⚠️ Próxima semana: ${SUPPLIES.proto}, LDRs, resistencias 1000 ohm, jumpers MM y MH.` },
  { week: 6, title: "Clase 6: Montaje de Sensores", slug: "04-armado/09-ensamblaje-sensores", preReading: "Qué es un divisor de voltaje y tierras comunes.", objectives: ["Fijar la protoboard en la parte frontal.", "Armar el circuito divisor de voltaje.", "Conectar A0/A1 y unir todas las tierras."], materials: [SUPPLIES.proto, SUPPLIES.ldr, SUPPLIES.r1000, SUPPLIES.jumpersMM, SUPPLIES.jumpersMH], socratic: [{ q: "¿Por qué hay que unir la tierra de la batería con la de Arduino?", a: "Para tener la misma referencia de 0V en todo el circuito." }], tips: "Revisa que las resistencias de 1000 ohms estén a GND y las LDRs a 5V.", reminder: `⚠️ Próxima clase: laptop, ${SUPPLIES.arduino}, cable USB y linterna.` },
  { week: 7, title: "Clase 7: Lógica del Seguidor y Calibración", slug: "04-armado/10-seguidor-logica-1", preReading: "Repaso de lógica condicional.", objectives: ["Comprender el algoritmo mediante el diagrama de flujo.", "Escribir el código en bloques.", "Cargar y calibrar en pista."], materials: [SUPPLIES.arduino, SUPPLIES.flashlight], socratic: [{ q: "El robot se desvía constantemente. ¿Cómo calibramos?", a: "Ajustando la velocidad base de los motores y el umbral analógico." }], tips: "Si el robot retrocede, la polaridad de motores o la lógica está invertida.", reminder: "¡Robots listos! Organizar carreras de laberintos de luz." },
];

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "planner", label: "📅 Planificación", icon: "📅" },
  { id: "students", label: "👩‍🎓 Estudiantes", icon: "👩‍🎓" },
  { id: "reflections", label: "🪞 Reflexiones", icon: "🪞" },
  { id: "visibility", label: "👁️ Visibilidad", icon: "👁️" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const ALL_LESSON_SLUGS = SYLLABUS.map(s => s.slug);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherPortal() {
  const [activeTab, setActiveTab] = useState("planner");
  const [activeWeekTab, setActiveWeekTab] = useState(0);
  const [startDate, setStartDate] = useState("2026-08-10");
  const [calculatedDates, setCalculatedDates] = useState([]);

  // Students
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [paralelloFilter, setParalelloFilter] = useState("");

  // Reflections
  const [reflections, setReflections] = useState([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [reflectionLessonFilter, setReflectionLessonFilter] = useState("");

  // Visibility
  const [visibility, setVisibility] = useState({});
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [savingSlug, setSavingSlug] = useState(null);

  const supabase = getBrowserClient();

  // Calculate semester dates
  useEffect(() => {
    if (!startDate) return;
    const start = new Date(startDate + "T00:00:00");
    const dates = SYLLABUS.map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx * 7);
      return d.toLocaleDateString("es-EC", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    });
    setCalculatedDates(dates);
  }, [startDate]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    const url = `/api/teacher/students${paralelloFilter ? `?paralelo=${encodeURIComponent(paralelloFilter)}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setStudents(data.students ?? []);
    setStudentsLoading(false);
  }, [paralelloFilter]);

  // Fetch reflections
  const fetchReflections = useCallback(async () => {
    setReflectionsLoading(true);
    const url = `/api/teacher/reflections${reflectionLessonFilter ? `?lesson_slug=${encodeURIComponent(reflectionLessonFilter)}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    setReflections(data.reflections ?? []);
    setReflectionsLoading(false);
  }, [reflectionLessonFilter]);

  // Fetch visibility
  const fetchVisibility = useCallback(async () => {
    setVisibilityLoading(true);
    const res = await fetch("/api/teacher/lessons-visibility");
    const data = await res.json();
    const map = {};
    (data.lessons ?? []).forEach(l => { map[l.lesson_slug] = l.is_visible; });
    // Default all lessons to visible if not in DB
    ALL_LESSON_SLUGS.forEach(slug => {
      if (map[slug] === undefined) map[slug] = true;
    });
    setVisibility(map);
    setVisibilityLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "students") fetchStudents();
    if (activeTab === "reflections") fetchReflections();
    if (activeTab === "visibility") fetchVisibility();
  }, [activeTab, fetchStudents, fetchReflections, fetchVisibility]);

  const toggleVisibility = async (slug) => {
    setSavingSlug(slug);
    const newValue = !visibility[slug];
    await fetch("/api/teacher/lessons-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_slug: slug, is_visible: newValue }),
    });
    setVisibility(prev => ({ ...prev, [slug]: newValue }));
    setSavingSlug(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 flex flex-col gap-6">

      {/* Top Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm">🎓</div>
          <div>
            <h1 className="text-xl font-display font-black text-slate-800 tracking-tight">Portal del Docente</h1>
            <p className="text-xs text-slate-500 font-semibold">Academia Seguidor de Luz — Gestión de curso</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-xl text-xs transition border border-slate-200 active:scale-95 uppercase tracking-wider">
            Ver Curso
          </a>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-xs transition border border-red-200 active:scale-95 uppercase tracking-wider">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-black rounded-xl whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Planificación ─────────────────────────────────────────────── */}
      {activeTab === "planner" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Date planner */}
          <section className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-display font-black text-slate-800 flex items-center gap-2">📅 Planificador</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Selecciona el inicio del curso para calcular el cronograma.</p>
            </div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none text-slate-800 font-bold text-sm" />
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {SYLLABUS.map((item, idx) => (
                <button key={item.week} onClick={() => setActiveWeekTab(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${activeWeekTab === idx ? "bg-blue-50 border-brand-blue" : "bg-white border-slate-150 hover:bg-slate-50"}`}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className={activeWeekTab === idx ? "text-brand-blue" : "text-slate-500"}>Semana {item.week}</span>
                    {calculatedDates[idx] && <span className="text-slate-400 font-mono text-[9px]">{calculatedDates[idx]}</span>}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{item.title}</p>
                </button>
              ))}
            </div>
          </section>

          {/* RIGHT: Week detail */}
          <section className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue bg-blue-50 border border-brand-blue/20 px-2.5 py-1 rounded-full">Semana {SYLLABUS[activeWeekTab].week}</span>
              <h2 className="text-lg font-display font-black text-slate-800 tracking-tight mt-3">{SYLLABUS[activeWeekTab].title}</h2>
              {calculatedDates[activeWeekTab] && <p className="text-xs text-slate-500 mt-1">📅 {calculatedDates[activeWeekTab]}</p>}
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl">
              <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest block mb-1">📚 Lectura Previa</span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">{SYLLABUS[activeWeekTab].preReading}</p>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">🎯 Objetivos</h3>
              <ul className="space-y-1 text-xs text-slate-700 font-medium pl-4 list-disc">
                {SYLLABUS[activeWeekTab].objectives.map((obj, i) => <li key={i}>{obj}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 mb-2">🛠️ Materiales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SYLLABUS[activeWeekTab].materials.map((mat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-700">
                    <span className="text-brand-orange">✔</span><span>{mat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">❓ Preguntas Socráticas</h3>
              {SYLLABUS[activeWeekTab].socratic.map((soc, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-xs"><span className="text-brand-orange font-black">P:</span><strong className="text-slate-800">{soc.q}</strong></div>
                  <div className="pl-5 flex items-start gap-2 text-xs text-slate-600"><span className="text-green-600 font-bold">R:</span><p className="italic font-semibold">{soc.a}</p></div>
                </div>
              ))}
            </div>

            {SYLLABUS[activeWeekTab].week < 7 && (
              <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Recordatorio para la siguiente clase</h4>
                  <p className="text-xs text-amber-950 font-semibold">{SYLLABUS[activeWeekTab].reminder}</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── TAB: Estudiantes ───────────────────────────────────────────────── */}
      {activeTab === "students" && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-display font-black text-slate-800">👩‍🎓 Progreso de Estudiantes</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filtrar por paralelo..."
                value={paralelloFilter}
                onChange={e => setParalelloFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-brand-blue w-36"
              />
              <button onClick={fetchStudents} className="px-3 py-2 bg-brand-blue text-white text-xs font-black rounded-xl hover:bg-brand-blue/90 transition">Buscar</button>
            </div>
          </div>

          {studentsLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-3">👥</span>
              <p className="text-sm font-semibold">No se encontraron estudiantes.</p>
              <p className="text-xs mt-1">Verifica que la base de datos esté configurada y haya perfiles con rol "student".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-wider">Estudiante</th>
                    <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-wider">Paralelo</th>
                    <th className="text-center px-3 py-2 font-black text-slate-500 uppercase tracking-wider">Lecciones</th>
                    <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-wider">Última visita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s) => (
                    <tr key={s.user_id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-brand-orange/10 rounded-lg flex items-center justify-center text-xs font-black text-brand-orange border border-brand-orange/20">
                            {s.full_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{s.full_name ?? "Sin nombre"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 bg-slate-100 rounded-lg font-bold text-slate-600">{s.paralelo ?? "-"}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-black text-brand-orange">{s.completed_lessons}</span>
                        <span className="text-slate-400"> / {SYLLABUS.length}</span>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 max-w-[80px] mx-auto overflow-hidden">
                          <div className="bg-brand-orange h-full rounded-full" style={{ width: `${Math.round((s.completed_lessons / SYLLABUS.length) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-semibold">
                        {s.last_visited_at ? new Date(s.last_visited_at).toLocaleDateString("es-EC", { day: "2-digit", month: "short" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Reflexiones ───────────────────────────────────────────────── */}
      {activeTab === "reflections" && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-display font-black text-slate-800">🪞 Respuestas de Reflexión</h2>
            <div className="flex gap-2">
              <select
                value={reflectionLessonFilter}
                onChange={e => setReflectionLessonFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-brand-blue"
              >
                <option value="">Todas las lecciones</option>
                {SYLLABUS.map(s => <option key={s.slug} value={s.slug}>{s.title}</option>)}
              </select>
              <button onClick={fetchReflections} className="px-3 py-2 bg-brand-blue text-white text-xs font-black rounded-xl hover:bg-brand-blue/90 transition">Buscar</button>
            </div>
          </div>

          {reflectionsLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
          ) : reflections.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-3">🪞</span>
              <p className="text-sm font-semibold">No hay reflexiones todavía.</p>
              <p className="text-xs mt-1">Las respuestas aparecerán aquí cuando los estudiantes completen una lección.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reflections.map((r) => (
                <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-orange/10 rounded-lg flex items-center justify-center text-xs font-black text-brand-orange border border-brand-orange/20">
                        {r.student_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{r.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Paralelo {r.paralelo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-semibold">{r.lesson_slug}</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.submitted_at).toLocaleDateString("es-EC")}</p>
                    </div>
                  </div>
                  <div className="pl-2 border-l-2 border-brand-orange/30">
                    <p className="text-[10px] font-black text-brand-orange uppercase tracking-wider mb-0.5">{r.question_key}</p>
                    <p className="text-sm text-slate-700 font-semibold leading-relaxed">{r.answer_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Visibilidad ───────────────────────────────────────────────── */}
      {activeTab === "visibility" && (
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-display font-black text-slate-800">👁️ Control de Visibilidad de Lecciones</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Activa o desactiva el acceso de los estudiantes a cada lección. Los cambios se aplican de inmediato.</p>
          </div>

          {visibilityLoading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {SYLLABUS.map(s => {
                const isVisible = visibility[s.slug] !== false;
                const isSaving = savingSlug === s.slug;
                return (
                  <div key={s.slug} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{isVisible ? "🟢" : "🔒"}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{s.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVisibility(s.slug)}
                      disabled={isSaving}
                      className={`shrink-0 ml-3 px-4 py-2 text-xs font-black rounded-xl transition-all border-2 ${
                        isVisible
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      } disabled:opacity-50 disabled:cursor-wait`}
                    >
                      {isSaving ? "..." : isVisible ? "Visible ✓" : "Oculta"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
