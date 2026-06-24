import React from 'react';

export default function StoryTeller({ message, inquiry, concept, attribute }) {
  return (
    <div className="my-6 p-5 bg-white border-3 border-slate-200 rounded-3xl shadow-[0_4px_0_#cbd5e1] font-sans text-slate-800 flex flex-col sm:flex-row items-start gap-5">
      {/* Avatar Container */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1 mx-auto sm:mx-0">
        <div className="w-20 h-20 rounded-full border-3 border-[#4c97ff] overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
          <img 
            src="/images/characters/stella-avatar.png" 
            alt="Comandante Stella" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load or hasn't been copied/converted yet
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<span className="text-3xl">👩‍🚀</span>';
            }}
          />
        </div>
        <span className="text-xs font-black tracking-wider text-slate-700 uppercase">Stella</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Directora
        </span>
      </div>

      {/* Dialog Bubble */}
      <div className="flex-grow space-y-4 w-full">
        {/* Dialogue text */}
        <div className="relative p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm leading-relaxed text-slate-700 font-medium">
          {/* Bubble triangle tip (hidden on small screen, visible on sm+) */}
          <div className="hidden sm:block absolute top-6 -left-2 w-4 h-4 bg-slate-50 border-b-2 border-l-2 border-slate-100 rotate-45" />
          
          {/* Badges for IB concepts */}
          {(concept || attribute) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {concept && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100/70 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full select-none">
                  🔍 Concepto: {concept}
                </span>
              )}
              {attribute && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100/70 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full select-none">
                  🎖️ Perfil: {attribute}
                </span>
              )}
            </div>
          )}

          <p>{message}</p>
        </div>

        {/* Inquiry question (IB-PEP) */}
        {inquiry && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-100/80 flex items-start gap-3 shadow-inner">
            <span className="text-2xl mt-0.5 select-none">💡</span>
            <div className="space-y-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-700">
                Pregunta de Indagación:
              </h5>
              <p className="text-sm font-bold text-slate-800 italic leading-snug">
                "{inquiry}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
