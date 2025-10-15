import { CSSProperties, ChangeEvent } from "react";

type TextProps = {
	label: string;
	id: string;
	required?: boolean;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	readOnly?: boolean;
};

const styles: Record<"label" | "input", CSSProperties> = {
	label: {
		display: "block"
	},
	input: {
		width: "100%",
		padding: "0.4rem 0.8rem",
		border: "1px solid var(--color-gray-700)",
		borderRadius: "0.25rem",
		maxWidth: "15rem"
	}
};

export default function Text({ label, id, required = true, value, onChange, placeholder, readOnly }: TextProps) {
	return (
		<div>
			<label htmlFor={id} style={styles.label}>
				{label}
			</label>
			<input type="text" id={id} name={id} aria-label={label} required={required} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} style={styles.input} />
		</div>
	);
}
