import {
  forwardRef,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export type FormProps = FormHTMLAttributes<HTMLFormElement>;

export function Form({ className, ...props }: FormProps) {
  return (
    <form
      className={cn('flex w-full min-w-0 flex-col gap-6', className)}
      {...props}
    />
  );
}

export function FormSection({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function FormField({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-w-0 flex-col gap-1.5', className)} {...props} />;
}

export type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(function FormLabel(
  { className, children, required, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-semibold text-slate-800',
        props.htmlFor === undefined && 'cursor-default',
        className,
      )}
      {...props}
    >
      {children}
      {required ? <span className="ml-0.5 text-red-600" aria-hidden>*</span> : null}
    </label>
  );
});

export function FormDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs leading-relaxed text-slate-500', className)} {...props} />;
}

export type FormMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: 'error' | 'success' | 'muted';
};

const messageVariant: Record<NonNullable<FormMessageProps['variant']>, string> = {
  error: 'text-red-600',
  success: 'text-emerald-700',
  muted: 'text-slate-500',
};

export function FormMessage({ className, variant = 'error', id, role, ...props }: FormMessageProps) {
  return (
    <p
      id={id}
      role={role ?? (variant === 'error' ? 'alert' : undefined)}
      className={cn('text-sm font-medium', messageVariant[variant], className)}
      {...props}
    />
  );
}

/** Wrap inputs so focus ring and width stay consistent. */
export function FormControl({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0', className)} {...props} />;
}

export function FormActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center', className)}
      {...props}
    />
  );
}
