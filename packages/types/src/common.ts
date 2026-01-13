/**
 * Common types and schemas used across the system
 */

import { z } from "zod/v4";

/**
 * Localized text for multi-language support
 * e.g., { "en": "SITCON 2026", "zh-Hant": "學生計算機年會 2026" }
 */
export const LocalizedTextSchema = z.record(z.string(), z.string());
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

/**
 * Sort order for queries
 */
export const SortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof SortOrderSchema>;

/**
 * User roles in the system
 */
export const UserRoleSchema = z.enum(["admin", "viewer", "eventAdmin"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Registration status
 */
export const RegistrationStatusSchema = z.enum(["pending", "confirmed", "cancelled"]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

/**
 * Email campaign status
 */
export const EmailCampaignStatusSchema = z.enum(["draft", "sent", "scheduled", "sending", "cancelled"]);
export type EmailCampaignStatus = z.infer<typeof EmailCampaignStatusSchema>;

/**
 * Form field types
 */
export const FormFieldTypeSchema = z.enum(["text", "textarea", "select", "checkbox", "radio"]);
export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;

/**
 * Supported locales for SMS
 */
export const LocaleSchema = z.enum(["zh-Hant", "zh-Hans", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;
