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

const ALL_LESSON_SLUGS = SYLLABUS.map(s => s.slug);

const TABS = [
  { id: "paralelos", label: "👥 Paralelos", icon: "👥" },
  { id: "calendar", label: "📅 Calendario", icon: "📅" },
  { id: "attendance", label: "✅ Asistencia", icon: "✅" },
  { id: "students", label: "📈 Progreso", icon: "📈" },
  { id: "reflections", label: "🪞 Reflexiones", icon: "🪞" },
  { id: "visibility", label: "👁️ Configuración", icon: "👁️" },
];

export default function TeacherPortal() {
  const [activeTab, setActiveTab] = useState("paralelos");
  const [paralelos, setParalelos] = useState([]);
  const [selectedParalelo, setSelectedParalelo] = useState("");
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [visibility, setVisibility] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  
  const supabase = getBrowserClient();

  // ─── Fetchers ───────────────────────────────────────────────────────────────

  const fetchParalelos = useCallback(async () => {
    const res = await fetch("/api/teacher/paralelos");
    if (res.ok) {
      const data = await res.json();
      setParalelos(data || []);
      if (data.length > 0 && !selectedParalelo) setSelectedParalelo(data[0].id);
    }
  }, [selectedParalelo]);

  const fetchSessions = useCallback(async () => {
    if (!selectedParalelo) return;
    const res = await fetch(`/api/teacher/sessions?paralelo_id=${selectedParalelo}`);
    if (res.ok) setSessions(await res.json());
  }, [selectedParalelo]);

  const fetchStudents = useCallback(async () => {
    const filter = paralelos.find(p => p.id === selectedParalelo)?.name || "";
    const url = `/api/teacher/students${filter ? `?paralelo=${encodeURIComponent(filter)}` : ""}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students ?? []);
    }
  }, [selectedParalelo, paralelos]);

  const fetchReflections = useCallback(async () => {
    const res = await fetch("/api/teacher/reflections");
    if (res.ok) {
      const data = await res.json();
      setReflections(data.reflections ?? []);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedSession) return;
    const res = await fetch(`/api/teacher/attendance?session_id=${selectedSession}`);
    if (res.ok) setAttendance(await res.json());
  }, [selectedSession]);

  const fetchVisibility = useCallback(async () => {
    const res = await fetch("/api/teacher/lessons-visibility");
    if (res.ok) {
      const data = await res.json();
      const map = {};
      (data.lessons ?? []).forEach(l => { map[l.lesson_slug] = l.is_visible; });
      ALL_LESSON_SLUGS.forEach(slug => { if (map[slug] === undefined) map[slug] = true; });
      setVisibility(map);
    }
  }, []);

  useEffect(() => {
    fetchParalelos();
  }, [fetchParalelos]);

  useEffect(() => {
    if (activeTab === "calendar") fetchSessions();
    if (activeTab === "attendance") {
      fetchSessions();
      fetchStudents();
    }
    if (activeTab === "students") fetchStudents();
    if (activeTab === "reflections") fetchReflections();
    if (activeTab === "visibility") fetchVisibility();
  }, [activeTab, selectedParalelo, selectedSession, fetchSessions, fetchStudents, fetchReflections, fetchVisibility]);

  useEffect(() => {
    if (activeTab === "attendance" && selectedSession) {
      fetchAttendance();
    }
  }, [selectedSession, activeTab, fetchAttendance]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const createParalelo = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const start_date = e.target.start_date.value;
    await fetch("/api/teacher/paralelos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, start_date }),
    });
    fetchParalelos();
    e.target.reset();
  };

  const createSession = async (e) => {
    e.preventDefault();
    const session_date = e.target.session_date.value;
    const description = e.target.description.value;
    await fetch("/api/teacher/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paralelo_id: selectedParalelo, session_date, description }),
    });
    fetchSessions();
    e.target.reset();
  };

  const deleteSession = async (id) => {
    if(!confirm("¿Eliminar sesión?")) return;
    await fetch(`/api/teacher/sessions?id=${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const toggleAttendance = async (studentId, isPresent) => {
    const newStatus = !isPresent;
    await fetch("/api/teacher/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: selectedSession, student_id: studentId, is_present: newStatus }),
    });
    fetchAttendance();
  };

  const approveReflection = async (userId, activityId, status, feedback) => {
    await fetch("/api/teacher/approve-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, activity_id: activityId, status, feedback }),
    });
    fetchReflections(); // refresh
  };

  const toggleVisibilityAction = async (slug) => {
    const newValue = !visibility[slug];
    await fetch("/api/teacher/lessons-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_slug: slug, is_visible: newValue }),
    });
    setVisibility(prev => ({ ...prev, [slug]: newValue }));
  };

  // ─── Renderers ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-white text-2xl shadow-sm">🎓</div>
          <div>
            <h1 className="text-xl font-display font-black text-slate-800 tracking-tight">Portal del Docente</h1>
            <p className="text-xs text-slate-500 font-semibold">Gestión de Paralelos, Asistencia y Aprobaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {paralelos.length > 0 && (
            <select
              value={selectedParalelo}
              onChange={e => { setSelectedParalelo(e.target.value); setSelectedSession(""); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              {paralelos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <a href="/" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black rounded-xl text-xs transition border border-slate-200 uppercase">
            Ver Curso
          </a>
          <button onClick={() => supabase.auth.signOut().then(()=>window.location.href="/")} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl text-xs transition border border-red-200 uppercase">
            Salir
          </button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-black rounded-xl whitespace-nowrap transition-all border ${
              activeTab === tab.id ? "bg-brand-blue text-white border-brand-blue shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 min-h-[500px]">
        
        {/* PARALELOS */}
        {activeTab === "paralelos" && (
          <div>
            <h2 className="text-base font-display font-black mb-4">Gestión de Paralelos</h2>
            <form onSubmit={createParalelo} className="flex gap-3 mb-6 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre (ej: "A", "Mañana")</label>
                <input name="name" required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha de Inicio</label>
                <input name="start_date" type="date" required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
              </div>
              <button type="submit" className="px-4 py-2 bg-brand-blue text-white font-bold rounded-lg h-[42px]">Crear Paralelo</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paralelos.map(p => (
                <div key={p.id} className="p-4 border border-slate-200 rounded-xl">
                  <h3 className="font-black text-lg text-brand-blue">{p.name}</h3>
                  <p className="text-sm text-slate-600">Inicio: {new Date(p.start_date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === "calendar" && (
          <div>
            <h2 className="text-base font-display font-black mb-4">Calendario Flexible</h2>
            {!selectedParalelo ? <p className="text-sm text-slate-500">Selecciona o crea un paralelo primero.</p> : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-sm mb-3">Agendar Nueva Sesión</h3>
                  <form onSubmit={createSession} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
                      <input name="session_date" type="date" required className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Descripción / Lección a impartir</label>
                      <input name="description" required placeholder="Ej: Práctica 1 y 2 juntas" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 bg-brand-blue text-white font-bold rounded-lg">Añadir al Calendario</button>
                  </form>
                </div>
                <div className="lg:col-span-8 space-y-3">
                  {sessions.length === 0 ? <p className="text-sm text-slate-500">No hay sesiones agendadas.</p> : sessions.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{new Date(s.session_date).toLocaleDateString("es-EC", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-slate-600">{s.description}</p>
                      </div>
                      <button onClick={() => deleteSession(s.id)} className="text-red-500 font-bold text-xs px-3 py-1 bg-red-50 rounded-lg">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <div>
            <h2 className="text-base font-display font-black mb-4">Asistencia de la Clase</h2>
            {!selectedParalelo ? <p className="text-sm text-slate-500">Selecciona un paralelo arriba.</p> : (
              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                  <label className="font-bold text-sm text-slate-700">Selecciona la Sesión:</label>
                  <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg outline-none min-w-[200px]">
                    <option value="">-- Elige una sesión --</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>{new Date(s.session_date).toLocaleDateString()} - {s.description}</option>
                    ))}
                  </select>
                </div>
                {selectedSession && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {students.map(student => {
                      const isPresent = attendance.find(a => a.student_id === student.user_id)?.is_present || false;
                      return (
                        <div key={student.user_id} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${isPresent ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`} onClick={() => toggleAttendance(student.user_id, isPresent)}>
                          <span className="font-bold text-sm">{student.full_name}</span>
                          <span className="text-xl">{isPresent ? "✅" : "❌"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {activeTab === "students" && (
          <div>
            <h2 className="text-base font-display font-black mb-4">Progreso General del Paralelo</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="p-3">Estudiante</th>
                    <th className="p-3">Progreso (%)</th>
                    <th className="p-3">Lecciones Completadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.user_id}>
                      <td className="p-3 font-bold">{s.full_name}</td>
                      <td className="p-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px]">
                          <div className="bg-brand-blue h-full rounded-full" style={{ width: `${Math.round((s.completed_lessons / SYLLABUS.length) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="p-3">{s.completed_lessons} / {SYLLABUS.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REFLECTIONS */}
        {activeTab === "reflections" && (
          <div>
            <h2 className="text-base font-display font-black mb-4">Revisión de Tareas y Reflexiones</h2>
            <div className="space-y-4">
              {reflections.map(r => (
                <div key={`${r.user_id}-${r.activity_id}`} className={`p-4 rounded-xl border-l-4 border ${r.approval_status === 'approved' ? 'border-l-green-500 bg-green-50/30' : r.approval_status === 'pending' ? 'border-l-yellow-400 bg-yellow-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm">{r.student_name} <span className="text-slate-500 font-normal text-xs">(Paralelo {r.paralelo})</span></p>
                      <p className="text-xs text-slate-500">{r.lesson_slug}</p>
                    </div>
                    <div className="flex gap-2">
                      {r.approval_status === 'approved' && <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Aprobado 🟢</span>}
                      {r.approval_status === 'rejected' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">Rechazado 🔴</span>}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-slate-200 mb-3">
                    <p className="text-xs font-bold text-brand-orange mb-1">{r.question_key}</p>
                    <p className="text-sm text-slate-700">{r.answer_text}</p>
                  </div>
                  {r.approval_status === 'pending' && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const feedback = new FormData(e.target).get("feedback");
                        const status = e.nativeEvent.submitter.value;
                        approveReflection(r.user_id, r.activity_id, status, feedback);
                      }}
                      className="flex flex-col sm:flex-row gap-2 mt-2"
                    >
                      <input 
                        name="feedback" 
                        placeholder="Escribe una respuesta o comentario para el estudiante..." 
                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-brand-blue"
                      />
                      <div className="flex gap-2">
                        <button type="submit" value="approved" className="px-3 py-2 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600 transition whitespace-nowrap">Aprobar 🟢</button>
                        <button type="submit" value="rejected" className="px-3 py-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition whitespace-nowrap">Rechazar 🔴</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISIBILITY */}
        {activeTab === "visibility" && (
          <div>
             <h2 className="text-base font-display font-black mb-4">Configuración de Visibilidad</h2>
             <p className="text-sm text-slate-500 mb-6">Bloquea o desbloquea lecciones manualmente.</p>
             <div className="space-y-2">
              {SYLLABUS.map(s => {
                const isVisible = visibility[s.slug] !== false;
                return (
                  <div key={s.slug} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{isVisible ? "🟢" : "🔒"}</span>
                      <div>
                        <p className="text-sm font-black text-slate-800">{s.title}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleVisibilityAction(s.slug)} className={`px-4 py-2 text-xs font-black rounded-xl border-2 ${isVisible ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {isVisible ? "Visible" : "Oculta"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
