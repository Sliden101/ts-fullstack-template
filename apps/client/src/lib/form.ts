import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/hooks/form-context';
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  SwitchField,
  PhotoUploadField,
  SubmitButton,
} from '@/components/ui/form';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    NumberField,
    SelectField,
    CheckboxField,
    SwitchField,
    PhotoUploadField,
  },
  formComponents: {
    SubmitButton,
  },
});
