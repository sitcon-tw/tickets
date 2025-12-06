import styled from "styled-components";

export type CheckboxOption = string | { value: string; label: string };

type MultiCheckboxProps = {
	label: string;
	name: string;
	options: CheckboxOption[];
	values?: string[];
	onValueChange?: (values: string[]) => void;
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

	.checkbox-items {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
`;

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
	pointer-events: none;
`;

const StyledLabel = styled.label`
	display: flex;
	align-items: center;
	cursor: pointer;
	user-select: none;
	color: rgb(17 24 39);

	:is(.dark, .dark *) & {
		color: rgb(243 244 246);
	}

	svg {
		overflow: visible;
		margin-right: 0.5rem;
		flex-shrink: 0;
		width: 1.25em;
		height: 1.25em;
	}

	.path {
		fill: none;
		stroke: rgb(156 163 175);
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition:
			stroke-dasharray 0.5s ease,
			stroke-dashoffset 0.5s ease;
		stroke-dasharray: 241 9999999;
		stroke-dashoffset: 0;
	}

	:is(.dark, .dark *) & .path {
		stroke: rgb(156 163 175);
	}

	${HiddenCheckbox}:checked ~ svg .path {
		stroke-dasharray: 70.5096664428711 9999999;
		stroke-dashoffset: -262.2723388671875;
		stroke: rgb(55 65 81);
	}

	&:hover .path {
		stroke: rgb(107 114 128);
	}

	:is(.dark, .dark *) &:hover .path {
		stroke: rgb(209 213 219);
	}

	:is(.dark, .dark *) & ${HiddenCheckbox}:checked ~ svg .path {
		stroke: rgb(229 231 235);
	}
`;

export default function MultiCheckbox({ label, name, options, values = [], onValueChange }: MultiCheckboxProps) {
	const handleCheckedChange = (optionValue: string, checked: boolean) => {
		if (!onValueChange) return;

		if (checked) {
			onValueChange([...values, optionValue]);
		} else {
			onValueChange(values.filter(v => v !== optionValue));
		}
	};

	return (
		<StyledWrapper>
			<legend className="legend">{label}</legend>
			<div className="checkbox-items">
				{options.map(option => {
					const optionValue = typeof option === "object" && option !== null && "value" in option ? option.value : String(option);
					const optionLabel = typeof option === "object" && option !== null && "label" in option ? option.label : String(option);
					const optionId = `${name}-${optionValue}`;
					const isChecked = values.includes(optionValue);

					return (
						<StyledLabel key={optionId} htmlFor={optionId}>
							<HiddenCheckbox id={optionId} name={name} checked={isChecked} onChange={e => handleCheckedChange(optionValue, e.target.checked)} />
							<svg viewBox="0 0 64 64">
								<path
									d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
									pathLength="575.0541381835938"
									className="path"
								/>
							</svg>
							{optionLabel}
						</StyledLabel>
					);
				})}
			</div>
		</StyledWrapper>
	);
}
