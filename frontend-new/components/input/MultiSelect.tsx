import { CSSProperties } from "react";

type MultiSelectProps = {
  label: string;
  name: string;
  options: string[];
};

const styles: Record<"fieldset" | "legend" | "option" | "checkbox", CSSProperties> = {
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
  checkbox: {
    marginRight: "0.5rem"
  }
};

export default function MultiSelect({ label, name, options }: MultiSelectProps) {
  return (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{label}</legend>
      {options.map(option => {
        const optionId = `${name}-${option}`;
        return (
          <div key={optionId} style={styles.option}>
            <input
              type="checkbox"
              id={optionId}
              name={name}
              value={option}
              style={styles.checkbox}
            />
            <label htmlFor={optionId}>{option}</label>
          </div>
        );
      })}
    </fieldset>
  );
}
