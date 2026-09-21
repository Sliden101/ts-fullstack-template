import React, { useRef, useState } from 'react';
import { Upload, Trash2, Image as ImageIcon, AlertCircle, Link, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/atom';
import { getTranslation } from '@/i18n';

export interface PhotoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  language?: 'km' | 'en';
  label?: string;
  maxSizeMB?: number;
  className?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  value,
  onChange,
  disabled = false,
  language = 'km',
  label,
  maxSizeMB = 5,
  className = '',
}) => {
  const t = getTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const displayLabel = label || t.photoUpload.label;

  const handleFile = (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t.photoUpload.fileTypeError);
      return;
    }

    // Validate size (maxSizeMB in MB)
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(t.photoUpload.fileSizeError);
      return;
    }

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage(t.photoUpload.readError);
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input value so re-uploading same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleTriggerUpload = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange('');
    setErrorMessage(null);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
      setErrorMessage(null);
    }
  };

  return (
    <div className={`space-y-3 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Header / Title */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
          <ImageIcon className="w-4 h-4 text-[#0d7c90]" />
          <span>{displayLabel}</span>
          <span className="text-[10px] text-slate-400 font-normal lowercase">{t.photoUpload.optional}</span>
        </label>
        <span className="text-[10px] text-slate-400 font-normal">
          {t.photoUpload.supportedFormats}
        </span>
      </div>

      {/* Main Upload / Preview Area */}
      {value ? (
        // Preview State when image exists
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
          <div className="relative w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 group">
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0d7c90]/10 text-[#0d7c90] dark:bg-[#0d7c90]/20">
                <Check className="w-3 h-3 mr-1" />
                {t.photoUpload.imageSelected}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {value.startsWith('data:')
                ? t.photoUpload.uploadedFromDevice
                : value}
            </p>

            <div className="flex items-center space-x-2 pt-0.5">
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleTriggerUpload}
                disabled={disabled}
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t.photoUpload.changeButton}</span>
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="xs"
                onClick={handleRemove}
                disabled={disabled}
              >
                <Trash2 className="w-3 h-3" />
                <span>{t.photoUpload.removeButton}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Dropzone State when no image is selected
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerUpload}
          className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
            disabled
              ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40'
              : isDragging
              ? 'border-[#0d7c90] bg-[#0d7c90]/5 dark:bg-[#0d7c90]/10 scale-[1.005]'
              : 'border-slate-200 dark:border-slate-700 hover:border-[#0d7c90]/60 hover:bg-white dark:hover:bg-slate-800/60 bg-white/70 dark:bg-slate-850/60'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#0d7c90]/10 dark:bg-[#0d7c90]/20 flex items-center justify-center text-[#0d7c90] mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {t.photoUpload.dragDropText}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {t.photoUpload.supportedFormats}
          </p>
          <Button
            type="button"
            disabled={disabled}
            size="sm"
            className="mt-2.5 bg-[#0d7c90] hover:bg-[#0a6b7d] text-white"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.photoUpload.uploadButton}</span>
          </Button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* URL Input Toggle */}
      <div className="pt-1 flex items-center justify-end text-xs border-t border-slate-200/60 dark:border-slate-800/80">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={disabled}
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-slate-500 hover:text-[#0d7c90] dark:text-slate-400 dark:hover:text-[#0d7c90]"
        >
          <Link className="w-3 h-3" />
          <span>{t.photoUpload.enterUrl}</span>
        </Button>
      </div>

      {/* URL Input collapse */}
      {showUrlInput && (
        <div className="flex items-center space-x-1.5 pt-1 animate-in fade-in duration-150">
          <input
            type="url"
            disabled={disabled}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
            placeholder={t.photoUpload.urlPlaceholder}
            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0d7c90] text-slate-900 dark:text-slate-100"
          />
          <Button
            type="button"
            size="xs"
            disabled={disabled || !urlInput.trim()}
            onClick={handleApplyUrl}
            className="bg-[#0d7c90] hover:bg-[#0a6b7d] text-white"
          >
            {t.photoUpload.apply}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
