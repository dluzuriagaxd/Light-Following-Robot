import React, { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState('es');

  useEffect(() => {
    // Read from cookies
    const cookies = document.cookie.split(';');
    const localeCookie = cookies.find(c => c.trim().startsWith('locale='));
    if (localeCookie) {
      setLocale(localeCookie.split('=')[1]);
    }
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    // Set cookie for 1 year
    document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    setLocale(newLocale);
    // Reload to apply changes across Astro and React
    window.location.reload();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2"
      title="Cambiar Idioma / Change Language"
    >
      {locale === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
    </button>
  );
}
