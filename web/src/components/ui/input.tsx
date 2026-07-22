import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn('ui-input', className)}
        {...props}
      />
    );
  },
);
