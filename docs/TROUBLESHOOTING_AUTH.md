# Troubleshooting Authentication Errors

If you see an "Internal Server Error" at `/api/auth/error`, follow these steps.

**If `DATABASE_URL`, `AUTH_SECRET`, and `NEXTAUTH_URL` are already set** (e.g. in Hostinger), the most likely cause is **MongoDB connection** or **no user in the production database**. See sections 2 and 3 below.

## Common Causes

### 1. Missing Environment Variables

**Required variables in production:**
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your site URL, e.g. `https://doddapanenigroup.net`
- `DATABASE_URL` - MongoDB connection string (MongoDB Atlas)

**Check:**
1. Log into your hosting provider (Hostinger, Vercel, etc.)
2. Go to your app's environment variables settings
3. Verify all three variables are set correctly
4. For `NEXTAUTH_URL`, ensure it matches your exact domain (with `https://` and no trailing slash)

### 2. Database Connection Issues (most likely when env vars are set)

If `DATABASE_URL` is correct in the panel but login still hits `/api/auth/error`:

**Symptoms:**
- Login attempts fail with "Internal Server Error"
- Server logs show errors like `MongoServerSelectionError` or `authorize failed`

**Fix:**
1. **MongoDB Atlas Network Access** – In Atlas: Network Access → Add IP Address → allow `0.0.0.0/0` so Hostinger (or any host) can connect. Without this, the DB connection from production will fail and auth will 500.
2. **Password in connection string** – If your MongoDB user password contains `@`, `#`, `:`, `/`, or `%`, it must be [URL-encoded](https://www.w3schools.com/tags/ref_urlencode.asp) in `DATABASE_URL` (e.g. `%40` for `@`).
3. Verify the connection string (user, password, cluster host) is correct and the database name (e.g. `doddapaneni_group`) exists.
4. Check your hosting provider’s **server logs** after a failed login; the app now logs `[auth] authorize failed` with the underlying error.

### 3. User Doesn't Exist in Production Database

**Symptoms:**
- Env vars are set but you still get "Internal Server Error" or "Authentication service unavailable"
- Or you see "Invalid email or password" and you're sure the credentials are correct (then DB might be failing; check logs)

**Fix:**  
The Super Admin must exist in the **same** MongoDB that production uses. Seed from your machine using the **production** `DATABASE_URL`:

```bash
# On your local machine, .env.local must use the SAME DATABASE_URL as Hostinger
DATABASE_URL=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/doddapaneni_group?retryWrites=true&w=majority
SUPER_ADMIN_EMAIL=lk8772000@gmail.com
SUPER_ADMIN_PASSWORD=123456
SUPER_ADMIN_NAME=Super Admin

# Add Super Admin (and other roles) if missing; does not wipe DB
npm run db:seed

# OR wipe production DB and create only this Super Admin (use with care)
npm run db:reset
```

Then log in at `https://doddapanenigroup.net/en/login` (or your domain).

### 4. NEXTAUTH_URL Mismatch

**Symptoms:**
- Works locally but fails in production
- Redirects to `/api/auth/error`

**Fix:**
- Set `NEXTAUTH_URL` to your exact production URL:
  - ✅ `https://doddapanenigroup.net`
  - ❌ `https://doddapanenigroup.net/` (trailing slash)
  - ❌ `http://doddapanenigroup.net` (missing https)
  - ❌ `doddapanenigroup.net` (missing protocol)

### 5. Build/Deployment Issues

**Symptoms:**
- App builds but auth doesn't work
- Old code still running

**Fix:**
1. Rebuild and redeploy your app
2. Clear any build cache
3. Restart the application server
4. Verify the latest code is deployed

## Quick Checklist (env vars already set)

- [ ] **MongoDB Atlas → Network Access** – add `0.0.0.0/0` so your host (e.g. Hostinger) can connect
- [ ] **Super Admin in production DB** – run `npm run db:seed` locally with production `DATABASE_URL` in `.env.local`
- [ ] **Hostinger (or host) logs** – after a failed login, look for `[auth] authorize failed` and the real error (e.g. MongoServerSelectionError)
- [ ] **DATABASE_URL** – no typos; if the DB user password has `@`, `#`, `:`, `/`, `%`, URL-encode it in the string
- [ ] `NEXTAUTH_URL` = `https://doddapanenigroup.net` (no trailing slash)
- [ ] Save env vars and use **Save and redeploy** so the app restarts with the latest config

## Testing

1. **Test login locally** with production `DATABASE_URL`:
   ```bash
   # In .env.local
   DATABASE_URL=<your-production-mongodb-url>
   AUTH_SECRET=<same-as-production>
   NEXTAUTH_URL=http://localhost:3000
   
   npm run dev
   # Try logging in at http://localhost:3000/en/login
   ```

2. **Check server logs** in your hosting provider's dashboard for specific error messages

3. **Verify user exists**:
   ```bash
   # Connect to MongoDB and check
   # Should see user with email: lk8772000@gmail.com
   ```

## Still Not Working?

1. Check your hosting provider's logs for detailed error messages
2. Verify all environment variables are set (not just in `.env.local` but in production settings)
3. Ensure MongoDB Atlas is accessible from your hosting provider's IP
4. Try creating a fresh Super Admin user with `npm run db:reset` pointing to production DB
