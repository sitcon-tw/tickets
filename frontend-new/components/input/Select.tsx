import { CSSProperties, ChangeEvent } from "react";
import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";

export type SelectOption = string | { value: string; label: string };

type SelectProps = {
  label: string;
  id: string;
  options: SelectOption[];
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  pleaseSelectText?: string;
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

export default function Select({ label, id, options, required = true, value, onChange, pleaseSelectText }: SelectProps) {
  const locale = useLocale();

  const t = getTranslations(locale, {
    pleaseSelect: {
      "zh-Hant": "請選擇...",
      "zh-Hans": "请选择...",
      en: "Please select..."
    }
  });

  const placeholder = pleaseSelectText || t.pleaseSelect;

  return (
    <div>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        aria-label={label}
        required={required}
        value={value}
        onChange={onChange}
        style={styles.select}
      >
        <option value="">{placeholder}</option>
        {options.map((option, i) => {
          const optionValue = typeof option === 'object' && option !== null && 'value' in option ? option.value : String(option);
          const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? option.label : String(option);
          return (
            <option key={i} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
