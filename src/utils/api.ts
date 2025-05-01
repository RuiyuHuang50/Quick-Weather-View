// src/utils/api.ts
import { getStoredOptions, LocalStorageOptions } from "./storage";

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
  const options: LocalStorageOptions = await getStoredOptions();

  // 2. Check if API key exists
  if (!options.apiKey) {
    console.error("API Key not found in storage.");
    throw new Error("API Key not set. Please set it in the extension options.");
  }

  const apiKey = options.apiKey;
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${tempScale}&appid=${apiKey}`;

  const res = await fetch(apiUrl);

  if (!res.ok) {
    console.error(`API Error: ${res.status} ${res.statusText}`);
    if (res.status === 401) {
      // Specific error for invalid key
      throw new Error(
        "Invalid API Key. Please check it in the extension options."
      );
    }
    if (res.status === 404) {
      throw new Error(`City "${city}" not found. Please check the city name.`);
    }
    // Generic error for other issues
    throw new Error(
      "Could not fetch weather data. Check city name or API key."
    );
  }

  const data: OpenWeatherData = await res.json();
  return data;
}

export function getWeatherIconSrc(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
