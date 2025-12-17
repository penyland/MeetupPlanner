# MeetupPlanner Admin React

A modern React admin application for managing meetups and speakers, built with React 19, TypeScript, Vite, and Tailwind CSS.

## Features

- 📅 View scheduled meetups
- 📊 RSVP analytics with interactive charts
- 👤 Add and manage speakers
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔒 Type-safe with TypeScript

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- The MeetupPlanner API running (usually at https://localhost:7001)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL if different from the default.

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/      # Reusable components
│   ├── Layout.tsx
│   └── Navigation.tsx
├── pages/          # Page components
│   ├── Home.tsx
│   ├── MeetupPage.tsx
│   ├── AddSpeaker.tsx
│   └── NotFound.tsx
├── services/       # API services
│   ├── apiClient.ts
│   ├── meetupsService.ts
│   └── speakersService.ts
├── types/          # TypeScript type definitions
│   └── index.ts
├── App.tsx         # Main app component with routing
├── main.tsx        # Application entry point
└── index.css       # Global styles with Tailwind
```

## Technology Stack

- **React 19** - UI library
- **TypeScript 5.7** - Type safety
- **Vite 6** - Build tool and dev server
- **React Router 7** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first CSS
- **Recharts 2.15** - Charting library
- **Axios 1.7** - HTTP client

## API Configuration

The application connects to the MeetupPlanner API. Configure the API URL in the `.env` file:

```
VITE_API_BASE_URL=https://localhost:7001
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

See the main project LICENSE file.
