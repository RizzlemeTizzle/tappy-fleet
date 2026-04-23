import type { LucideIcon } from 'lucide-react';

type Tone = 'violet' | 'teal' | 'mixed' | 'muted';

const TONE_STYLES: Record<Tone, string> = {
  violet: 'border-[#7c5cff]/25 bg-[#7c5cff]/12 text-[#9f89ff]',
  teal: 'border-[#33d6c5]/25 bg-[#33d6c5]/12 text-[#7ce9de]',
  mixed: 'border-white/10 bg-[linear-gradient(135deg,rgba(124,92,255,0.18),rgba(51,214,197,0.12))] text-white',
  muted: 'border-white/10 bg-white/[0.04] text-zinc-300',
};

export function BrandIcon({
  icon: Icon,
  className = '',
  size = 18,
  tone = 'mixed',
}: {
  icon: LucideIcon;
  className?: string;
  size?: number;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border ${TONE_STYLES[tone]} ${className}`}
    >
      <Icon size={size} strokeWidth={2.1} />
    </span>
  );
}
