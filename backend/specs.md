# SITCON 2026 Registration System Requirements

## 📌 System Objectives

Design a comprehensive registration system for SITCON 2026 camps and related activities, supporting:
- Multi-ticket type registration and management
- Conditional form fields
- Invitation code mechanisms
- Order inquiry and statistics
- Activity landing page and backend management
- Check-in functionality

---

## 🧭 User Registration Flow

### 1. Landing Page Entry
- Display basic event information:
  - Event name, date, location, organizer
  - Contact person and methods
  - OG image and event description
- Auto-select corresponding ticket types or show invitation-only tickets if URL contains invitation code parameters

### 2. Registration Page
- Display ticket type selection including:
  - Ticket name and price
  - Available quantity
  - Invitation code requirement status
  - Sales period (accurate to the minute)
- Require invitation code input for restricted ticket types

### 3. Dynamic Registration Form
- Form fields displayed based on selected ticket type configuration

### 4. Form Submission and Terms Agreement
- File upload validation (format and size restrictions)
- Email field with regex validation

### 5. Registration Success
- Generate unique check-in identification code (text or numeric UID)
- Generate QR code and order number (numeric only)
- Send registration confirmation email

---

## 🎟️ Registration and Ticket Specifications

### Ticket Management
Support multiple ticket types with the following attributes:
- **Ticket Name**: Display name for the ticket type
- **Sales Period**: Registration opening and closing times (accurate to minutes)
- **Sales Limit**: Total number of tickets available
- **Purchase Limit**: Maximum tickets per transaction (default: 1)
- **Frontend Visibility**: Whether to display on frontend (for internal/reserved tickets)
- **Invitation Code Requirement**: Whether invitation code is required
- **Form Field Configuration**: Display/required field settings

### Invitation Code Features
- Auto-generate invitation codes based on ticket types or manual setup
- Set usage limits per invitation code and corresponding ticket types
- Support invitation codes as URL parameters for quick registration

---

## 📝 Form Field Types

| Field Type | Supported Features |
|------------|-------------------|
| Single-line Text | Required/Optional |
| Multi-line Text | Required/Optional |
| Email | Regex validation included |
| Radio Button | Custom options |
| Checkbox | Custom options |
| Dropdown | Custom options |
| File Upload | Format and size restrictions |
| Description Text | Display only, non-input |

### Conditional Display
- Each field can be configured to display/require based on ticket type
- Support block-style description text interspersed between fields

---

## 📧 Email and Identification Information

### Generated Information per Registration:
- **Order ID**: Numeric, auto-incrementing
- **Unique Check-in ID**: Alphanumeric characters allowed
- **QR Code**: Generated based on check-in ID

### Registration Confirmation Email Contents:
- Event information
- Registration data summary
- QR code image
- Unique check-in code and order number

---

## 🛠️ Backend Functionality

### Registration Overview
- View ticket type sales quantities (sold/limit)
- Export registration data (CSV, Excel)
- Referral source statistics support (optional tracking of source URLs or invitation codes)

### Order Inquiry
**Filter Conditions:**
- Order number
- Unique identification code
- Email
- Name
- Any field value (fuzzy search)

**Features:**
- View detailed individual registration data (including form content and attachments)
- Cancel individual orders with optional cancellation reason notification to customers
- **Registration/Check-in time limit: 15 minutes**

### Form Management
- Edit field display and required settings for ticket types
- Add/modify/delete fields (without affecting existing registration data)

### Ticket Management
- Create/edit/delete ticket types
- Modify ticket names, times, quantities, visibility, and invitation code requirements

### Landing Page Editor
**Customizable Elements:**
- Event name and description
- Event date and location
- OG image and meta description
- Contact person and methods

### Invitation Code Management
- Auto or manual invitation code creation
- Set usage limits and ticket type associations
- Generate quick registration links with invitation codes (with preset ticket types)

### Access Control
**User Roles:**
- **Admin**: Full system access
- **Check-in Staff**: Read-only access to registration lists and check-in pages

**Features:**
- Add/remove administrator accounts

### Bulk Email System
**Features:**
- Select recipients (e.g., specific ticket types, all registrants)
- Custom email subject and content (HTML support)
- Form field substitution (name, check-in code, etc.)
- Email sending records and status tracking

---

## 🔄 System Flow Diagram

```
[Landing Page]
     ↓
[Ticket Selection (with invitation code verification)]
     ↓
[Dynamic Form Completion + Terms Agreement]
     ↓
[Submit → Generate Registration Info + Send Email]
     ↓
[Backend: Consolidate registration data, invitation management, export, statistics]
```

---

## 📣 Referral System

### 🎯 Functionality Goals
Enable each registered user to have a unique referral link to share with friends. Track referral effectiveness and spread patterns, support random draws, statistical analysis, and visualization.

### 👤 Frontend Features

#### 1. Post-Registration Referral Information
**Display:**
- Unique referral link with user identification parameter
```
https://sitcon.org/2026/register?ref=abcdef123456
```
- Share buttons (copy, Line, Facebook, X)

#### 2. Auto-populate Referrer Field
When users enter through referral links, the system will:
- Automatically store referrer identification code in form data (non-public field)
- Allow backend to view referrer for each registration

### 🛠️ Backend Features

#### 1. Referrer Association Query and Display
- Add "Referrer (Check-in Code + Email + Name)" field to each order
- **Filter Support:**
  - All registrants referred by specific user
  - Registrations without referrers
- Support referral tree visualization (expansion diagram)

#### 2. Referral Tree Visualization
**Display expansion relationship diagram with referrer as root:**
- Hierarchy levels (which invitation level)
- Nodes showing referrer + count
- Support node expansion/export of all registrants in tree

#### 3. Qualified Referrer List and Random Sampling
- Set thresholds (e.g., "refer 2+ people")
- Display all qualified referrers
- **Provide:**
  - CSV export (referrer check-in code, name, email, referral count)
  - Random selection of N qualified referrers (built-in random draw mechanism)

#### 4. Statistics and Reports
**Display:**
- Referral count leaderboard (sortable)
- Referral count distribution chart (bar chart)
- Multi-level referral counts (e.g., Level 1: 120 people, Level 2: 38 people...)

### 🔄 Flow Diagram (with Referral System)

```
[User A completes registration]
     ↓
Generate A's unique link: https://.../?ref=A1234
     ↓
[User B enters through A's link]
     ↓
User B completes registration (system records ref=A1234)
     ↓
Backend shows: B's referrer is A
     ↓
A's referral count +1
     ↓
Backend statistics, tree diagram update, referral threshold check → Enter draw pool
```

### 🧩 Data Field Design Reference

| Field | Type | Description |
|-------|------|-------------|
| `referrer_id` | Text | Referrer's check-in code or UID |
| `ref_count` | Integer | Number of successful referrals by this user |
| `ref_tree_path` | Array | Tree structure tracking (e.g., [A → B → C]) |
| `ref_link` | Text | Unique referral link |

---

## 📦 Additional Module 1: Registration Edit and Cancellation (with Email Verification)

### 🎯 Module Objectives
Allow registrants to request edit or cancellation links before registration deadline. System provides temporary authorized edit access through email verification for enhanced security and link abuse prevention.

### 🔁 User Operation Flow

1. **Access Registration Query and Edit Page**
   - Input fields: Email and registration number (or ID/UID)

2. **System Verification**
   - If successful, display "Verification link will be sent to your email"

3. **Email Verification**
   - User clicks edit or cancel registration link in email

4. **Edit Page Access**
   - Only authorized fields are editable
   - Can cancel registration if ticket type allows

### 🔐 Security and Verification Design

| Item | Description |
|------|-------------|
| Verification Method | Temporary authorization link via registrant's email |
| Link Format | `https://sitcon.org/2026/edit?token=xxxxx` |
| Token Validity | Default 30 minutes (adjustable) |
| Single-use Limitation | One-time use, expires after click (can resend) |
| Rate Limiting | Prevent brute force: max 3 requests per hour |
| Token Algorithm | Recommend HMAC or JWT (including registration UID, email, expiry) |

### ✏️ Edit Functionality

| Feature | Description |
|---------|-------------|
| Editable Fields | Each field can be set as "editable" in backend |
| Edit Frequency | Optional repeated edits (recommended to allow) |
| Modification Records | Auto-record modified fields, time, source IP |
| Non-editable Items | Email, ticket type, ID fields (default non-modifiable) |

### ❌ Cancellation Functionality

| Feature | Description |
|---------|-------------|
| Cancelable Ticket Settings | Each ticket type individually configurable |
| Cancellation Deadline | Cannot cancel N days before event (e.g., 3 days) |
| Cancellation Confirmation | Display "Cancellation cannot be undone, please confirm" |
| Post-cancellation Processing | Release quota, set status to "cancelled", send cancellation email |
| Non-cancelable Cases | Display "Cannot cancel" if past deadline or ticket type doesn't support |

### 🖥️ Backend Feature Additions

| Feature | Description |
|---------|-------------|
| Query Modification Records | View modification and cancellation records for each registration |
| Enable/Disable Feature | Each event can choose to enable edit/cancel module |
| Modification Limit Settings | Set allowed modification count, token validity time, etc. |
| Link Sending Records | View edit link request records and status for each registrant |
| Manual Link Sending | Administrators can manually resend edit/cancel links |

### 📧 Email Design (Edit/Cancel Links)

**Subject (Chinese):** 【SITCON 2026】報名資料編輯連結  
**Subject (English):** [SITCON 2026] Registration Edit Request Link

**Content includes:**
- Event name and date
- Registrant basic information summary (name, registration number)
- Click button below to edit or cancel registration
- Security reminder: Link for personal use only, valid for 30 minutes
- Ignore this email if not requested by you

### 🧩 Additional Data Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `edit_token_hash` | Text | Token hash value |
| `edit_token_expiry` | DateTime | Token expiry time |
| `last_edit_request_time` | DateTime | Last request time (for rate limiting) |
| `edit_audit_log` | Array | Modification records with content and timestamps |
| `is_cancelled` | Boolean | Whether registration is cancelled |
| `cancel_reason` | Text | (Optional) Cancellation reason note |

### ✅ Module Settings and Controls

| Setting Item | Description |
|--------------|-------------|
| `enable_edit_module` | Whether to enable registrant edit functionality |
| `enable_cancel_module` | Whether to enable registrant cancellation functionality |
| `editable_fields[]` | List of editable field IDs |
| `cancelable_ticket_ids[]` | List of cancelable ticket type IDs |

---

## ✅ Engineering Considerations

- Each registrant must have a unique check-in code for referral identification
- All referral records must prevent fraud (link parameter modification, self-referral)
- Invitation code mechanism and referral link mechanism should work simultaneously but as different functional paths
- If users click multiple invitation codes, the final referral link used at the time of registration determines the referrer