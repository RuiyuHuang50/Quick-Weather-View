// src/utils/api.ts

export interface OpenWeatherData {
  name: string;
  main: {
    feels_like: number;
    humidity: number;
    pressure: number;
    temp: number;
    temp_max: number;
    temp_min: number;
  };
  weather: {
    description: string;
    icon: string;
    id: number;
    main: string;
  }[];
  wind: {
    deg: number;
    speed: number;
  };
}

export type OpenWeatherTempScale = "metric" | "imperial";

export async function fetchOpenWeatherData(
  city: string,
  tempScale: OpenWeatherTempScale
): Promise<OpenWeatherData> {
  // Replace with your actual Vercel deployment URL
  // Example: const API_BASE_URL = "https://quick-weather-view.vercel.app";
  const API_BASE_URL = "https://YOUR_VERCEL_URL_HERE"; // 👈 REPLACE THIS with your Vercel URL
  
  const apiUrl = `${API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}&units=${tempScale}`;

  const res = await fetch(apiUrl);

  if (!res.ok) {
    console.error(`Weather API Error: ${res.status} ${res.statusText}`);
    
    if (res.status === 404) {
      throw new Error(`City "${city}" not found. Please check the city name.`);
    }
    
    if (res.status >= 500) {
      throw new Error("Weather service temporarily unavailable. Please try again later.");
    }
    
    if (res.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    
    // Try to get error message from response
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || "Could not fetch weather data.");
    } catch {
      throw new Error("Could not fetch weather data. Please try again.");
    }
  }

  const data: OpenWeatherData = await res.json();
  return data;
}

export function getWeatherIconSrc(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
