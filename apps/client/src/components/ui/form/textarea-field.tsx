import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/hooks/form-context';
import { Textarea } from '@/components/atom';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { toErrorMessages } from './utils';

export type TextareaFieldProps = {
  label: ReactNode;
  placeholder?: string;
  description?: string;
  rows?: number;
  disabled?: boolean;
  controlClassName?: string;
};

export function TextareaField({
  label,
  placeholder,
  description,
  rows = 3,
  disabled,
  controlClassName,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        className={controlClassName}
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
