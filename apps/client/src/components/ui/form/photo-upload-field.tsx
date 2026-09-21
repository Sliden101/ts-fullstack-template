import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '@/hooks/form-context';
import { PhotoUpload } from '@/components/molecules';
import { Field, FieldError } from '@/components/ui/field';
import { toErrorMessages } from './utils';

export type PhotoUploadFieldProps = {
  language?: 'km' | 'en';
  disabled?: boolean;
};

export function PhotoUploadField({
  language = 'km',
  disabled,
}: PhotoUploadFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const messages = toErrorMessages(errors);
  const isInvalid = field.state.meta.isTouched && messages.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <PhotoUpload
        value={field.state.value}
        onChange={(url) => field.handleChange(url)}
        disabled={disabled}
        language={language}
      />
      {isInvalid && (
        <FieldError id={`${field.name}-error`} role="alert">
          {messages[0]}
        </FieldError>
      )}
    </Field>
  );
}
