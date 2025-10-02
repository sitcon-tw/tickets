"use client"

import { useLocale } from 'next-intl';
import { getTranslations } from '@/i18n/helpers';

export default function Header() {
  const locale = useLocale();

  const t = getTranslations(locale, {
    description: {
      "zh-Hant": "報名系統",
      "zh-Hans": "报名系统",
      en: "Registration System"
    },
    signFront: {
      "zh-Hant": "已有 ",
      "zh-Hans": "已有 ",
      en: ""
    },
    signBack: {
      "zh-Hant": " 人報名",
      "zh-Hans": " 人报名",
      en: " people registered"
    }
  });

  return (
    <section style={{
			paddingTop: '5rem',
			textAlign: 'center'
		}}>
      <h1 style={{
				fontSize: '2.5rem',
				marginBottom: '1rem'
			}}>
        SITCON 2026 <span style={{
					display: 'block',
					fontSize: '0.8em'
				}}>{t.description}</span>
      </h1>
      <p style={{
				fontSize: '1.2rem'
			}}>
        {t.signFront}
        <span style={{
					fontWeight: 'bold',
					fontSize: '1.5em'
				}}>20</span>
        {t.signBack}
      </p>
    </section>
  );
}