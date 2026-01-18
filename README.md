# RepuShield v7

Reputation Monitoring System - Full-stack application for monitoring and analyzing social media posts, news articles, and online mentions.

## Project Structure

```
repushieldv7/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express + TypeScript backend
├── package.json       # Root workspace configuration
└── [documentation files]
```

## Quick Start

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install --legacy-peer-deps
```

### Run Development Servers

**Option 1: Run both servers from root**
```bash
npm run dev:all
```

**Option 2: Run separately**
```bash
# Terminal 1 - Frontend
npm run dev:frontend
# or
cd frontend && npm run dev

# Terminal 2 - Backend
npm run dev:backend
# or
cd backend && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Environment Setup

Create a `.env` file in the `backend/` directory with:

```env
OPENAI_API_KEY=your_openai_key
RAPIDAPI_KEY=your_rapidapi_key
SERPAPI_KEY=your_serpapi_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
FETCH_INTERVAL_MINUTES=10
NODE_ENV=development
```

## Available Scripts

### Root Level
- `npm run dev:all` - Run both frontend and backend
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run build` - Build frontend for production

### Frontend (`frontend/`)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend (`backend/`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

## Features

- **Multi-platform Monitoring**: Twitter, Reddit, Facebook, News
- **Risk Scoring**: AI-powered risk assessment (1-10 scale)
- **Fact-Checking**: Automated fact-checking for high-risk posts
- **Topic Extraction**: Automatic topic identification
- **Real-time Dashboard**: Monitor mentions and sentiment
- **Configuration Management**: Set up monitoring for entities

## Documentation

- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `DATABASE_SETUP.md` - Database configuration
- `API_ENDPOINTS_FIX.md` - API documentation
- `AGENT_ORCHESTRATION.md` - Agent system architecture
