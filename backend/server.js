const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting - adjust as needed
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: [
    'chrome-extension://*', // Allow all Chrome extensions
    'moz-extension://*',    // Allow all Firefox extensions (if you plan to support)
    'http://localhost:*',   // For development
    'https://localhost:*'   // For development with HTTPS
  ],
  methods: ['GET'],
  credentials: false
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const { city, units = 'metric' } = req.query;
    
    // Validate required parameters
    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    // Validate units parameter
    if (!['metric', 'imperial'].includes(units)) {
      return res.status(400).json({
        error: 'Units must be either "metric" or "imperial"'
      });
    }

    // Check if API key is configured
    if (!process.env.OPENWEATHER_API_KEY) {
      console.error('OPENWEATHER_API_KEY environment variable not set');
      return res.status(500).json({
        error: 'Weather service configuration error'
      });
    }

    // Make request to OpenWeatherMap API
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${process.env.OPENWEATHER_API_KEY}`;
    
    console.log(`Fetching weather for: ${city} (${units})`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        return res.status(500).json({
          error: 'Weather service authentication error'
        });
      }
      
      if (response.status === 404) {
        return res.status(404).json({
          error: `City "${city}" not found. Please check the city name.`
        });
      }
      
      return res.status(500).json({
        error: 'Weather service temporarily unavailable'
      });
    }
    
    const weatherData = await response.json();
    
    // Return the weather data
    res.json(weatherData);
    
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Quick Weather View API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌤️  Weather API: http://localhost:${PORT}/api/weather?city=London&units=metric`);
});

module.exports = app;
