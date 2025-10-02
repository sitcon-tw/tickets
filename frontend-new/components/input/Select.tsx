import { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import * as i18n from "@/lib/i18n";

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
  const pathname = usePathname();
  const lang = i18n.local(pathname ?? "/");

  const t = i18n.t(lang, {
    pleaseSelect: {
      "zh-Hant": "請選擇...",
      "zh-Hans": "请选择...",
      en: "Please select..."
    }
  });

  return (
    <div>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <select id={id} name={id} aria-label={label} required={required} style={styles.select}>
        <option value="">{t.pleaseSelect}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
