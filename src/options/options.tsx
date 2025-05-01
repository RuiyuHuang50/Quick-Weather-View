// src/options/options.tsx

import React, { useState, useEffect, ChangeEvent } from "react";
import ReactDOM from "react-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  FormControl,
  FormLabel,
  Divider,
  Link,
  Tooltip,
  Popover,
  CircularProgress,
  IconButton,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import {
  HelpOutline as HelpOutlineIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
} from "@material-ui/icons";
import "fontsource-roboto";
import "./options.css";
import {
  getStoredOptions,
  setStoredOptions,
  LocalStorageOptions,
} from "../utils/storage";
import { OpenWeatherTempScale } from "../utils/api";

const Options: React.FC = () => {
  const [options, setOptions] = useState<LocalStorageOptions | null>(null);
  // Input states
  const [homeCityInput, setHomeCityInput] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [tempScaleInput, setTempScaleInput] =
    useState<OpenWeatherTempScale>("metric");

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // State for Inline Help Popover
  const [helpAnchorEl, setHelpAnchorEl] =
    React.useState<HTMLButtonElement | null>(null);

  // State for Validation
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<
    "valid" | "invalid" | "unknown"
  >("unknown");

  // Load options on component mount
  useEffect(() => {
    getStoredOptions().then((storedOptions) => {
      setOptions(storedOptions);
      setApiKeyInput(storedOptions.apiKey || "");
      setHomeCityInput(storedOptions.homeCity || "");
      setTempScaleInput(
        (storedOptions.tempScale as OpenWeatherTempScale) || "metric"
      );

      setValidationResult("unknown");
    });
  }, []);

  // --- Input Handlers ---
  const handleHomeCityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHomeCityInput(event.target.value);
  };
  const handleApiKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKeyInput(event.target.value);
    setValidationResult("unknown"); // Reset validation status on change
  };
  const handleTempScaleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTempScaleInput(event.target.value as OpenWeatherTempScale);
  };
  // --- End Input Handlers ---

  // --- Inline Help Popover Logic ---
  const handleHelpClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };
  const handleHelpClose = () => {
    setHelpAnchorEl(null);
  };
  const helpOpen = Boolean(helpAnchorEl);
  const helpId = helpOpen ? "api-key-help-popover" : undefined;
  // --- End Inline Help Logic ---

  // --- Validation Logic ---
  const validateApiKey = async (keyToValidate: string) => {
    if (!keyToValidate || keyToValidate.trim().length !== 32) {
      setValidationResult("invalid");
      return;
    }
    setIsValidating(true);
    setValidationResult("unknown");
    try {
      const testUrl = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${keyToValidate.trim()}`;
      const res = await fetch(testUrl);
      if (res.ok) {
        setValidationResult("valid");
      } else if (res.status === 401) {
        setValidationResult("invalid");
      } else {
        console.warn(
          `API Key validation check failed with status: ${res.status}`
        );
        setValidationResult("invalid");
      }
    } catch (error) {
      console.error("API Key validation fetch error:", error);
      setValidationResult("invalid");
    } finally {
      setIsValidating(false);
    }
  };
  // --- End Validation Logic ---

  const handleSaveClick = () => {
    const trimmedApiKey = apiKeyInput.trim();
    const updatedOptions: LocalStorageOptions = {
      homeCity: homeCityInput.trim(),
      apiKey: trimmedApiKey,
      tempScale: tempScaleInput,
    };
    setStoredOptions(updatedOptions)
      .then(() => {
        setOptions(updatedOptions);
        setSnackbarMessage("Options saved successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        validateApiKey(trimmedApiKey);
      })
      .catch((err) => {
        console.error("Error saving options:", err);
        setSnackbarMessage("Failed to save options.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setValidationResult("unknown");
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // --- Function to render Validation Status ---
  const renderValidationStatus = () => {
    if (isValidating) {
      return (
        <Tooltip title="Validating API Key...">
          <CircularProgress
            size={20}
            style={{ marginLeft: 8, verticalAlign: "middle" }}
          />
        </Tooltip>
      );
    }
    switch (validationResult) {
      case "valid":
        return (
          <Tooltip title="API Key is valid!">
            <CheckIcon
              style={{ color: "green", marginLeft: 8, verticalAlign: "middle" }}
            />
          </Tooltip>
        );
      case "invalid":
        return (
          <Tooltip title="API Key appears invalid.">
            <ErrorIcon
              style={{ color: "red", marginLeft: 8, verticalAlign: "middle" }}
            />
          </Tooltip>
        );
      case "unknown":
      default:
        return null;
    }
  };

  if (!options) {
    return (
      <Box p={3}>
        <Typography>Loading options...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="sm" mx="auto">
      <Paper variant="outlined" elevation={0} style={{ padding: "24px" }}>
        <Typography variant="h4" gutterBottom align="center">
          Weather Extension Options
        </Typography>
        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={3}>
          {/* API Key Section */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="h6" gutterBottom style={{ marginBottom: 0 }}>
                OpenWeatherMap API Key
              </Typography>
              <Tooltip title="How to get an API Key">
                <IconButton
                  onClick={handleHelpClick}
                  size="small"
                  aria-describedby={helpId}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Help Popover Content */}
            <Popover
              id={helpId}
              open={helpOpen}
              anchorEl={helpAnchorEl}
              onClose={handleHelpClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
              <Box p={2} maxWidth="350px">
                <Typography variant="body2" gutterBottom>
                  Steps to get your FREE OpenWeatherMap API Key:
                </Typography>
                <ol
                  style={{ paddingLeft: "20px", margin: 0, fontSize: "0.8rem" }}
                >
                  <li>
                    <Link
                      href="https://home.openweathermap.org/users/sign_up"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sign up
                    </Link>{" "}
                    on OpenWeatherMap.
                  </li>
                  <li>Verify your email.</li>
                  <li>
                    Go to the{" "}
                    <Link
                      href="https://home.openweathermap.org/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      API keys tab
                    </Link>{" "}
                    after logging in.
                  </li>
                  <li>
                    Copy the 32-character key shown (usually named "Default").
                  </li>
                  <li>Paste it below.</li>
                  <li>(Keys might take minutes/hours to activate).</li>
                </ol>
              </Box>
            </Popover>

            {/* Input Field with Validation Status */}
            <Box display="flex" alignItems="center">
              <TextField
                label="API Key"
                variant="outlined"
                size="small"
                fullWidth
                value={apiKeyInput}
                onChange={handleApiKeyChange}
                type="password"
                required
                helperText={
                  validationResult === "invalid" && !isValidating
                    ? "API key appears invalid. Please double-check."
                    : "Paste your 32-character key here"
                }
                error={validationResult === "invalid" && !isValidating}
              />
              {/* Validation Status Indicator */}
              {renderValidationStatus()}
            </Box>
            {/* Example Key Format
            <Typography
              variant="caption"
              color="textSecondary"
              display="block"
              style={{ marginTop: "8px" }}
            >
            </Typography> */}
          </Grid>

          {/* Home City Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Home City
            </Typography>
            <TextField
              label="Home City Name"
              variant="outlined"
              size="small"
              fullWidth
              value={homeCityInput}
              onChange={handleHomeCityChange}
              helperText="City for badge temperature display (e.g., London)"
            />
          </Grid>

          {/* Temperature Scale Section */}
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Temperature Scale</FormLabel>
              <RadioGroup
                row
                aria-label="temperature scale"
                name="tempScale"
                value={tempScaleInput}
                onChange={handleTempScaleChange}
              >
                <FormControlLabel
                  value="metric"
                  control={<Radio color="primary" size="small" />}
                  label="Celsius (°C)"
                />
                <FormControlLabel
                  value="imperial"
                  control={<Radio color="primary" size="small" />}
                  label="Fahrenheit (°F)"
                />
              </RadioGroup>
            </FormControl>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12} style={{ textAlign: "center", marginTop: "24px" }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSaveClick}
            >
              Save Options
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Standard React entry point for options page
const root = document.createElement("div");
document.body.appendChild(root);
ReactDOM.render(<Options />, root);
