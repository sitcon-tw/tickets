import { ChangeEvent } from "react";
import styled from "styled-components";

type CheckboxProps = {
	label: string;
	id: string;
	question?: string;
	required?: boolean;
	value?: string | boolean;
	checked?: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const StyledLabel = styled.label`
	display: flex;
	align-items: center;
	cursor: pointer;
	user-select: none;

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
		stroke: var(--color-gray-100);
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition:
			stroke-dasharray 0.5s ease,
			stroke-dashoffset 0.5s ease;
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

export default function Checkbox({ label, id, question, required = true, value, checked, onChange }: CheckboxProps) {
	return (
		<div>
			{question ? <p style={{ marginBottom: "1rem" }}>{question}</p> : null}
			<StyledLabel htmlFor={id}>
				<input type="checkbox" id={id} name={id} aria-label={label} required={required} value={typeof value === "string" ? value : "true"} checked={checked} onChange={onChange} />
				<svg viewBox="0 0 64 64" height="1.5em" width="1.5em">
					<path
						d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
						pathLength="575.0541381835938"
						className="path"
					/>
				</svg>
				{label}
			</StyledLabel>
		</div>
	);
}
