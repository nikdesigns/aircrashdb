// components/SearchBox.tsx
'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

type Props = {
  value?: string; // initial value (uncontrolled)
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export type SearchBoxHandle = {
  focus: () => void;
  clear: () => void;
  setValue: (v: string) => void; // optional helper to programmatically set value
};

const SearchBox = forwardRef<SearchBoxHandle, Props>(function SearchBox(
  { value = '', onChange, onSubmit, placeholder = 'Search...', className = '' },
  ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        if (inputRef.current) {
          inputRef.current.value = '';
          onChange?.('');
        }
      },
      setValue: (v: string) => {
        if (inputRef.current) {
          inputRef.current.value = v;
          onChange?.(v);
        }
      },
    }),
    [onChange]
  );

  // If parent passes a changed `value` prop at runtime (programmatic updates),
  // reflect it into the uncontrolled input via ref. This won't change the controlledness.
  useEffect(() => {
    if (inputRef.current && typeof value === 'string') {
      if (inputRef.current.value !== value) {
        inputRef.current.value = value;
      }
    }
    // only respond to explicit value prop changes
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = inputRef.current?.value ?? '';
    onSubmit?.(v);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value);
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <input
        ref={inputRef}
        name="q"
        defaultValue={value} // uncontrolled, SSR-safe initial value
        onChange={handleChange}
        type="search"
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
        aria-label="Search reports"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1"
      >
        <svg
          className="h-4 w-4 text-slate-600"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </form>
  );
});

export default SearchBox;
