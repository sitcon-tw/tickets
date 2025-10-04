import { CSSProperties } from 'react';

export const formStyles: Record<string, CSSProperties> = {
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontWeight: 'bold',
    display: 'block'
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #333',
    borderRadius: '0.25rem',
    fontSize: '1rem',
    backgroundColor: '#222',
    color: '#fff'
  },
  fieldset: {
    border: '1px solid #333',
    borderRadius: '0.25rem',
    padding: '1rem',
    backgroundColor: '#111'
  },
  legend: {
    fontWeight: 'bold',
    padding: '0 0.5rem'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0.5rem 0',
    fontWeight: 'normal'
  },
  optionInput: {
    width: 'auto',
    margin: 0
  }
};
