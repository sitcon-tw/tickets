/** Message of a caught value, whatever was thrown */
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
