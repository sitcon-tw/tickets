import { ChangeEvent } from "react";
import styled from "styled-components";

export type RadioOption = string | { value: string; label: string };

type RadioProps = {
    label: string;
    name: string;
    options: RadioOption[];
    required?: boolean;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onValueChange?: (value: string) => void;
};

const StyledWrapper = styled.fieldset`
    border: none;
    padding: 0;
    margin: 0;

    .legend {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: rgb(17 24 39);
    }

    :is(.dark, .dark *) & .legend {
        color: rgb(243 244 246);
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
        position: absolute;
        opacity: 0;
        width: 20px;
        height: 20px;
        margin: 0;
        cursor: pointer;
    }

    .radio-circle {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgb(156 163 175);
        position: relative;
        margin-right: 10px;
        flex-shrink: 0;
    }

    :is(.dark, .dark *) & .radio-circle {
        border-color: rgb(209 213 219);
    }

    .radio-circle::before {
        content: "";
        display: block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgb(55 65 81);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        transition: all 0.2s ease-in-out;
    }

    :is(.dark, .dark *) & .radio-circle::before {
        background-color: rgb(229 231 235);
    }

    .radio-button input[type="radio"]:checked + .radio-circle::before {
        transform: translate(-50%, -50%) scale(1);
    }

    .radio-label {
        font-size: 16px;
        font-weight: bold;
        color: rgb(17 24 39);
    }

    :is(.dark, .dark *) & .radio-label {
        color: rgb(243 244 246);
    }

    .radio-button:hover .radio-circle {
        border-color: rgb(75 85 99);
    }

    :is(.dark, .dark *) & .radio-button:hover .radio-circle {
        border-color: rgb(229 231 235);
    }
`;

export default function Radio({ label, name, options, required = true, value, onChange, onValueChange }: RadioProps) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
        if (onValueChange) {
            onValueChange(e.target.value);
        }
    };

    return (
        <StyledWrapper>
            <legend className="legend">{label}</legend>
            <div className="radio-buttons">
                {options.map((option, i) => {
                    const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
                    const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
                    const optionId = `${name}-${optionValue}`;
                    const isChecked = value === optionValue;

                    return (
                        <label key={optionId} className="radio-button">
                            <input type="radio" id={optionId} name={name} value={optionValue} required={required && i === 0} checked={isChecked} onChange={handleChange} />
                            <div className="radio-circle" />
                            <span className="radio-label">{optionLabel}</span>
                        </label>
                    );
                })}
            </div>
        </StyledWrapper>
    );
}
