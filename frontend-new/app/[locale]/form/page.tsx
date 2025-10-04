"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import Nav from "@/components/Nav";
import { getTranslations } from "@/i18n/helpers";
import { registrationsAPI, authAPI, ticketsAPI } from '@/lib/api/endpoints';
import { FormField } from '@/components/form/FormField';
import { formStyles } from '@/components/form/formStyles';
import { TicketFormField } from '@/lib/types/api';

type FormDataType = {
  [key: string]: string | boolean | string[];
};

export default function FormPage() {
	const router = useRouter();
	const locale = useLocale();
	const [submitHover, setSubmitHover] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formFields, setFormFields] = useState<TicketFormField[]>([]);
	const [formData, setFormData] = useState<FormDataType>({});
	const [ticketId, setTicketId] = useState<string | null>(null);
	const [eventId, setEventId] = useState<string | null>(null);
	const [invitationCode, setInvitationCode] = useState<string | null>(null);
	const [referralCode, setReferralCode] = useState<string | null>(null);
	const [userEmail, setUserEmail] = useState<string>('');

	const t = getTranslations(locale, {
		noTicketAlert: {
			"zh-Hant": "未指定票種，請重新選擇",
			"zh-Hans": "未指定票种，请重新选择",
			en: "No ticket specified, please select again"
		},
		incompleteFormAlert: {
			"zh-Hant": "表單資料不完整，請重新選擇票種",
			"zh-Hans": "表单资料不完整，请重新选择票种",
			en: "Form data incomplete, please select ticket again"
		},
		registrationFailedAlert: {
			"zh-Hant": "報名失敗: ",
			"zh-Hans": "报名失败: ",
			en: "Registration failed: "
		},
		pleaseSelect: {
			"zh-Hant": "請選擇...",
			"zh-Hans": "请选择...",
			en: "Please select..."
		},
		reselectTicket: {
			"zh-Hant": "重新選擇票種",
			"zh-Hans": "重新选择票种",
			en: "Reselect Ticket"
		},
		fillForm: {
			"zh-Hant": "填寫報名資訊",
			"zh-Hans": "填写报名资讯",
			en: "Fill Registration Form"
		},
		loadingForm: {
			"zh-Hant": "載入表單中...",
			"zh-Hans": "载入表单中...",
			en: "Loading form..."
		},
		loadFormFailed: {
			"zh-Hant": "載入表單失敗: ",
			"zh-Hans": "载入表单失败: ",
			en: "Failed to load form: "
		},
		backToHome: {
			"zh-Hant": "返回首頁",
			"zh-Hans": "返回首页",
			en: "Back to Home"
		},
		name: {
			"zh-Hant": "姓名",
			"zh-Hans": "姓名",
			en: "Name"
		},
		invitationCode: {
			"zh-Hant": "邀請碼",
			"zh-Hans": "邀请码",
			en: "Invitation Code"
		},
		referralCode: {
			"zh-Hant": "推薦碼",
			"zh-Hans": "推荐码",
			en: "Referral Code"
		},
		submitRegistration: {
			"zh-Hant": "提交報名",
			"zh-Hans": "提交报名",
			en: "Submit Registration"
		}
	});

	// Form data handlers
	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === 'true') {
			// Single checkbox
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			// Multiple checkbox options
			setFormData(prev => {
				const currentValues = Array.isArray(prev[name]) ? prev[name] as string[] : [];
				if (checked) {
					return { ...prev, [name]: [...currentValues, value] };
				} else {
					return { ...prev, [name]: currentValues.filter(v => v !== value) };
				}
			});
		}
	}, []);

	// Initialize form
	useEffect(() => {
		async function initForm() {
			try {
				// Check auth
				const session = await authAPI.getSession();
				if (!session || !session.user) {
					router.push('/login/');
					return;
				}

				const email = session.user.email || '';
				setUserEmail(email);

				// Load form data from localStorage
				const storedData = localStorage.getItem('formData');
				if (!storedData) {
					alert(t.noTicketAlert);
					router.push('/');
					return;
				}

				const parsedData = JSON.parse(storedData);
				setTicketId(parsedData.ticketId);
				setEventId(parsedData.eventId);
				setInvitationCode(parsedData.invitationCode || null);
				setReferralCode(parsedData.referralCode || null);

				// Load form fields from ticket API
				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error('Failed to load form fields');
				}

				setFormFields(formFieldsData.data || []);
				setLoading(false);
			} catch (error) {
				console.error('Failed to initialize form:', error);
				setError(error instanceof Error ? error.message : 'Unknown error');
				setLoading(false);
			}
		}

		initForm();
	}, [router, t.noTicketAlert]);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!ticketId || !eventId) {
			alert(t.incompleteFormAlert);
			router.push('/');
			return;
		}

		try {
			const registrationData = {
				eventId,
				ticketId,
				formData: {
					...formData,
				},
				invitationCode: invitationCode || undefined,
				referralCode: referralCode || undefined
			};

			const result = await registrationsAPI.create(registrationData);

			if (result.success) {
				// Clear stored data
				localStorage.removeItem('formData');
				// Redirect to success page
				router.push('/success');
			} else {
				throw new Error('Registration failed');
			}
		} catch (error) {
			console.error('Registration error:', error);
			alert(t.registrationFailedAlert + (error instanceof Error ? error.message : 'Unknown error'));
		}
	};

	return (
		<>
			<Nav />
			<main>
				<section style={{
					marginTop: '8rem',
					maxWidth: '800px',
					marginLeft: 'auto',
					marginRight: 'auto',
					padding: '0 1rem'
				}}>
					<p><a href="/">{t.reselectTicket}</a></p>
					<h1 style={{
						marginBlock: '1rem',
						fontSize: '2.5rem'
					}}>{t.fillForm}</h1>

					{loading && (
						<div style={{ textAlign: 'center', padding: '2rem' }}>{t.loadingForm}</div>
					)}

					{error && (
						<div style={{ textAlign: 'center', padding: '2rem' }}>
							<p style={{ color: 'red' }}>{t.loadFormFailed}{error}</p>
							<a href="/">{t.backToHome}</a>
						</div>
					)}

					{!loading && !error && (
						<form onSubmit={handleSubmit} style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '1.5rem'
						}}>
							{/* Dynamic form fields from API */}
							{formFields.map((field, index) => (
								<FormField
									key={index}
									field={field}
									value={formData[field.name] || ''}
									onTextChange={handleTextChange}
									onCheckboxChange={handleCheckboxChange}
									pleaseSelectText={t.pleaseSelect}
								/>
							))}

							{/* Invitation and referral code fields */}
							{invitationCode && (
								<div style={formStyles.formGroup}>
									<label style={formStyles.label}>{t.invitationCode}</label>
									<input
										type="text"
										name="invitationCode"
										value={invitationCode}
										readOnly
										style={formStyles.input}
									/>
								</div>
							)}

							{referralCode && (
								<div style={formStyles.formGroup}>
									<label style={formStyles.label}>{t.referralCode}</label>
									<input
										type="text"
										name="referralCode"
										value={referralCode}
										readOnly
										style={formStyles.input}
									/>
								</div>
							)}

							<button
								type="submit"
								className="button"
								onMouseEnter={() => setSubmitHover(true)}
								onMouseLeave={() => setSubmitHover(false)}
								style={{
									padding: '1rem 2rem',
									backgroundColor: submitHover ? '#005999' : '#007acc',
									color: 'white',
									border: 'none',
									borderRadius: '0.25rem',
									fontSize: '1.1rem',
									fontWeight: 'bold',
									cursor: 'pointer',
									marginTop: '2rem',
									alignSelf: 'center'
								}}
							>{t.submitRegistration}</button>
						</form>
					)}
				</section>
			</main>
		</>
	);
}
