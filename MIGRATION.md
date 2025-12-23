# Migration Guide: Shared Types & Schemas

This guide explains how to migrate your existing routes and forms to use the new shared types and Zod schemas.

## What Changed?

### Before
- Types were duplicated between `backend/types/api.ts` and `frontend/lib/types/api.ts`
- Backend used JSON Schema for Fastify validation
- Frontend used manual type definitions with no runtime validation
- No guarantee that frontend and backend types matched

### After
- **Single source of truth**: All types defined in `@tickets/shared` package
- **Runtime validation**: Zod schemas validate on both backend and frontend
- **Type safety**: TypeScript types automatically inferred from Zod schemas
- **Prisma integration**: Database types auto-generated and shared

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  @tickets/shared                    │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  Zod Schemas     │      │  Prisma Types    │   │
│  │  (manual)        │      │  (auto-generated)│   │
│  └────────┬─────────┘      └────────┬─────────┘   │
│           │                         │              │
│           └────────┬────────────────┘              │
│                    │                               │
└────────────────────┼───────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐           ┌────▼─────┐
    │ Backend  │           │ Frontend │
    │ (Fastify)│           │ (Next.js)│
    └──────────┘           └──────────┘
```

## Step-by-Step Migration

### 1. Backend Route Migration

**Old approach (JSON Schema):**

```typescript
// backend/schemas/registration.ts
export const registrationCreateBody = {
  type: "object",
  properties: {
    eventId: { type: "string" },
    ticketId: { type: "string" },
    formData: { type: "object" }
  },
  required: ["eventId", "ticketId", "formData"]
};

// backend/routes/public/registrations.ts
import { registrationSchemas } from "#schemas/registration";

interface RegistrationCreateRequest {
  eventId: string;
  ticketId: string;
  formData: Record<string, any>;
}

fastify.post(
  "/registrations",
  { schema: registrationSchemas.createRegistration },
  async (request: FastifyRequest<{ Body: RegistrationCreateRequest }>, reply) => {
    const { eventId, ticketId, formData } = request.body;
    // ...
  }
);
```

**New approach (Zod):**

```typescript
// backend/routes/public/registrations.ts
import { registrationCreateSchema, type RegistrationCreateRequest } from "@tickets/shared";
import { createApiResponseSchema } from "#utils/zod-schemas";

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
    // request.body is automatically typed and validated!
    const { eventId, ticketId, formData } = request.body;
    // ...
  }
);
```

### 2. Frontend Form Migration

**Old approach (manual validation):**

```typescript
// frontend/components/RegistrationForm.tsx
import { useForm } from "react-hook-form";
import type { RegistrationCreateRequest } from "@/lib/types/api";

function RegistrationForm() {
  const form = useForm<RegistrationCreateRequest>({
    defaultValues: {
      eventId: "",
      ticketId: "",
      formData: {},
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // No validation, types could be wrong
    await registrationAPI.create(data);
  });

  return <form onSubmit={onSubmit}>{/* ... */}</form>;
}
```

**New approach (Zod validation):**

```typescript
// frontend/components/RegistrationForm.tsx
import { useZodForm } from "@/lib/hooks/useZodForm";
import { registrationCreateSchema, type RegistrationCreateRequest } from "@tickets/shared";

function RegistrationForm() {
  const form = useZodForm({
    schema: registrationCreateSchema,
    defaultValues: {
      eventId: "",
      ticketId: "",
      formData: {},
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // data is validated against the same schema as the backend!
    await registrationAPI.create(data);
  });

  return <form onSubmit={onSubmit}>{/* ... */}</form>;
}
```

### 3. Removing Duplicate Types

After migrating, you can safely remove duplicate type definitions:

**Files to clean up:**
- `backend/types/api.ts` - Remove types now in `@tickets/shared`
- `frontend/lib/types/api.ts` - Remove types now in `@tickets/shared`
- `backend/schemas/*.ts` - Can be removed after all routes migrated

**Keep these:**
- Domain-specific types that aren't shared (UI-only types, backend-only types)
- Types for external APIs
- Complex computed types

### 4. Using Prisma Types

**Old approach:**

```typescript
// backend/types/database.ts
export interface User {
  id: string;
  email: string;
  name: string;
  // ... manually kept in sync with Prisma schema
}
```

**New approach:**

```typescript
// Just import from shared!
import type { User } from "@tickets/shared";

// User type is automatically generated from Prisma schema
function handleUser(user: User) {
  console.log(user.email);
}
```

## Common Patterns

### Pattern 1: API Response with Pagination

```typescript
import { createApiResponseSchema, paginationSchema } from "@tickets/shared";
import { z } from "zod";

const eventSchema = z.object({
  id: z.string(),
  name: z.record(z.string()),
  // ...
});

const eventListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(eventSchema),
  pagination: paginationSchema,
});
```

### Pattern 2: Nested Validation

```typescript
import { z } from "zod";

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
});

const userProfileSchema = z.object({
  name: z.string(),
  email: z.email(),
  address: addressSchema, // Nested schema
});
```

### Pattern 3: Conditional Fields

```typescript
import { z } from "zod";

const ticketSchema = z.object({
  name: z.string(),
  price: z.number(),
  requireInviteCode: z.boolean(),
  // Only required if requireInviteCode is true (validated at runtime)
  inviteCode: z.string().optional(),
});
```

### Pattern 4: Transform Data

```typescript
import { z } from "zod";

const eventCreateSchema = z.object({
  startDate: z.iso.datetime().transform((str) => new Date(str)),
  endDate: z.iso.datetime().transform((str) => new Date(str)),
});
```

## Migration Checklist

### Backend
- [ ] Install `@tickets/shared` in backend package.json
- [ ] Add Zod type provider to Fastify app
- [ ] Create example Zod route (see `backend/routes/public/registrations-zod.ts`)
- [ ] Gradually migrate routes from JSON Schema to Zod
- [ ] Remove old schema files after migration complete
- [ ] Update tests to use Zod schemas

### Frontend
- [ ] Install `@tickets/shared` in frontend package.json
- [ ] Install `@hookform/resolvers` for Zod integration
- [ ] Create `useZodForm` hook for form validation
- [ ] Update forms to use shared schemas
- [ ] Remove duplicate type definitions
- [ ] Update API client types to use shared types

### Shared Package
- [x] Create `@tickets/shared` package
- [x] Set up Prisma type generation
- [x] Create Zod schemas for all API endpoints
- [x] Export all types and schemas
- [x] Write documentation

## Troubleshooting

### Issue: Type mismatch between frontend and backend

**Solution:** Both should import from the same schema:
```typescript
import { registrationCreateSchema } from "@tickets/shared";
```

### Issue: Zod validation failing on valid data

**Solution:** Check your schema definitions. Use `.optional()` for optional fields:
```typescript
z.object({
  required: z.string(),
  optional: z.string().optional(),
})
```

### Issue: Prisma types not updating

**Solution:** Regenerate Prisma types:
```bash
cd backend && prisma generate
```

### Issue: Cannot import from `@tickets/shared`

**Solution:** Make sure you've installed dependencies:
```bash
pnpm install
```

## Examples

See these files for complete examples:
- Backend: `backend/routes/public/registrations-zod.ts`
- Frontend: `frontend/lib/hooks/useZodForm.ts`
- Shared: `shared/src/schemas/registration.ts`

## Benefits

✅ **Type Safety**: Impossible to have mismatched types between frontend/backend
✅ **Less Code**: No duplicate type definitions
✅ **Runtime Validation**: Catch errors before they reach your database
✅ **Better DX**: Auto-completion and type checking everywhere
✅ **Easier Refactoring**: Change schema once, updates everywhere
✅ **Documentation**: Schemas serve as documentation

## Next Steps

1. Start by migrating one route as a proof of concept
2. Migrate your most-used endpoints first
3. Gradually migrate the rest of your routes
4. Remove old schema files once migration is complete
5. Update your tests to use the new schemas

## Questions?

Check the following resources:
- [Zod Documentation](https://zod.dev/)
- [Fastify Type Provider Zod](https://github.com/turkerdev/fastify-type-provider-zod)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [Shared Package README](./shared/README.md)
