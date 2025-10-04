import { CSSProperties } from 'react';

export const formStyles: Record<string, CSSProperties> = {
  formGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.4rem 0.8rem',
    border: '1px solid var(--color-gray-700)',
    borderRadius: '0.25rem',
    backgroundColor: 'transparent',
    color: 'inherit',
    fontFamily: 'inherit'
  },
  fieldset: {
    border: 'none',
    padding: 0,
    margin: 0
  },
  legend: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontWeight: 'normal'
  },
  optionInput: {
    marginRight: '0.5rem'
  }
};
