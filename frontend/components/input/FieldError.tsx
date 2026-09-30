type FieldErrorProps = {
	id: string;
	message?: string;
};

/** Inline validation message shown under a form control; reference it from the control with `aria-describedby`. */
export default function FieldError({ id, message }: FieldErrorProps) {
	if (!message) return null;

	return (
		<p id={id} role="alert" className="text-sm text-destructive">
			{message}
		</p>
	);
}
