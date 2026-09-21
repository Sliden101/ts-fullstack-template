import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/hooks/form-context';
import { Input } from '@/components/atom';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { toErrorMessages } from './utils';

export type NumberFieldProps = {
  label: ReactNode;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  controlClassName?: string;
};

export function NumberField({
  label,
  placeholder,
  description,
  min,
  max,
  step,
  disabled,
  controlClassName,
}: NumberFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        className={cn('font-mono', controlClassName)}
      />
      {description && !isInvalid && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {isInvalid && (
        <FieldError id={`${field.name}-error`} role="alert">
          {messages[0]}
        </FieldError>
      )}
    </Field>
  );
}
