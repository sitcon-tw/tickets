import React, { ChangeEvent } from "react";
import styled from 'styled-components';

export type RadioOption = string | { value: string; label: string };

type RadioProps = {
  label: string;
  name: string;
  options: RadioOption[];
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const StyledWrapper = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;

  .legend {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: white;
  }

  .radio-buttons {
    display: flex;
    flex-direction: column;
  }

  .radio-button {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    cursor: pointer;
  }

  .radio-button input[type="radio"] {
    display: none;
  }

  .radio-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #aaa;
    position: relative;
    margin-right: 10px;
  }

  .radio-circle::before {
    content: "";
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ddd;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: all 0.2s ease-in-out;
  }

  .radio-button input[type="radio"]:checked + .radio-circle::before {
    transform: translate(-50%, -50%) scale(1);
    background-color: var(--color-gray-200);
  }

  .radio-label {
    font-size: 16px;
    font-weight: bold;
    color: white;
  }

  .radio-button:hover .radio-circle {
    border-color: #555;
  }
`;

export default function Radio({ label, name, options, required = true, value, onChange }: RadioProps) {
  return (
    <StyledWrapper>
      <legend className="legend">{label}</legend>
      <div className="radio-buttons">
        {options.map((option, i) => {
          const optionValue = typeof option === 'object' && option !== null && 'value' in option ? option.value : String(option);
          const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? option.label : String(option);
          const optionId = `${name}-${optionValue}`;
          return (
            <label key={optionId} className="radio-button">
              <input
                type="radio"
                id={optionId}
                name={name}
                value={optionValue}
                required={required && i === 0}
                checked={value === optionValue}
                onChange={onChange}
              />
              <div className="radio-circle" />
              <span className="radio-label">{optionLabel}</span>
            </label>
          );
        })}
      </div>
    </StyledWrapper>
  );
}
