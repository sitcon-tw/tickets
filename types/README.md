# @sitcontix/types

Unified types and schemas for SITCON tickets system. This package provides Zod schemas and TypeScript types for both frontend and backend.

## Installation

```bash
pnpm add @sitcontix/types
```

## Usage

### Import all types (default)

```typescript
import { UserSchema, EventSchema, TicketSchema } from "@sitcontix/types";
```

### Import from specific modules (tree-shakeable)

The package is modularized into separate domains for better tree-shaking and code organization:

```typescript
// Common types
import { LocalizedText, UserRole, SortOrder } from "@sitcontix/types/common";

// API types
import { ApiResponse, Pagination, PaginationQuery } from "@sitcontix/types/api";

// User types
import { User, SessionUser, UserCapabilities } from "@sitcontix/types/user";

// Auth types
import { AuthContext, LoginRequest, Session } from "@sitcontix/types/auth";

// Event types
import { Event, EventListItem, EventStats } from "@sitcontix/types/event";

// Ticket types
import { Ticket, TicketAnalytics } from "@sitcontix/types/ticket";

// Form types
import { EventFormField, FieldFilter, FilterCondition } from "@sitcontix/types/form";

// Registration types
import { Registration, RegistrationStats } from "@sitcontix/types/registration";

// Referral types
import { Referral, ReferralLeaderboard, ReferralTree } from "@sitcontix/types/referral";

// Invitation types
import { InvitationCode, InvitationCodeVerification } from "@sitcontix/types/invitation";

// Email types
import { EmailCampaign, TargetAudience } from "@sitcontix/types/email";

// SMS types
import { SendVerificationRequest, VerifyCodeRequest } from "@sitcontix/types/sms";

// Turnstile types
import { TurnstileResponse, TurnstileValidationResult } from "@sitcontix/types/turnstile";

// Analytics types
import { AnalyticsData, EventDashboardData } from "@sitcontix/types/analytics";

// Validation types
import { ValidationError } from "@sitcontix/types/validation";

// System types
import { HealthStatus, ExportData } from "@sitcontix/types/system";

// Helper types
import { IdParams, EventAccessRequest } from "@sitcontix/types/helpers";
```

## Module Organization

- **common**: Shared types used across multiple domains (LocalizedText, enums, etc.)
- **api**: API response wrappers, pagination, and search queries
- **user**: User entities and SMS verification
- **auth**: Authentication and authorization types
- **event**: Event entities and related types
- **ticket**: Ticket entities and analytics
- **form**: Form fields, filters, and validation
- **registration**: Registration entities and statistics
- **referral**: Referral system types
- **invitation**: Invitation code types
- **email**: Email campaign types
- **sms**: SMS verification types
- **turnstile**: Cloudflare Turnstile integration
- **analytics**: Analytics and dashboard data
- **validation**: Validation error types
- **system**: System health, Redis config, export data
- **helpers**: Backend helper interfaces

## Benefits of Modular Imports

1. **Tree-shaking**: Import only what you need, reducing bundle size
2. **Better organization**: Types are grouped by domain
3. **Faster IDE**: Smaller import surfaces improve autocomplete performance
4. **Clear dependencies**: Module structure shows relationships between types
