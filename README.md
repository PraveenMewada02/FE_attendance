# Attendance Management System - Frontend

A modern, responsive frontend application built with React, TypeScript, and Vite for managing employee attendance data.

## Features

- 📊 **Dashboard**: Overview with statistics and charts
- 👥 **Attendance Data**: View and search attendance records
- 🔍 **MCID Data**: Fetch and process MCID punch data
- 📁 **File Management**: View and manage stored punch data files
- 📈 **Analytics**: Detailed analytics and insights with visualizations

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Axios** - HTTP client
- **Recharts** - Chart library
- **Lucide React** - Icons
- **date-fns** - Date utilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (required):
```env
VITE_API_DEPLOY_URL=https://your-backend-api-url.com
```
**Note:** This environment variable is required for the application to work.

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Layout/      # Main layout with sidebar
│   └── DataTable/   # Data table component
├── pages/           # Page components
│   ├── Dashboard/   # Dashboard page
│   ├── Attendance/  # Attendance data page
│   ├── MCID/        # MCID data page
│   ├── Files/       # Files management page
│   └── Analytics/   # Analytics page
├── services/        # API services
│   └── api.ts       # API client
├── types/           # TypeScript type definitions
│   └── index.ts
├── App.tsx          # Main app component with routing
└── main.tsx         # Entry point
```

## API Integration

The frontend connects to the Django backend API. Configure the API URL using the `VITE_API_DEPLOY_URL` environment variable in `.env.local`.

### Available Endpoints

- `/inout/list/` - Fetch and save attendance data
- `/inout/search/` - Search attendance data
- `/inout/filter/` - Filter by employee
- `/mcid-data/fetch/` - Fetch MCID data
- `/mcid-data/process/` - Process MCID data
- `/files/all/` - Get all files
- `/files/file/<id>/` - Get file by ID
- `/files/process/<id>/` - Process file

## Features in Detail

### Dashboard
- Real-time statistics (total employees, records, today's attendance, average work time)
- Attendance trend chart (last 7 days)
- Work time distribution chart

### Attendance Data
- Search by date range
- Filter by employee code
- Export data to CSV
- Sortable and searchable table

### MCID Data
- Fetch MCID data from external API
- Process MCID data with operations
- View statistics (saved count, duplicates, etc.)
- Export processed data

### Files
- View all stored punch data files
- Download files
- Process files
- View file metadata

### Analytics
- Attendance trend analysis
- Status distribution (pie chart)
- Top employees by attendance
- Work time distribution

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

The Vite dev server is configured to proxy API requests to the Django backend. Update `vite.config.ts` if your backend runs on a different port.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
