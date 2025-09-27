// components/Label.tsx
import React from 'react';

export type IconFunc = (props: React.SVGProps<SVGSVGElement>) => JSX.Element;

export type LabelProps = {
  icon?: IconFunc | null;
  label: string;
  value?: string | number | null;
  className?: string;
};

export function Label({
  icon: Icon,
  label,
  value,
  className = '',
}: LabelProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon (optional) */}
      {Icon ? (
        <Icon className="h-4 w-4 text-slate-500 shrink-0" aria-hidden />
      ) : null}

      {/* Text */}
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400">{label}</div>
        <div
          className="text-xs font-medium text-slate-800 truncate"
          title={typeof value === 'string' ? value : undefined}
        >
          {value ?? '—'}
        </div>
      </div>
    </div>
  );
}
