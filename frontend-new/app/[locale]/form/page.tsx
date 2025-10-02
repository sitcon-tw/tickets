"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import Nav from "@/components/Nav";
import { getTranslations } from "@/i18n/helpers";
import { authAPI, eventsAPI, registrationsAPI } from '@/lib/api/endpoints';

type FormFieldOption = {
	value: string;
	label: string;
} | string;

type FormField = {
	name: string;
	type: 'text' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox';
	description: string;
	placeholder?: string;
	required?: boolean;
	options?: FormFieldOption[];
	helpText?: string;
};

type FormData = {
	[key: string]: string | boolean | string[];
};

export default function FormPage() {
	const router = useRouter();
	const locale = useLocale();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formFields, setFormFields] = useState<FormField[]>([]);
	const [formData, setFormData] = useState<FormData>({});
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [eventId, setEventId] = useState<string | null>(null);
	const [invitationCode, setInvitationCode] = useState<string | null>(null);
	const [referralCode, setReferralCode] = useState<string | null>(null);
	const [eventName, setEventName] = useState<string>('');
	const [ticketName, setTicketName] = useState<string>('');
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
		event: {
			"zh-Hant": "活動：",
			"zh-Hans": "活动：",
			en: "Event:"
		},
		ticketType: {
			"zh-Hant": "票種：",
			"zh-Hans": "票种：",
			en: "Ticket Type:"
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

	// Parse URL parameters
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const urlParams = new URLSearchParams(window.location.search);
		const ticketIdParam = urlParams.get('ticket') || sessionStorage.getItem('selectedTicketId');
		const inviteParam = urlParams.get('invite') || sessionStorage.getItem('invitationCode');
		const refParam = urlParams.get('ref') || sessionStorage.getItem('referralCode');
		const eventNameParam = sessionStorage.getItem('selectedEventName') || urlParams.get('eventName');
		const ticketNameParam = sessionStorage.getItem('selectedTicketName') || urlParams.get('ticketType');

		setSelectedTicketId(ticketIdParam);
		setInvitationCode(inviteParam);
		setReferralCode(refParam);

		if (eventNameParam) setEventName(eventNameParam);
		if (ticketNameParam) setTicketName(ticketNameParam);
	}, []);

	// Check authentication
	const checkAuth = useCallback(async () => {
		try {
			const session = await authAPI.getSession();
			if (!session || !session.user) {
				router.push('/login/');
				return false;
			}

			if (session.user.email) {
				setUserEmail(session.user.email);
				setFormData(prev => ({ ...prev, email: session.user.email }));
			}

			return true;
		} catch (error) {
			console.error('Auth check failed:', error);
			router.push('/login/');
			return false;
		}
	}, [router]);

	// Load form fields
	const loadFormFields = useCallback(async () => {
		if (!selectedTicketId) {
			alert(t.noTicketAlert);
			router.push('/');
			return;
		}

		try {
			// First get events to find the event ID
			const eventsData = await eventsAPI.getAll();

			if (!eventsData.success || !eventsData.data.length) {
				throw new Error('No active events found');
			}

			const fetchedEventId = eventsData.data[0].id;
			setEventId(fetchedEventId);

			// Get ticket information including form fields
			const ticketsData = await eventsAPI.getTickets(fetchedEventId);

			if (!ticketsData.success) {
				throw new Error('Failed to load tickets');
			}

			// Find the specific ticket
			const ticket = ticketsData.data.find((t: any) => t.id === selectedTicketId);
			if (!ticket) {
				throw new Error('Selected ticket not found');
			}

			setFormFields(ticket.formFields || []);
			setLoading(false);
		} catch (error) {
			console.error('Failed to load form fields:', error);
			setError(error instanceof Error ? error.message : 'Unknown error');
			setLoading(false);
		}
	}, [selectedTicketId, router, t.noTicketAlert]);

	// Initialize page
	useEffect(() => {
		const init = async () => {
			const isAuthenticated = await checkAuth();
			if (!isAuthenticated) return;

			await loadFormFields();
		};

		init();
	}, [checkAuth, loadFormFields]);

	// Handle input change
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	// Handle checkbox change
	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === 'true') {
			// Single checkbox (like acceptTerms)
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
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!selectedTicketId || !eventId) {
			alert(t.incompleteFormAlert);
			router.push('/');
			return;
		}

		try {
			const registrationData = {
				eventId,
				ticketId: selectedTicketId,
				formData,
				invitationCode: invitationCode || undefined,
				referralCode: referralCode || undefined
			};

			const result = await registrationsAPI.create(registrationData);

			if (result.success) {
				// Clear stored data
				sessionStorage.removeItem('selectedTicketId');
				sessionStorage.removeItem('referralCode');
				sessionStorage.removeItem('invitationCode');
				sessionStorage.removeItem('selectedEventName');
				sessionStorage.removeItem('selectedTicketName');
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

	// Render individual form field
	const renderFormField = (field: FormField, index: number) => {
		const required = field.required;
		const requiredMark = field.required ? ' *' : '';

		const formGroupStyle: React.CSSProperties = {
			display: 'flex',
			flexDirection: 'column',
			gap: '0.5rem'
		};

		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			display: 'block'
		};

		const inputStyle: React.CSSProperties = {
			padding: '0.75rem',
			border: '2px solid #333',
			borderRadius: '0.25rem',
			fontSize: '1rem',
			backgroundColor: '#222',
			color: '#fff'
		};

		const fieldsetStyle: React.CSSProperties = {
			border: '1px solid #333',
			borderRadius: '0.25rem',
			padding: '1rem',
			backgroundColor: '#111'
		};

		const legendStyle: React.CSSProperties = {
			fontWeight: 'bold',
			padding: '0 0.5rem'
		};

		const optionStyle: React.CSSProperties = {
			display: 'flex',
			alignItems: 'center',
			gap: '0.5rem',
			margin: '0.5rem 0',
			fontWeight: 'normal'
		};

		const optionInputStyle: React.CSSProperties = {
			width: 'auto',
			margin: 0
		};

		switch (field.type) {
			case 'text':
				return (
					<div style={formGroupStyle} key={index}>
						<label htmlFor={field.name} style={labelStyle}>{field.description}{requiredMark}</label>
						<input
							type="text"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
							style={inputStyle}
						/>
					</div>
				);

			case 'email':
				return (
					<div style={formGroupStyle} key={index}>
						<label htmlFor={field.name} style={labelStyle}>{field.description}{requiredMark}</label>
						<input
							type="email"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
							style={inputStyle}
						/>
					</div>
				);

			case 'textarea':
				return (
					<div style={formGroupStyle} key={index}>
						<label htmlFor={field.name} style={labelStyle}>{field.description}{requiredMark}</label>
						<textarea
							id={field.name}
							name={field.name}
							rows={3}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
							style={inputStyle}
						/>
					</div>
				);

			case 'select':
				return (
					<div style={formGroupStyle} key={index}>
						<label htmlFor={field.name} style={labelStyle}>{field.description}{requiredMark}</label>
						<select
							id={field.name}
							name={field.name}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
							style={inputStyle}
						>
							<option value="">{t.pleaseSelect}</option>
							{field.options && field.options.map((option, i) => {
								const value = typeof option === 'object' ? option.value : option;
								const label = typeof option === 'object' ? option.label : option;
								return <option key={i} value={value}>{label}</option>;
							})}
						</select>
					</div>
				);

			case 'radio':
				return (
					<div style={formGroupStyle} key={index}>
						<fieldset style={fieldsetStyle}>
							<legend style={legendStyle}>{field.description}{requiredMark}</legend>
							{field.options && field.options.map((option, i) => {
								const value = typeof option === 'object' ? option.value : option;
								const label = typeof option === 'object' ? option.label : option;
								return (
									<label key={i} style={optionStyle}>
										<input
											type="radio"
											name={field.name}
											value={value}
											required={required && i === 0}
											checked={formData[field.name] === value}
											onChange={handleInputChange}
											style={optionInputStyle}
										/>
										{label}
									</label>
								);
							})}
						</fieldset>
					</div>
				);

			case 'checkbox':
				// Handle single checkbox vs multiple checkbox options
				if (field.options && Array.isArray(field.options)) {
					// Multiple checkbox options
					return (
						<div style={formGroupStyle} key={index}>
							<fieldset style={fieldsetStyle}>
								<legend style={legendStyle}>{field.description}{requiredMark}</legend>
								{field.options.map((option, i) => {
									const value = typeof option === 'object' ? option.value : option;
									const label = typeof option === 'object' ? option.label : option;
									const currentValues = Array.isArray(formData[field.name]) ? formData[field.name] as string[] : [];
									return (
										<label key={i} style={optionStyle}>
											<input
												type="checkbox"
												name={field.name}
												value={value}
												checked={currentValues.includes(value)}
												onChange={handleCheckboxChange}
												style={optionInputStyle}
											/>
											{label}
										</label>
									);
								})}
							</fieldset>
						</div>
					);
				} else {
					// Single checkbox (like terms acceptance)
					return (
						<div style={formGroupStyle} key={index}>
							<label style={{ ...optionStyle, cursor: 'pointer' }}>
								<input
									type="checkbox"
									name={field.name}
									value="true"
									required={required}
									checked={!!formData[field.name]}
									onChange={handleCheckboxChange}
									style={optionInputStyle}
								/>
								{field.description}{requiredMark}
							</label>
							{field.helpText && <p style={{
								fontSize: '0.9rem',
								color: '#666',
								marginTop: '0.25rem',
								fontStyle: 'italic'
							}}>{field.helpText}</p>}
						</div>
					);
				}

			default:
				return (
					<div style={formGroupStyle} key={index}>
						<label htmlFor={field.name} style={labelStyle}>{field.description}{requiredMark}</label>
						<input
							type="text"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
							style={inputStyle}
						/>
					</div>
				);
		}
	};

	const [submitHover, setSubmitHover] = useState(false);

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

					{eventName && ticketName && (
						<div style={{
							marginBottom: '1rem',
							padding: '1rem',
							background: 'var(--color-gray-800)',
							borderRadius: '8px'
						}}>
							<p><strong>{t.event}</strong><span>{eventName}</span></p>
							<p><strong>{t.ticketType}</strong><span>{ticketName}</span></p>
						</div>
					)}

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
							{/* Basic fields */}
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '0.5rem'
							}}>
								<label htmlFor="name" style={{
									fontWeight: 'bold',
									display: 'block'
								}}>{t.name} *</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									value={(formData.name as string) || ''}
									onChange={handleInputChange}
									style={{
										padding: '0.75rem',
										border: '2px solid #333',
										borderRadius: '0.25rem',
										fontSize: '1rem',
										backgroundColor: '#222',
										color: '#fff'
									}}
								/>
							</div>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '0.5rem'
							}}>
								<label htmlFor="email" style={{
									fontWeight: 'bold',
									display: 'block'
								}}>Email *</label>
								<input
									type="email"
									id="email"
									name="email"
									required
									value={(formData.email as string) || userEmail}
									onChange={handleInputChange}
									style={{
										padding: '0.75rem',
										border: '2px solid #333',
										borderRadius: '0.25rem',
										fontSize: '1rem',
										backgroundColor: '#222',
										color: '#fff'
									}}
								/>
							</div>

							{/* Dynamic form fields */}
							{formFields.map((field, index) => renderFormField(field, index))}

							{/* Invitation and referral code fields */}
							{invitationCode && (
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem'
								}}>
									<label style={{
										fontWeight: 'bold',
										display: 'block'
									}}>{t.invitationCode}</label>
									<input type="text" name="invitationCode" value={invitationCode} readOnly style={{
										padding: '0.75rem',
										border: '2px solid #333',
										borderRadius: '0.25rem',
										fontSize: '1rem',
										backgroundColor: '#222',
										color: '#fff'
									}} />
								</div>
							)}

							{referralCode && (
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem'
								}}>
									<label style={{
										fontWeight: 'bold',
										display: 'block'
									}}>{t.referralCode}</label>
									<input type="text" name="referralCode" value={referralCode} readOnly style={{
										padding: '0.75rem',
										border: '2px solid #333',
										borderRadius: '0.25rem',
										fontSize: '1rem',
										backgroundColor: '#222',
										color: '#fff'
									}} />
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
