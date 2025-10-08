import { CSSProperties } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";
import DecryptedText from './DecryptedText';

interface PageSpinnerProps {
  size?: number;
  style?: CSSProperties;
}

export default function PageSpinner({ size = 48, style }: PageSpinnerProps) {
  const locale = useLocale();
  const t = getTranslations(locale, {
    loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Now Loading..." }
  });

  return (
    <>
      <div
        style={{
          display: "inline-block",
          width: size,
          height: size,
          animation: "spin 0.8s linear infinite",
          ...style
        }}
        role="status"
        aria-label="Loading"
      >
        <Image
          src="/assets/small-stone.png"
          alt="Loading"
          width={size}
          height={size}
          style={{
            display: 'block'
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
      <DecryptedText text={t.loading} animateOn="view" />
    </>
  );
}
