'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export type PasswordInputWithToggleProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> & {
  /** Classes on the outer bordered container (flex row). */
  className?: string;
  /** Classes on the inner input (no border; use padding here). */
  inputClassName?: string;
};

const defaultBoxClass =
  'flex w-full min-w-0 items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500';

const defaultInputClass =
  'min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-slate-900 outline-none ring-0 placeholder:text-slate-400';

/**
 * Password field with show/hide toggle. Border wraps input + icon so the eye stays inside the box.
 */
export default function PasswordInputWithToggle({
  className,
  inputClassName,
  id,
  disabled,
  ...rest
}: PasswordInputWithToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className?.trim() ? className : defaultBoxClass}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={inputClassName?.trim() ? inputClassName : defaultInputClass}
        {...rest}
      />
      <button
        type="button"
        className="mr-1.5 shrink-0 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-40"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        disabled={disabled}
      >
        {visible ? <EyeOff className="h-5 w-5 shrink-0" aria-hidden /> : <Eye className="h-5 w-5 shrink-0" aria-hidden />}
      </button>
    </div>
  );
}
