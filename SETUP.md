# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Backend URL (Optional)**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
   If not set, defaults to `http://localhost:8000`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`

## Django Backend Configuration

Make sure your Django backend is configured to allow CORS requests from the frontend:

1. **Install django-cors-headers** (if not already installed):
   ```bash
   pip install django-cors-headers
   ```

2. **Add to Django settings.py**:
   ```python
   INSTALLED_APPS = [
       ...
       'corsheaders',
       ...
   ]

   MIDDLEWARE = [
       ...
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       ...
   ]

   # Allow all origins for development (change for production)
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]

   # Or allow all origins (development only)
   CORS_ALLOW_ALL_ORIGINS = True
   ```

3. **Start Django Server**:
   ```bash
   python manage.py runserver
   ```

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console, make sure:
- `django-cors-headers` is installed and configured
- Django server is running
- Frontend is accessing the correct backend URL

### API Connection Issues
- Verify Django server is running on port 8000
- Check browser console for error messages
- Verify API endpoints are correct in `src/services/api.ts`

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview the build**:
   ```bash
   npm run preview
   ```

3. **Deploy**:
   - The `dist` folder contains the production build
   - Serve it with any static file server (nginx, Apache, etc.)
   - Or deploy to platforms like Vercel, Netlify, etc.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Django backend API URL | `http://localhost:8000` |

## Features Overview

- ✅ Dashboard with statistics and charts
- ✅ Attendance data search and filtering
- ✅ MCID data fetch and processing
- ✅ File management
- ✅ Analytics with visualizations
- ✅ Responsive design
- ✅ Data export (CSV)
- ✅ Sortable and searchable tables

