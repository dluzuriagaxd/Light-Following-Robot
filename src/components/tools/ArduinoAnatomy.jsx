import React, { useState, useEffect } from 'react';

const SECTIONS = {
  usb: {
    title: "🔌 Conector USB",
    desc: "Es el canal de comunicación y alimentación inicial. Funciona como los 'oídos' del Arduino: sirve para descargar los programas desde la computadora a la placa mediante el cable USB. También proporciona energía de 5V para que funcione mientras programas.",
    analog: "Como cuando conectas tu celular a la computadora para pasar música.",
    pos: "top-[31.0%] left-[2.5%] w-[20.0%] h-[24.0%]"
  },
  power: {
    title: "🔋 Jack de Alimentación Externa",
    desc: "Sirve para conectar la batería externa (pilas o batería de 9V). Esto le da energía al robot para que pueda moverse libremente por el suelo de manera autónoma, sin depender de estar amarrado a la computadora.",
    analog: "Es como el estómago del robot; de aquí saca su fuerza cuando está en el piso.",
    pos: "top-[65.0%] left-[9.5%] w-[18.0%] h-[30.0%]"
  },
  reset: {
    title: "🔴 Botón de Reset",
    desc: "Un pequeño botón físico que, al presionarlo, reinicia el microcontrolador haciendo que el programa que tiene cargado empiece a ejecutarse desde el principio.",
    analog: "Es como apagar y volver a prender tu juguete favorito para reiniciar el juego.",
    pos: "top-[24.0%] left-[21.5%] w-[5.0%] h-[7.0%] rounded-full"
  },
  digital: {
    title: "⚡ Pines Digitales (0 al 13)",
    desc: "Son compuertas de salida y entrada digital. Solo conocen dos estados: 5V (HIGH/Encendido) o 0V (LOW/Apagado). Sirven para mandar electricidad a los LEDs o al Puente H para controlar los motores.",
    analog: "Son como interruptores de luz convencionales: o están encendidos o apagados.",
    pos: "top-[20.0%] left-[35.0%] w-[56.0%] h-[9.0%]"
  },
  power_pins: {
    title: "🔌 Pines de Alimentación (Power)",
    desc: "Pines que entregan voltajes regulados y constantes para alimentar tus circuitos: 5V, 3.3V y GND (tierra o polo negativo, retorno de corriente). Son indispensables para energizar la protoboard.",
    analog: "Son los enchufes de pared de tu casa donde conectas los electrodomésticos para darles corriente.",
    pos: "top-[87.0%] left-[39.0%] w-[22.0%] h-[9.0%]"
  },
  analog: {
    title: "🔦 Pines Analógicos (A0 al A5)",
    desc: "Pines de entrada que pueden medir voltajes variables entre 0V y 5V, traduciéndolos a números entre 0 (mínimo) y 1023 (máximo). Son ideales para leer fotorresistencias (LDR) que cambian con el brillo de la luz.",
    analog: "Funciona como un termómetro que mide la temperatura exacto en lugar de decir solo 'hace frío' o 'hace calor'.",
    pos: "top-[87.0%] left-[63.0%] w-[15.0%] h-[9.0%]"
  },
  mcu: {
    title: "🧠 Microcontrolador (ATmega328P)",
    desc: "Es el cerebro principal de la placa. Aquí es donde se guarda el programa que escribimos y se toman las decisiones lógico-matemáticas (encender motores, apagar LEDs, leer sensores).",
    analog: "Es el cerebro del robot.",
    pos: "top-[57.0%] left-[60.0%] w-[28.0%] h-[11.5%]"
  }
};

export default function ArduinoAnatomy() {
  const [selectedKey, setSelectedKey] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  return (
    <div className={`w-full transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[100] w-screen min-h-screen bg-[#f0f4f8] p-4 md:p-6 flex flex-col justify-between overflow-y-auto font-sans text-slate-800' 
        : 'my-8 p-5 bg-slate-100 border-3 border-slate-200 rounded-3xl text-slate-800 font-sans'
    }`}>
      
      {/* Top Header Row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#5cb85c] shadow-[0_0_8px_#5cb85c]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
            🧠 Interactividad: Anatomía del Arduino Uno R3
          </span>
        </div>
        
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="scratch-btn py-1.5 px-3.5 text-xs font-extrabold rounded-xl border border-[#3375d6] bg-[#4c97ff] text-white cursor-pointer select-none transition-all duration-75 border-b-4 border-b-[#3375d6] hover:translate-y-[1px] hover:border-b-3 active:translate-y-[2.5px] active:border-b-1 flex items-center gap-1.5"
        >
          {isFullscreen ? (
            <>
              <span>✕</span>
              <span>Cerrar Vista</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Maximizar</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className={`grid grid-cols-1 gap-6 ${isFullscreen ? 'md:grid-cols-2 flex-grow items-center' : 'xl:grid-cols-2'}`}>
        
        {/* LEFT PANEL: The Arduino board with hotspot overlays */}
        <div className="flex flex-col items-center justify-center space-y-4 w-full">
          <div className="w-full max-w-[460px] bg-white border-3 border-slate-200 rounded-3xl p-4 shadow-[0_4px_0_#cbd5e1]">
            <div className="relative w-full">
              <img 
                src="/ArduinoUno.svg" 
                className="w-full h-auto block select-none" 
                alt="Arduino Uno R3" 
              />
              
              {/* Hotspot buttons overlay */}
              {Object.entries(SECTIONS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`absolute border-2 border-dashed transition-all cursor-pointer ${item.pos} ${
                    selectedKey === key 
                      ? 'border-[#ffab19] bg-[#ffab19]/20 shadow-[0_0_12px_rgba(255,171,25,0.4)] z-30 scale-[1.02]' 
                      : 'border-[#4c97ff]/60 bg-[#4c97ff]/5 hover:border-[#ffab19] hover:bg-[#ffab19]/10 z-20'
                  }`}
                  title={item.title}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-bold max-w-[400px] leading-relaxed italic">
            💡 Haz clic en las zonas punteadas de la placa para descubrir para qué sirven.
          </p>
        </div>

        {/* RIGHT PANEL: Description and analogies card */}
        <div className="flex flex-col justify-center">
          <div className="bg-white border-3 border-slate-200 p-5 rounded-3xl shadow-[0_4px_0_#cbd5e1] min-h-[240px] flex flex-col justify-center">
            {selectedKey ? (
              <div className="space-y-4 animate-[fadeIn_0.15s_ease-out]">
                <h3 className="text-base font-extrabold text-[#4c97ff] flex items-center gap-2">
                  {SECTIONS[selectedKey].title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  {SECTIONS[selectedKey].desc}
                </p>
                <div className="p-3 bg-blue-50 border-2 border-blue-100 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#3375d6] block">
                    💡 En palabras sencillas (Analogía):
                  </span>
                  <p className="text-xs italic text-blue-900 font-semibold leading-relaxed">
                    {SECTIONS[selectedKey].analog}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-3">
                <span className="text-3xl block">🔍</span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Explora el Cerebro del Robot</h4>
                <p className="text-xs font-bold leading-normal text-slate-500 max-w-[280px] mx-auto">
                  Selecciona cualquier zona punteada en el Arduino de la izquierda para ver su función detallada y una analogía.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER: Component disclaimers */}
      <div className="mt-5 pt-4 border-t border-slate-200 text-[11px] text-slate-500 font-semibold leading-relaxed max-w-[90%] mx-auto text-center">
        ⚠️ *Nota: Esta guía ilustra únicamente los componentes esenciales que utilizaremos en nuestras prácticas. Tu placa física tiene más componentes pequeños (como chips de comunicación USB, reguladores de voltaje, condensadores y LEDs de estado TX/RX/ON), pero estos 7 son los básicos.*
      </div>

    </div>
  );
}
