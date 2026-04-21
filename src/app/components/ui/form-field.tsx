import React from 'react';
import { cn } from './utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, icon, accentColor = 'border-blue-500', children }: FormSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className={`px-5 py-4 bg-slate-50 dark:bg-slate-900/80 border-b-2 ${accentColor} flex items-center gap-3`}>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</p>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-950">
        {children}
      </div>
    </div>
  );
}

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function FormActions({ onCancel, onSubmit, submitLabel = 'Save', cancelLabel = 'Cancel', isLoading }: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
