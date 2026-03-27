import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'elevated' | 'outline' | 'muted';

const cardVariants: Record<CardVariant, string> = {
  default: 'border border-slate-200/90 bg-white shadow-sm',
  elevated:
    'border border-slate-200/80 bg-white shadow-[0_4px_24px_-6px_rgba(15,23,42,0.12)]',
  outline: 'border border-dashed border-slate-200 bg-white/80',
  muted: 'border border-slate-100 bg-corporate-surface/80',
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-2xl p-6 text-slate-900 sm:p-6 md:p-8', cardVariants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold leading-snug tracking-tight text-slate-900', className)} {...props} />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-slate-600', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('text-sm leading-relaxed text-slate-600', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4', className)} {...props} />
  );
}
