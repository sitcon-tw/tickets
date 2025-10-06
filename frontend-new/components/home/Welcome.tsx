"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";
import { authAPI, registrationsAPI } from "@/lib/api/endpoints";
import { useRouter } from "@/i18n/navigation";
import ElectricBorder from "../ElectricBorder";
import Spinner from "@/components/Spinner";

type WelcomeState = "hidden" | "registered" | "referral" | "default";

interface WelcomeProps {
  eventId: string;
  eventSlug: string;
}

export default function Welcome({ eventId, eventSlug }: WelcomeProps) {
  const locale = useLocale();
  const router = useRouter();

  const t = getTranslations(locale, {
    description: {
      "zh-Hant": "毛哥EM的網站起始模板，使用Astro和Fastify構建。",
      "zh-Hans": "毛哥EM的网站起始模板，使用Astro和Fastify构建。",
      en: "Elvis Mao's Website starter template using Astro and Fastify."
    },
    loggedInWelcome: {
      "zh-Hant": "歡迎回來！趕緊開始報名吧！",
      "zh-Hans": "欢迎回来！赶紧开始报名吧！",
      en: "Welcome back! Let's get you registered!"
    },
    registeredWelcome: {
      "zh-Hant": "你已完成報名！",
      "zh-Hans": "你已完成报名！",
      en: "Registration Complete!"
    },
    viewRegDetail: {
      "zh-Hant": "查看報名資料",
      "zh-Hans": "查看报名资料",
      en: "View Registration Details"
    },
    referralWelcome: {
      "zh-Hant": "邀請你一起參加 SITCON！",
      "zh-Hans": "邀请你一起参加 SITCON！",
      en: "invites you to join SITCON!"
    },
    selectTicket: {
      "zh-Hant": "請選擇你要的票種",
      "zh-Hans": "请选择你要的票种",
      en: "Please select your ticket type"
    },
    loading: {
      "zh-Hant": "載入中...",
      "zh-Hans": "载入中...",
      en: "Loading..."
    },
    loadFailed: {
      "zh-Hant": "載入失敗",
      "zh-Hans": "载入失败",
      en: "Load failed"
    },
    promotionalText: {
      "zh-Hant": "最後一個註冊的是gay",
      "zh-Hans": "最後一個註冊的是gay",
      en: "The last one who registered is gay!"
    },
    friend: {
      "zh-Hant": "朋友",
      "zh-Hans": "朋友",
      en: "Friend"
    }
  });

  const [welcomeState, setWelcomeState] = useState<WelcomeState>("hidden");
  const [referralParam, setReferralParam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const referral = sessionStorage.getItem("referralCode");

    setReferralParam(referral);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function handleWelcome() {
      try {
        const sessionData = await authAPI.getSession();

        if (!sessionData) {
          decideState(false);
          return;
        }

        try {
          const registrations = await registrationsAPI.getAll();
          if (registrations?.success && Array.isArray(registrations.data) && registrations.data.length > 0) {
            // Check if user has registered for this specific event
            const hasRegisteredForEvent = registrations.data.some(reg => reg.event?.id === eventId);
            if (hasRegisteredForEvent && !cancelled) {
              setWelcomeState("registered");
              return;
            }
          }
        } catch (error) {
          console.error("Failed to load registrations", error);
        }

        decideState(true);
      } catch (error) {
        console.error("Failed to handle welcome section", error);
        decideState(false);
      }
    };

    function decideState(isAuthenticated: boolean) {
      if (cancelled) return;
      if (referralParam) {
        setWelcomeState("referral");
        return;
      }
      setWelcomeState(isAuthenticated ? "default" : "hidden");
    };

    handleWelcome();

    return () => {
      cancelled = true;
    };
  }, [referralParam, eventId, t.loadFailed]);

  return (
    <section>
      {welcomeState === "registered" ? (
        <ElectricBorder
          color="#5A738F"
          chaos={0.7}
          thickness={5}
        >
        <section
          style={{
            padding: '2rem',
            margin: '1rem',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}
          >
            {t.registeredWelcome}
          </h2>
          <div className="items-center justify-center flex">
            <button
              className="button"
              onClick={() => {setLoading(true); router.push(`/${eventSlug}/success`)}}>
              {loading ? <><Spinner size="sm" />{" "}</> : null}
              {t.viewRegDetail}
            </button>
          </div>
        </section>
        </ElectricBorder>
      ) : null}

      {welcomeState === "referral" ? (
        <section
          style={{
            backgroundColor: 'var(--color-gray-800)',
            padding: '2rem',
            margin: '1rem',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <span>{referralParam || t.friend}</span> {t.referralWelcome}
          </h2>
          <p>{t.promotionalText}</p>
        </section>
      ) : null}

      {welcomeState === "default" ? (
        <section
          style={{
            backgroundColor: 'var(--color-gray-800)',
            padding: '2rem',
            margin: '1rem',
            textAlign: 'center',
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}
          >
            {t.loggedInWelcome}
          </h2>
        </section>
      ) : null}

      <h2
        style={{
          fontSize: '1rem',
          marginBlock: '2rem',
          textAlign: 'center',
          fontWeight: 'normal',
          animation: 'blink 1s infinite linear alternate',
          opacity: 0.8
        }}
      >
        {t.selectTicket}
      </h2>
    </section>
  );
}
