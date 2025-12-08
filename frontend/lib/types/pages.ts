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
	tt: {
		ticketName: string;
		description: string;
		plainDescription: string;
	};
}
