// Page-Specific Types

export interface LanguageFieldsProps {
	ticketName: string;
	description: string;
	plainDescription: string;
	language: string;
	languageLabel: string;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onPlainDescriptionChange: (value: string) => void;
	required?: boolean;
	t: {
		ticketName: string;
		description: string;
		plainDescription: string;
		preview: string;
	};
}
