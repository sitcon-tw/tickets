import { CSSProperties, ChangeEvent } from "react";

type RadioOption = string | { value: string; label: string };

type RadioProps = {
  label: string;
  name: string;
  options: RadioOption[];
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
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

export default function Radio({ label, name, options, required = true, value, onChange }: RadioProps) {
  return (
    <fieldset style={styles.fieldset}>
      <legend style={styles.legend}>{label}</legend>
      {options.map((option, i) => {
        const optionValue = typeof option === 'object' && option !== null && 'value' in option ? option.value : String(option);
        const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? option.label : String(option);
        const optionId = `${name}-${optionValue}`;
        return (
          <div key={optionId} style={styles.option}>
            <input
              type="radio"
              id={optionId}
              name={name}
              value={optionValue}
              required={required && i === 0}
              checked={value === optionValue}
              onChange={onChange}
              style={styles.radio}
            />
            <label htmlFor={optionId}>{optionLabel}</label>
          </div>
        );
      })}
    </fieldset>
  );
}
