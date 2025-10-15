"use client";

import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import styled from "styled-components";
import { useAlert } from "@/contexts/AlertContext";
import { useSearchParams } from "next/navigation";

const StyledMain = styled.main`
	section {
		position: relative;
		height: 100vh;
	}
`;

const Container = styled.div<{ isActive: boolean }>`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	max-width: 100%;
	padding: 1rem;
	opacity: ${props => (props.isActive ? 1 : 0)};
	pointer-events: ${props => (props.isActive ? "all" : "none")};
	transition: opacity 0.3s ease-in-out;
`;

const Title = styled.h1`
	margin-block: 1rem;
	text-align: center;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: bold;
`;

const EmailInput = styled.input`
	border: 2px solid var(--color-gray-900);
	width: 20rem;
	padding: 0.5rem;
	max-width: 100%;
	border-radius: 8px;
`;

const SendButton = ({ onClick, disabled, isLoading, children }: { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode }) => {
	return (
		<StyledButton disabled={disabled}>
			<button onClick={onClick} disabled={disabled}>
				<div className="svg-wrapper-1">
					<div className="svg-wrapper">
						{isLoading ? (
							<Spinner size="sm" />
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24}>
								<path fill="none" d="M0 0h24v24H0z" />
								<path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
							</svg>
						)}
					</div>
				</div>
				<span>{children}</span>
			</button>
		</StyledButton>
	);
};

const StyledButton = styled.div<{ disabled: boolean }>`
	button {
		font-family: inherit;
		font-size: 18px;
		background: var(--color-gray-800);
		color: white;
		padding: 0.6em 1em;
		display: flex;
		align-items: center;
		border: var(--color-gray-600) 2px solid;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.2s;
		cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};
		margin: 1rem auto;
		opacity: ${props => (props.disabled ? 0.7 : 1)};

		span {
			display: block;
			margin-left: 0.3em;
			transition: all 0.3s ease-in-out;
		}

		svg {
			display: block;
			transform-origin: center center;
			transition: transform 0.3s ease-in-out;
		}

		&:hover:not(:disabled) {
			.svg-wrapper {
				animation: fly-1 0.8s ease-in-out infinite alternate;
			}

			svg {
				transform: translateX(3.5em) rotate(45deg) scale(1.1);
			}

			span {
				transform: translateX(9em);
			}
		}

		&:active:not(:disabled) {
			transform: scale(0.95);
		}
	}

	@keyframes fly-1 {
		from {
			transform: translateY(0.1em);
		}
		to {
			transform: translateY(-0.1em);
		}
	}
`;

const MessageContainer = styled.div`
	h2 {
		margin-bottom: 1rem;
	}

	p {
		line-height: 1.6;
	}
`;

export default function Login() {
	const locale = useLocale();
	const { showAlert }	= useAlert();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl");
	const [viewState, setViewState] = useState<"login" | "sent">("login");
	const [isLoading, setIsLoading] = useState(false);

	const t = getTranslations(locale, {
		login: {
			"zh-Hant": "登入／註冊",
			"zh-Hans": "登录／注册",
			en: "Login / Register"
		},
		continue: {
			"zh-Hant": "寄送 Magic Link",
			"zh-Hans": "发送 Magic Link",
			en: "Send Magic Link"
		},
		sent: {
			"zh-Hant": "已發送 Magic Link",
			"zh-Hans": "已发送 Magic Link",
			en: "Magic Link Sent"
		},
		message: {
			"zh-Hant": "請檢查您的電子郵件收件匣，並點擊連結以登入。若在垃圾郵件請記得回報為非垃圾郵件，以免錯過後續重要信件。",
			"zh-Hans": "请检查您的电子邮件收件箱，并点击链接以登录。若在垃圾邮件请记得举报为非垃圾邮件，以免错过后续重要信件。",
			en: "Please check your email inbox and click the link to log in. If you find it in the spam folder, please mark it as not spam to avoid missing important future emails."
		},
		error: {
			"zh-Hant": "錯誤",
			"zh-Hans": "错误",
			en: "Error"
		}
	});

	const login = async () => {
		const emailInput = document.getElementById("email") as HTMLInputElement;
		const email = emailInput?.value;
		if (!email || isLoading) return;

		setIsLoading(true);
		try {
			await authAPI.getMagicLink(email, locale, returnUrl || undefined);
			setViewState("sent");
		} catch (error) {
			console.error("Login error:", error);
			showAlert(t.error + ": " + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<StyledMain>
				<section>
					<Container isActive={viewState === "login"}>
						<Title>{t.login}</Title>
						<Label htmlFor="email">Email</Label>
						<EmailInput type="email" name="email" id="email" />
						<SendButton onClick={login} disabled={isLoading} isLoading={isLoading}>
							{t.continue}
						</SendButton>
					</Container>

					<Container isActive={viewState === "sent"}>
						<MessageContainer>
							<h2>{t.sent}</h2>
							<p>{t.message}</p>
						</MessageContainer>
					</Container>
				</section>
			</StyledMain>
		</>
	);
}
