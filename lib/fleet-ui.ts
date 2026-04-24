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
    'border-transparent bg-[linear-gradient(135deg,#a798ff_0%,#88a7ff_48%,#5ee6d7_100%)] text-black shadow-[0_16px_34px_rgba(89,115,255,0.28)] hover:-translate-y-0.5 hover:brightness-105',
  secondary:
    'border-transparent bg-[linear-gradient(135deg,#c7bdff_0%,#b5c7ff_48%,#9df0e7_100%)] text-black hover:-translate-y-0.5 hover:brightness-105',
  subtle:
    'border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/15 hover:bg-white/[0.08] hover:text-white',
  danger:
    'border-transparent bg-[linear-gradient(135deg,#ff9cc0_0%,#ffb490_100%)] text-black hover:-translate-y-0.5 hover:brightness-105',
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
