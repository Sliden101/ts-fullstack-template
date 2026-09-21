import type { ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { Loader2 } from 'lucide-react';
import { useFormContext } from '@/hooks/form-context';
import { Button, type ButtonProps } from '@/components/atom';

export type SubmitButtonProps = Omit<ButtonProps, 'type' | 'children'> & {
  label: string;
  loadingLabel?: string;
  icon?: ReactNode;
};

export function SubmitButton({
  label,
  loadingLabel = 'Saving…',
  icon,
  disabled,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  return (
    <Button
      type="submit"
      disabled={!canSubmit || isSubmitting || disabled}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
