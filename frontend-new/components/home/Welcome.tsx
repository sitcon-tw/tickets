"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import * as i18n from "@/i18n";

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide-copy"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

type WelcomeState = "hidden" | "registered" | "referral" | "invitation" | "default";

export default function Welcome() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const lang = i18n.local(currentPath);

  const t = useMemo(
    () =>
      i18n.t(lang, {
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
        inviteTicket: {
          "zh-Hant": "你收到了一張講者邀請票！",
          "zh-Hans": "你收到了一张讲者邀请票！",
          en: "You received a speaker invitation!"
        },
        registerNow: {
          "zh-Hant": "立即報名",
          "zh-Hans": "立即报名",
          en: "Register Now"
        },
        selectTicket: {
          "zh-Hant": "請選擇你要的票種",
          "zh-Hans": "请选择你要的票种",
          en: "Please select your ticket type"
        }
      }),
    [lang]
  );

  const [welcomeState, setWelcomeState] = useState<WelcomeState>("hidden");
  const [referralCode, setReferralCode] = useState("載入中...");
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [referralParam, setReferralParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const referral = urlParams.get("ref");
    const invitation = urlParams.get("invite");

    if (referral) {
      sessionStorage.setItem("referralCode", referral);
    }

    if (invitation) {
      sessionStorage.setItem("invitationCode", invitation);
    }

    setReferralParam(referral);
    setInvitationCode(invitation);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleWelcome = async () => {
      try {
        const sessionResponse = await fetch("http://localhost:3000/api/auth/get-session", {
          credentials: "include"
        });

        if (!sessionResponse.ok) {
          decideState(false);
          return;
        }

        const sessionData = await sessionResponse.json();

        if (!sessionData || !sessionData.user) {
          decideState(false);
          return;
        }

        // User authenticated
        const registrationsResponse = await fetch("http://localhost:3000/api/registrations", {
          credentials: "include"
        });

        if (registrationsResponse.ok) {
          const registrations = await registrationsResponse.json();
          if (registrations?.success && Array.isArray(registrations.data) && registrations.data.length > 0) {
            if (!cancelled) {
              setWelcomeState("registered");
              await loadReferralCode();
            }
            return;
          }
        }

        decideState(true);
      } catch (error) {
        console.error("Failed to handle welcome section", error);
        decideState(false);
      }
    };

    const loadReferralCode = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/referrals", {
          credentials: "include"
        });

        if (!response.ok) {
          if (!cancelled) setReferralCode("載入失敗");
          return;
        }

        const referral = await response.json();
        if (cancelled) return;

        if (referral?.success && referral.data?.code) {
          setReferralCode(referral.data.code);
        } else {
          setReferralCode("載入失敗");
        }
      } catch (error) {
        console.error("Failed to load referral code", error);
        if (!cancelled) setReferralCode("載入失敗");
      }
    };

    const decideState = (isAuthenticated: boolean) => {
      if (cancelled) return;
      if (invitationCode) {
        setWelcomeState("invitation");
        return;
      }
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
  }, [invitationCode, referralParam]);

  const handleCopy = async () => {
    if (typeof window === "undefined") return;
    if (!referralCode || referralCode === "載入中..." || referralCode === "載入失敗") return;
    try {
      await navigator.clipboard.writeText(referralCode);
      alert("推薦碼已複製到剪貼簿！");
    } catch (error) {
      console.error("Failed to copy referral code", error);
    }
  };

  const handleInvitationRegister = () => {
    if (typeof window === "undefined" || !invitationCode) return;
    const params = new URLSearchParams();
    params.set("invite", invitationCode);
    window.location.href = `/form/?${params.toString()}`;
  };

  return (
    <section>
      {welcomeState === "registered" ? (
        <section className="welcome-section">
          <h2>{t.registeredWelcome}</h2>
          <p>{t.inviteCode}</p>
          <button type="button" className="code" onClick={handleCopy}>
            <span id="referral-code">{referralCode}</span>
            <CopyIcon />
          </button>
        </section>
      ) : null}

      {welcomeState === "referral" ? (
        <section className="welcome-section">
          <h2>
            <span id="referrer-name">{referralParam || "朋友"}</span> {t.referralWelcome}
          </h2>
          <p>累積三人一起報名即可獲得一張柴柴簽名照。</p>
        </section>
      ) : null}

      {welcomeState === "invitation" ? (
        <section className="welcome-section">
          <h2>{t.inviteTicket}</h2>
          <button type="button" className="button" onClick={handleInvitationRegister}>
            {t.registerNow}
          </button>
        </section>
      ) : null}

      {welcomeState === "default" ? (
        <section className="welcome-section">
          <h2>{t.loggedInWelcome}</h2>
        </section>
      ) : null}

      <h2 id="select">{t.selectTicket}</h2>

      <style jsx>{`
        .welcome-section {
          background-color: var(--color-gray-800);
          padding: 2rem;
          margin: 1rem;
          text-align: center;
        }

        .code {
          background-color: var(--color-gray-700);
          padding: 0.5rem;
          max-width: 10rem;
          margin: 1rem auto 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
          color: inherit;
        }

        .code:hover {
          background-color: var(--color-gray-600);
        }

        #referral-code {
          text-align: center;
          flex: 1;
          font-weight: bold;
        }

        .lucide-copy {
          opacity: 0.7;
        }

        .welcome-section h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        #select {
          font-size: 1rem;
          margin-block: 2rem;
          text-align: center;
          font-weight: normal;
          animation: blink 1s infinite linear alternate;
          opacity: 0.8;
        }

        @keyframes blink {
          to {
            opacity: 0.1;
          }
        }

        .button {
          margin: 1rem auto 0;
          display: inline-block;
        }
      `}</style>
    </section>
  );
}
