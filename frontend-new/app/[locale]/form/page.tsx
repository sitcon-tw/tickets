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

		switch (field.type) {
			case 'text':
				return (
					<div className="form-group" key={index}>
						<label htmlFor={field.name}>{field.description}{requiredMark}</label>
						<input
							type="text"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
						/>
					</div>
				);

			case 'email':
				return (
					<div className="form-group" key={index}>
						<label htmlFor={field.name}>{field.description}{requiredMark}</label>
						<input
							type="email"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
						/>
					</div>
				);

			case 'textarea':
				return (
					<div className="form-group" key={index}>
						<label htmlFor={field.name}>{field.description}{requiredMark}</label>
						<textarea
							id={field.name}
							name={field.name}
							rows={3}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
						/>
					</div>
				);

			case 'select':
				return (
					<div className="form-group" key={index}>
						<label htmlFor={field.name}>{field.description}{requiredMark}</label>
						<select
							id={field.name}
							name={field.name}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
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
					<div className="form-group" key={index}>
						<fieldset>
							<legend>{field.description}{requiredMark}</legend>
							{field.options && field.options.map((option, i) => {
								const value = typeof option === 'object' ? option.value : option;
								const label = typeof option === 'object' ? option.label : option;
								return (
									<label key={i} className="radio-option">
										<input
											type="radio"
											name={field.name}
											value={value}
											required={required && i === 0}
											checked={formData[field.name] === value}
											onChange={handleInputChange}
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
						<div className="form-group" key={index}>
							<fieldset>
								<legend>{field.description}{requiredMark}</legend>
								{field.options.map((option, i) => {
									const value = typeof option === 'object' ? option.value : option;
									const label = typeof option === 'object' ? option.label : option;
									const currentValues = Array.isArray(formData[field.name]) ? formData[field.name] as string[] : [];
									return (
										<label key={i} className="checkbox-option">
											<input
												type="checkbox"
												name={field.name}
												value={value}
												checked={currentValues.includes(value)}
												onChange={handleCheckboxChange}
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
						<div className="form-group" key={index}>
							<label className="checkbox-single">
								<input
									type="checkbox"
									name={field.name}
									value="true"
									required={required}
									checked={!!formData[field.name]}
									onChange={handleCheckboxChange}
								/>
								{field.description}{requiredMark}
							</label>
							{field.helpText && <p className="help-text">{field.helpText}</p>}
						</div>
					);
				}

			default:
				return (
					<div className="form-group" key={index}>
						<label htmlFor={field.name}>{field.description}{requiredMark}</label>
						<input
							type="text"
							id={field.name}
							name={field.name}
							placeholder={field.placeholder || ''}
							required={required}
							value={(formData[field.name] as string) || ''}
							onChange={handleInputChange}
						/>
					</div>
				);
		}
	};

	return (
		<>
			<Nav />
			<main>
				<section>
					<p><a href={linkBuilder('/')}>重新選擇票種</a></p>
					<h1>填寫報名資訊</h1>

					{eventName && ticketName && (
						<div className="ticket-info">
							<p><strong>活動：</strong><span>{eventName}</span></p>
							<p><strong>票種：</strong><span>{ticketName}</span></p>
						</div>
					)}

					{loading && (
						<div className="loading">載入表單中...</div>
					)}

					{error && (
						<div className="error">
							<p style={{ color: 'red' }}>載入表單失敗: {error}</p>
							<a href={linkBuilder('/')}>返回首頁</a>
						</div>
					)}

					{!loading && !error && (
						<form onSubmit={handleSubmit}>
							{/* Basic fields */}
							<div className="form-group">
								<label htmlFor="name">姓名 *</label>
								<input
									type="text"
									id="name"
									name="name"
									required
									value={(formData.name as string) || ''}
									onChange={handleInputChange}
								/>
							</div>
							<div className="form-group">
								<label htmlFor="email">Email *</label>
								<input
									type="email"
									id="email"
									name="email"
									required
									value={(formData.email as string) || userEmail}
									onChange={handleInputChange}
								/>
							</div>

							{/* Dynamic form fields */}
							{formFields.map((field, index) => renderFormField(field, index))}

							{/* Invitation and referral code fields */}
							{invitationCode && (
								<div className="form-group">
									<label>邀請碼</label>
									<input type="text" name="invitationCode" value={invitationCode} readOnly />
								</div>
							)}

							{referralCode && (
								<div className="form-group">
									<label>推薦碼</label>
									<input type="text" name="referralCode" value={referralCode} readOnly />
								</div>
							)}

							<button type="submit" className="button">提交報名</button>
						</form>
					)}
				</section>
			</main>

			<style jsx>{`
				section {
					margin-top: 8rem;
					max-width: 800px;
					margin-left: auto;
					margin-right: auto;
					padding: 0 1rem;
				}
				h1 {
					margin-block: 1rem;
					font-size: 2.5rem;
				}
				.ticket-info {
					margin-bottom: 1rem;
					padding: 1rem;
					background: var(--color-gray-800);
					border-radius: 8px;
				}
				.loading,
				.error {
					text-align: center;
					padding: 2rem;
				}
				form {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}
				.form-group {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}
				.form-group label {
					font-weight: bold;
					display: block;
				}
				.form-group input,
				.form-group select,
				.form-group textarea {
					padding: 0.75rem;
					border: 2px solid #333;
					border-radius: 0.25rem;
					font-size: 1rem;
					background-color: #222;
					color: #fff;
				}
				.form-group fieldset {
					border: 1px solid #333;
					border-radius: 0.25rem;
					padding: 1rem;
					background-color: #111;
				}
				.form-group legend {
					font-weight: bold;
					padding: 0 0.5rem;
				}
				.radio-option,
				.checkbox-option {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					margin: 0.5rem 0;
					font-weight: normal !important;
				}
				.checkbox-single {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					margin: 0.5rem 0;
					font-weight: normal !important;
					cursor: pointer;
				}
				.radio-option input,
				.checkbox-option input,
				.checkbox-single input {
					width: auto;
					margin: 0;
				}
				.help-text {
					font-size: 0.9rem;
					color: #666;
					margin-top: 0.25rem;
					font-style: italic;
				}
				button[type="submit"] {
					padding: 1rem 2rem;
					background-color: #007acc;
					color: white;
					border: none;
					border-radius: 0.25rem;
					font-size: 1.1rem;
					font-weight: bold;
					cursor: pointer;
					margin-top: 2rem;
					align-self: center;
				}
				button[type="submit"]:hover {
					background-color: #005999;
				}
			`}</style>
		</>
	);
}
