import { CSSProperties, ChangeEvent } from "react";

type TextareaProps = {
	label: string;
	id: string;
	required?: boolean;
	rows?: number;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
};

const styles: Record<"label" | "textarea", CSSProperties> = {
	label: {
		display: "block",
		marginBottom: "0.5rem"
	},
	textarea: {
		width: "100%",
		padding: "0.4rem 0.8rem",
		border: "1px solid var(--color-gray-700)",
		borderRadius: "0.25rem",
		resize: "vertical",
		fontFamily: "inherit",
		backgroundColor: "transparent",
		color: "#fff"
	}
};

export default function Textarea({ label, id, required = true, rows = 4, value, onChange, placeholder }: TextareaProps) {
	return (
		<div>
			<label htmlFor={id} style={styles.label}>
				{label}
			</label>
			<textarea id={id} name={id} aria-label={label} required={required} rows={rows} value={value} onChange={onChange} placeholder={placeholder} style={styles.textarea} />
		</div>
	);
}
