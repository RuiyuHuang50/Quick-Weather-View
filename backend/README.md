# Quick Weather View API Server

A secure backend API service for the Quick Weather View Chrome extension.

## Features

- 🔐 Secure API key management (keys never exposed to users)
- 🛡️ Rate limiting to prevent abuse
- 🌍 CORS configured for browser extensions
- 📊 Request logging and error handling
- ⚡ Fast and lightweight Express.js server

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenWeatherMap API key
   ```

3. **Run the server:**
   ```bash
   # Development (with auto-restart)
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Weather Data
```
GET /api/weather?city=London&units=metric
```

**Parameters:**
- `city` (required): City name
- `units` (optional): `metric` or `imperial` (defaults to `metric`)

**Response:**
```json
{
  "name": "London",
  "main": {
    "temp": 20.5,
    "feels_like": 19.8,
    "humidity": 65
  },
  "weather": [
    {
      "main": "Clouds",
      "description": "broken clouds",
      "icon": "04d"
    }
  ],
  "wind": {
    "speed": 3.2
  }
}
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to your repo
3. Set `OPENWEATHER_API_KEY` environment variable
4. Deploy automatically

### Option 2: Heroku
1. Create Heroku app
2. Set environment variables
3. Deploy via Git

### Option 3: Digital Ocean App Platform
1. Create app from GitHub repo
2. Configure environment variables
3. Deploy

### Option 4: Vercel (Serverless)
1. Install Vercel CLI
2. Deploy with `vercel`
3. Set environment variables in dashboard

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation
- Error handling without exposing sensitive info
- Helmet.js security headers

## Environment Variables

- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (required)
- `PORT`: Server port (optional, defaults to 3000)
- `NODE_ENV`: Environment mode (development/production)
