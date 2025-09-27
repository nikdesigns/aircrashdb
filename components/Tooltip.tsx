// components/Tooltip.tsx
'use client';

import React, { useId, useLayoutEffect, useRef, useState } from 'react';

type TooltipProps = {
  children: React.ReactNode;
  text: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
};

export default function Tooltip({
  children,
  text,
  placement = 'top',
  className = '',
}: TooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(
    null
  );

  // Position tooltip after layout (client only)
  useLayoutEffect(() => {
    if (!visible) return;
    if (!triggerRef.current || !tipRef.current) return;

    const t = triggerRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const padding = 8; // gap between trigger and tooltip

    let left = 0;
    let top = 0;

    switch (placement) {
      case 'top':
        left = t.left + t.width / 2 - tip.width / 2 + window.scrollX;
        top = t.top - tip.height - padding + window.scrollY;
        break;
      case 'bottom':
        left = t.left + t.width / 2 - tip.width / 2 + window.scrollX;
        top = t.bottom + padding + window.scrollY;
        break;
      case 'left':
        left = t.left - tip.width - padding + window.scrollX;
        top = t.top + t.height / 2 - tip.height / 2 + window.scrollY;
        break;
      case 'right':
        left = t.right + padding + window.scrollX;
        top = t.top + t.height / 2 - tip.height / 2 + window.scrollY;
        break;
    }

    // prevent overflow horizontally
    const maxLeft = document.documentElement.clientWidth - tip.width - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    setCoords({ left, top });
  }, [visible, placement]);

  // keyboard + mouse handlers
  function onMouseEnter() {
    setVisible(true);
  }
  function onMouseLeave() {
    setVisible(false);
  }
  function onFocus() {
    setVisible(true);
  }
  function onBlur() {
    setVisible(false);
  }

  // Render: ensure server-side renders children only (no JS required)
  return (
    <>
      <span
        ref={(el) => {
          // allow refs to be set to interactive elements (button/a) by children
          if (el && !triggerRef.current) triggerRef.current = el;
        }}
        // if children is an element, we clone it below to attach refs/handlers
        className={className}
      >
        {React.isValidElement(children) ? (
          React.cloneElement(children as React.ReactElement, {
            ref(node: HTMLElement) {
              triggerRef.current = node;
              const origRef = (children as any).ref;
              if (typeof origRef === 'function') origRef(node);
              else if (origRef && typeof origRef === 'object')
                (origRef as any).current = node;
            },
            onMouseEnter(e: any) {
              (children as any).props?.onMouseEnter?.(e);
              onMouseEnter();
            },
            onMouseLeave(e: any) {
              (children as any).props?.onMouseLeave?.(e);
              onMouseLeave();
            },
            onFocus(e: any) {
              (children as any).props?.onFocus?.(e);
              onFocus();
            },
            onBlur(e: any) {
              (children as any).props?.onBlur?.(e);
              onBlur();
            },
            'aria-describedby': text ? id : undefined,
          })
        ) : (
          // plain text child fallback: wrap in span that supports events
          <span
            ref={(node) => (triggerRef.current = node)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onFocus={onFocus}
            onBlur={onBlur}
            tabIndex={0}
            aria-describedby={text ? id : undefined}
          >
            {children}
          </span>
        )}
      </span>

      {/* Tooltip popover — rendered only when visible (client-only because of 'use client') */}
      {visible && coords && (
        <div
          ref={tipRef}
          id={id}
          role="tooltip"
          className="z-50 pointer-events-none rounded bg-slate-900/95 px-2 py-1 text-xs text-white shadow"
          style={{
            position: 'absolute',
            left: `${coords.left}px`,
            top: `${coords.top}px`,
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}
