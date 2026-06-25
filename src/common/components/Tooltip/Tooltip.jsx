import { useState } from 'react';

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ minWidth: 220 }}
        >
          <span
            className="block px-3 py-2 rounded-[10px] text-[12px] font-medium leading-snug text-white text-center whitespace-normal"
            style={{
              background: 'rgba(28,28,31,0.92)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            }}
          >
            {text}
          </span>
          {/* Arrow */}
          <span
            className="block mx-auto w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(28,28,31,0.92)',
              width: 0,
            }}
          />
        </span>
      )}
    </span>
  );
}
