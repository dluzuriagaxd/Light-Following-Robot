import React, { useState } from 'react';

const QUESTIONS = [
  {
    id: 0,
    text: "¿Cuál es el símbolo y bloque con el que iniciamos todo diagrama de flujo?",
    options: [
      "Un rectángulo que dice: 'Girar Ruedas'",
      "Un óvalo/elipse que dice: 'Inicio'",
      "Un rombo que dice: '¿Hay luz?'"
    ],
    correct: 1,
    hint: "Todo diagrama de flujo normalizado inicia y termina con un óvalo o elipse de 'Inicio' y 'Fin'."
  },
  {
    id: 1,
    text: "Una vez iniciado, ¿cuál es la primera acción continua que debe realizar el Arduino para saber qué ocurre?",
    options: [
      "Un rectángulo que dice: 'Leer Sensores LDR A0 y A1'",
      "Un óvalo que dice: 'Esperar 1 Segundo'",
      "Un rombo que dice: '¿Resta > 50?'"
    ],
    correct: 0,
    hint: "Para que el 'cerebro' decida, primero necesita recibir información de los ojos. Las acciones o lecturas se dibujan en rectángulos."
  },
  {
    id: 2,
    text: "Con las lecturas obtenidas, ¿cuál es la primera condición de seguridad que debemos evaluar?",
    options: [
      "Un rectángulo que dice: 'Encender LEDs'",
      "Un rombo que dice: '¿Ambos sensores están a oscuras? (A0 y A1 < 300)'",
      "Un óvalo que dice: 'Apagar motores'"
    ],
    correct: 1,
    hint: "Las preguntas o condiciones lógicas se dibujan siempre dentro de un rombo de decisión. La seguridad de parar por oscuridad es lo primero."
  },
  {
    id: 3,
    text: "Si la respuesta a la condición de oscuridad es 'SÍ', ¿qué acción debe ejecutar el robot?",
    options: [
      "Un rectángulo que dice: 'Avanzar Recto'",
      "Un rectángulo que dice: 'Detener Motores (Velocidad = 0)'",
      "Un rombo que dice: '¿Girar Izquierda?'"
    ],
    correct: 1,
    hint: "Si no hay luz suficiente, detenemos los motores en un rectángulo de acción para que el robot no dé vueltas alocadas."
  },
  {
    id: 4,
    text: "Si no está oscuro ('NO'), ¿cuál es la siguiente condición que debemos comprobar?",
    options: [
      "Un rombo que dice: '¿Llegó a la linterna? (A0 y A1 > 850)'",
      "Un rectángulo que dice: 'Girar Rueda Derecha'",
      "Un óvalo que dice: 'Inicio'"
    ],
    correct: 0,
    hint: "La segunda condición de seguridad evalúa si el robot ya llegó justo debajo de la linterna para detenerse."
  },
  {
    id: 5,
    text: "Si la linterna no está encima ('NO'), ¿cómo determinamos si el foco está a la izquierda?",
    options: [
      "Un rombo que dice: '¿La resta (A0 - A1) > 50?'",
      "Un rectángulo que dice: 'Avanzar 10 cm'",
      "Un rombo que dice: '¿Girar Derecha?'"
    ],
    correct: 0,
    hint: "Restamos los sensores. Si la resta es mayor al umbral de 50, significa que el sensor izquierdo (A0) lee más luz y debemos girar."
  },
  {
    id: 6,
    text: "Si la resta es mayor que 50 ('SÍ'), ¿qué acción de motores debemos tomar?",
    options: [
      "Un rectángulo que dice: 'Girar a la Izquierda (Motor izquierdo atrás, derecho adelante)'",
      "Un rectángulo que dice: 'Avanzar Recto'",
      "Un rombo que dice: '¿Resta < -50?'"
    ],
    correct: 0,
    hint: "Para girar a la izquierda, el motor izquierdo gira en reversa y el derecho hacia adelante."
  },
  {
    id: 7,
    text: "Si la resta no es mayor que 50 ('NO'), ¿cómo sabemos si la luz está a la derecha o al centro?",
    options: [
      "Un rombo que dice: '¿La resta (A0 - A1) < -50?'",
      "Un rectángulo que dice: 'Detenerse'",
      "Un óvalo de 'Fin'"
    ],
    correct: 0,
    hint: "Evaluamos si la resta es menor que -50. Si es sí, gira a la derecha; si es no (luz balanceada), avanza recto."
  }
];

export default function FlowchartBuilder() {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = () => {
    if (selectedOpt === null) return;
    const q = QUESTIONS[currentQuestionIdx];
    if (selectedOpt === q.correct) {
      setScore(s => s + 1);
      setShowHint(false);
      setSelectedOpt(null);
      if (currentQuestionIdx < QUESTIONS.length - 1) {
        setCurrentQuestionIdx(idx => idx + 1);
      } else {
        setCompleted(true);
      }
    } else {
      setShowHint(true);
    }
  };

  const resetAll = () => {
    setCurrentQuestionIdx(0);
    setSelectedOpt(null);
    setShowHint(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="my-8 p-6 bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col lg:flex-row gap-8 font-sans text-slate-200">
      
      {/* LEFT COLUMN: Questions & Flow */}
      <div className="flex-1 flex flex-col justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange font-mono block mb-2">
            📊 Constructor de Diagramas de Flujo
          </span>
          
          {!completed ? (
            <div className="space-y-6">
              <h3 className="text-base font-extrabold text-white leading-snug">
                {QUESTIONS[currentQuestionIdx].text}
              </h3>

              <div className="space-y-3">
                {QUESTIONS[currentQuestionIdx].options.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                      selectedOpt === idx 
                        ? 'bg-blue-950/40 border-brand-blue text-white font-bold' 
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="option"
                      checked={selectedOpt === idx}
                      onChange={() => {
                        setSelectedOpt(idx);
                        setShowHint(false);
                      }}
                      className="mt-0.5 rounded-full border-slate-600 bg-transparent text-brand-blue focus:ring-0 cursor-pointer accent-brand-blue"
                    />
                    <span className="text-xs">{opt}</span>
                  </label>
                ))}
              </div>

              {showHint && (
                <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-xs text-amber-300 leading-relaxed font-semibold italic">
                  💡 Pista: {QUESTIONS[currentQuestionIdx].hint}
                </div>
              )}

              <button
                onClick={handleAnswer}
                disabled={selectedOpt === null}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/95 text-black font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-50"
              >
                Comprobar Bloque ➔
              </button>
            </div>
          ) : (
            <div className="text-center py-10 space-y-4">
              <span className="text-4xl">🎉</span>
              <h3 className="text-lg font-black text-white">¡Diagrama Completo!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Has construido exitosamente el diagrama de flujo lógico del seguidor de luz. Ya puedes programarlo en bloques reales.
              </p>
              <button
                onClick={resetAll}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95"
              >
                Reconstruir Diagrama
              </button>
            </div>
          )}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono pt-4 border-t border-slate-800">
          <span>PROGRESO: {currentQuestionIdx + (completed ? 1 : 0)} / {QUESTIONS.length}</span>
          <span>ACIERTOS: {score}</span>
        </div>
      </div>

      {/* RIGHT COLUMN: The Visual Flowchart */}
      <div className="flex-1 flex flex-col gap-4 lg:border-l lg:border-slate-800 lg:pl-6 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
          📋 Diagrama Lógico del Seguidor de Luz
        </span>

        {/* The flowchart cards stack */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[260px] mx-auto py-4">
          
          {/* Ellipse: Start */}
          {currentQuestionIdx >= 0 && (
            <div className="w-full py-2 bg-blue-50 border border-brand-blue rounded-full text-center text-[10px] font-black text-blue-700 shadow-sm transition">
              ● INICIO
            </div>
          )}

          {/* Arrow */}
          {currentQuestionIdx >= 1 && <div className="text-xs text-slate-500 font-bold">↓</div>}

          {/* Rectangle: Read LDRs */}
          {currentQuestionIdx >= 1 && (
            <div className="w-full py-2.5 bg-slate-850 border border-slate-750 rounded-lg text-center text-[9px] font-bold text-slate-300 shadow-sm leading-normal">
              Leer Sensores A0 y A1<br />
              Resta = A0 - A1
            </div>
          )}

          {/* Arrow */}
          {currentQuestionIdx >= 2 && <div className="text-xs text-slate-500 font-bold">↓</div>}

          {/* Diamond: Darkness Check */}
          {currentQuestionIdx >= 2 && (
            <div className="relative w-28 h-28 flex items-center justify-center border-2 border-brand-blue bg-[#0f1d2c] rotate-45 shadow-sm text-center">
              <div className="-rotate-45 text-[8px] font-bold text-blue-400 leading-normal px-2">
                ¿A0 &lt; 300 Y<br />A1 &lt; 300?
              </div>
              {/* Yes Arrow */}
              {currentQuestionIdx >= 3 && (
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-[8px] font-bold text-red-400">
                  Sí ➔ [PARAR]
                </div>
              )}
            </div>
          )}

          {/* Arrow */}
          {currentQuestionIdx >= 4 && <div className="text-xs text-slate-500 font-bold">↓ No</div>}

          {/* Diamond: Distance Check */}
          {currentQuestionIdx >= 4 && (
            <div className="relative w-28 h-28 flex items-center justify-center border-2 border-brand-blue bg-[#0f1d2c] rotate-45 shadow-sm text-center">
              <div className="-rotate-45 text-[8px] font-bold text-blue-400 leading-normal px-2">
                ¿A0 &gt; 850 Y<br />A1 &gt; 850?
              </div>
              {/* Yes Arrow */}
              {currentQuestionIdx >= 5 && (
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-[8px] font-bold text-red-400">
                  Sí ➔ [PARAR]
                </div>
              )}
            </div>
          )}

          {/* Arrow */}
          {currentQuestionIdx >= 5 && <div className="text-xs text-slate-500 font-bold">↓ No</div>}

          {/* Diamond: Left Check */}
          {currentQuestionIdx >= 5 && (
            <div className="relative w-28 h-28 flex items-center justify-center border-2 border-brand-blue bg-[#0f1d2c] rotate-45 shadow-sm text-center">
              <div className="-rotate-45 text-[8px] font-bold text-blue-400 leading-normal px-2">
                ¿Resta &gt; 50?
              </div>
              {/* Yes Arrow */}
              {currentQuestionIdx >= 6 && (
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-[8px] font-bold text-blue-400">
                  Sí ➔ [GIRAR IZQ]
                </div>
              )}
            </div>
          )}

          {/* Arrow */}
          {currentQuestionIdx >= 7 && <div className="text-xs text-slate-500 font-bold">↓ No</div>}

          {/* Diamond: Right Check */}
          {currentQuestionIdx >= 7 && (
            <div className="relative w-28 h-28 flex items-center justify-center border-2 border-brand-blue bg-[#0f1d2c] rotate-45 shadow-sm text-center">
              <div className="-rotate-45 text-[8px] font-bold text-blue-400 leading-normal px-2">
                ¿Resta &lt; -50?
              </div>
              {/* Yes/No branches */}
              {completed && (
                <>
                  <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-[8px] font-bold text-purple-400">
                    Sí ➔ [GIRAR DER]
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-400">
                    No ➔ [RECTO]
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ellipse: End */}
          {completed && (
            <>
              <div className="text-xs text-slate-500 font-bold mt-4">↓</div>
              <div className="w-full py-2 bg-blue-50 border border-brand-blue rounded-full text-center text-[10px] font-black text-blue-700 shadow-sm mt-1">
                ● FIN
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
