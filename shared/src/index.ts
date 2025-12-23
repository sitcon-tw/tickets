/**
 * @tickets/shared
 * Shared types and schemas for the tickets application
 */

// Export all schemas (these are the primary types used in the application)
export * from "./schemas/index";

// Export response types
export * from "./types/responses";

// Prisma-generated types are not re-exported to avoid conflicts
// Import them directly from "@tickets/shared/types/prisma" if needed
