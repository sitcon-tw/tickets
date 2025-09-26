"use client";

import { ReactNode } from "react";

type ConfirmProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Confirm({ isOpen, onClose, children }: ConfirmProps) {
  return (
    <div
      className="confirm"
      role="dialog"
      aria-modal="true"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "all" : "none"
      }}
    >
      <div className="confirm-container">
        <button id="close" type="button" aria-label="close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
      <style jsx>{`
        .confirm {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background-color: #ffffff29;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding-top: 10rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease-in-out;
          z-index: 400;
        }

        @media (prefers-color-scheme: dark) {
          .confirm {
            background-color: #00000029;
          }
        }

        .confirm-container {
          max-width: 800px;
          margin: auto;
          padding: 2rem;
          position: relative;
        }

        #close {
          position: absolute;
          right: 2rem;
          top: -1rem;
          cursor: pointer;
          font-size: 2rem;
          background: transparent;
          border: none;
          color: inherit;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}
