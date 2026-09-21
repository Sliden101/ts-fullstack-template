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

export type TextFieldProps = {
  label: ReactNode;
  placeholder?: string;
  description?: string;
  type?: React.ComponentProps<typeof Input>['type'];
  autoComplete?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  disabled?: boolean;
  controlClassName?: string;
};

export function TextField({
  label,
  placeholder,
  description,
  type = 'text',
  autoComplete,
  leadingIcon,
  trailing,
  disabled,
  controlClassName,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;
  const hasAdornment = Boolean(leadingIcon || trailing);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className={cn(hasAdornment && 'relative')}>
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {leadingIcon}
          </span>
        )}
        <Input
          id={field.name}
          name={field.name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${field.name}-error` : undefined}
          className={cn(leadingIcon && 'pl-10', trailing && 'pr-11', controlClassName)}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2.5">
            {trailing}
          </span>
        )}
      </div>
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
