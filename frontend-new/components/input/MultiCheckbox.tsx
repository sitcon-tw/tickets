import React, { CSSProperties, ChangeEvent } from "react";
import styled from 'styled-components';

type CheckboxOption = string | { value: string; label: string };

type MultiCheckboxProps = {
  label: string;
  name: string;
  options: CheckboxOption[];
  values?: string[];
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const styles: Record<"fieldset" | "legend", CSSProperties> = {
  fieldset: {
    border: "none",
    padding: 0,
    margin: 0
  },
  legend: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "bold"
  }
};

const StyledLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  margin-bottom: 0.5rem;

  input[type="checkbox"] {
    display: none;
  }

  svg {
    overflow: visible;
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  .path {
    fill: none;
    stroke: var(--color-gray-400);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease;
    stroke-dasharray: 241 9999999;
    stroke-dashoffset: 0;
  }

  input:checked ~ svg .path {
    stroke-dasharray: 70.5096664428711 9999999;
    stroke-dashoffset: -262.2723388671875;
  }

  &:hover .path {
    stroke: var(--color-gray-300);
  }
`;

export default function MultiCheckbox({ label, name, options, values = [], onChange }: MultiCheckboxProps) {
  return (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{label}</legend>
      {options.map((option) => {
        const optionValue = typeof option === 'object' && option !== null && 'value' in option ? option.value : String(option);
        const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? option.label : String(option);
        const optionId = `${name}-${optionValue}`;
        const isChecked = values.includes(optionValue);

        return (
          <StyledLabel key={optionId} htmlFor={optionId}>
            <input
              type="checkbox"
              id={optionId}
              name={name}
              value={optionValue}
              checked={isChecked}
              onChange={onChange}
            />
            <svg viewBox="0 0 64 64" height="1em" width="1em">
              <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" className="path" />
            </svg>
            {optionLabel}
          </StyledLabel>
        );
      })}
    </fieldset>
  );
}
