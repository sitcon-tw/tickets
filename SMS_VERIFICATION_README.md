# SMS Verification System

This document describes the SMS verification system implemented for the ticketing platform.

## Overview

The SMS verification system allows tickets to optionally require phone number verification via SMS before users can register. This adds an extra layer of security and identity verification for sensitive events.

## Features

1. **Optional SMS Verification per Ticket**: Each ticket can be configured to require SMS verification
2. **Independent Verification Page**: Dedicated `/[locale]/verify` page for SMS verification
3. **Two Verification Flows**:
   - After magic link login (for phone verification)
   - When accessing tickets that require SMS verification
4. **Rate Limiting**: Prevents SMS spam with 60-second cooldown between sends
5. **Code Expiry**: Verification codes expire after 10 minutes
6. **Multi-language Support**: SMS messages sent in user's preferred language

## Database Schema Changes

### Added Fields to `Ticket` Table
- `requireSmsVerification` (Boolean, default: false) - Whether this ticket requires SMS verification

### Added Fields to `User` Table
- `phoneNumber` (String, optional) - User's verified phone number
- `phoneVerified` (Boolean, default: false) - Whether phone is verified

### New `SmsVerification` Table
- `id` (String) - Unique identifier
- `userId` (String) - User who requested verification
- `phoneNumber` (String) - Phone number being verified
- `code` (String) - 6-digit verification code
- `purpose` (String) - "ticket_access" or "phone_verification"
- `ticketId` (String, optional) - Associated ticket if purpose is ticket_access
- `verified` (Boolean, default: false) - Whether code was verified
- `expiresAt` (DateTime) - When code expires
- `createdAt`, `updatedAt` (DateTime) - Timestamps

## API Endpoints

### POST `/api/sms-verification/send`
Send SMS verification code.

**Auth Required**: Yes

**Body**:
```json
{
  "phoneNumber": "0912345678",
  "purpose": "ticket_access" | "phone_verification",
  "ticketId": "ticket_id_here",  // Required if purpose is ticket_access
  "locale": "zh-Hant" | "zh-Hans" | "en"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "expiresAt": "2025-10-11T12:00:00.000Z"
  },
  "message": "驗證碼已發送"
}
```

### POST `/api/sms-verification/verify`
Verify SMS code.

**Auth Required**: Yes

**Body**:
```json
{
  "phoneNumber": "0912345678",
  "code": "123456",
  "purpose": "ticket_access" | "phone_verification",
  "ticketId": "ticket_id_here"  // Required if purpose is ticket_access
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "purpose": "ticket_access",
    "ticketId": "ticket_id_here"
  },
  "message": "驗證成功"
}
```

### GET `/api/sms-verification/check/:ticketId`
Check if user needs SMS verification for a ticket.

**Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "requiresVerification": true,
    "isVerified": false,
    "phoneNumber": "0912345678"  // If already verified
  }
}
```

### GET `/api/sms-verification/status`
Get user's phone verification status.

**Auth Required**: Yes

**Response**:
```json
{
  "success": true,
  "data": {
    "phoneNumber": "0912345678",
    "phoneVerified": true
  }
}
```

## Frontend Implementation

### Verification Page
- Located at: `frontend-new/app/[locale]/verify/page.tsx`
- Handles both phone verification and ticket access verification
- Features:
  - Phone number input with validation
  - Send code button with countdown timer
  - 6-digit code input
  - Automatic redirect on success

### URL Parameters
- `purpose`: "ticket_access" or "phone_verification"
- `ticketId`: Required if purpose is ticket_access
- `redirect`: URL to redirect to after successful verification

### Example URLs
```
# Phone verification
/zh-Hant/verify?purpose=phone_verification&redirect=/zh-Hant/

# Ticket access verification
/zh-Hant/verify?purpose=ticket_access&ticketId=abc123&redirect=/zh-Hant/event123/form
```

## User Flows

### Single Flow: When Accessing SMS-Required Ticket
1. User logs in via magic link (normal flow, no SMS verification yet)
2. User browses events and clicks on a ticket
3. System checks if ticket requires SMS verification via API
4. If required and not verified, redirects to `/[locale]/verify` page
5. User enters phone number and receives SMS code
6. User enters code to verify
7. After successful verification, proceeds to registration form
8. Subsequent access to same ticket doesn't require re-verification (unless expired)

**Note**: SMS verification only happens when the user tries to access a ticket that requires it, not during login.

## Configuration

### Environment Variables
Add these to `backend/.env`:

```env
# TwSMS API Credentials
TWSMS_USERNAME=your_username_here
TWSMS_PASSWORD=your_password_here
```

### Obtaining TwSMS Credentials
1. Register at https://www.twsms.com
2. Enable API in Account Settings → API Settings
3. Use your account username and password

### SMS Message Format
Messages are automatically localized:

**Traditional Chinese (zh-Hant)**:
```
您的驗證碼是：123456
此驗證碼將在10分鐘後過期。
```

**Simplified Chinese (zh-Hans)**:
```
您的验证码是：123456
此验证码将在10分钟后过期。
```

**English (en)**:
```
Your verification code is: 123456
This code will expire in 10 minutes.
```

## Admin Configuration

### Enabling SMS Verification for Tickets

To enable SMS verification for a ticket:

1. Go to Admin Panel → Tickets
2. Create or edit a ticket
3. Check the "Require SMS Verification" checkbox (需要簡訊驗證)
4. Save the ticket

The checkbox appears below the "Require Invite Code" option in the ticket form.

### Admin API Endpoints

#### GET `/api/admin/sms-verification-logs`
Get SMS verification logs with pagination and filters.

**Query Parameters**:
- `userId` (string, optional) - Filter by user ID
- `phoneNumber` (string, optional) - Filter by phone number (partial match)
- `purpose` (string, optional) - Filter by purpose: "ticket_access" or "phone_verification"
- `ticketId` (string, optional) - Filter by ticket ID
- `verified` (boolean, optional) - Filter by verification status
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Items per page

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_id",
        "userId": "user_id",
        "phoneNumber": "0912345678",
        "code": "******",  // Masked for security
        "purpose": "ticket_access",
        "ticketId": "ticket_id",
        "verified": true,
        "expiresAt": "2025-10-11T12:00:00.000Z",
        "createdAt": "2025-10-11T11:50:00.000Z",
        "user": {
          "id": "user_id",
          "email": "user@example.com",
          "name": "User Name"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**Security Notes**:
- Verification codes are masked in the response
- Expired codes show "EXPIRED"
- Pending unverified codes show "PENDING"

#### GET `/api/admin/sms-verification-stats`
Get SMS verification statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalSent": 150,
    "totalVerified": 120,
    "totalExpired": 25,
    "successRate": 80.00,
    "byPurpose": {
      "ticket_access": 100,
      "phone_verification": 50
    },
    "recentActivity": {
      "ticket_access": 15,
      "phone_verification": 10
    }
  }
}
```

### Viewing Logs (UI)

While a dedicated admin UI page for logs wasn't created in this implementation, you can:

1. **Access logs via API**: Use the endpoints above directly
2. **View in database**: Query the `sms_verification` table directly
3. **Create custom admin page**: Use the provided API endpoints to build a logs viewer

Example logs page location (if you want to create it):
- Frontend path: `frontend-new/app/[locale]/admin/sms-logs/page.tsx`
- Use `adminSmsVerificationAPI.getLogs()` and `adminSmsVerificationAPI.getStats()`

## Security Features

1. **Rate Limiting**: Users can only request one SMS per minute per phone number
2. **Code Expiry**: Verification codes expire after 10 minutes
3. **One-Time Use**: Codes can only be verified once
4. **Session Required**: All endpoints require authentication
5. **User Isolation**: Users can only verify codes they requested
6. **Phone Number Validation**: Taiwan mobile format (09xxxxxxxx) enforced

## Cost Considerations

TwSMS charges per message:
- Standard SMS (up to 70 Chinese or 160 English chars): 1 point
- Long SMS: Multiple points based on length

Verification messages are short, using 1 point per send.

## Testing

### Test SMS Sending (Development)
```bash
# Set test credentials in .env
TWSMS_USERNAME=test_user
TWSMS_PASSWORD=test_pass

# Note: Real SMS will be sent, ensure you have test credits
```

### Manual Testing Checklist
- [ ] Can send SMS verification code
- [ ] Countdown timer works (60 seconds)
- [ ] Can verify with correct code
- [ ] Cannot verify with wrong code
- [ ] Cannot verify expired code
- [ ] Ticket access requires verification when enabled
- [ ] Ticket access works without verification when disabled
- [ ] Phone number persists after verification
- [ ] Redirects work correctly after verification

## Troubleshooting

### SMS Not Sending
1. Check TWSMS credentials in `.env`
2. Verify API is enabled in TwSMS account settings
3. Check account has sufficient credits
4. Verify phone number format (must be 09xxxxxxxx for Taiwan)

### Code Not Verifying
1. Check code hasn't expired (10 minutes)
2. Ensure code matches exactly (6 digits)
3. Verify user is logged in
4. Check code hasn't been used already

### Rate Limit Issues
- Users must wait 60 seconds between SMS sends
- Check `createdAt` in `sms_verification` table

## Files Modified/Created

### Backend
- `backend/prisma/schema.prisma` - Database schema updates
- `backend/lib/sms.js` - TwSMS API integration
- `backend/routes/public/smsVerification.js` - Public SMS verification routes
- `backend/routes/admin/smsVerificationLogs.js` - Admin SMS logs routes
- `backend/routes/public.js` - Public route registration
- `backend/routes/admin.js` - Admin route registration
- `backend/schemas/ticket.js` - Ticket schema with SMS field

### Frontend
- `frontend-new/app/[locale]/verify/page.tsx` - SMS verification page
- `frontend-new/app/[locale]/login/magic-link/page.tsx` - Updated magic link flow
- `frontend-new/app/[locale]/admin/tickets/page.tsx` - Admin ticket management with SMS toggle
- `frontend-new/components/home/Tickets.tsx` - Ticket verification check
- `frontend-new/lib/api/endpoints.ts` - API client methods (public + admin)

## Future Enhancements

Potential improvements:
1. Support international phone numbers
2. Add SMS verification to registration form directly
3. Allow users to update phone number
4. Add admin view of verification logs
5. Support multiple SMS providers
6. Add SMS templates customization
