import { ChangeEvent, useEffect, useState } from "react";
import styled from "styled-components";
import { Input } from "../ui/input";

export type RadioOption = string | { value: string; label: string };

type RadioProps = {
	label: string;
	name: string;
	options: RadioOption[];
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onValueChange?: (value: string) => void;
	enableOther?: boolean;
	otherLabel?: string;
	otherPlaceholder?: string;
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

	.other-input-wrapper {
		margin-left: 30px;
		margin-top: 8px;
	}
`;

export default function Radio({ label, name, options, required = true, value, onChange, onValueChange, enableOther = false, otherLabel = "Other", otherPlaceholder = "" }: RadioProps) {
	const OTHER_VALUE = "__other__";

	// Check if current value is one of the predefined options
	const optionValues = options.map(opt =>
		typeof opt === "object" && opt !== null && "value" in opt ? opt.value : String(opt)
	);

	// Track whether "Other" radio is selected (separate from the text value)
	const valueIsAPredefinedOption = value !== undefined && value !== "" && optionValues.includes(value);
	const [isOtherRadioSelected, setIsOtherRadioSelected] = useState(!valueIsAPredefinedOption && enableOther && value !== undefined);
	const [otherText, setOtherText] = useState(valueIsAPredefinedOption ? "" : (value || ""));

	// Sync state when value prop changes from outside (e.g., form reset or load from saved data)
	useEffect(() => {
		const isPredefined = value !== undefined && value !== "" && optionValues.includes(value);
		if (isPredefined) {
			setIsOtherRadioSelected(false);
		} else if (value !== undefined && value !== "" && enableOther) {
			setIsOtherRadioSelected(true);
			setOtherText(value);
		}
	}, [value, optionValues, enableOther]);

	const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedValue = e.target.value;

		if (selectedValue === OTHER_VALUE) {
			// When "Other" radio is selected, show the input and use current otherText
			setIsOtherRadioSelected(true);
			const newValue = otherText || "";
			const syntheticEvent = {
				...e,
				target: {
					...e.target,
					value: newValue
				}
			} as ChangeEvent<HTMLInputElement>;

			if (onChange) {
				onChange(syntheticEvent);
			}
			if (onValueChange) {
				onValueChange(newValue);
			}
		} else {
			// Regular option selected - hide "Other" input
			setIsOtherRadioSelected(false);
			if (onChange) {
				onChange(e);
			}
			if (onValueChange) {
				onValueChange(selectedValue);
			}
		}
	};

	const handleOtherTextChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newText = e.target.value;
		setOtherText(newText);

		// Create a synthetic radio change event with the text value
		const syntheticEvent = {
			target: {
				name: name,
				value: newText
			}
		} as ChangeEvent<HTMLInputElement>;

		if (onChange) {
			onChange(syntheticEvent);
		}
		if (onValueChange) {
			onValueChange(newText);
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
							<input type="radio" id={optionId} name={name} value={optionValue} required={required && i === 0} checked={isChecked} onChange={handleRadioChange} />
							<div className="radio-circle" />
							<span className="radio-label">{optionLabel}</span>
						</label>
					);
				})}
				{enableOther && (
					<>
						<label className="radio-button">
							<input
								type="radio"
								id={`${name}-other`}
								name={name}
								value={OTHER_VALUE}
								required={required && options.length === 0}
								checked={isOtherRadioSelected}
								onChange={handleRadioChange}
							/>
							<div className="radio-circle" />
							<span className="radio-label">{otherLabel}</span>
						</label>
						{isOtherRadioSelected && (
							<Input
								type="text"
								className="max-w-64"
								placeholder={otherPlaceholder}
								value={otherText}
								onChange={handleOtherTextChange}
								required={required}
							/>
						)}
					</>
				)}
			</div>
		</StyledWrapper>
	);
}
