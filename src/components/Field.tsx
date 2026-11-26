import type { InputHTMLAttributes, ReactNode } from 'react';

export const inputCls =
  'w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] shadow-[inset_0_2px_4px_rgba(21,36,59,.05)] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15';

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-sub">
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-sub">{hint}</span>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}
