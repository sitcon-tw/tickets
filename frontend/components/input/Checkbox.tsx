import { ChangeEvent, forwardRef } from "react";
import styled from "styled-components";
import MarkdownContent from "@/components/MarkdownContent";

type CheckboxProps = {
	label?: string;
	id: string;
	question?: string;
	required?: boolean;
	value?: string | boolean;
	checked?: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	inputRef?: React.Ref<HTMLInputElement>;
	description?: string;
};

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

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, id, question, required = false, value, checked, onChange, inputRef, description }, ref) => {
	return (
		<div>
			{question ? <p style={{ marginBottom: "1rem", color: "inherit" }}>{question}</p> : null}
			<StyledLabel htmlFor={id}>
				<HiddenCheckbox id={id} name={id} aria-label={label} required={required} value={typeof value === "string" ? value : "true"} checked={checked} onChange={onChange} ref={inputRef || ref} />
				<svg viewBox="0 0 64 64">
					<path
						d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
						pathLength="575.0541381835938"
						className="path"
					/>
				</svg>
				{label}
			</StyledLabel>
			{description && (
				<div className="text-sm text-gray-600 dark:text-gray-400 ml-7 mt-1">
					<MarkdownContent content={description} className="text-sm" />
				</div>
			)}
		</div>
	);
});
Checkbox.displayName = "Checkbox";

export default Checkbox;
