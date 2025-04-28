// src/background/background.ts
import {
  getStoredCities,
  getStoredOptions,
  setStoredCities,
  setStoredOptions,
  LocalStorageOptions,
} from "../utils/storage";
import { fetchOpenWeatherData, OpenWeatherTempScale } from "../utils/api";

// --- Helper function to update the badge ---
async function updateBadge() {
  console.log("Attempting badge update.");
  try {
    const options: LocalStorageOptions = await getStoredOptions();

    if (options.homeCity === "" || !options.apiKey) {
      console.log("Home city or API key not set, clearing badge.");
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    try {
      const data = await fetchOpenWeatherData(
        options.homeCity,
        options.tempScale as OpenWeatherTempScale
      );
      const temp = Math.round(data.main.temp);

      // *** CHANGE HERE: Only use the temperature number for the badge text ***
      // Ensure the result is a string
      const badgeText = String(temp);

      chrome.action.setBadgeText({
        // text: `${temp}${symbol}`, // OLD VERSION
        text: badgeText, // NEW VERSION (e.g., "23", "75")
      });
      // Set a background color for better visibility (optional)
      chrome.action.setBadgeBackgroundColor({ color: "#007bff" }); // Example blue color
      console.log(
        `Badge updated for ${options.homeCity}: ${badgeText}` // Log the simple text
      );
    } catch (apiError) {
      console.error(
        `Error fetching weather for badge update (${options.homeCity}):`,
        apiError.message
      );
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#DC3545" }); // Example red color for error
    }
  } catch (storageError) {
    console.error(
      "Error getting stored options for badge update:",
      storageError
    );
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#DC3545" });
  }
}
// --- End Helper Function ---

chrome.runtime.onInstalled.addListener(() => {
  setStoredCities([]);
  setStoredOptions({
    //hasAutoOverlay: false,
    homeCity: "",
    tempScale: "metric",
    apiKey: "",
  });

  chrome.contextMenus.create({
    contexts: ["selection"],
    title: "Add city to weather extension",
    id: "weatherExtension",
  });

  // Trigger alarm immediately for first run, then every 60 minutes.
  chrome.alarms.create("weatherAlarm", {
    delayInMinutes: 0,
    periodInMinutes: 60,
  });
  // Also update badge immediately on install/update
  updateBadge();
});

chrome.contextMenus.onClicked.addListener((event) => {
  getStoredCities().then((cities) => {
    const selectedText = event.selectionText?.trim();
    if (selectedText && !cities.includes(selectedText)) {
      setStoredCities([...cities, selectedText]);
    }
  });
});

// Listener for the scheduled alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "weatherAlarm") {
    console.log("Weather alarm triggered by schedule.");
    updateBadge(); // Call the helper function
  }
});

// Listener for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.options) {
    console.log("Options changed, triggering badge update.");
    updateBadge(); // Call the helper function
  }
});
