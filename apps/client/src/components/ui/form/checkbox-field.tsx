import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/hooks/form-context';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { toErrorMessages } from './utils';

export type CheckboxFieldProps = {
  label: ReactNode;
  description?: string;
  disabled?: boolean;
};

export function CheckboxField({
  label,
  description,
  disabled,
}: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        onBlur={field.handleBlur}
        disabled={disabled}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && !isInvalid && (
          <FieldDescription>{description}</FieldDescription>
        )}
        {isInvalid && (
          <FieldError id={`${field.name}-error`} role="alert">
            {messages[0]}
          </FieldError>
        )}
      </FieldContent>
    </Field>
  );
}
