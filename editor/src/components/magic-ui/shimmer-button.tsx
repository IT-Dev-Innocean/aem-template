import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ShimmerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  shimmerColor?: string;
};

export function ShimmerButton({
  className,
  children,
  shimmerColor = 'rgba(255,255,255,0.35)',
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        'bg-vscode-accent text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}>
      <span
        className='absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] gradient-to-r from-transparent via-white/20 to-transparent'
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        }}
      />
      <span className='relative z-10 flex items-center gap-2'>{children}</span>
    </button>
  );
}
