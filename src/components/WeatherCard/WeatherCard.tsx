// src/components/WeatherCard/WeatherCard.tsx
// Polished MUI v4: With Loading Skeletons and Improved Error Display

import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Paper } from "@material-ui/core";
import { Skeleton, Alert } from "@material-ui/lab";
import {
  getWeatherIconSrc,
  fetchOpenWeatherData,
  OpenWeatherData,
  OpenWeatherTempScale,
} from "../../utils/api";
import "./WeatherCard.css";

type WeatherCardState = "loading" | "error" | "ready";

const WeatherCard: React.FC<{
  city: string;
  tempScale: OpenWeatherTempScale;
}> = ({ city, tempScale }) => {
  const [weatherData, setWeatherData] = useState<OpenWeatherData | null>(null);
  const [cardState, setCardState] = useState<WeatherCardState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setWeatherData(null);
    setCardState("loading");
    setErrorMessage("");
    setLastUpdated(null);

    fetchOpenWeatherData(city, tempScale)
      .then((data) => {
        setWeatherData(data);
        setLastUpdated(new Date());
        setCardState("ready");
      })
      .catch((err) => {
        console.error(`WeatherCard Error for ${city}:`, err);
        setErrorMessage(err.message || "Could not retrieve weather data.");
        setCardState("error");
      });
  }, [city, tempScale]);

  const tempUnit = tempScale === "metric" ? "\u2103" : "\u2109";

  let cardContent: React.ReactNode;

  if (cardState === "loading") {
    cardContent = (
      <Box p={2}>
        {/* Loading Skeleton */}
        <Typography variant="h6" className="weatherCard-title">
          <Skeleton width="60%" />
        </Typography>
        <Grid
          container
          justifyContent="space-around"
          alignItems="center"
          spacing={1}
        >
          <Grid item xs={6}>
            <Typography variant="h3" className="weatherCard-temp">
              <Skeleton width="50%" />
            </Typography>
            <Typography
              variant="body2"
              className="weatherCard-body feels-like"
              color="textSecondary"
            >
              <Skeleton width="70%" />
            </Typography>
          </Grid>
          <Grid
            item
            xs={6}
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Skeleton
              variant="circle"
              width={50}
              height={50}
              style={{ marginBottom: "4px" }}
            />
            <Typography variant="body1" className="weatherCard-body condition">
              <Skeleton width="80%" />
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  } else if (cardState === "error") {
    cardContent = (
      <Box p={1}>
        {/* Error Alert */}
        <Typography variant="h6" className="weatherCard-title" gutterBottom>
          {city}
        </Typography>
        <Alert
          severity="warning"
          variant="outlined"
          style={{ margin: "8px 0" }}
        >
          {errorMessage}
        </Alert>
      </Box>
    );
  } else if (weatherData) {
    // Ready State Content
    cardContent = (
      <Box p={2}>
        <Grid
          container
          justifyContent="space-around"
          alignItems="center"
          spacing={1}
        >
          {/* Left Side: Temp Info */}
          <Grid item xs={7}>
            {" "}
            {/* Give a bit more space */}
            <Typography
              className="weatherCard-title"
              variant="h6"
              noWrap
              title={weatherData.name}
            >
              {weatherData.name}
            </Typography>
            <Typography className="weatherCard-temp" variant="h3">
              {Math.round(weatherData.main.temp)}
              {tempUnit}
            </Typography>
            <Typography
              className="weatherCard-body feels-like"
              variant="body2"
              color="textSecondary"
            >
              Feels like {Math.round(weatherData.main.feels_like)}
              {tempUnit}
            </Typography>
            {/* Display more details */}
            <Typography variant="caption" display="block" color="textSecondary">
              Humidity: {weatherData.main.humidity}%
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Wind: {weatherData.wind.speed.toFixed(1)}{" "}
              {tempScale === "metric" ? "m/s" : "mph"}
            </Typography>
          </Grid>
          {/* Right Side: Icon & Description */}
          <Grid
            item
            xs={5}
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {weatherData.weather.length > 0 ? (
              <>
                <img
                  src={getWeatherIconSrc(weatherData.weather[0].icon)}
                  alt={weatherData.weather[0].description}
                  style={{ width: "50px", height: "50px", marginBottom: "4px" }}
                />
                <Typography
                  className="weatherCard-body condition"
                  variant="body1"
                  style={{ textTransform: "capitalize" }}
                >
                  {weatherData.weather[0].description}
                </Typography>
              </>
            ) : (
              <Skeleton variant="circle" width={50} height={50} />
            )}
          </Grid>
        </Grid>
        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <Typography
            variant="caption"
            display="block"
            align="right"
            color="textSecondary"
            style={{ marginTop: "8px", fontSize: "0.65rem" }}
          >
            Updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
    );
  } else {
    cardContent = (
      <Box p={1}>
        <Typography variant="h6" className="weatherCard-title" gutterBottom>
          {city}
        </Typography>
        <Alert severity="error" variant="outlined" style={{ margin: "8px 0" }}>
          No weather data available.
        </Alert>
      </Box>
    );
  }

  // Render the container (using Paper for slight visual separation)
  return (
    <Paper variant="outlined" elevation={0}>
      {cardContent}
    </Paper>
  );
};

export default WeatherCard;
