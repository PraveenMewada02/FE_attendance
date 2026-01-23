# Environment Variables Setup

## Required Environment Variables

### VITE_API_DEPLOY_URL

This is the **only** environment variable required for the application. It specifies the backend API URL.

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

**IMPORTANT:** For local development, you MUST create a `.env.local` file in the root directory.

1. Create a file named `.env.local` in the root of your project
2. Add your environment variable:

```env
VITE_API_DEPLOY_URL=https://your-deployed-backend-url.com
```

**After creating `.env.local`:**
- Restart your development server (`npm run dev`)
- The environment variables will be loaded automatically

**Note:** If `VITE_API_DEPLOY_URL` is not set, the application will show an error in the console and API calls will fail.

## Notes

- `.env.local` files are automatically ignored by git (already in `.gitignore`)
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- Make sure your backend API has CORS configured to allow requests from your frontend domain

