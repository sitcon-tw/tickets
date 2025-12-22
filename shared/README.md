# @tickets/shared

Shared types and validation schemas for the tickets application.

## Overview

This package provides a single source of truth for:
- **Zod schemas** for runtime validation (used in both backend and frontend)
- **TypeScript types** inferred from Zod schemas
- **Prisma-generated types** from the database schema

## Features

✅ **Type Safety** - Shared types ensure frontend and backend stay in sync
✅ **Runtime Validation** - Zod schemas validate data at runtime
✅ **Single Source of Truth** - Define schemas once, use everywhere
✅ **Auto-generated Types** - Prisma types generated automatically from database schema

## Installation

This package is part of the monorepo workspace. It's automatically available to other packages:

```json
{
  "dependencies": {
    "@tickets/shared": "workspace:*"
  }
}
```

## Usage

### In Backend (Fastify)

```typescript
import {
  registrationCreateSchema,
  eventCreateSchema,
  type RegistrationCreateRequest,
  type EventCreateRequest,
} from "@tickets/shared";
import { createApiResponseSchema } from "#utils/zod-schemas";

// Use in Fastify routes with automatic validation
fastify.post(
  "/registrations",
  {
    schema: {
      description: "Create a new registration",
      tags: ["registrations"],
      body: registrationCreateSchema,
      response: {
        201: createApiResponseSchema(registrationResponseSchema),
      },
    },
  },
  async (request, reply) => {
    // request.body is fully typed and validated
    const { eventId, ticketId, formData } = request.body;
    // ...
  }
);
```

### In Frontend (React + Next.js)

```typescript
import { registrationCreateSchema, type RegistrationCreateRequest } from "@tickets/shared";
import { useZodForm } from "@/lib/hooks/useZodForm";

function RegistrationForm() {
  const form = useZodForm({
    schema: registrationCreateSchema,
    defaultValues: {
      eventId: "",
      ticketId: "",
      formData: {},
    },
  });

  const onSubmit = form.handleSubmit(async (data: RegistrationCreateRequest) => {
    // data is fully typed and validated against the same schema as backend
    await registrationAPI.create(data);
  });

  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Using Prisma Types

```typescript
import type { User, Event, Registration } from "@tickets/shared";

// These types are automatically generated from your Prisma schema
function handleUser(user: User) {
  console.log(user.email, user.role);
}
```

## Available Schemas

### Common Schemas
- `paginationSchema` - Pagination response structure
- `paginationQuerySchema` - Pagination query parameters
- `apiResponseSchema(dataSchema)` - Generic API response wrapper
- `apiErrorSchema` - Error response structure
- `sortOrderSchema` - Sort order enum ("asc" | "desc")
- `searchQuerySchema` - Search query parameters
- `localizedTextSchema` - Localized text object

### Event Schemas
- `eventCreateSchema` - Create event request
- `eventUpdateSchema` - Update event request
- `eventFormFieldCreateSchema` - Create form field
- `eventFormFieldUpdateSchema` - Update form field
- `formFieldTypeSchema` - Form field type enum

### Ticket Schemas
- `ticketCreateSchema` - Create ticket request
- `ticketUpdateSchema` - Update ticket request
- `ticketReorderSchema` - Reorder tickets request

### Registration Schemas
- `registrationCreateSchema` - Create registration request
- `registrationUpdateSchema` - Update registration request
- `registrationStatusSchema` - Registration status enum

### Invitation Code Schemas
- `invitationCodeCreateSchema` - Create invitation code
- `invitationCodeUpdateSchema` - Update invitation code
- `invitationCodeVerifySchema` - Verify invitation code

### Referral Schemas
- `referralValidateSchema` - Validate referral code

### Email Campaign Schemas
- `emailCampaignCreateSchema` - Create email campaign
- `targetAudienceSchema` - Target audience definition

## Development

### Adding New Schemas

1. Create a new schema file in `src/schemas/`:

```typescript
// src/schemas/my-feature.ts
import { z } from "zod";

export const myFeatureCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type MyFeatureCreateRequest = z.infer<typeof myFeatureCreateSchema>;
```

2. Export it in `src/schemas/index.ts`:

```typescript
export * from "./my-feature.js";
```

3. Use it in backend and frontend!

### Updating Prisma Types

Prisma types are automatically regenerated when you run:

```bash
pnpm install  # Triggers backend postinstall hook
# or
cd backend && prisma generate
```

The types are generated to `shared/src/types/prisma/index.ts`.

## Type Inference

All types are inferred from Zod schemas, ensuring they stay in sync:

```typescript
import { registrationCreateSchema, type RegistrationCreateRequest } from "@tickets/shared";

// Type is automatically inferred
type InferredType = z.infer<typeof registrationCreateSchema>;

// Same as manually defined type
const request: RegistrationCreateRequest = {
  eventId: "...",
  ticketId: "...",
  formData: {},
};
```

## Migration Guide

### Migrating from Old Schemas

**Before (duplicated types):**
```typescript
// backend/types/api.ts
export interface RegistrationCreateRequest {
  eventId: string;
  ticketId: string;
  formData: Record<string, any>;
}

// frontend/lib/types/api.ts
export interface RegistrationCreateRequest {  // Duplicate!
  eventId: string;
  ticketId: string;
  formData: Record<string, any>;
}
```

**After (shared schema):**
```typescript
// shared/src/schemas/registration.ts
export const registrationCreateSchema = z.object({
  eventId: z.string().uuid(),
  ticketId: z.string().uuid(),
  formData: z.record(z.any()),
});

export type RegistrationCreateRequest = z.infer<typeof registrationCreateSchema>;

// Both backend and frontend import from @tickets/shared
import { registrationCreateSchema, type RegistrationCreateRequest } from "@tickets/shared";
```

## Best Practices

1. **Always use Zod schemas** for validation instead of manually checking types
2. **Infer types from schemas** instead of manually defining interfaces
3. **Keep schemas focused** - one schema per request/response type
4. **Use `.optional()` and `.default()`** to handle optional fields properly
5. **Leverage Zod transformations** for data normalization (e.g., `.transform()`, `.coerce`)

## Dependencies

- `zod` ^4.2.1 - Runtime validation library

## License

Apache-2.0
