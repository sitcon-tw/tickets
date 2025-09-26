import { CSSProperties } from "react";

type EmailProps = {
  label: string;
  id: string;
  required?: boolean;
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

export default function Email({ label, id, required = true }: EmailProps) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <input type="email" id={id} name={id} aria-label={label} required={required} style={styles.input} />
    </div>
  );
}
