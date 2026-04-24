import { cn } from '@/lib/utils';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-60';

const buttonSizes = {
  sm: 'min-h-9 px-3.5 py-2',
  md: 'min-h-10 px-4 py-2.5',
  lg: 'min-h-11 px-5 py-3',
  icon: 'h-10 w-10',
} as const;

const buttonVariants = {
  primary:
    'border-transparent bg-[linear-gradient(135deg,#a798ff_0%,#88a7ff_48%,#5ee6d7_100%)] text-[#0b1017] shadow-[0_16px_34px_rgba(89,115,255,0.28)] hover:-translate-y-0.5 hover:brightness-105',
  secondary:
    'border-white/12 bg-[linear-gradient(135deg,rgba(143,125,255,0.18),rgba(109,137,255,0.14),rgba(51,214,197,0.12))] text-white shadow-[0_10px_26px_rgba(62,78,120,0.18)] hover:-translate-y-0.5 hover:border-[#8f7dff]/35 hover:bg-[linear-gradient(135deg,rgba(143,125,255,0.24),rgba(109,137,255,0.18),rgba(51,214,197,0.15))]',
  subtle:
    'border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white',
  danger:
    'border-red-400/20 bg-[linear-gradient(135deg,rgba(255,92,139,0.22),rgba(255,134,91,0.18))] text-white shadow-[0_10px_24px_rgba(92,34,54,0.18)] hover:-translate-y-0.5 hover:border-red-300/30 hover:bg-[linear-gradient(135deg,rgba(255,92,139,0.28),rgba(255,134,91,0.24))]',
} as const;

type FleetButtonSize = keyof typeof buttonSizes;
type FleetButtonVariant = keyof typeof buttonVariants;

export function fleetButtonClass(
  variant: FleetButtonVariant = 'primary',
  size: FleetButtonSize = 'md',
  className?: string,
) {
  return cn(buttonBase, buttonSizes[size], buttonVariants[variant], className);
}
