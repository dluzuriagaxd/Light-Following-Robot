import React, { useState, useEffect } from 'react';

export default function BlinkSimulator() {
  const [currentStep, setCurrentStep] = useState(0); // 0: Connect USB, 1: Select COM, 2: Compile, 3: Upload, 4: Running
  const [usbConnected, setUsbConnected] = useState(false);
  const [comPort, setComPort] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [txRxFlash, setTxRxFlash] = useState(false);
  const [ledState, setLedState] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState(["[SISTEMA] Listo para iniciar conexión."]);

  // Handle L LED blinking when running
  useEffect(() => {
    if (currentStep !== 4) {
      setLedState(false);
      return;
    }
    const interval = setInterval(() => {
      setLedState(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Handle compilation progress animation
  const startCompile = () => {
    setCompiling(true);
    setCompileProgress(0);
    setConsoleLogs(prev => [...prev, "[COMPILADOR] Iniciando verificación del sketch..."]);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setCompileProgress(progress);
      if (progress === 40) {
        setConsoleLogs(prev => [...prev, "[COMPILADOR] Vinculando librerías fundamentales..."]);
      }
      if (progress === 80) {
        setConsoleLogs(prev => [...prev, "[COMPILADOR] Generando binario (.hex)..."]);
      }
      if (progress >= 100) {
        clearInterval(interval);
        setCompiling(false);
        setCurrentStep(3);
        setConsoleLogs(prev => [
          ...prev, 
          "[COMPILADOR] Compilación exitosa.",
          "[COMPILADOR] El sketch usa 928 bytes (2%) del espacio de almacenamiento de programa. El máximo es 32256 bytes."
        ]);
      }
    }, 150);
  };

  // Handle upload progress animation & TX/RX flashing
  const startUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    setTxRxFlash(true);
    setConsoleLogs(prev => [...prev, "[CARGADOR] Conectando con el cargador Optiboot..."]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress === 40) {
        setConsoleLogs(prev => [...prev, "[CARGADOR] Escribiendo memoria flash..."]);
      }
      if (progress === 80) {
        setConsoleLogs(prev => [...prev, "[CARGADOR] Verificando escritura..."]);
      }
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setTxRxFlash(false);
        setCurrentStep(4);
        setConsoleLogs(prev => [
          ...prev, 
          "[CARGADOR] Carga completada con éxito.",
          "[SISTEMA] Programa iniciado. LED pin 13 parpadeando."
        ]);
      }
    }, 200);
  };

  const resetAll = () => {
    setCurrentStep(0);
    setUsbConnected(false);
    setComPort("");
    setCompileProgress(0);
    setUploadProgress(0);
    setTxRxFlash(false);
    setConsoleLogs(["[SISTEMA] Reiniciado. Conecta el cable USB."]);
  };

  return (
    <div className="my-8 p-6 bg-slate-900/95 border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col xl:flex-row gap-6 font-sans text-slate-200">
      
      {/* LEFT COLUMN: Steps & Actions */}
      <div className="flex-1 flex flex-col justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange font-mono block mb-2">
            💻 Asistente de Carga (SteamMaker Blocks)
          </span>
          <h3 className="text-lg font-black text-white mb-4">
            Aprende a subir tu programa al Arduino Uno
          </h3>
          
          {/* Step list */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className={`p-4 rounded-2xl border transition ${
              currentStep === 0 ? 'bg-indigo-950/40 border-brand-blue' : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">1</span>
                <span className="text-xs font-bold">Conectar cable USB</span>
              </div>
              {currentStep === 0 && (
                <button
                  onClick={() => {
                    setUsbConnected(true);
                    setCurrentStep(1);
                    setConsoleLogs(prev => [...prev, "[SISTEMA] Cable USB conectado. Arduino encendido (LED ON)."]);
                  }}
                  className="mt-3 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition"
                >
                  🔌 Enchufar Cable USB
                </button>
              )}
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-2xl border transition ${
              currentStep === 1 ? 'bg-indigo-950/40 border-brand-blue' : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">2</span>
                <span className="text-xs font-bold">Seleccionar Puerto COM</span>
              </div>
              {currentStep === 1 && (
                <div className="mt-3 flex gap-2">
                  <select
                    value={comPort}
                    onChange={(e) => {
                      setComPort(e.target.value);
                      if (e.target.value) {
                        setCurrentStep(2);
                        setConsoleLogs(prev => [...prev, `[SISTEMA] Puerto ${e.target.value} seleccionado correctamente.`]);
                      }
                    }}
                    className="px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none focus:border-brand-blue cursor-pointer"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="COM1">COM 1 (Puerto Serial)</option>
                    <option value="COM3">COM 3 (Arduino Uno)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-2xl border transition ${
              currentStep === 2 ? 'bg-indigo-950/40 border-brand-blue' : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">3</span>
                <span className="text-xs font-bold">Compilar el Código</span>
              </div>
              {currentStep === 2 && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={startCompile}
                    disabled={compiling}
                    className="px-4 py-2 bg-brand-orange text-black rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
                  >
                    {compiling ? 'Compilando...' : '⚙️ Verificar / Compilar'}
                  </button>
                  {compiling && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-orange h-full transition-all" style={{ width: `${compileProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-2xl border transition ${
              currentStep === 3 ? 'bg-indigo-950/40 border-brand-blue' : 'bg-slate-800/40 border-slate-800 opacity-60'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">4</span>
                <span className="text-xs font-bold">Subir Código al Arduino</span>
              </div>
              {currentStep === 3 && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={startUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-brand-green text-black rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
                  >
                    {uploading ? 'Cargando...' : '⬆️ Cargar / Subir'}
                  </button>
                  {uploading && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-green h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {currentStep === 4 && (
          <button
            onClick={resetAll}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition"
          >
            🔄 Resetear Simulador
          </button>
        )}
      </div>

      {/* RIGHT COLUMN: Board view and Console */}
      <div className="flex-1 flex flex-col gap-6 xl:border-l xl:border-slate-800 xl:pl-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block mb-3">
            🧠 Hardware: Placa Arduino Uno R3
          </span>
          
          {/* Arduino Board Drawing */}
          <div className="relative w-full max-w-[340px] aspect-[1.5] bg-[#0a2e36] border-2 border-[#125866] rounded-3xl shadow-inner flex flex-col justify-between p-5 overflow-hidden mx-auto">
            {/* USB Cable animation */}
            <div className={`absolute top-0 left-4 w-12 h-16 bg-slate-600 rounded-b-md border-x border-slate-500 transition-all duration-500 z-20 ${
              usbConnected ? 'translate-y-0' : '-translate-y-16'
            }`}>
              <div className="w-2 h-4 bg-brand-blue rounded-t-sm mx-auto mt-2 animate-pulse" />
            </div>

            {/* USB Port slot */}
            <div className="absolute left-4 top-0 w-12 h-6 bg-slate-800 border-x border-b border-slate-700 rounded-b-md z-15" />

            {/* Microchip */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 w-36 h-10 bg-slate-900 border border-slate-800 rounded flex items-center justify-around px-2 z-10">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="w-1.5 h-1 bg-slate-700 rounded-sm" />
              ))}
            </div>
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3 text-[8px] font-black tracking-widest text-slate-700 select-none z-10">
              ATMEGA328P
            </div>

            {/* RX/TX LEDs */}
            <div className="absolute right-16 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 text-[7px] font-black font-mono text-slate-500">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${txRxFlash ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950'}`} />
                <span>TX</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${txRxFlash ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-amber-950'}`} />
                <span>RX</span>
              </div>
            </div>

            {/* Power ON LED */}
            <div className="absolute left-16 bottom-6 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full border border-white transition ${
                usbConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-emerald-950 border-emerald-900'
              }`} />
              <span className="text-[7px] font-black text-slate-500 font-mono">ON</span>
            </div>

            {/* Pin 13 LED (L) */}
            <div className="absolute right-12 top-10 flex flex-col items-center">
              <span className="text-[7px] font-bold text-slate-500 font-mono mb-0.5">L</span>
              <div className={`w-4 h-4 rounded-full border transition-all duration-100 ${
                ledState ? 'bg-amber-400 border-white shadow-[0_0_15px_#f59e0b]' : 'bg-amber-950 border-amber-900'
              }`} />
            </div>

            <div className="flex justify-between items-start z-10">
              <span className="text-[8px] font-black text-slate-500 font-mono">UNO R3</span>
            </div>

            <div className="flex justify-end items-end mt-auto z-10">
              <span className="text-[7px] font-bold text-slate-500 font-mono">DIGITAL INPUTS</span>
            </div>
          </div>
        </div>

        {/* Consola / Terminal de Carga */}
        <div className="flex-1 min-h-[120px] bg-black/60 border border-slate-800 rounded-2xl p-4 font-mono text-[9px] text-sky-400 overflow-y-auto max-h-[140px] custom-scrollbar flex flex-col gap-1">
          {consoleLogs.map((log, i) => (
            <div key={i} className={
              log.includes('[SUCCESS]') ? 'text-green-400 font-bold' : 
              log.includes('[ERROR]') ? 'text-red-400 font-bold' : 'text-sky-400'
            }>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
