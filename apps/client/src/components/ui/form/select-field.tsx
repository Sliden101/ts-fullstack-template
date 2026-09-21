import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/hooks/form-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { toErrorMessages } from './utils';

export type SelectFieldOption = { label: string; value: string };

export type SelectFieldProps = {
  label: ReactNode;
  placeholder?: string;
  options: SelectFieldOption[];
  disabled?: boolean;
  controlClassName?: string;
};

export function SelectField({
  label,
  placeholder,
  options,
  disabled,
  controlClassName,
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value ?? '')}
        disabled={disabled}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${field.name}-error` : undefined}
          className={cn('w-full', controlClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && (
        <FieldError id={`${field.name}-error`} role="alert">
          {messages[0]}
        </FieldError>
      )}
    </Field>
  );
}
