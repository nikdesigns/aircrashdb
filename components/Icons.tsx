// components/Icons.tsx
import React from 'react';

export const Icon = {
  site: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path d="M12 2v20M2 12h20" strokeWidth="1.5" />
    </svg>
  ),
  aircraft: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M2 16l20-5-20-5v4l14 1-14 1v4z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  operator: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
      <path d="M7 9h10M7 15h7" strokeWidth="1.5" />
    </svg>
  ),
  fatalities: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
      <path d="M6 22c0-4 12-4 12 0" strokeWidth="1.5" />
    </svg>
  ),
  injuries: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" strokeWidth="1.5" />
    </svg>
  ),
  survivors: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="4" strokeWidth="1.5" />
      <path d="M2 22c0-5 20-5 20 0" strokeWidth="1.5" />
    </svg>
  ),
  origin: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 2v20M2 12h20" strokeWidth="1.5" />
    </svg>
  ),
  destination: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M2 12h20M12 2v20" strokeWidth="1.5" />
    </svg>
  ),
};
