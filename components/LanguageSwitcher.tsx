'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TAPPY_LANGS, useLang } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = TAPPY_LANGS.find((l) => l.code === lang) ?? TAPPY_LANGS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase tracking-wide">{current.code}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute bottom-full left-0 mb-1 max-h-64 w-48 overflow-y-auto rounded-xl border border-white/10 bg-[#131926] py-1 shadow-xl"
          style={{ scrollbarWidth: 'thin' }}
        >
          {TAPPY_LANGS.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={active}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? 'font-semibold text-[#33d6c5]'
                    : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span>{l.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
