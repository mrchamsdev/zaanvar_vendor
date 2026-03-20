import { getCountries, getCountryCallingCode } from "libphonenumber-js";

/**
 * GET /api/countries
 * Returns a list of all countries with ISO code, phone code, and display name.
 * Compatible with the format expected by SearchableCountryCode:
 *   { isoCode, phonecode, name }
 */
export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // libphonenumber-js ships a list of all supported ISO country codes
    const isoCodes = getCountries(); // e.g. ["AC","AD","AE","AF", ...]

    // Intl.DisplayNames is available in Node 12+ / modern browsers
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

    const countries = isoCodes
      .map((isoCode) => {
        let callingCode;
        try {
          callingCode = getCountryCallingCode(isoCode); // e.g. "91" for IN
        } catch {
          return null; // skip unsupported codes
        }

        let name;
        try {
          name = displayNames.of(isoCode) || isoCode;
        } catch {
          name = isoCode;
        }

        return {
          isoCode,                    // "IN"
          phonecode: `+${callingCode}`, // "+91"
          name,                       // "India"
        };
      })
      .filter(Boolean); // remove nulls

    // Cache for 24 hours — country data never changes per request
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).json(countries);
  } catch (error) {
    console.error("Failed to build countries list:", error);
    return res.status(500).json({ error: "Failed to fetch countries" });
  }
}
