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
	qrValue: string;
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
	/** Buttons shown on the right of the title, e.g. the primary "Add" action. */
	actions?: React.ReactNode;
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
	/** The current answer; `undefined` when the field has not been answered yet. */
	value: string | boolean | string[] | undefined;
	onValueChange: (fieldId: string, value: string | boolean | string[]) => void;
	pleaseSelectText: string;
	/** Validation message shown under the field. */
	error?: string;
	disabled?: boolean;
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
