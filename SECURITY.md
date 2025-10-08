# Security Policy

## Overview

This document outlines the security measures implemented in the SITCON 2026 Tickets system and provides guidelines for reporting security vulnerabilities.

## Security Features

### 1. Authentication & Authorization

- **Magic Link Authentication**: Passwordless authentication using Better Auth
- **Session Management**: Secure session cookies with HTTP-only and SameSite attributes
- **Role-Based Access Control (RBAC)**: Admin, staff, and viewer roles with granular permissions
- **Token Expiration**: Magic links expire after 10 minutes

### 2. Input Validation & Sanitization

- **XSS Prevention**: All user inputs are sanitized using DOMPurify before storage
- **SQL Injection Prevention**: Using Prisma ORM with parameterized queries
- **Form Validation**: Dynamic validation based on ticket form field configurations
- **Type Checking**: Strict validation of data types and formats

### 3. Rate Limiting

Rate limiting is applied to prevent abuse and DoS attacks:

- **Global Rate Limit**: 100 requests per 15 minutes per IP
- **Auth Endpoints**: 5 requests per 15 minutes (stricter for login attempts)
- **Registration Endpoints**: 10 requests per hour per IP

Configure these limits via environment variables:
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15 minutes
AUTH_RATE_LIMIT_MAX=5
REGISTRATION_RATE_LIMIT_MAX=10
```

### 4. Security Headers

Implemented via @fastify/helmet:

- **Content Security Policy (CSP)**: Restricts resource loading
- **HSTS**: Forces HTTPS connections (1 year max-age)
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME-sniffing
- **X-XSS-Protection**: Enables browser XSS filtering

### 5. CORS Configuration

- **Whitelisted Origins**: Only specified frontend and backend URIs are allowed
- **Credentials**: CORS credentials properly configured for cross-origin requests
- **Development Mode**: Localhost access allowed in non-production environments

### 6. Request Size Limits

To prevent DoS attacks via large payloads:

- **Body Size Limit**: 1MB (default)
- **JSON Size Limit**: 512KB (default)

Configure via environment variables:
```bash
MAX_BODY_SIZE=1048576
MAX_JSON_SIZE=524288
```

### 7. Admin Access Control

- **No Hardcoded Credentials**: Admin emails are configured via environment variables
- **Environment-Based Assignment**: Automatic admin role assignment based on `ADMIN_EMAILS` env var

Example:
```bash
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

### 8. Database Security

- **Connection Pooling**: Proper connection management via Prisma
- **Prepared Statements**: All queries use parameterized statements
- **Transaction Support**: ACID compliance for critical operations
- **Data Integrity**: Foreign key constraints and unique indexes

### 9. Error Handling

- **Safe Error Messages**: No sensitive information in error responses
- **Structured Logging**: Errors logged server-side with full details
- **Client-Friendly Messages**: User-facing errors are sanitized and localized

## Configuration

### Required Environment Variables

```bash
# Authentication
BETTER_AUTH_SECRET=<strong-random-secret>

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Security Settings
NODE_ENV=production
TRUST_PROXY=true
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5
REGISTRATION_RATE_LIMIT_MAX=10
MAX_BODY_SIZE=1048576
MAX_JSON_SIZE=524288
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `BETTER_AUTH_SECRET` with a strong random value
- [ ] Set `ADMIN_EMAILS` with authorized admin email addresses
- [ ] Enable `TRUST_PROXY=true` if behind a reverse proxy
- [ ] Configure appropriate rate limits
- [ ] Ensure CORS origins are properly whitelisted
- [ ] Use HTTPS for all connections
- [ ] Keep dependencies up to date
- [ ] Regular security audits

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please follow responsible disclosure:

1. **Do NOT** open a public issue
2. Email security concerns to: [security contact email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

- Regularly update dependencies using `pnpm update`
- Monitor security advisories from:
  - npm security advisories
  - Prisma security updates
  - Fastify security releases
  - Better Auth security announcements

## Audit Log

| Date | Version | Changes |
|------|---------|---------|
| 2024-XX-XX | 1.0.0 | Initial security implementation |
| - | - | Added rate limiting, helmet, input sanitization |
| - | - | Removed hardcoded admin credentials |
| - | - | Implemented CORS whitelisting |

## Additional Resources

- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Guides/Security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Better Auth Security](https://www.better-auth.com/docs/concepts/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)

## Contact

For security-related questions or concerns, please contact the development team.
