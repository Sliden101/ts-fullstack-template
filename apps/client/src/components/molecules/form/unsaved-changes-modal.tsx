import * as React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { ModalBackdrop, Button } from '@/components/atom';
import { getTranslation } from '@/i18n';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  language?: 'km' | 'en';
  onConfirmDiscard: () => void;
  onKeepEditing: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  language = 'en',
  onConfirmDiscard,
  onKeepEditing,
}) => {
  if (!isOpen) return null;
  const dict = getTranslation(language);

  return (
    <ModalBackdrop onClose={onKeepEditing}>
      <div
        data-slot="unsaved-changes-modal"
        role="alertdialog"
        aria-modal="true"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {dict.unsavedChanges.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {dict.unsavedChanges.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onKeepEditing}
          >
            {dict.unsavedChanges.keepEditing}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirmDiscard}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{dict.unsavedChanges.discard}</span>
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
};

export default UnsavedChangesModal;
