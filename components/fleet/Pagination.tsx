'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

const BTN_BASE = 'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm transition-colors';

export function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = Math.min((currentPage - 1) * pageSize + 1, total);
  const to = Math.min(currentPage * pageSize, total);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm">
      <span className="text-zinc-500">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={
            currentPage === 1
              ? `${BTN_BASE} cursor-not-allowed text-zinc-700`
              : `${BTN_BASE} text-zinc-400 hover:bg-zinc-800 hover:text-white`
          }
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ell-${i}`} className="px-1 text-zinc-600">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={
                p === currentPage
                  ? `${BTN_BASE} border border-[#33d6c5]/30 bg-[#33d6c5]/15 text-[#33d6c5]`
                  : `${BTN_BASE} text-zinc-400 hover:bg-zinc-800 hover:text-white`
              }
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={
            currentPage === totalPages
              ? `${BTN_BASE} cursor-not-allowed text-zinc-700`
              : `${BTN_BASE} text-zinc-400 hover:bg-zinc-800 hover:text-white`
          }
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
