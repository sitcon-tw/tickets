# Quick Start Guide

## Backend (Fastify) Usage

### 1. Import shared schemas

```typescript
import {
  registrationCreateSchema,
  eventCreateSchema,
  type RegistrationCreateRequest,
} from "@tickets/shared";
```

### 2. Use in routes

```typescript
fastify.post(
  "/registrations",
  {
    schema: {
      body: registrationCreateSchema,
      response: {
        201: createApiResponseSchema(z.object({
          id: z.string(),
          status: z.string(),
        })),
      },
    },
  },
  async (request, reply) => {
    // request.body is fully typed and validated!
    const data = request.body;
  }
);
```

## Frontend (React) Usage

### 1. Import schemas and hook

```typescript
import { registrationCreateSchema } from "@tickets/shared";
import { useZodForm } from "@/lib/hooks/useZodForm";
```

### 2. Use in forms

```typescript
function MyForm() {
  const form = useZodForm({
    schema: registrationCreateSchema,
    defaultValues: {
      eventId: "",
      ticketId: "",
      formData: {},
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    // Validated data, matching backend schema!
    await api.post("/registrations", data);
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

## Creating New Schemas

### 1. Define the schema

```typescript
// shared/src/schemas/my-feature.ts
import { z } from "zod";

export const myFeatureSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  age: z.number().int().positive().optional(),
});

export type MyFeature = z.infer<typeof myFeatureSchema>;
```

### 2. Export it

```typescript
// shared/src/schemas/index.ts
export * from "./my-feature.js";
```

### 3. Use it everywhere!

Both backend and frontend can now import and use it:

```typescript
import { myFeatureSchema, type MyFeature } from "@tickets/shared";
```

## Common Zod Patterns

```typescript
// String validation
z.string()
  .min(1, "Required")
  .max(100)
  .email()
  .url()
  .uuid()
  .regex(/^[A-Z]+$/)

// Number validation
z.number()
  .int()
  .positive()
  .min(0)
  .max(100)

// Optional/nullable fields
z.string().optional()  // string | undefined
z.string().nullable()  // string | null
z.string().nullish()   // string | null | undefined

// Default values
z.string().default("hello")
z.number().default(0)

// Arrays
z.array(z.string())
z.array(userSchema).min(1).max(10)

// Objects
z.object({
  name: z.string(),
  age: z.number(),
})

// Enums
z.enum(["admin", "user", "guest"])

// Unions
z.union([z.string(), z.number()])

// Records (key-value pairs)
z.record(z.string(), z.any())

// Transformations
z.string().transform(s => s.toUpperCase())
z.string().datetime().transform(s => new Date(s))

// Refinements (custom validation)
z.string().refine(
  (val) => val.length >= 8,
  { message: "Password must be at least 8 characters" }
)
```

## Tips

✨ Always infer types from schemas, never define them manually:
```typescript
// ✅ Good
export const userSchema = z.object({ name: z.string() });
export type User = z.infer<typeof userSchema>;

// ❌ Bad
export interface User { name: string }  // Manual type
```

✨ Use `.optional()` for optional fields:
```typescript
z.object({
  required: z.string(),
  optional: z.string().optional(),
})
```

✨ Use `.default()` for fields with default values:
```typescript
z.object({
  isActive: z.boolean().default(true),
  role: z.string().default("user"),
})
```

✨ Compose schemas for reusability:
```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
});

const userSchema = z.object({
  name: z.string(),
  address: addressSchema,  // Reuse!
});
```

## Testing

```typescript
import { registrationCreateSchema } from "@tickets/shared";

test("validates valid data", () => {
  const result = registrationCreateSchema.safeParse({
    eventId: "valid-uuid",
    ticketId: "valid-uuid",
    formData: {},
  });

  expect(result.success).toBe(true);
});

test("rejects invalid data", () => {
  const result = registrationCreateSchema.safeParse({
    eventId: "not-a-uuid",  // Invalid!
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    console.log(result.error.issues);
  }
});
```

## More Resources

- [Shared Package README](./README.md)
- [Migration Guide](../MIGRATION.md)
- [Zod Documentation](https://zod.dev/)
