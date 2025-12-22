/**
 * Custom hook for using Zod schemas with react-hook-form
 * Provides type-safe form validation using shared schemas
 */

import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormProps, UseFormReturn, FieldValues } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z, ZodType } from "zod";

/**
 * Typed form hook that integrates Zod schemas with react-hook-form
 *
 * @example
 * ```tsx
 * import { registrationCreateSchema } from '@tickets/shared';
 *
 * function RegistrationForm() {
 *   const form = useZodForm({
 *     schema: registrationCreateSchema,
 *     defaultValues: {
 *       eventId: '',
 *       ticketId: '',
 *       formData: {},
 *     },
 *   });
 *
 *   const onSubmit = form.handleSubmit(async (data) => {
 *     // data is fully typed based on the schema
 *     await registrationAPI.create(data);
 *   });
 * }
 * ```
 */
export function useZodForm<TSchema extends ZodType<any, any, any>>({
	schema,
	...formProps
}: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> & {
	schema: TSchema;
}): UseFormReturn<z.infer<TSchema>> {
	return useForm({
		...formProps,
		resolver: zodResolver(schema),
	});
}
