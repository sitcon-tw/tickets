"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Nav from "@/components/Nav";
import * as i18n from "@/i18n";

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
	const pathname = usePathname();
	const lang = i18n.local(pathname);
	const linkBuilder = i18n.l(pathname);

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
			const response = await fetch('http://localhost:3000/api/auth/get-session', {
				credentials: 'include'
			});

			if (!response.ok) {
				router.push(linkBuilder('/login/'));
				return false;
			}

			const session = await response.json();
			if (!session || !session.user) {
				router.push(linkBuilder('/login/'));
				return false;
			}

			if (session.user.email) {
				setUserEmail(session.user.email);
				setFormData(prev => ({ ...prev, email: session.user.email }));
			}

			return true;
		} catch (error) {
			console.error('Auth check failed:', error);
			router.push(linkBuilder('/login/'));
			return false;
		}
	}, [router, linkBuilder]);

	// Load form fields
	const loadFormFields = useCallback(async () => {
		if (!selectedTicketId) {
			alert('未指定票種，請重新選擇');
			router.push(linkBuilder('/'));
			return;
		}

		try {
			// First get events to find the event ID
			const eventsResponse = await fetch('http://localhost:3000/api/events');
			const eventsData = await eventsResponse.json();

			if (!eventsData.success || !eventsData.data.length) {
				throw new Error('No active events found');
			}

			const fetchedEventId = eventsData.data[0].id;
			setEventId(fetchedEventId);

			// Get ticket information including form fields
			const ticketsResponse = await fetch(`http://localhost:3000/api/events/${fetchedEventId}/tickets`);
			const ticketsData = await ticketsResponse.json();

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
	}, [selectedTicketId, router, linkBuilder]);

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
			alert('表單資料不完整，請重新選擇票種');
			router.push(linkBuilder('/'));
			return;
		}

		try {
			const registrationData = {
				eventId,
				ticketId: selectedTicketId,
				formData,
				invitationCode,
				referralCode
			};

			const response = await fetch('http://localhost:3000/api/registrations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(registrationData)
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Clear stored data
				sessionStorage.removeItem('selectedTicketId');
				sessionStorage.removeItem('referralCode');
				sessionStorage.removeItem('invitationCode');
				sessionStorage.removeItem('selectedEventName');
				sessionStorage.removeItem('selectedTicketName');
				// Redirect to success page
				router.push(linkBuilder('/success'));
			} else {
				throw new Error(result.message || 'Registration failed');
			}
		} catch (error) {
			console.error('Registration error:', error);
			alert('報名失敗: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
							<option value="">請選擇...</option>
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
					<p><a href={linkBuilder('/')}>重新選擇票種</a></p>
					<h1 style={{
						marginBlock: '1rem',
						fontSize: '2.5rem'
					}}>填寫報名資訊</h1>

					{eventName && ticketName && (
						<div style={{
							marginBottom: '1rem',
							padding: '1rem',
							background: 'var(--color-gray-800)',
							borderRadius: '8px'
						}}>
							<p><strong>活動：</strong><span>{eventName}</span></p>
							<p><strong>票種：</strong><span>{ticketName}</span></p>
						</div>
					)}

					{loading && (
						<div style={{ textAlign: 'center', padding: '2rem' }}>載入表單中...</div>
					)}

					{error && (
						<div style={{ textAlign: 'center', padding: '2rem' }}>
							<p style={{ color: 'red' }}>載入表單失敗: {error}</p>
							<a href={linkBuilder('/')}>返回首頁</a>
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
								}}>姓名 *</label>
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
									}}>邀請碼</label>
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
									}}>推薦碼</label>
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
							>提交報名</button>
						</form>
					)}
				</section>
			</main>
		</>
	);
}
