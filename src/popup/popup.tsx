// src/popup/popup.tsx
// Polished MUI v4: Refined Spacing & Added Tooltips

import React, { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import ReactDOM from "react-dom";
import {
  Box,
  Grid,
  InputBase,
  IconButton,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Tooltip, // Keep Tooltip
  Divider, // Keep Divider
} from "@material-ui/core";
import { Alert } from "@material-ui/lab"; // Keep Alert
import {
  Add as AddIcon,
  Close as CloseIcon,
  Settings as SettingsIcon, // Keep SettingsIcon
  Refresh as RefreshIcon, // Add RefreshIcon
} from "@material-ui/icons";
import "fontsource-roboto";
import "./popup.css"; // Your main popup styles
import WeatherCard from "../components/WeatherCard/WeatherCard"; // Import polished card
import {
  setStoredCities,
  setStoredOptions,
  getStoredCities,
  getStoredOptions,
  LocalStorageOptions,
} from "../utils/storage";
import { OpenWeatherTempScale } from "../utils/api";

const App: React.FC<{}> = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState<string>("");
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Add state to trigger refresh in cards
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([getStoredCities(), getStoredOptions()])
      .then(([storedCities, storedOptions]) => {
        setOptions(storedOptions);
        if (!storedOptions || !storedOptions.apiKey) {
          setError("API Key not set. Please go to Options.");
          setCities([]);
        } else {
          let citiesToDisplay = [...storedCities];
          if (storedOptions.homeCity) {
            if (citiesToDisplay.includes(storedOptions.homeCity)) {
              citiesToDisplay = [
                storedOptions.homeCity,
                ...citiesToDisplay.filter((c) => c !== storedOptions.homeCity),
              ];
            } else {
              citiesToDisplay.unshift(storedOptions.homeCity);
            }
          }
          setCities(citiesToDisplay);
          if (citiesToDisplay.length === 0) {
            setError(
              "No cities added. Add one above or set a Home City in Options."
            );
          }
        }
      })
      .catch((err) => {
        console.error("Error loading initial data:", err);
        setError("Could not load settings or cities.");
        setCities([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, []);

  // Trigger refresh in WeatherCard components when refreshTrigger changes
  // Note: WeatherCard needs to add refreshTrigger to its useEffect dependency array
  // (This simple trigger might cause unnecessary refetches if only options change,
  // but it's a basic way to implement manual refresh)

  const handleCityButtonClick = () => {
    if (cityInput === "") return;
    const trimmedCity = cityInput.trim();
    if (cities.includes(trimmedCity)) {
      setCityInput("");
      return;
    }
    const updatedCities = [...cities, trimmedCity];
    // Filter out home city before saving to storage
    setStoredCities(updatedCities.filter((c) => c !== options?.homeCity)).then(
      () => {
        setCities(updatedCities); // Update UI state
        setCityInput(""); // Clear input
      }
    );
  };

  const handleCityDeleteButtonClick = (cityToDelete: string) => {
    const updatedCities = cities.filter((city) => city !== cityToDelete);
    // Filter out home city before saving to storage
    setStoredCities(updatedCities.filter((c) => c !== options?.homeCity)).then(
      () => {
        setCities(updatedCities); // Update UI state
      }
    );
  };

  const handleTempScaleButtonClick = () => {
    if (!options) return;
    const updatedOptions: LocalStorageOptions = {
      ...options,
      tempScale: options.tempScale === "metric" ? "imperial" : "metric",
    };
    setStoredOptions(updatedOptions).then(() => {
      setOptions(updatedOptions); // Update local state immediately
      setRefreshTrigger(Date.now()); // Trigger refresh on scale change
    });
  };

  const handleRefreshClick = () => {
    setError(null); // Clear errors on manual refresh
    setRefreshTrigger(Date.now()); // Update trigger to force WeatherCard useEffect
    // Optionally: reload city list too, though not strictly necessary unless expecting external changes
    // loadData(); // Re-running loadData is another way but refetches options too
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <Box
        p={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const renderErrorOrInfo = () => {
    if (!error) return null;
    const isActionableError =
      error.includes("API Key") ||
      error.includes("No cities") ||
      error.includes("Home city");
    return (
      <Box m={1} textAlign="center">
        {" "}
        {/* Reduced margin */}
        <Alert
          severity={isActionableError ? "warning" : "error"}
          style={{ marginBottom: "10px" }}
        >
          {error}
        </Alert>
        {isActionableError && (
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={openOptionsPage}
          >
            Go to Options
          </Button>
        )}
      </Box>
    );
  };

  if (!options) {
    return (
      <Box p={2}>
        <Typography>Could not load options.</Typography>
      </Box>
    );
  }

  const apiKeyExists = options?.apiKey && options.apiKey.length > 0;

  return (
    <Box p={1.5} className="popup-container">
      {" "}
      {/* Slightly reduced padding */}
      {/* Top controls using outlined Paper */}
      <Paper variant="outlined" elevation={0} style={{ marginBottom: "12px" }}>
        <Box display="flex" alignItems="center" p={0.5}>
          <InputBase
            placeholder="Add city"
            value={cityInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setCityInput(event.target.value)
            }
            style={{ flexGrow: 1, marginLeft: "8px", fontSize: "0.9rem" }}
            onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") handleCityButtonClick();
            }}
            disabled={!apiKeyExists}
            aria-label="Add a city name"
          />
          <Tooltip title="Add City">
            <span>
              <IconButton
                onClick={handleCityButtonClick}
                size="small"
                disabled={!apiKeyExists}
              >
                {" "}
                <AddIcon fontSize="small" />{" "}
              </IconButton>
            </span>
          </Tooltip>
          <Divider
            orientation="vertical"
            flexItem
            style={{ margin: "4px 8px" }}
          />
          <Tooltip title="Change Temperature Unit">
            <IconButton onClick={handleTempScaleButtonClick} size="small">
              <Typography
                variant="button"
                style={{
                  width: "24px",
                  textAlign: "center",
                  fontSize: "0.8rem",
                }}
              >
                {options.tempScale === "metric" ? "\u2103" : "\u2109"}
              </Typography>
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh Weather Data">
            <IconButton
              onClick={handleRefreshClick}
              size="small"
              disabled={!apiKeyExists}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open Settings">
            <IconButton onClick={openOptionsPage} size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      {renderErrorOrInfo()}
      {apiKeyExists && (
        // Added key to Box to help React update list on city changes
        <Box
          key={refreshTrigger}
          className="weatherCardList"
          style={{
            maxHeight: "calc(550px - 100px)",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {cities.map((city) => (
            <Box
              key={city}
              style={{ position: "relative", marginBottom: "12px" }}
            >
              {/* Use the polished WeatherCard */}
              <WeatherCard
                city={city}
                tempScale={options.tempScale as OpenWeatherTempScale}
              />
              {/* External Delete Button */}
              {city !== options?.homeCity && (
                <Tooltip title={`Delete ${city}`}>
                  <IconButton
                    aria-label="delete city"
                    onClick={() => handleCityDeleteButtonClick(city)}
                    size="small"
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      zIndex: 1,
                    }}
                  >
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<App />, root);
