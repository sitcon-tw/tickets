export const validateEmail = email => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validatePhone = phone => {
	const phoneRegex = /^(\+886|0)?[2-9]\d{8}$/;
	return phoneRegex.test(phone.replace(/[-\s]/g, ""));
};

export const validateRequired = value => {
	return value !== undefined && value !== null && value.toString().trim() !== "";
};

export const validateLength = (value, min = 0, max = Infinity) => {
	if (!value) return min === 0;
	const length = value.toString().length;
	return length >= min && length <= max;
};

export const validateFormData = (data, formFields) => {
	const errors = {};

	for (const field of formFields) {
		const value = data[field.name];
		const fieldErrors = [];

		if (field.isRequired && !validateRequired(value)) {
			fieldErrors.push(`${field.label}為必填欄位`);
			continue;
		}

		if (!validateRequired(value)) continue;

		switch (field.type) {
			case "email":
				if (!validateEmail(value)) {
					fieldErrors.push(`${field.label}格式不正確`);
				}
				break;
			case "phone":
				if (!validatePhone(value)) {
					fieldErrors.push(`${field.label}格式不正確`);
				}
				break;
			case "text":
			case "textarea":
				if (field.validation) {
					const validation = JSON.parse(field.validation);
					if (!validateLength(value, validation.minLength, validation.maxLength)) {
						fieldErrors.push(`${field.label}長度不符合要求`);
					}
				}
				break;
		}

		if (fieldErrors.length > 0) {
			errors[field.name] = fieldErrors;
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
};
