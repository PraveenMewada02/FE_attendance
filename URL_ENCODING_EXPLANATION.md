# URL Encoding Explanation

## What is `%2F`?

The `%2F` you see in the URL is **normal and expected**. It's the URL-encoded version of the `/` character.

### Example:
- **What you type:** `22/01/2026`
- **What appears in URL:** `22%2F01%2F2026`
- **What the backend receives:** `22/01/2026` (automatically decoded)

## Why does this happen?

Browsers automatically encode special characters in URLs to ensure they're transmitted correctly. The `/` character has special meaning in URLs (it separates path segments), so it gets encoded as `%2F` when used in query parameters.

## Is this a problem?

**No!** This is completely normal and expected behavior:

1. ✅ The browser automatically encodes it when sending
2. ✅ Django automatically decodes it when receiving
3. ✅ Your backend receives the correct date: `22/01/2026`

## How to verify?

1. Check your Django backend logs - you'll see it receives `22/01/2026` (not `22%2F01%2F2026`)
2. Check the browser console - the request interceptor logs show the decoded parameters
3. The API works correctly - your backend is returning 200 status codes

## What I've added:

1. **Date validation** - Ensures dates are in DD/MM/YYYY format before sending
2. **Request logging** - Shows exactly what's being sent to the API
3. **Date normalization** - Automatically formats dates correctly

## Summary

The `%2F` is just how browsers display encoded `/` characters in URLs. Your dates are being sent and received correctly. Everything is working as expected! 🎉

