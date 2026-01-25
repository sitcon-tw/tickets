// Component Props Types
import { TicketFormField } from "@sitcontix/types";
import React from "react";

// Spinner
export interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

// QR Code Popup
export interface QRCodePopupProps {
	isOpen: boolean;
	onClose: () => void;
	registrationId: string;
	registrationTime: Date | string;
	useOpass?: boolean;
	opassEventId?: string | null;
}

// Markdown Content
export interface MarkdownContentProps {
	content: string;
	className?: string;
}

// Admin Header
export interface AdminHeaderProps {
	title: string;
	description?: string;
}

// Lanyard
export interface LanyardProps {
	position?: [number, number, number];
	gravity?: [number, number, number];
	fov?: number;
	transparent?: boolean;
	name?: string;
}

export interface BandProps {
	maxSpeed?: number;
	minSpeed?: number;
	name?: string;
}

// Form Field
export interface FormFieldProps {
	field: TicketFormField;
	value: string | boolean | string[];
	onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
	onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	pleaseSelectText: string;
	otherText?: string;
}

// Home Components
export interface WelcomeProps {
	eventId: string;
	eventSlug: string;
}

export interface HeaderProps {
	eventId: string;
}

export interface TicketsProps {
	eventId: string;
	eventSlug: string;
}

export interface InfoProps {
	eventId: string;
}

// Button - Note: buttonVariants must be imported from the button component itself
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	isLoading?: boolean;
	variant?: "default" | "outline" | "primary" | "destructive" | "secondary" | "ghost" | "link";
	size?: "default" | "sm" | "lg" | "icon";
}
