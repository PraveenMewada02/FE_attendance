# Environment Variables Setup

## Required Environment Variables

### For Production/Deployment (Vercel)

Set the following environment variable in your Vercel project settings:

```
VITE_API_DEPLOY_URL=https://your-backend-api-url.com
```

**How to set in Vercel:**
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add a new variable:
   - **Name:** `VITE_API_DEPLOY_URL`
   - **Value:** Your deployed backend URL (e.g., `https://api.example.com`)
   - **Environment:** Production, Preview, Development (or select as needed)

### For Local Development

Create a `.env.local` file in the root directory:

```env
# For local development
VITE_API_BASE_URL=http://localhost:8000

# Or use the deploy URL if testing against deployed backend
# VITE_API_DEPLOY_URL=https://your-backend-api-url.com
```

## Priority Order

The API configuration uses the following priority:
1. `VITE_API_DEPLOY_URL` (for production/deployment)
2. `VITE_API_BASE_URL` (for local development)
3. `http://localhost:8000` (default fallback)

## Notes

- `.env.local` files are automatically ignored by git (already in `.gitignore`)
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- Make sure your backend API has CORS configured to allow requests from your frontend domain

