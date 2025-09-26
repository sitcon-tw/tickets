import { CSSProperties } from "react";

type RadioProps = {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
};

const styles: Record<"fieldset" | "legend" | "option" | "radio", CSSProperties> = {
  fieldset: {
    border: "none",
    padding: 0,
    margin: 0
  },
  legend: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "bold"
  },
  option: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  radio: {
    marginRight: "0.5rem"
  }
};

export default function Radio({ label, name, options, required = true }: RadioProps) {
  return (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{label}</legend>
      {options.map(option => {
        const optionId = `${name}-${option}`;
        return (
          <div key={optionId} style={styles.option}>
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option}
              required={required}
              style={styles.radio}
            />
            <label htmlFor={optionId}>{option}</label>
          </div>
        );
      })}
    </fieldset>
  );
}
