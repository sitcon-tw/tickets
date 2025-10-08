# Modular Type System Documentation

This document explains the new modular type system implemented for the SITCON tickets backend.

## Overview

The codebase now includes a comprehensive type system using JSDoc type definitions and reusable Fastify schemas, providing better code organization, validation, and developer experience.

## Directory Structure

```
├── types/              # JSDoc type definitions
│   ├── index.js       # Main export for all types
│   ├── database.js    # Database model types
│   ├── api.js         # API request/response types
│   ├── auth.js        # Authentication types
│   └── validation.js  # Validation types
├── schemas/           # Fastify validation schemas
│   ├── index.js       # Main export for all schemas
│   ├── common.js      # Common schema components
│   ├── event.js       # Event-related schemas
│   ├── registration.js# Registration schemas
│   ├── ticket.js      # Ticket schemas
│   ├── user.js        # User schemas
│   ├── formField.js   # Form field schemas
│   ├── invitationCode.js # Invitation code schemas
│   ├── referral.js    # Referral schemas
│   └── emailCampaign.js # Email campaign schemas
└── examples/          # Usage examples
    └── modular-route-example.js
```

## Usage Examples

### 1. Using Type Definitions

```javascript
/**
 * @typedef {import('../types/database.js').Event} Event
 * @typedef {import('../types/api.js').EventCreateRequest} EventCreateRequest
 */

// Type-aware function
/**
 * @param {EventCreateRequest} eventData
 * @returns {Promise<Event>}
 */
async function createEvent(eventData) {
    // Implementation with type safety
}
```

### 2. Using Fastify Schemas

```javascript
import { eventSchemas } from "../schemas/event.js";

fastify.post("/events", {
    schema: eventSchemas.createEvent // Reusable schema
}, async (request, reply) => {
    // Handler implementation
});
```

### 3. Using Response Helpers

```javascript
import { 
    successResponse, 
    validationErrorResponse, 
    notFoundResponse 
} from "#utils/response.js";

// Standardized responses
return reply.send(successResponse(data, "操作成功"));

const { response, statusCode } = validationErrorResponse("驗證失敗");
return reply.code(statusCode).send(response);
```

## Key Benefits

### 1. Type Safety
- JSDoc type definitions provide IntelliSense and type checking
- Prevents runtime errors through compile-time validation
- Better refactoring support

### 2. Code Reusability
- Schemas can be reused across multiple routes
- Consistent validation rules
- DRY principle adherence

### 3. Standardization
- Consistent API response formats
- Standardized error handling
- Uniform validation patterns

### 4. Better Documentation
- Self-documenting code through type definitions
- Clear API contracts
- Easier onboarding for new developers

## Database Types

All Prisma model types are defined in `types/database.js`:

```javascript
/**
 * @typedef {Object} Event
 * @property {string} id - Event unique identifier
 * @property {string} name - Event name
 * @property {Date} startDate - Event start date
 * // ... more properties
 */
```

## API Types

Request/response types in `types/api.js`:

```javascript
/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {*} data - Response data
 */
```

## Schema Components

Common schema components in `schemas/common.js`:

```javascript
export const successResponse = {
    type: 'object',
    properties: {
        success: { type: 'boolean', const: true },
        message: { type: 'string' },
        data: { /* dynamic */ }
    }
};
```

## Migration Guide

### For Existing Routes

1. Add type imports at the top:
   ```javascript
   /**
    * @typedef {import('../types/database.js').Event} Event
    */
   ```

2. Replace inline schemas with imports:
   ```javascript
   import { eventSchemas } from "../schemas/event.js";
   
   // Replace inline schema with:
   schema: eventSchemas.createEvent
   ```

3. Update response helpers:
   ```javascript
   import { validationErrorResponse } from "#utils/response.js";
   
   // Replace:
   errorResponse("VALIDATION_ERROR", "message", null, 422)
   // With:
   validationErrorResponse("message")
   ```

### For New Features

1. Define types in appropriate `types/*.js` file
2. Create schemas in appropriate `schemas/*.js` file
3. Use type annotations in route handlers
4. Utilize standardized response helpers

## Validation Patterns

### Form Field Validation
```javascript
import { validateFormData } from "#utils/validation.js";

const errors = validateFormData(formData, formFields);
if (errors) {
    const { response, statusCode } = validationErrorResponse("驗證失敗", errors);
    return reply.code(statusCode).send(response);
}
```

### Query Parameter Validation
```javascript
import { validateQuery } from "#utils/validation.js";

fastify.addHook('preHandler', validateQuery({
    page: [rules.positiveInteger],
    limit: [rules.positiveInteger]
}));
```

## Best Practices

1. **Always import types**: Use JSDoc type imports for better IDE support
2. **Reuse schemas**: Don't duplicate validation logic
3. **Use response helpers**: Maintain consistent API responses
4. **Document with JSDoc**: Add proper documentation for all functions
5. **Group related types**: Keep related types in the same module
6. **Version schemas**: Consider versioning for API evolution

## Examples

See `examples/modular-route-example.js` for a complete example of how to use the modular type system in practice.