import MarkdownContent from "@/components/MarkdownContent";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { styled } from "styled-components";
import { Input } from "../ui/input";
import FieldError from "./FieldError";

export type RadioOption = string | { value: string; label: string };

type RadioProps = {
	label: string;
	name: string;
	options: RadioOption[];
	required?: boolean;
	value?: string;
	onValueChange?: (value: string) => void;
	enableOther?: boolean;
	otherPlaceholder?: string;
	description?: string;
	error?: string;
	disabled?: boolean;
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
		position: relative;
		display: flex;
		align-items: center;
		min-height: 2rem;
		padding: 0.125rem 0;
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

	.radio-button input[type="radio"]:focus-visible + .radio-circle {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}

	.radio-label {
		font-size: 16px;
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
		margin-bottom: 8px;
	}
`;

const OTHER_VALUE = "__other__";

export default function Radio({ label, name, options, required = true, value = "", onValueChange, enableOther = false, otherPlaceholder = "", description, error, disabled }: RadioProps) {
	const locale = useLocale();
	const errorId = `${name}-error`;
	const otherInputRef = useRef<HTMLInputElement>(null);

	const t = getTranslations(locale, {
		other: {
			"zh-Hant": "其他",
			"zh-Hans": "其他",
			en: "Other"
		}
	});

	const optionValues = options.map(opt => (typeof opt === "object" && opt !== null && "value" in opt ? opt.value : opt));
	const valueIsPredefined = value !== "" && optionValues.includes(value);

	// "Other" must stay selected while its text is still empty, so the selection cannot be derived from the value alone.
	const [otherActive, setOtherActive] = useState(false);
	const [lastOtherText, setLastOtherText] = useState(!valueIsPredefined ? value : "");
	const otherSelected = enableOther && (otherActive || (value !== "" && !valueIsPredefined));
	const otherText = otherSelected ? value : lastOtherText;

	useEffect(() => {
		if (otherActive) otherInputRef.current?.focus();
	}, [otherActive]);

	const selectOption = (optionValue: string) => {
		setOtherActive(false);
		onValueChange?.(optionValue);
	};

	const selectOther = () => {
		setOtherActive(true);
		onValueChange?.(lastOtherText);
	};

	const changeOtherText = (e: ChangeEvent<HTMLInputElement>) => {
		setLastOtherText(e.target.value);
		onValueChange?.(e.target.value);
	};

	return (
		<StyledWrapper disabled={disabled} aria-describedby={error ? errorId : undefined}>
			<legend className="legend">{label}</legend>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
			<div className="radio-buttons" role="radiogroup" aria-required={required || undefined} aria-invalid={error ? true : undefined}>
				{options.map((option, i) => {
					const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : option;
					const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : option;
					const optionId = `${name}-${optionValue}`;
					const isChecked = !otherSelected && value === optionValue;

					return (
						<label key={optionId} className="radio-button">
							<input type="radio" id={optionId} name={name} value={optionValue} required={required && i === 0} checked={isChecked} onChange={() => selectOption(optionValue)} />
							<div className="radio-circle" />
							<span className="radio-label">{optionLabel}</span>
						</label>
					);
				})}
				{enableOther && (
					<>
						<label className="radio-button">
							<input type="radio" id={`${name}-other`} name={name} value={OTHER_VALUE} required={required && options.length === 0} checked={otherSelected} onChange={selectOther} />
							<div className="radio-circle" />
							<span className="radio-label">{t.other}</span>
						</label>
						{otherSelected && (
							<div className="other-input-wrapper">
								<Input
									ref={otherInputRef}
									type="text"
									aria-label={`${label} (${t.other})`}
									placeholder={otherPlaceholder}
									value={otherText}
									onChange={changeOtherText}
									required={required}
									aria-invalid={error ? true : undefined}
									disabled={disabled}
								/>
							</div>
						)}
					</>
				)}
			</div>
			<FieldError id={errorId} message={error} />
		</StyledWrapper>
	);
}
