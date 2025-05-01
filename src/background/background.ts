// src/background/background.ts

import {
  getStoredCities,
  getStoredOptions,
  setStoredCities,
  setStoredOptions,
  LocalStorageOptions,
} from "../utils/storage";
import {
  fetchOpenWeatherData,
  getWeatherIconSrc,
  OpenWeatherTempScale,
} from "../utils/api";

const ADD_CITY_MENU_ID = "weatherExtensionAddCity";
const CHECK_WEATHER_MENU_ID = "weatherExtensionCheckWeather";

// --- Helper function to update the browser action badge ---
async function updateBadge() {
  console.log("Attempting badge update.");
  try {
    const options: LocalStorageOptions = await getStoredOptions();
    if (options.homeCity === "" || !options.apiKey) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }
    try {
      const data = await fetchOpenWeatherData(
        options.homeCity,
        options.tempScale as OpenWeatherTempScale
      );
      const temp = Math.round(data.main.temp);
      const badgeText = String(temp);
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: "#007bff" });
    } catch (apiError) {
      console.error(
        `Error fetching weather for badge update (${options.homeCity}):`,
        apiError.message
      );
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#DC3545" });
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

// --- Extension Installation and Setup ---
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated.");
  chrome.storage.local.get(["options", "cities"], (res) => {
    if (!res.options) {
      setStoredOptions({ homeCity: "", tempScale: "metric", apiKey: "" });
    }
    if (!res.cities) {
      setStoredCities([]);
    }
  });

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ADD_CITY_MENU_ID,
      title: "Add city to Weather Extension",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: CHECK_WEATHER_MENU_ID,
      title: "Check weather for '%s'",
      contexts: ["selection"],
    });
  });

  chrome.alarms.create("weatherAlarm", {
    delayInMinutes: 1,
    periodInMinutes: 60,
  });
  updateBadge();
});

// --- Listener for Context Menu Clicks ---
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === ADD_CITY_MENU_ID && info.selectionText) {
    const selectedText = info.selectionText.trim();
    if (selectedText) {
      console.log(`Context menu: Attempting to add city "${selectedText}"`);
      try {
        const currentCities = await getStoredCities();
        const options = await getStoredOptions();
        if (
          !currentCities.includes(selectedText) &&
          selectedText !== options.homeCity
        ) {
          await setStoredCities([...currentCities, selectedText]);
          chrome.notifications.create(
            "",
            {
              type: "basic",
              iconUrl: chrome.runtime.getURL("icon.png"),
              title: "City Added",
              message: `"${selectedText}" added to your list.`,
            },
            (id) => {
              if (chrome.runtime.lastError)
                console.error(
                  "Add City Notify Err:",
                  chrome.runtime.lastError.message
                );
            }
          );
        } else {
          chrome.notifications.create(
            "",
            {
              type: "basic",
              iconUrl: chrome.runtime.getURL("icon.png"),
              title: "City Not Added",
              message: `"${selectedText}" is already in your list or is home city.`,
            },
            (id) => {
              if (chrome.runtime.lastError)
                console.error(
                  "City Not Added Notify Err:",
                  chrome.runtime.lastError.message
                );
            }
          );
        }
      } catch (error) {
        console.error("Error adding city:", error);
      }
    }
  }

  // Handle "Check Weather" action
  if (info.menuItemId === CHECK_WEATHER_MENU_ID && info.selectionText) {
    const selectedText = info.selectionText.trim();
    if (selectedText) {
      console.log(`Context menu: Checking weather for "${selectedText}"`);
      (async () => {
        try {
          const options = await getStoredOptions();
          if (!options.apiKey) {
            chrome.notifications.create(
              "",
              {
                type: "basic",
                iconUrl: chrome.runtime.getURL("icon.png"),
                title: "API Key Required",
                message: "Please set API key in options.",
              },
              (id) => {
                if (chrome.runtime.lastError)
                  console.error(
                    "API Key Notify Err:",
                    chrome.runtime.lastError.message
                  );
              }
            );
            return;
          }

          console.log(`Fetching weather for "${selectedText}"...`);
          const data = await fetchOpenWeatherData(
            selectedText,
            options.tempScale as OpenWeatherTempScale
          );
          console.log(`Data received for "${selectedText}"`);

          // Process data
          const temp = Math.round(data.main.temp);
          const symbol = options.tempScale === "metric" ? "\u2103" : "\u2109";
          let weatherDescription = "N/A";
          if (
            data.weather &&
            data.weather.length > 0 &&
            data.weather[0].description
          ) {
            weatherDescription = data.weather[0].description;
          }
          const notificationMessage = `Temp: ${temp}${symbol}, Condition: ${weatherDescription}`;
          const notificationTitle = `Weather: ${data.name}`;

          // Define final notification options with iconUrl restored
          const notificationOptions: chrome.notifications.NotificationOptions =
            {
              type: "basic",
              iconUrl: chrome.runtime.getURL("icon.png"),
              title: notificationTitle,
              message: notificationMessage,
              priority: 0,
            };
          const notificationId = `weatherCheck_${Date.now()}`;

          // Create notification with callback
          chrome.notifications.create(
            notificationId,
            notificationOptions,
            (createdNotificationId) => {
              if (chrome.runtime.lastError) {
                console.error(
                  `Notification creation FAILED for ${notificationId}:`,
                  chrome.runtime.lastError.message
                );
              } else {
                console.log(
                  `Notification creation SUCCEEDED for ${notificationId}.`
                ); 
              }
            }
          );
        } catch (fetchOrOptionError) {
          console.error(
            `Error checking weather for "${selectedText}":`,
            fetchOrOptionError
          );
          chrome.notifications.create(
            `fetch_error_${Date.now()}`,
            {
              type: "basic",
              iconUrl: chrome.runtime.getURL("icon.png"),
              title: "Weather Check Failed",
              message: `Could not get weather for "${selectedText}".\nReason: ${fetchOrOptionError.message}`,
            },
            (id) => {
              if (chrome.runtime.lastError)
                console.error(
                  "Fetch Error Notify Err:",
                  chrome.runtime.lastError.message
                );
            }
          );
        }
      })();
    }
  }
});

// --- Listener for Scheduled Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "weatherAlarm") {
    console.log("Weather alarm triggered by schedule.");
    updateBadge();
  }
});

// --- Listener for Storage Changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.options) {
    console.log("Options changed, triggering badge update.");
    updateBadge();
  }
});

console.log("Background script loaded.");
