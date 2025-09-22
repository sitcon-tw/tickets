---
import Layout from "@layouts/Layout.astro";
import Nav from "@components/Nav.astro";
import * as i18n from "src/i18n";
import * as Input from "@components/input";
const lang = i18n.local(Astro.url.pathname);
const t = i18n.t(lang, {
	success: {
		"zh-Hant": "報名成功！",
		"zh-Hans": "报名成功！",
		en: "Registration Successful!"
	}
});
const l = i18n.l(Astro.url);
---

<Layout i18n={t.t} path="login" title={t.login} theme="#FFF" lang={lang}>
	<Nav />
	<main>
		<section>
			<p><a href={l("/")}>重新選擇票種</a></p>
			<h1>填寫報名資訊</h1>
			<div id="ticket-info" style="display: none; margin-bottom: 1rem; padding: 1rem; background: var(--color-gray-800); border-radius: 8px;">
				<p><strong>活動：</strong><span id="event-name"></span></p>
				<p><strong>票種：</strong><span id="ticket-name"></span></p>
			</div>
			<div id="loading" style="text-align: center; padding: 2rem;">載入表單中...</div>

			<form id="registration-form" style="display: none;">
				<!-- Form fields will be loaded dynamically -->
			</form>
		</section>
		</section>
	</main>

	<script is:inline>
		let selectedTicketId = null;
		let invitationCode = null;
		let referralCode = null;
		let eventId = null;
		let formFields = [];

		// Parse URL parameters
		function parseUrlParams() {
			const urlParams = new URLSearchParams(window.location.search);
			selectedTicketId = urlParams.get('ticket');
			invitationCode = urlParams.get('invite');
			referralCode = urlParams.get('ref');

			// Also check sessionStorage as fallback
			if (!selectedTicketId) selectedTicketId = sessionStorage.getItem('selectedTicketId');
			if (!invitationCode) invitationCode = sessionStorage.getItem('invitationCode');
			if (!referralCode) referralCode = sessionStorage.getItem('referralCode');
			
			// Display event and ticket information
			const eventName = sessionStorage.getItem('selectedEventName') || urlParams.get('eventName');
			const ticketName = sessionStorage.getItem('selectedTicketName') || urlParams.get('ticketType');
			
			if (eventName && ticketName) {
				document.getElementById('event-name').textContent = eventName;
				document.getElementById('ticket-name').textContent = ticketName;
				document.getElementById('ticket-info').style.display = 'block';
			}
		}

		// Load form fields for the selected ticket
		async function loadFormFields() {
			if (!selectedTicketId) {
				alert('未指定票種，請重新選擇');
				window.location.href = '/';
				return;
			}

			try {
				// First get events to find the event ID
				const eventsResponse = await fetch('http://localhost:3000/api/events');
				const eventsData = await eventsResponse.json();
				
				if (!eventsData.success || !eventsData.data.length) {
					throw new Error('No active events found');
				}
				
				eventId = eventsData.data[0].id;
				
				// Get ticket information including form fields
				const ticketsResponse = await fetch(`http://localhost:3000/api/events/${eventId}/tickets`);
				const ticketsData = await ticketsResponse.json();
				
				if (!ticketsData.success) {
					throw new Error('Failed to load tickets');
				}

				// Find the specific ticket
				const ticket = ticketsData.data.find(t => t.id === selectedTicketId);
				if (!ticket) {
					throw new Error('Selected ticket not found');
				}

				formFields = ticket.formFields || [];
				
				// Generate form HTML
				generateFormHTML();
				
			} catch (error) {
				console.error('Failed to load form fields:', error);
				document.getElementById('loading').innerHTML = `
					<p style="color: red;">載入表單失敗: ${error.message}</p>
					<a href="/">返回首頁</a>
				`;
			}
		}

		// Generate form HTML based on form fields
		function generateFormHTML() {
			const form = document.getElementById('registration-form');
			let formHTML = '';

			// Always include basic fields
			formHTML += `
				<div class="form-group">
					<label for="name">姓名 *</label>
					<input type="text" id="name" name="name" required>
				</div>
				<div class="form-group">
					<label for="email">Email *</label>
					<input type="email" id="email" name="email" required>
				</div>
			`;

			// Add dynamic form fields
			formFields.forEach((field, index) => {
				formHTML += generateFieldHTML(field, index);
			});

			// Add invitation and referral code fields if present
			if (invitationCode) {
				formHTML += `
					<div class="form-group">
						<label>邀請碼</label>
						<input type="text" name="invitationCode" value="${invitationCode}" readonly>
					</div>
				`;
			}

			if (referralCode) {
				formHTML += `
					<div class="form-group">
						<label>推薦碼</label>
						<input type="text" name="referralCode" value="${referralCode}" readonly>
					</div>
				`;
			}

			// Add submit button
			formHTML += `
				<button type="submit" class="button">提交報名</button>
			`;

			form.innerHTML = formHTML;
			
			// Hide loading and show form
			document.getElementById('loading').style.display = 'none';
			form.style.display = 'flex';
		}

		// Generate HTML for individual form field
		function generateFieldHTML(field, index) {
			const required = field.required ? 'required' : '';
			const requiredMark = field.required ? ' *' : '';
			
			switch (field.type) {
				case 'text':
					return `
						<div class="form-group">
							<label for="${field.name}">${field.description}${requiredMark}</label>
							<input type="text" id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" ${required}>
						</div>
					`;
				
				case 'email':
					return `
						<div class="form-group">
							<label for="${field.name}">${field.description}${requiredMark}</label>
							<input type="email" id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" ${required}>
						</div>
					`;
				
				case 'textarea':
					return `
						<div class="form-group">
							<label for="${field.name}">${field.description}${requiredMark}</label>
							<textarea id="${field.name}" name="${field.name}" rows="3" placeholder="${field.placeholder || ''}" ${required}></textarea>
						</div>
					`;
				
				case 'select':
					let selectOptions = '';
					if (field.options && Array.isArray(field.options)) {
						selectOptions = field.options.map(option => {
							const value = typeof option === 'object' ? option.value : option;
							const label = typeof option === 'object' ? option.label : option;
							return `<option value="${value}">${label}</option>`;
						}).join('');
					}
					return `
						<div class="form-group">
							<label for="${field.name}">${field.description}${requiredMark}</label>
							<select id="${field.name}" name="${field.name}" ${required}>
								<option value="">請選擇...</option>
								${selectOptions}
							</select>
						</div>
					`;
				
				case 'radio':
					let radioOptions = '';
					if (field.options && Array.isArray(field.options)) {
						radioOptions = field.options.map((option, i) => {
							const value = typeof option === 'object' ? option.value : option;
							const label = typeof option === 'object' ? option.label : option;
							return `
								<label class="radio-option">
									<input type="radio" name="${field.name}" value="${value}" ${required && i === 0 ? 'required' : ''}>
									${label}
								</label>
							`;
						}).join('');
					}
					return `
						<div class="form-group">
							<fieldset>
								<legend>${field.description}${requiredMark}</legend>
								${radioOptions}
							</fieldset>
						</div>
					`;
				
				case 'checkbox':
					// Handle single checkbox (like acceptTerms) vs multiple checkbox options
					if (field.options && Array.isArray(field.options)) {
						// Multiple checkbox options
						let checkboxOptions = field.options.map(option => {
							const value = typeof option === 'object' ? option.value : option;
							const label = typeof option === 'object' ? option.label : option;
							return `
								<label class="checkbox-option">
									<input type="checkbox" name="${field.name}" value="${value}">
									${label}
								</label>
							`;
						}).join('');
						return `
							<div class="form-group">
								<fieldset>
									<legend>${field.description}${requiredMark}</legend>
									${checkboxOptions}
								</fieldset>
							</div>
						`;
					} else {
						// Single checkbox (like terms acceptance)
						return `
							<div class="form-group">
								<label class="checkbox-single">
									<input type="checkbox" name="${field.name}" value="true" ${required}>
									${field.description}${requiredMark}
								</label>
								${field.helpText ? `<p class="help-text">${field.helpText}</p>` : ''}
							</div>
						`;
					}
				
				default:
					return `
						<div class="form-group">
							<label for="${field.name}">${field.description}${requiredMark}</label>
							<input type="text" id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}" ${required}>
						</div>
					`;
			}
		}
		// Check if user is authenticated
		async function checkAuth() {
			try {
				const response = await fetch('http://localhost:3000/api/auth/get-session', {
					credentials: 'include'
				});
				
				if (!response.ok) {
					// Redirect to login if not authenticated
					window.location.href = '/login/';
					return false;
				}
				
				const session = await response.json();
				if (!session || !session.user) {
					window.location.href = '/login/';
					return false;
				}
				
				// Pre-fill email if available
				const emailInput = document.getElementById('email');
				if (emailInput && session.user.email) {
					emailInput.value = session.user.email;
				}
				
				return true;
			} catch (error) {
				console.error('Auth check failed:', error);
				window.location.href = '/login/';
				return false;
			}
		}
		
		async function handleSubmit(event) {
			event.preventDefault();
			
			if (!selectedTicketId || !eventId) {
				alert('表單資料不完整，請重新選擇票種');
				window.location.href = '/';
				return;
			}
			
			// Get form data
			const form = event.target;
			const formData = new FormData(form);
			const data = {};
			
			// Handle regular form data
			for (const [key, value] of formData.entries()) {
				if (data[key]) {
					// If key already exists, make it an array
					if (!Array.isArray(data[key])) {
						data[key] = [data[key]];
					}
					data[key].push(value);
				} else {
					data[key] = value;
				}
			}
			
			// Handle checkboxes specifically
			const checkboxes = form.querySelectorAll('input[type="checkbox"]');
			checkboxes.forEach(checkbox => {
				const name = checkbox.name;
				if (checkbox.checked) {
					// For single checkboxes (like acceptTerms), convert "true" to boolean
					if (checkbox.value === "true") {
						data[name] = true;
					} else {
						// For multi-value checkboxes, collect as array
						if (!data[name]) {
							data[name] = [];
						}
						if (!Array.isArray(data[name])) {
							data[name] = [data[name]];
						}
						data[name].push(checkbox.value);
					}
				} else {
					// For unchecked single checkboxes (like acceptTerms), set to false
					if (checkbox.value === "true" && !data[name]) {
						data[name] = false;
					}
				}
			});
			
			await submitRegistration(data);
		}
		
		// Submit registration to backend
		async function submitRegistration(formDataObj) {
			try {
				const registrationData = {
					eventId,
					ticketId: selectedTicketId,
					formData: formDataObj,
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
					// Redirect to success page
					window.location.href = '/success';
				} else {
					throw new Error(result.message || 'Registration failed');
				}
			} catch (error) {
				console.error('Registration error:', error);
				alert('報名失敗: ' + error.message);
			}
		}
		
		// Initialize page
		document.addEventListener('DOMContentLoaded', async () => {
			parseUrlParams();
			
			const isAuthenticated = await checkAuth();
			if (!isAuthenticated) return;
			
			await loadFormFields();
			
			// Add form submit handler after form is generated
			document.getElementById('registration-form').addEventListener('submit', handleSubmit);
		});
	</script>

	<style is:inline>
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
	</style>
</Layout>
