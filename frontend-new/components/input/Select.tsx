import { CSSProperties } from "react";

type SelectProps = {
  label: string;
  id: string;
  options: string[];
  required?: boolean;
};

const styles: Record<"label" | "select", CSSProperties> = {
  label: {
    display: "block",
    marginBottom: "0.5rem"
  },
  select: {
    width: "100%",
    padding: "0.4rem 0.8rem",
    border: "1px solid var(--color-gray-700)",
    borderRadius: "0.25rem",
    backgroundColor: "white",
    maxWidth: "15rem"
  }
};

export default function Select({ label, id, options, required = true }: SelectProps) {
  return (
    <div>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <select id={id} name={id} aria-label={label} required={required} style={styles.select}>
        <option value="">請選擇...</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
