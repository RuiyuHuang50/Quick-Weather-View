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
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
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
  const [tempScaleInput, setTempScaleInput] =
    useState<OpenWeatherTempScale>("metric");

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // Load options on component mount
  useEffect(() => {
    getStoredOptions().then((storedOptions) => {
      setOptions(storedOptions);
      setHomeCityInput(storedOptions.homeCity || "");
      setTempScaleInput(
        (storedOptions.tempScale as OpenWeatherTempScale) || "metric"
      );
    });
  }, []);

  // --- Input Handlers ---
  const handleHomeCityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setHomeCityInput(event.target.value);
  };
  const handleTempScaleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTempScaleInput(event.target.value as OpenWeatherTempScale);
  };
  // --- End Input Handlers ---

  const handleSaveClick = () => {
    const updatedOptions: LocalStorageOptions = {
      homeCity: homeCityInput.trim(),
      tempScale: tempScaleInput,
    };
    setStoredOptions(updatedOptions)
      .then(() => {
        setOptions(updatedOptions);
        setSnackbarMessage("Options saved successfully!");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      })
      .catch((err) => {
        console.error("Error saving options:", err);
        setSnackbarMessage("Failed to save options.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
