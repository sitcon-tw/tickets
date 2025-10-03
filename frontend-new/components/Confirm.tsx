"use client";

import { ReactNode } from "react";

type ConfirmProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isConfirming?: boolean;
};

export default function Confirm({ isOpen, onClose, children, isConfirming = false }: ConfirmProps) {
  return (
    <div
      className={isConfirming ? "confirm confirming" : "confirm"}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#00000029',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingTop: '10rem',
        opacity: (isOpen && isConfirming) ? 1 : 0,
        pointerEvents: (isOpen && isConfirming) ? 'all' : 'none',
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
