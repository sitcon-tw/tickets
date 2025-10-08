# Security Setup Guide

This guide explains how to configure and use the security features implemented in this backend.

## Quick Start

1. Copy `.env.example` to `.env` in both frontend and backend directories
2. Configure the required security variables
3. Run `pnpm install` to install dependencies including security packages
4. Start the server with `pnpm dev` or `pnpm start`

## Required Security Environment Variables

```bash
# Admin Configuration (REQUIRED)
ADMIN_EMAILS=admin@example.com,another-admin@example.com

# Node Environment (REQUIRED in production)
NODE_ENV=production

# Trust Proxy (REQUIRED if behind reverse proxy like Caddy/Nginx)
TRUST_PROXY=true

# Authentication Secret (REQUIRED - use strong random value)
BETTER_AUTH_SECRET=your-super-secret-key-change-this-in-production
```

## Optional Security Configuration

### Rate Limiting

Control how many requests a client can make:

```bash
# Global rate limit (default: 100 requests per 15 minutes)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15 minutes

# Auth endpoint rate limit (default: 5 requests per 15 minutes)
AUTH_RATE_LIMIT_MAX=5

# Registration rate limit (default: 10 requests per hour)
REGISTRATION_RATE_LIMIT_MAX=10
```

### Request Size Limits

Prevent DoS attacks via large payloads:

```bash
# Maximum request body size in bytes (default: 1MB)
MAX_BODY_SIZE=1048576

# Maximum JSON body size in bytes (default: 512KB)
MAX_JSON_SIZE=524288
```

## Security Features Overview

### 1. Rate Limiting

**Purpose**: Prevent brute force attacks and DoS

**How it works**:
- Global rate limit applied to all endpoints
- Stricter limits on authentication endpoints
- Moderate limits on registration endpoints
- IP-based tracking

**Bypass in development**:
Localhost (127.0.0.1, ::1) is automatically exempted in non-production environments.

### 2. Security Headers (Helmet)

**Purpose**: Protect against common web vulnerabilities

**Headers configured**:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME-sniffing protection)
- X-XSS-Protection

**Customization**:
Edit `backend/config/security.js` to modify CSP directives and other header settings.

### 3. Input Sanitization

**Purpose**: Prevent XSS attacks

**How it works**:
- All user inputs are sanitized using DOMPurify
- HTML tags are removed or escaped
- Applied automatically in registration and admin routes

**Usage in your routes**:
```javascript
import { sanitizeObject } from "#utils/sanitize.js";

// Sanitize plain text (removes all HTML)
const sanitizedData = sanitizeObject(formData, false);

// Sanitize but allow safe HTML tags
const sanitizedHtml = sanitizeObject(content, true);
```

### 4. CORS Configuration

**Purpose**: Prevent unauthorized cross-origin requests

**Configuration**:
- Whitelist specified in environment variables
- Development mode allows localhost
- Credentials properly configured

**Modify allowed origins**:
Edit `FRONTEND_URI` and `BACKEND_URI` in `.env`

### 5. Admin Access Control

**Purpose**: Secure admin role assignment

**Configuration**:
Set admin emails in environment variable (comma-separated):
```bash
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

**How it works**:
- When a user signs up with an email in `ADMIN_EMAILS`, they automatically get admin role
- No hardcoded credentials in source code
- Can be changed without code deployment

### 6. Secure Logging

**Purpose**: Prevent sensitive data exposure in logs

**Usage**:
Use Fastify's built-in logger or the secure logger utility:

```javascript
// In route handlers (preferred)
request.log.error("Error occurred", error);
request.log.warn("Warning message");
request.log.info("Info message");

// Using custom secure logger (if needed)
import logger from "#utils/logger.js";

logger.error("Context", error, { additionalData });
logger.warn("Context", "message", { data });
logger.info("Context", "message", { data });
logger.debug("Context", "message", { data }); // Only in development
```

**What gets redacted**:
- Passwords, tokens, secrets
- API keys, authorization headers
- Database connection strings
- Cookie values
- Session data

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `BETTER_AUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Configure `ADMIN_EMAILS` with actual admin email addresses
- [ ] Set `TRUST_PROXY=true` if behind reverse proxy
- [ ] Review and adjust rate limits for expected traffic
- [ ] Ensure HTTPS is enabled (required for secure cookies)
- [ ] Configure proper CORS origins (no wildcards in production)
- [ ] Review CSP directives in `config/security.js`
- [ ] Set up monitoring for rate limit violations
- [ ] Test all security features in staging environment

## Testing Security Features

### Test Rate Limiting

```bash
# Make repeated requests to auth endpoint
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/sign-in/magic-link \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo ""
done
```

Expected: Should get rate limited after 5 requests.

### Test Input Sanitization

```bash
# Try to inject XSS
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -H "Cookie: session_token=..." \
  -d '{
    "eventId": "event123",
    "ticketId": "ticket123",
    "formData": {
      "name": "<script>alert('XSS')</script>John"
    }
  }'
```

Expected: Script tags should be removed from stored data.

### Test Security Headers

```bash
curl -I http://localhost:3000/api/system/health
```

Expected headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (in production)

### Test CORS

```bash
# From unauthorized origin
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/auth/sign-in/magic-link
```

Expected: Should not return Access-Control-Allow-Origin header.

## Monitoring

### What to Monitor

1. **Rate Limit Violations**: Track IPs hitting rate limits frequently
2. **Failed Auth Attempts**: Monitor for brute force patterns
3. **Error Rates**: Sudden spikes might indicate attacks
4. **Unusual Traffic**: Large payload sizes or odd request patterns

### Logs to Watch

```bash
# In production, logs are JSON formatted
grep '"level":"error"' logs.json | jq

# Filter by context
grep '"context":"Auth middleware error"' logs.json
```

## Troubleshooting

### Rate Limit Too Strict
Increase limits in `.env`:
```bash
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=10
```

### CSP Blocking Resources
Edit `backend/config/security.js` to add domains to CSP directives:
```javascript
contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'", "https://trusted-cdn.com"]
  }
}
```

### Admin Role Not Assigned
1. Check `ADMIN_EMAILS` in `.env`
2. Verify email matches exactly (case-sensitive)
3. Check logs for database hook execution
4. Try recreating the user account

### CORS Issues
1. Verify `FRONTEND_URI` and `BACKEND_URI` in `.env`
2. Check if running behind proxy (set `TRUST_PROXY=true`)
3. Review origin in CORS error message
4. In development, localhost should work automatically

## Additional Resources

- [SECURITY.md](../SECURITY.md) - Security policy and features
- [SECURITY_CHECKLIST.md](../SECURITY_CHECKLIST.md) - Vulnerability scan results
- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Guides/Security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Support

For security concerns or questions:
1. Review this documentation
2. Check SECURITY.md for detailed information
3. Contact the development team

## Updates

Keep security dependencies updated:
```bash
pnpm update @fastify/helmet @fastify/rate-limit isomorphic-dompurify
```

Check for security advisories:
```bash
pnpm audit
```
