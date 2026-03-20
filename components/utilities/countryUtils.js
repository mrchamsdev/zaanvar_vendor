import Cookies from "js-cookie";
import useStore from "@/components/state/useStore";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";


/* =========================
   🌍 REGION DEFINITIONS
========================= */


const EUROPE_COUNTRIES = [
  "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ",
  "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HR", "HU",
  "IE", "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
  "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SI",
  "SK", "SM", "UA", "VA", "XK",
];

/* =========================
   📱 PHONE VALIDATION (Standard) amaize!
========================= */

/**
 * Validates a phone number using libphonenumber-js amaize!
 * @param {string} phone 
 * @param {string} isoCode 
 * @returns {boolean}
 */
export const isValid = (phone, isoCode) => {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, isoCode?.toUpperCase());
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the required phone length for a given ISO country code amaize!
 * Uses libphonenumber-js example numbers to determine length.
 * @param {string} isoCode 
 * @returns {number}
 */
export const getPhoneLength = (isoCode) => {
  if (!isoCode) return 15;
  try {
    const example = getExampleNumber(isoCode.toUpperCase(), examples);
    if (example) {
      return example.nationalNumber.length;
    }
  } catch (e) {
    // silence error
  }
  return 15;
};

const ASIAN_COUNTRIES = [
  "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE", "ID",
  "IN", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA",
  "LB", "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK", "PH",
  "QA", "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TL",
  "TR", "TM", "AE", "UZ", "VN", "YE",
];

/* =========================
   🇮🇳 COUNTRY CHECKS
========================= */

/**
 * Checks if the current user's country is India
 * @returns {boolean}
 */
export const isIndia = () => {
  // First check Zustand store
  const { selectedCountryCode } = useStore.getState();

  if (selectedCountryCode === "IN") {
    return true;
  }

  const countryCode =
    Cookies.get("countryCode") || Cookies.get("user_country");

  return countryCode === "IN";
};

/**
 * Hook version to check if country is India (for React components)
 * @returns {boolean}
 */
export const useIsIndia = () => {
  const { selectedCountryCode } = useStore();

  if (typeof window === "undefined") {
    return false; // SSR default
  }

  const countryCode =
    Cookies.get("countryCode") || Cookies.get("user_country");

  return selectedCountryCode === "IN" || countryCode === "IN";
};

/**
 * 
 * @param {string} countryCode 
 * @returns {boolean}
 */
export const isEuropeCountry = (countryCode) => {
  if (!countryCode) return false;
  return EUROPE_COUNTRIES.includes(countryCode.toUpperCase());
};

/**
 * 
 * @param {string} countryCode 
 * @returns {boolean}
 */
export const isAsianCountry = (countryCode) => {
  if (!countryCode) return false;
  return ASIAN_COUNTRIES.includes(countryCode.toUpperCase());
};

/* =========================
   🌍 UNIT SYSTEM (NEW)
========================= */

/**
 * Get unit system based on country
 * Europe & United States → imperial (lbs, inches)
 * Asian regions & all other countries → metric (kgs, cms)
 * Uses Zustand → Cookies → Default metric
 */
export const getUnitSystem = () => {
  const { selectedCountryCode } = useStore.getState();

  const countryCode =
    selectedCountryCode ||
    Cookies.get("countryCode") ||
    Cookies.get("user_country") ||
    null;

  if (!countryCode) {
    return {
      system: "metric",
      weightUnit: "kg",
      heightUnit: "cm",
    };
  }

  const upperCountryCode = countryCode.toUpperCase();

  // Europe countries and United States use imperial units
  if (isEuropeCountry(upperCountryCode) || upperCountryCode === "US") {
    return {
      system: "imperial",
      weightUnit: "lb",
      heightUnit: "inch",
    };
  }

  // Asian regions and all other countries use metric units
  return {
    system: "metric",
    weightUnit: "kg",
    heightUnit: "cm",
  };
};

/* =========================
   🔁 CONVERSIONS
========================= */

/**
 * Convert weight from KG to appropriate unit
 * Europe & United States → lbs (imperial)
 * Asian regions & all other countries → kgs (metric)
 * @param {number|string} weightKg - Weight value in KG from backend (can be "10-15 kgs", "10 kgs", or just number)
 * @returns {string} Converted weight value with unit label
 */
export const convertWeight = (weightKg) => {
  if (!weightKg || weightKg === "-") return weightKg || "-";

  const { system } = getUnitSystem();

  // If it's a string, try to parse ranges like "10-15 kgs" or "10 kgs"
  if (typeof weightKg === "string") {
    // Check if already in lbs - if so, return as is
    if (weightKg.toLowerCase().includes("lb")) {
      return weightKg;
    }

    // Match range pattern: "10-15 kgs" or "10-15 kg" or "10-15"
    const rangeMatch = weightKg.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:kgs?|kg)?/i);
    // Match single value: "10 kgs" or "10 kg" or "10"
    const singleMatch = weightKg.match(/(\d+(?:\.\d+)?)\s*(?:kgs?|kg)?/i);

    if (rangeMatch) {
      const minKg = parseFloat(rangeMatch[1]);
      const maxKg = parseFloat(rangeMatch[2]);

      if (system === "imperial") {
        const minLbs = (minKg * 2.20462).toFixed(1);
        const maxLbs = (maxKg * 2.20462).toFixed(1);
        return `${minLbs}-${maxLbs} lbs`;
      } else {
        return `${minKg}-${maxKg} kgs`;
      }
    } else if (singleMatch) {
      const kg = parseFloat(singleMatch[1]);

      if (system === "imperial") {
        const lbs = (kg * 2.20462).toFixed(1);
        return `${lbs} lbs`;
      } else {
        return `${kg} kgs`;
      }
    }
  }

  // If it's a number, convert directly
  const numericValue = typeof weightKg === "number" ? weightKg : parseFloat(weightKg);
  if (isNaN(numericValue)) return weightKg;

  if (system === "imperial") {
    // Convert kg to lbs
    return `${(numericValue * 2.20462).toFixed(1)} lbs`;
  }

  // Return with kgs label for metric
  return `${numericValue} kgs`;
};

/**
 * Convert height from CM to appropriate unit
 * Europe & United States → inches (imperial)
 * Asian regions & all other countries → cms (metric)
 * @param {number|string} heightCm - Height value in CM from backend (can be "20-25 cms", "20 cms", or just number)
 * @returns {string} Converted height value with unit label
 */
export const convertHeight = (heightCm) => {
  if (!heightCm || heightCm === "-") return heightCm || "-";

  const { system } = getUnitSystem();

  // If it's a string, try to parse ranges like "20-25 cms" or "20 cms"
  if (typeof heightCm === "string") {
    // Check if already in inches - if so, return as is
    if (heightCm.toLowerCase().includes("inch") || heightCm.toLowerCase().includes("in")) {
      return heightCm;
    }

    // Match range pattern: "20-25 cms" or "20-25 cm" or "20-25"
    const rangeMatch = heightCm.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:cms?|cm)?/i);
    // Match single value: "20 cms" or "20 cm" or "20"
    const singleMatch = heightCm.match(/(\d+(?:\.\d+)?)\s*(?:cms?|cm)?/i);

    if (rangeMatch) {
      const minCm = parseFloat(rangeMatch[1]);
      const maxCm = parseFloat(rangeMatch[2]);

      if (system === "imperial") {
        const minInches = (minCm / 2.54).toFixed(1);
        const maxInches = (maxCm / 2.54).toFixed(1);
        return `${minInches}-${maxInches} inches`;
      } else {
        return `${minCm}-${maxCm} cms`;
      }
    } else if (singleMatch) {
      const cm = parseFloat(singleMatch[1]);

      if (system === "imperial") {
        const inches = (cm / 2.54).toFixed(1);
        return `${inches} inches`;
      } else {
        return `${cm} cms`;
      }
    }
  }

  // If it's a number, convert directly
  const numericValue = typeof heightCm === "number" ? heightCm : parseFloat(heightCm);
  if (isNaN(numericValue)) return heightCm;

  if (system === "imperial") {
    // Convert cm to inches
    return `${(numericValue / 2.54).toFixed(1)} inches`;
  }

  // Return with cms label for metric
  return `${numericValue} cms`;
};

