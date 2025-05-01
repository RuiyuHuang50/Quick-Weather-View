// src/utils/storage.ts

export interface LocalStorage {
  cities?: string[];
  options?: LocalStorageOptions;
}

// Defines the structure of the options object
export interface LocalStorageOptions {
  homeCity: string;
  tempScale: string;
  apiKey?: string;
}

export type LocalStorageKeys = keyof LocalStorage;

/**
 * Saves the list of cities to chrome.storage.local.
 * @param cities Array of city names.
 * @returns Promise<void>
 */
export function setStoredCities(cities: string[]): Promise<void> {
  const vals: LocalStorage = {
    cities,
  };
  return new Promise((resolve) => {
    chrome.storage.local.set(vals, () => {
      resolve();
    });
  });
}

/**
 * Retrieves the list of cities from chrome.storage.local.
 * Defaults to an empty array if not found.
 * @returns Promise<string[]>
 */
export function getStoredCities(): Promise<string[]> {
  const keys: LocalStorageKeys[] = ["cities"];
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (res: LocalStorage) => {
      resolve(res.cities ?? []); // Return empty array if 'cities' is null/undefined
    });
  });
}

/**
 * Saves the user's options object to chrome.storage.local.
 * @param options The options object including apiKey, homeCity, tempScale, etc.
 * @returns Promise<void>
 */
export function setStoredOptions(options: LocalStorageOptions): Promise<void> {
  const vals: LocalStorage = {
    options,
  };
  return new Promise((resolve) => {
    chrome.storage.local.set(vals, () => {
      resolve();
    });
  });
}

/**
 * Retrieves the user's options object from chrome.storage.local.
 * Provides default values if no options have been saved yet.
 * @returns Promise<LocalStorageOptions>
 */
export function getStoredOptions(): Promise<LocalStorageOptions> {
  const keys: LocalStorageKeys[] = ["options"];
  const defaultOptions: LocalStorageOptions = {
    homeCity: "",
    tempScale: "metric",
    apiKey: "",
  };

  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (res: LocalStorage) => {
      const storedOptions = res.options;
      const resolvedOptions = { ...defaultOptions, ...storedOptions };
      resolve(resolvedOptions);
    });
  });
}
