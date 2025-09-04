// Vercel Serverless Function for Weather API
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', false);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req;
  
  try {
    // Health check endpoint
    if (url === '/api' || url === '/api/health') {
      return res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Quick Weather View API' 
      });
    }

    // Weather endpoint
    if (url.startsWith('/api/weather') || url.includes('weather')) {
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
      return res.status(200).json(weatherData);
    }

    // 404 for unknown endpoints
    return res.status(404).json({
      error: 'Endpoint not found',
      available: ['/api/health', '/api/weather?city=London&units=metric']
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}
