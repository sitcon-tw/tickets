"use client";

import { ReactNode, useEffect, useState } from "react";

type ConfirmProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isConfirming?: boolean;
};

export default function Confirm({ isOpen, onClose, children, isConfirming = false }: ConfirmProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is preferred
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div
      className={isConfirming ? "confirm confirming" : "confirm"}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: isDarkMode ? '#00000029' : '#ffffff29',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingTop: '10rem',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 400
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: 'auto',
          padding: '2rem',
          position: 'relative'
        }}
      >
        <button
          type="button"
          aria-label="close"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '2rem',
            top: '-1rem',
            cursor: 'pointer',
            fontSize: '2rem',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            lineHeight: 1
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
