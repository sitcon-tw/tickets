import { CSSProperties } from "react";

type CheckboxProps = {
  label: string;
  id: string;
  question?: string;
  required?: boolean;
};

const styles: Record<"label" | "input" | "question", CSSProperties> = {
  label: {
    marginRight: "1rem"
  },
  input: {
    width: "100%",
    padding: "0.4rem 0.8rem",
    border: "1px solid var(--color-gray-700)",
    borderRadius: "0.25rem"
  },
  question: {
    marginBottom: "1rem"
  }
};

export default function Checkbox({ label, id, question, required = true }: CheckboxProps) {
  return (
    <div>
      {question ? <p style={styles.question}>{question}</p> : null}
      <input type="checkbox" id={id} aria-label={label} required={required} style={styles.input} />
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
    </div>
  );
}
