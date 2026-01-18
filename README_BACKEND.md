# RepuShield Backend API

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the development server:
```bash
npm run dev
```

The API will run on `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Check if API is running

### Configurations
- `GET /api/configurations` - Get all configurations
- `GET /api/configurations/active` - Get active configuration
- `GET /api/configurations/:id` - Get configuration by ID
- `POST /api/configurations` - Create new configuration
- `PUT /api/configurations/:id` - Update configuration
- `DELETE /api/configurations/:id` - Delete configuration
- `POST /api/configurations/:id/activate` - Activate a configuration

## Running Both Frontend and Backend

From the root directory:
```bash
npm install  # Install concurrently if not already installed
npm run dev:all  # Runs both frontend and backend
```

Or separately:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:backend
```








