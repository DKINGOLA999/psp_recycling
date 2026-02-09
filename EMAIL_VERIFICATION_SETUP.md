# Email Verification Setup Guide

## Problem: Users Not Receiving Verification Codes

If users are not receiving verification codes, follow these steps:

## Solution 1: Check Server Console (Development Mode)

If email is **not configured**, the verification codes are automatically printed to your server console/terminal.

**How to find the code:**

1. Start your server: `npm run server`
2. When a user registers, look for this in your terminal:

```
============================================================
📧 EMAIL NOT CONFIGURED - DEVELOPMENT MODE
============================================================
User: John Doe (john@example.com)
Verification Code: 1234
Expires: 2/4/2026, 3:45:00 PM
============================================================
```

3. Enter the **Verification Code** shown in the terminal into the verification modal

## Solution 2: Configure Email Service (Production)

### Step 1: Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

### Step 2: Configure Email Settings in `.env`

#### Option A: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces)

3. **Update your `.env` file**:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=noreply@sigmarecycling.com
```

#### Option B: Other Email Services

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

**SendGrid (Recommended for Production):**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Step 3: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run server
```

### Step 4: Check Console for Confirmation

When the server starts, you should see:

```
✓ Email transporter configured with: {
  host: 'smtp.gmail.com',
  port: 587,
  user: 'your-email@gmail.com',
  secure: false
}
```

If you see warnings about missing environment variables, check your `.env` file.

## Troubleshooting

### Issue: "Invalid credentials" or authentication error

**Gmail:**
- Make sure you're using an **App Password**, not your regular Gmail password
- App Passwords only work if 2FA is enabled

**Outlook:**
- You may need to enable "Less secure app access" in account settings

### Issue: Email sent but not received

1. **Check Spam/Junk folder**
2. **Verify email address** is correct
3. **Check server logs** for errors:
   - Look for `✓ Verification email sent successfully to: user@email.com`
   - Or `✗ Failed to send verification email:` followed by error details

### Issue: "Email transporter not configured"

Your `.env` file is missing email configuration. Either:
- **Development:** Use codes from the console (see Solution 1)
- **Production:** Add email settings to `.env` (see Solution 2)

## Testing Email Configuration

1. Try registering a new user
2. Check the server console:
   - Success: `✓ Verification email sent successfully to: user@email.com`
   - Failure: `✗ Failed to send verification email:` + error message
   - No config: `📧 EMAIL NOT CONFIGURED - DEVELOPMENT MODE` + code in console

## Quick Test (Development)

For quick testing without email setup:

1. Register a user
2. Check server terminal for the verification code
3. Enter the code in the modal
4. Success!

## Need Help?

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `Invalid login: 535-5.7.8 Username and Password not accepted` | Use App Password for Gmail, not regular password |
| `connect ECONNREFUSED` | Wrong EMAIL_HOST or EMAIL_PORT |
| `Missing credentials for "PLAIN"` | EMAIL_USER or EMAIL_PASS not set in .env |
| No error but email not received | Check spam folder, verify EMAIL_FROM is valid |

---

**For Development:** Just use the codes from the console!  
**For Production:** Set up email service properly using this guide.
