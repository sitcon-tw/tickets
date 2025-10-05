"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { getTranslations } from "@/i18n/helpers";
import { authAPI, registrationsAPI, referralsAPI } from "@/lib/api/endpoints";
import { Copy, Check } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import Spinner from "@/components/Spinner";

type WelcomeState = "hidden" | "registered" | "referral" | "default";

export default function Welcome() {
  const locale = useLocale();
  const router = useRouter();

  const t = getTranslations(locale, {
    description: {
      "zh-Hant": "毛哥EM的網站起始模板，使用Astro和Fastify構建。",
      "zh-Hans": "毛哥EM的网站起始模板，使用Astro和Fastify构建。",
      en: "Elvis Mao's Website starter template using Astro and Fastify."
    },
    loggedInWelcome: {
      "zh-Hant": "歡迎回來！",
      "zh-Hans": "欢迎回来！",
      en: "Welcome back!"
    },
    registeredWelcome: {
      "zh-Hant": "你已完成報名！",
      "zh-Hans": "你已完成报名！",
      en: "Registration Complete!"
    },
    inviteCode: {
      "zh-Hant": "歡迎使用以下優惠碼邀請朋友一起參加：",
      "zh-Hans": "欢迎使用以下优惠码邀请朋友一起参加：",
      en: "Use this code to invite friends:"
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
  const [referralCode, setReferralCode] = useState(t.loading);
  const [referralParam, setReferralParam] = useState<string | null>(null);
  const [codeHovered, setCodeHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
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
            if (!cancelled) {
              setWelcomeState("registered");
              await loadReferralCode(registrations.data[0].id);
            }
            return;
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

    async function loadReferralCode(regId: string) {
      try {
        const refCode = await referralsAPI.getReferralLink(regId);
        if (!cancelled) setReferralCode(refCode.data.referralCode);
      } catch (error) {
        console.error("Failed to load referral code", error);
        if (!cancelled) setReferralCode(t.loadFailed);
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
  }, [referralParam, t.loadFailed]);

  async function handleCopy() {
    if (typeof window === "undefined") return;
    if (!referralCode || referralCode === t.loading || referralCode === t.loadFailed) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy referral code", error);
    }
  };

  useEffect(() => {
    // Inject keyframes animation into document
    const styleId = 'welcome-blink-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes blink {
          to {
            opacity: 0.1;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <section>
      {welcomeState === "registered" ? (
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
            {t.registeredWelcome}
          </h2>
          <p>{t.inviteCode}</p>
          <button
            type="button"
            onClick={handleCopy}
            onMouseEnter={() => setCodeHovered(true)}
            onMouseLeave={() => setCodeHovered(false)}
            disabled={referralCode === t.loading || referralCode === t.loadFailed}
            style={{
              backgroundColor: codeHovered ? 'var(--color-gray-600)' : 'var(--color-gray-700)',
              padding: '0.5rem',
              maxWidth: '10rem',
              margin: '1rem auto 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: (referralCode === t.loading || referralCode === t.loadFailed) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s, opacity 0.2s',
              border: 'none',
              color: 'inherit',
              opacity: (referralCode === t.loading || referralCode === t.loadFailed) ? 0.7 : 1
            }}
          >
            <span
              style={{
                textAlign: 'center',
                flex: 1,
                fontWeight: 'bold',
                marginRight: '0.5rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {referralCode === t.loading ? (
                <>
                  <Spinner size="sm" />
                  {referralCode}
                </>
              ) : referralCode}
            </span>
            <span>
              {copied ? <Check className="text-green-400" /> : <Copy />}
            </span>
          </button>
        </section>
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
