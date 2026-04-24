'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang, useT } from '@/lib/i18n';

function parseYMD(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export default function DatePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { lang } = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = parseYMD(value);
  const today = new Date();

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const dayNames = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i); // Monday 1 Jan 2024
    return new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(date);
  });

  const monthName = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(viewYear, viewMonth, 1));

  function formatDisplay(v: string): string {
    const d = parseYMD(v);
    if (!d) return t('datepicker_pick');
    return d.toLocaleDateString(lang, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: Date) => {
    onChange(toYMD(day));
    setOpen(false);
  };

  const isSame = (a: Date | null, b: Date | null) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const cells = calendarDays(viewYear, viewMonth);

  return (
    <div ref={ref} className="relative w-full xl:w-auto">
      <label className="text-xs text-zinc-400 block mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white transition-colors hover:border-zinc-600 focus:border-[#4CAF50] focus:outline-none sm:min-w-[148px] xl:w-auto"
      >
        <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
        <span className={value ? 'text-white' : 'text-zinc-500'}>{formatDisplay(value)}</span>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-white text-sm font-semibold capitalize">
              {monthName} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center text-xs text-zinc-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const isSelected = isSame(day, selected);
              const isToday = isSame(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    text-xs rounded-lg h-8 w-full flex items-center justify-center transition-colors
                    ${isSelected
                      ? 'bg-[#4CAF50] text-black font-bold'
                      : isToday
                      ? 'border border-[#4CAF50] text-[#4CAF50]'
                      : 'text-zinc-300 hover:bg-zinc-800'}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center"
            >
              {t('datepicker_clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
