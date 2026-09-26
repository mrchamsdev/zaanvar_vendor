import React, { useState, useEffect } from "react";
import { WebApimanager } from "./utilities/WebApiManager";
import { toApiDateOnly, dateOnlyWithTimeZone, parseWallClockDate } from "../utilities/date-time-utils";
import { toast } from "sonner";
import { Country, State, City } from "country-state-city";
import MultiSelectDropdown from "./MultiSelectDropdown";
import SearchableCountryCode from "./utilities/searchablecountrycode";
import { getPhoneLength } from "./utilities/countryUtils";

import ClinicFields from "./BranchFeatures/ClinicFields";
import DaycareFields from "./BranchFeatures/DaycareFields";
import GroomingFields from "./BranchFeatures/GroomingFields";
import PetStoreFields from "./BranchFeatures/PetStoreFields";
import PetSalesFields from "./BranchFeatures/PetSalesFields";
import BreederFields from "./BranchFeatures/BreederFields";
import TrainingFields from "./BranchFeatures/TrainingFields";
import SitterFields from "./BranchFeatures/SitterFields";

// ─── Helpers & Mappings ──────────────────────────────────────────────────────
function wallDatePayload(field, value) {
  if (!value) return { [field]: value || "" };
  const d = parseWallClockDate(value);
  if (!d) return { [field]: value };
  return dateOnlyWithTimeZone(field, d);
}

const ALLOWED_PHONE_COUNTRIES = ["IN", "GB", "US"];

const ALL_COUNTRIES_DIAL = Country.getAllCountries()
  .filter((c) => c.phonecode && ALLOWED_PHONE_COUNTRIES.includes(c.isoCode))
  .map((c) => ({
    code: c.isoCode,
    dialCode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
    name: c.name,
  }))
  .sort((a, b) => {
    if (a.code === "IN") return -1;
    if (b.code === "IN") return 1;
    return a.name.localeCompare(b.name);
  });

const parsePhoneAndCode = (phoneStr) => {
  if (!phoneStr) return { code: "+91", countryCode: "IN", number: "" };
  const str = String(phoneStr).trim();
  if (str.startsWith("+")) {
    const found = ALL_COUNTRIES_DIAL.find((c) => str.startsWith(c.dialCode));
    if (found) {
      return { code: found.dialCode, countryCode: found.code, number: str.slice(found.dialCode.length).replace(/\D/g, "") };
    }
  }
  return { code: "+91", countryCode: "IN", number: str.replace(/\D/g, "") };
};

const getRawPhoneDigits = (val) => {
  if (!val) return "";
  let str = String(val).trim();
  if (str.startsWith("+")) {
    const found = ALL_COUNTRIES_DIAL.find((c) => str.startsWith(c.dialCode));
    if (found) {
      return str.slice(found.dialCode.length).replace(/\D/g, "");
    }
  }
  return str.replace(/\D/g, "");
};

const convertDurationToDate = (value) => {
  if (!value) return "";
  const now = new Date();
  const str = String(value).trim();
  if (str.includes(".")) {
    const [years, months] = str.split(".").map(Number);
    const d = new Date();
    d.setFullYear(now.getFullYear() - (years || 0));
    d.setMonth(now.getMonth() - (months || 0));
    return toApiDateOnly(d);
  }
  const num = parseInt(str, 10);
  if (isNaN(num)) return "";
  if (num <= 12) {
    const d = new Date();
    d.setMonth(now.getMonth() - num);
    return toApiDateOnly(d);
  }
  const d = new Date();
  d.setFullYear(now.getFullYear() - num);
  return toApiDateOnly(d);
};

const formatDurationText = (value) => {
  if (!value) return "";
  const cleanVal = String(value).trim();
  if (cleanVal.includes(".")) {
    const parts = cleanVal.split(".");
    const y = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    let text = [];
    if (y > 0) text.push(`${y} year${y > 1 ? "s" : ""}`);
    if (m > 0) text.push(`${m} month${m > 1 ? "s" : ""}`);
    return text.length > 0 ? `(${text.join(" ")})` : "";
  }
  const num = parseInt(cleanVal, 10);
  if (!isNaN(num) && num > 0) {
    if (num <= 12) {
      return `(${num} month${num > 1 ? "s" : ""})`;
    } else {
      return `(${num} year${num > 1 ? "s" : ""})`;
    }
  }
  return "";
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = ["00", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))];
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

const SERVICES_LIST = [
  "Breeders", "Location", "Blood Bank", "E-Commerce", "Training",
  "Grooming", "Sitter/walker", "Day Care", "Rides", "NGO's",
  "Photographers", "Pet Shop", "Event", "Cremation", "Clinic",
];

const MAP_SERVICE_TO_FEATURE = {
  "Grooming": "Pet Grooming",
  "Pet Grooming": "Pet Grooming",
  "Training": "Pet Training",
  "Pet Training": "Pet Training",
  "Day Care": "Pet Daycare",
  "Daycare": "Pet Daycare",
  "Pet Daycare": "Pet Daycare",
  "Clinic": "Pet Clinic",
  "Pet Clinic": "Pet Clinic",
  "Cremation": "Pet Cremation",
  "Pet Cremation": "Pet Cremation",
  "Breeders": "Pet Breeder",
  "Pet Breeder": "Pet Breeder",
  "Sitter/walker": "Pet Sitter/Walker",
  "Pet Sitter/Walker": "Pet Sitter/Walker",
  "Pet Shop": "Pet Store",
  "Pet Store": "Pet Store",
};

const PET_LIST = [
  { id: "Dog", name: "Dog" },
  { id: "Cat", name: "Cat" },
  { id: "Fish", name: "Fish" },
  { id: "Bird", name: "Bird" },
  { id: "Small Pet", name: "Small Pet" },
];

const LOCATION_OPTIONS = [
  "Hyderabad", "Warangal", "Karimnagar", "Visakhapatnam",
  "Vijayawada", "Bangalore", "Mysore", "Chennai",
  "Coimbatore", "Mumbai", "Pune",
];

const DATA_STORE_TYPES = ["manual", "semi-automated", "automated"];
const PAYMENT_OPTIONS = ["Cash", "UPI", "NetBanking", "CreditCard", "DebitCard"];
const BUSINESS_TYPES = ["Independent", "Enterprise"];

const sanitizeExperienceInput = (val) => {
  if (!val) return "";
  let cleaned = String(val).replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  const [intPart, decPart] = cleaned.split(".");
  const sanitizedInt = intPart.slice(0, 3);
  if (decPart !== undefined) {
    return `${sanitizedInt}.${decPart.slice(0, 2)}`;
  }
  return sanitizedInt;
};

// ─── Blank branch template ────────────────────────────────────────────────────
const blankBranch = () => ({
  branchName: "",
  branchLocation: "",
  branchEmail: "",
  branchPhone: "",
  branchPhoneCode: "+91",
  branchCountryCode: "IN",
  branchOpeningDate: "",
  durationInput: "",
  dataStoreType: "",
  businessName: "",
  selectedServices: [],
  services: {},
  paymentMethods: [],
  hoursMode: "MAIN_HOURS",
  timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
  specialHours: [],
  is24x7: false,
  branchAddress: {},
  logo: null,
  morePhotos: [],
});

// ─── TimingsGrid sub-component ────────────────────────────────────────────────
function TimingsGrid({ timings = {}, is24x7, onChange, on24x7Change }) {
  const parseDay = (val = "") => {
    if (!val || val === "Closed") {
      return { oH: "09", oM: "00", openPeriod: "AM", cH: "10", cM: "00", closePeriod: "PM", isClosed: val === "Closed" };
    }
    const [openStr = "", closeStr = ""] = val.split(" - ");
    const [openTime = "09:00", openPeriod = "AM"] = openStr.split(" ");
    const [closeTime = "10:00", closePeriod = "PM"] = closeStr.split(" ");
    const [oH = "09", oM = "00"] = openTime.split(":");
    const [cH = "10", cM = "00"] = closeTime.split(":");
    return { oH, oM, openPeriod, cH, cM, closePeriod, isClosed: false };
  };

  const buildStr = (oH, oM, oP, cH, cM, cP) => `${oH}:${oM} ${oP} - ${cH}:${cM} ${cP}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={is24x7}
            onChange={e => {
              const c = e.target.checked;
              on24x7Change(c);
              const full = "12:00 AM - 11:59 PM";
              const newT = {};
              DAYS.forEach(d => { newT[d] = c ? full : ""; });
              onChange(newT);
            }}
            style={{ width: 16, height: 16, accentColor: "#1a73e8" }}
          />
          24/7 Open
        </label>
        <button
          type="button"
          onClick={() => {
            const base = Object.values(timings).find(v => v && v !== "Closed");
            if (!base) { alert("Set at least one open day first."); return; }
            const newT = {};
            DAYS.forEach(d => { newT[d] = base; });
            onChange(newT);
          }}
          style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          Apply to All days
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 32px" }}>
        {DAYS.map(day => {
          const { oH, oM, openPeriod, cH, cM, closePeriod, isClosed } = parseDay(timings[day]);

          const handleToggleClosed = (checked) => {
            if (checked) {
              onChange({ ...timings, [day]: "Closed" });
            } else {
              onChange({ ...timings, [day]: buildStr(oH, oM, openPeriod, cH, cM, closePeriod) });
            }
          };

          const update = (k, v) => {
            const cur = { oH, oM, openPeriod, cH, cM, closePeriod };
            cur[k] = v;
            onChange({ ...timings, [day]: buildStr(cur.oH, cur.oM, cur.openPeriod, cur.cH, cur.cM, cur.closePeriod) });
          };

          const sel = (style) => ({
            ...style,
            padding: "6px 4px",
            borderRadius: 4,
            border: "1px solid #d1d5db",
            fontSize: 13,
            background: isClosed ? "#f3f4f6" : "#fff",
            color: isClosed ? "#9ca3af" : "#1f2937",
            cursor: isClosed ? "not-allowed" : "pointer"
          });

          return (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", opacity: isClosed ? 0.75 : 1 }}>
              <div style={{ width: 96, display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: isClosed ? "#9ca3af" : "#374151" }}>{day}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: isClosed ? "#ef4444" : "#6b7280", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={e => handleToggleClosed(e.target.checked)}
                    style={{ accentColor: "#ef4444", width: 12, height: 12 }}
                  />
                  Closed
                </label>
              </div>

              <select disabled={isClosed} style={sel({ width: 52 })} value={oH} onChange={e => update("oH", e.target.value)}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ fontSize: 13, color: "#6b7280" }}>:</span>
              <select disabled={isClosed} style={sel({ width: 52 })} value={oM} onChange={e => update("oM", e.target.value)}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
              <select disabled={isClosed} style={sel({})} value={openPeriod} onChange={e => update("openPeriod", e.target.value)}><option>AM</option><option>PM</option></select>
              <span style={{ fontSize: 12, color: "#9ca3af", margin: "0 2px" }}>TO</span>
              <select disabled={isClosed} style={sel({ width: 52 })} value={cH} onChange={e => update("cH", e.target.value)}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ fontSize: 13, color: "#6b7280" }}>:</span>
              <select disabled={isClosed} style={sel({ width: 52 })} value={cM} onChange={e => update("cM", e.target.value)}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
              <select disabled={isClosed} style={sel({})} value={closePeriod} onChange={e => update("closePeriod", e.target.value)}><option>AM</option><option>PM</option></select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SpecialHoursSection sub-component (Google My Business style) ─────────────
function SpecialHoursSection({ specialHours = [], onChange, country = "India" }) {
  const defaultHolidays = [
    { id: "bonalu", name: "Bonalu", date: "2026-08-10", dateFormatted: "10 AUG 2026" },
    { id: "independence", name: "Indian independence day", date: "2026-08-15", dateFormatted: "15 AUG 2026" },
    { id: "diwali", name: "Diwali", date: "2026-11-08", dateFormatted: "08 NOV 2026" },
  ];

  const [publicHolidays, setPublicHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  const countryCode = country === "India" || !country ? "IN" : (country.slice(0, 2).toUpperCase());
  const currentYear = new Date().getFullYear();
  const todayStr = toApiDateOnly(new Date());

  useEffect(() => {
    let isMounted = true;
    const fetchHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const token = typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "";
        const webApi = new WebApimanager(token);

        let holidaysList = [];
        try {
          const res = await webApi.getwithouttoken(`public-holidays`, {
            params: { countryCode, year: currentYear }
          });
          const raw = res?.data || res;
          holidaysList = Array.isArray(raw) ? raw : (raw?.data || raw?.holidays || []);
        } catch (err) {
          try {
            const fallbackRes = await webApi.getwithouturltoken(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/${countryCode}`);
            const rawFb = fallbackRes?.data || fallbackRes;
            holidaysList = Array.isArray(rawFb) ? rawFb : [];
          } catch (fbErr) {
            console.warn("Public holiday fallback fetch failed:", fbErr);
          }
        }

        if (isMounted && holidaysList.length > 0) {
          const mapped = holidaysList.map((item, idx) => {
            const rawDate = item.date || item.holidayDate || "";
            let dateFormatted = rawDate;
            if (rawDate) {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, "0");
                const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
                const year = d.getFullYear();
                dateFormatted = `${day} ${month} ${year}`;
              }
            }
            return {
              id: item.id || `holiday-${idx}-${rawDate}`,
              name: item.name || item.localName || item.holidayName || "Public Holiday",
              date: rawDate,
              dateFormatted,
            };
          });

          // Filter holidays starting on or after today's date and sort ascending
          const upcoming = mapped.filter(h => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
          setPublicHolidays(upcoming);
        }
      } catch (e) {
        console.warn("Error fetching public holidays:", e);
      } finally {
        if (isMounted) setLoadingHolidays(false);
      }
    };

    fetchHolidays();
    return () => { isMounted = false; };
  }, [countryCode, currentYear, todayStr]);

  const [customDates, setCustomDates] = useState(
    Array.isArray(specialHours) && specialHours.length > 0
      ? specialHours
      : [
        { id: Date.now(), date: "", opensAt: "09:30", closesAt: "18:30", isClosed: false },
      ]
  );

  const [holidayHours, setHolidayHours] = useState({});

  const handleAddDate = () => {
    const next = [...customDates, { id: Date.now(), date: "", opensAt: "09:30", closesAt: "18:30", isClosed: false }];
    setCustomDates(next);
    if (onChange) onChange(next);
  };

  const handleRemoveDate = (id) => {
    const next = customDates.filter(item => item.id !== id);
    setCustomDates(next);
    if (onChange) onChange(next);
  };

  const handleCustomChange = (id, field, value) => {
    const next = customDates.map(item => item.id === id ? { ...item, [field]: value } : item);
    setCustomDates(next);
    if (onChange) onChange(next);
  };

  const handleHolidayReviewToggle = (id) => {
    setHolidayHours(prev => ({
      ...prev,
      [id]: prev[id] ? null : { opensAt: "09:30", closesAt: "18:30", isClosed: false }
    }));
  };

  const handleHolidayChange = (id, field, value) => {
    setHolidayHours(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { opensAt: "09:30", closesAt: "18:30", isClosed: false }), [field]: value }
    }));
  };

  const holidaySource = publicHolidays.length > 0 ? publicHolidays : defaultHolidays;
  const visibleHolidays = showAllHolidays ? holidaySource : holidaySource.slice(0, 5);
  const hasMoreHolidays = holidaySource.length > 5;

  return (
    <div style={{ marginTop: 24, padding: 20, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
      <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#111" }}>Special hours</h3>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>
        CONFIRM PUBLIC HOLIDAYS OR ADD HOURS SO CUSTOMERS KNOW WHEN YOU&apos;RE OPEN
      </p>

      {/* Preset Public Holidays */}
      {loadingHolidays ? (
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Loading public holidays...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {visibleHolidays.map((h) => {
            const activeConfig = holidayHours[h.id];
            return (
              <div key={h.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{h.dateFormatted}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleHolidayReviewToggle(h.id)}
                    style={{ background: "none", border: "none", color: "#1a73e8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    {activeConfig ? "Done" : "Review"}
                  </button>
                </div>

                {activeConfig && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={activeConfig.isClosed}
                        onChange={e => handleHolidayChange(h.id, "isClosed", e.target.checked)}
                        style={{ accentColor: "#ef4444" }}
                      />
                      Closed
                    </label>

                    {!activeConfig.isClosed && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>Opens at</span>
                          <input
                            type="time"
                            value={activeConfig.opensAt}
                            onChange={e => handleHolidayChange(h.id, "opensAt", e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 12 }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>Close at</span>
                          <input
                            type="time"
                            value={activeConfig.closesAt}
                            onChange={e => handleHolidayChange(h.id, "closesAt", e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 12 }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {hasMoreHolidays && (
            <div style={{ marginTop: 4, marginBottom: 8 }}>
              <button
                type="button"
                onClick={() => setShowAllHolidays(!showAllHolidays)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1a73e8",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                {showAllHolidays ? "View less" : `View more (${holidaySource.length - 5} more holidays)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Special Dates List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {customDates.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid #f8fafc" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Date</label>
              <input
                type="date"
                value={item.date}
                onChange={e => handleCustomChange(item.id, "date", e.target.value)}
                style={{
                  width: 175,
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 13,
                  background: "#fff",
                  color: "#1f2937",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {!item.isClosed && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Opens at</label>
                  <input
                    type="time"
                    value={item.opensAt}
                    onChange={e => handleCustomChange(item.id, "opensAt", e.target.value)}
                    style={{
                      width: 140,
                      padding: "7px 12px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      background: "#fff",
                      color: "#1f2937",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Close at</label>
                  <input
                    type="time"
                    value={item.closesAt}
                    onChange={e => handleCustomChange(item.id, "closesAt", e.target.value)}
                    style={{
                      width: 140,
                      padding: "7px 12px",
                      borderRadius: 6,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                      background: "#fff",
                      color: "#1f2937",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={item.isClosed}
                  onChange={e => handleCustomChange(item.id, "isClosed", e.target.checked)}
                  style={{ accentColor: "#ef4444", width: 15, height: 15 }}
                />
                Closed
              </label>

              {customDates.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveDate(item.id)}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", padding: "4px" }}
                  title="Remove date"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddDate}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#1a73e8",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          marginTop: 12,
          padding: 0
        }}
      >
        + Add a date
      </button>
    </div>
  );
}

// ─── ServicesCheckboxes sub-component ────────────────────────────────────────
function ServicesCheckboxes({ selected, onChange }) {
  const toggle = (svc) => {
    const next = selected.includes(svc) ? selected.filter(s => s !== svc) : [...selected, svc];
    onChange(next);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      {SERVICES_LIST.map(svc => (
        <label key={svc} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
          <input type="checkbox" checked={selected.includes(svc)} onChange={() => toggle(svc)} style={{ width: 14, height: 14 }} />
          {svc}
        </label>
      ))}
    </div>
  );
}

// ─── FeatureComponentWrapper ──────────────────────────────────────────────────
function FeatureComponentWrapper({ featureType, branch, branchIndex, setBranches, errors = {} }) {
  if (!branch.services || typeof branch.services !== "object" || Array.isArray(branch.services)) {
    branch.services = {};
  }

  switch (featureType) {
    case "Pet Grooming":
      return <GroomingFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} errors={errors} />;
    case "Pet Training":
      return <TrainingFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} errors={errors} />;
    case "Pet Daycare":
      return <DaycareFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} errors={errors} />;
    case "Pet Clinic":
      return <ClinicFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} serviceOptionsByFeatureType={{ "Pet Clinic": ["General Checkup", "Vaccination", "Deworming", "Dental Care", "Surgery", "Emergency Care", "Consultation"] }} errors={errors} />;
    case "Pet Breeder":
      return <BreederFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} errors={errors} />;
    case "Pet Sitter/Walker":
      return <SitterFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} errors={errors} />;
    case "Pet Sales":
      return <PetSalesFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} availablePetTypes={PET_LIST} errors={errors} />;
    case "Pet Store":
      return <PetStoreFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} errors={errors} />;
    default:
      return null;
  }
}

// ─── BranchServiceDetailsSection ─────────────────────────────────────────────
function BranchServiceDetailsSection({
  title,
  selectedServices = [],
  onServicesChange,
  branch,
  branchIndex,
  setBranches,
  errors = {},
}) {
  const activeFeatureTypes = Array.from(
    new Set(selectedServices.map(s => MAP_SERVICE_TO_FEATURE[s] || s).filter(Boolean))
  );

  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 20, marginBottom: 24, border: "1px solid #e5e7eb" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>{title}</h3>

      {/* Service Type Tag Bar */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Service Type</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fafafa", minHeight: 42, alignItems: "center" }}>
          {activeFeatureTypes.map(ft => (
            <span key={ft} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#1a73e8", color: "#fff", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 4 }}>
              {ft}
              <button
                type="button"
                onClick={() => {
                  const next = selectedServices.filter(s => (MAP_SERVICE_TO_FEATURE[s] || s) !== ft);
                  onServicesChange(next);
                }}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
          {activeFeatureTypes.length === 0 && (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>No services selected. Select services from Business Information or add below.</span>
          )}
        </div>
      </div>

      {/* Feature Details Forms */}
      {activeFeatureTypes.map(ft => (
        <div key={ft} style={{ marginBottom: 28, border: "1px solid #f3f4f6", borderRadius: 8, padding: 16, background: "#fff" }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1a73e8", borderBottom: "2px solid #e8f0fe", paddingBottom: 8 }}>{ft} Details</h4>
          <FeatureComponentWrapper
            featureType={ft}
            branch={branch}
            branchIndex={branchIndex}
            setBranches={setBranches}
            errors={errors}
          />
        </div>
      ))}
    </div>
  );
}

// ─── AddressSection Sub-component (Additional Information) ────────────────────
function AddressSection({ title, address = {}, onChange, errors = {} }) {
  const [geoLoading, setGeoLoading] = useState(false);

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    const toastId = toast.loading("Fetching your current location...");

    const onSuccess = async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const latStr = lat.toFixed(6);
      const lngStr = lng.toFixed(6);

      const locationUpdate = {
        latitude: latStr,
        longitude: lngStr,
      };

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const pincode = addr.postcode || "";
          
          const areaParts = [
            addr.road,
            addr.suburb || addr.neighbourhood || addr.subdistrict || addr.locality || addr.quarter,
            addr.county
          ].filter(Boolean);
          const areaName = areaParts.length > 0
            ? areaParts.join(", ")
            : (addr.suburb || addr.neighbourhood || data.name || "");

          const cityName = addr.city || addr.town || addr.village || addr.county || addr.city_district || "";
          const stateName = addr.state || "";
          const countryName = addr.country || "";
          const countryCodeVal = (addr.country_code || "").toUpperCase();

          if (pincode) locationUpdate.pincode = pincode.replace(/\D/g, "").slice(0, 6);
          if (areaName) locationUpdate.area = areaName;

          const countriesList = Country.getAllCountries();
          if (countryCodeVal || countryName) {
            const foundC = countriesList.find(
              c => c.isoCode === countryCodeVal || c.name.toLowerCase() === countryName.toLowerCase()
            );
            if (foundC) {
              locationUpdate.countryCode = foundC.isoCode;
              locationUpdate.country = foundC.name;

              const stList = State.getStatesOfCountry(foundC.isoCode);
              const foundS = stList.find(
                s => s.name.toLowerCase() === stateName.toLowerCase() || stateName.toLowerCase().includes(s.name.toLowerCase())
              );
              if (foundS) {
                locationUpdate.stateCode = foundS.isoCode;
                locationUpdate.state = foundS.name;

                if (cityName) {
                  const ctList = City.getCitiesOfState(foundC.isoCode, foundS.isoCode);
                  const foundCity = ctList.find(
                    c => c.name.toLowerCase() === cityName.toLowerCase() || cityName.toLowerCase().includes(c.name.toLowerCase())
                  );
                  locationUpdate.city = foundCity ? foundCity.name : cityName;
                }
              }
            }
          }
        }
      } catch (geoErr) {
        console.warn("Reverse geocode lookup warning:", geoErr);
      } finally {
        onChange(locationUpdate);
        toast.dismiss(toastId);
        toast.success("Location retrieved successfully!");
        setGeoLoading(false);
      }
    };

    const onError = (err) => {
      if (err.code === err.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (fallbackErr) => {
            toast.dismiss(toastId);
            setGeoLoading(false);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              toast.error("Location permission denied. Please allow location access in browser settings.");
            } else {
              toast.error("Location request timed out. Please enter coordinates manually.");
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
        return;
      }

      toast.dismiss(toastId);
      setGeoLoading(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Location permission denied. Please allow location access in browser settings.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        toast.error("Location position unavailable. Please enter coordinates manually.");
      } else {
        toast.error("Could not fetch location. Please enter manually.");
      }
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };

  const countries = Country.getAllCountries();
  const selectedCountryObj = countries.find(
    c => c.isoCode === address.countryCode || c.name === address.country
  );
  const selectedCountryCode = selectedCountryObj?.isoCode || "";

  const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  const selectedStateObj = states.find(
    s => s.isoCode === address.stateCode || s.name === address.state
  );
  const selectedStateCode = selectedStateObj?.isoCode || "";

  const cities = (selectedCountryCode && selectedStateCode)
    ? City.getCitiesOfState(selectedCountryCode, selectedStateCode)
    : [];

  const countryList = countries.map(c => ({ id: c.isoCode, name: c.name }));
  const stateList = states.map(s => ({ id: s.isoCode, name: s.name }));
  const cityList = cities.map(c => ({ id: c.name, name: c.name }));

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</h3>
        <button
          type="button"
          onClick={handleGeoLocation}
          disabled={geoLoading}
          style={{ background: "none", border: "none", color: geoLoading ? "#9ca3af" : "#1a73e8", fontSize: 13, fontWeight: 600, cursor: geoLoading ? "not-allowed" : "pointer" }}
        >
          {geoLoading ? "Fetching location..." : "Get Geo location"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Country <span style={{ color: "#e74c3c" }}>*</span></label>
          <MultiSelectDropdown
            listItems={countryList}
            selectedIds={selectedCountryCode ? [selectedCountryCode] : []}
            setSelectedIds={(ids) => {
              const code = ids.length ? ids[ids.length - 1] : "";
              const cObj = countries.find(c => c.isoCode === code);
              onChange("countryCode", code);
              onChange("country", cObj ? cObj.name : "");
              onChange("stateCode", "");
              onChange("state", "");
              onChange("city", "");
            }}
            isSingleSelect={true}
            placeholder="Select Country"
            hasError={Boolean(errors.country)}
          />
          {errors.country && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.country}</span>}
        </div>

        <div>
          <label style={labelStyle}>State <span style={{ color: "#e74c3c" }}>*</span></label>
          <MultiSelectDropdown
            listItems={stateList}
            selectedIds={selectedStateCode ? [selectedStateCode] : []}
            setSelectedIds={(ids) => {
              const sCode = ids.length ? ids[ids.length - 1] : "";
              const sObj = states.find(s => s.isoCode === sCode);
              onChange("stateCode", sCode);
              onChange("state", sObj ? sObj.name : "");
              onChange("city", "");
            }}
            isSingleSelect={true}
            placeholder={!selectedCountryCode ? "Select Country first" : "Select State"}
            hasError={Boolean(errors.state)}
          />
          {errors.state && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.state}</span>}
        </div>

        <div>
          <label style={labelStyle}>City <span style={{ color: "#e74c3c" }}>*</span></label>
          <MultiSelectDropdown
            listItems={cityList}
            selectedIds={address.city ? [address.city] : []}
            setSelectedIds={(ids) => {
              const cityName = ids.length ? ids[ids.length - 1] : "";
              onChange("city", cityName);
            }}
            isSingleSelect={true}
            placeholder={!selectedStateCode ? "Select State first" : "Select City"}
            hasError={Boolean(errors.city)}
          />
          {errors.city && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.city}</span>}
        </div>

        <div>
          <label style={labelStyle}>Pin Code <span style={{ color: "#e74c3c" }}>*</span></label>
          <input
            style={{ ...inputStyle, border: errors.pincode ? "1px solid #ef4444" : inputStyle.border }}
            placeholder="Enter Pin Code"
            maxLength={6}
            value={address.pincode || ""}
            onChange={e => onChange("pincode", e.target.value.replace(/\D/g, ""))}
          />
          {errors.pincode && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.pincode}</span>}
        </div>
        <div>
          <label style={labelStyle}>Area/Street</label>
          <input style={inputStyle} placeholder="Enter Area/Street" value={address.area || ""} onChange={e => onChange("area", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Flat/House no.</label>
          <input style={inputStyle} placeholder="Enter Flat/House no." value={address.flat || ""} onChange={e => onChange("flat", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Latitude</label>
          <input style={inputStyle} placeholder="Select here" value={address.latitude || ""} onChange={e => onChange("latitude", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Longitude</label>
          <input style={inputStyle} placeholder="Select here" value={address.longitude || ""} onChange={e => onChange("longitude", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── PhotoUploadSection Sub-component (Additional Information) ─────────────────
function PhotoUploadSection({ title, photos = [], onUpload, onRemove, single = false }) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onUpload(files);
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24, background: "#fff" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>
        {title} <span style={{ color: "#e74c3c" }}>*</span>
      </h3>

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {/* Upload Box */}
        <label style={{
          width: 90, height: 90, borderRadius: "50%", border: "1.5px dashed #bbb",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", background: "#fafafa"
        }}>
          <input type="file" accept="image/*" multiple={!single} onChange={handleFileChange} style={{ display: "none" }} />
          <span style={{ fontSize: 22, color: "#555" }}>+</span>
          <span style={{ fontSize: 9, color: "#777", textAlign: "center", marginTop: 2 }}>Tap to Select Photo</span>
        </label>

        {/* Thumbnail previews */}
        {photos.map((p, idx) => (
          <div key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #ddd", background: "#f3f4f6" }}>
            <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              style={{
                position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BranchSection sub-component ─────────────────────────────────────────────
function BranchSection({ branch, index, onChange, onRemove, showRemove, errors = {} }) {
  const field = (key) => ({
    value: branch[key] || "",
    onChange: (e) => onChange(index, key, e.target.value),
  });

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box",
    background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
  const fieldWrap = { marginBottom: 16 };

  const getErr = (fieldKey) => errors[`${fieldKey}_${index}`];

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 20, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>
          Enter Branch {index + 1} Details
        </h4>
        {showRemove && (
          <button type="button" onClick={() => onRemove(index)}
            style={{ background: "none", border: "none", color: "#e74c3c", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            Remove
          </button>
        )}
      </div>

      {/* Grid Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch name <span style={{ color: "#e74c3c" }}>*</span></label>
          <input
            style={{ ...inputStyle, border: getErr("branchName") ? "1px solid #ef4444" : inputStyle.border }}
            placeholder="Enter Branch Name"
            value={branch.branchName || ""}
            onChange={e => onChange(index, "branchName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          />
          {getErr("branchName") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchName")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Location <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto", border: getErr("branchLocation") ? "1px solid #ef4444" : inputStyle.border }} value={branch.branchLocation || ""} onChange={e => onChange(index, "branchLocation", e.target.value)}>
            <option value="">Select Branch location</option>
            {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {getErr("branchLocation") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchLocation")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Opening Date <span style={{ color: "#e74c3c" }}>*</span></label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                placeholder="Eg: 6 (months) or 2 (years) or 2.5"
                style={{ ...inputStyle, flex: 1, border: getErr("branchOpeningDate") ? "1px solid #ef4444" : inputStyle.border }}
                value={branch.durationInput || ""}
                onChange={(e) => {
                  const val = sanitizeExperienceInput(e.target.value);
                  const converted = convertDurationToDate(val);
                  onChange(index, "durationInput", val);
                  if (converted) {
                    onChange(index, "branchOpeningDate", converted);
                  }
                }}
              />
              {String(branch.durationInput || "").trim() && (
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {formatDurationText(branch.durationInput)}
                </span>
              )}
            </div>
            <input
              type="date"
              style={{ ...inputStyle, border: getErr("branchOpeningDate") ? "1px solid #ef4444" : inputStyle.border }}
              max={toApiDateOnly(new Date())}
              value={branch.branchOpeningDate || ""}
              onChange={(e) => {
                onChange(index, "branchOpeningDate", e.target.value);
                onChange(index, "durationInput", "");
              }}
            />
          </div>
          {getErr("branchOpeningDate") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchOpeningDate")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Present Data store model <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto", border: getErr("dataStoreType") ? "1px solid #ef4444" : inputStyle.border }} value={branch.dataStoreType || ""} onChange={e => onChange(index, "dataStoreType", e.target.value)}>
            <option value="">Select Data store type</option>
            {DATA_STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {getErr("dataStoreType") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("dataStoreType")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Business Name (optional)</label>
          <input
            style={inputStyle}
            placeholder="Enter Business name"
            value={branch.businessName || ""}
            onChange={e => onChange(index, "businessName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
          />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Email <span style={{ color: "#e74c3c" }}>*</span></label>
          <input type="email" style={{ ...inputStyle, border: getErr("branchEmail") ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter branch email" {...field("branchEmail")} />
          {getErr("branchEmail") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchEmail")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Phone Number <span style={{ color: "#e74c3c" }}>*</span></label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ border: getErr("branchPhone") ? "1px solid #ef4444" : "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "2px 6px", height: "40px", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <SearchableCountryCode
                countries={ALL_COUNTRIES_DIAL}
                selectedCode={branch.branchCountryCode || "IN"}
                onSelect={(code) => {
                  const cObj = ALL_COUNTRIES_DIAL.find((c) => c.code === code);
                  const dial = cObj?.dialCode || "+91";
                  onChange(index, "branchCountryCode", code);
                  onChange(index, "branchPhoneCode", dial);
                  const digits = getRawPhoneDigits(branch.branchPhone);
                  const maxLen = getPhoneLength(code);
                  const trimmed = digits.slice(0, maxLen);
                  onChange(index, "branchPhone", trimmed ? `${dial}${trimmed}` : "");
                }}
              />
            </div>
            <input
              type="tel"
              style={{ ...inputStyle, flex: 1, border: getErr("branchPhone") ? "1px solid #ef4444" : inputStyle.border }}
              placeholder={`Enter ${getPhoneLength(branch.branchCountryCode || "IN") !== 15 ? getPhoneLength(branch.branchCountryCode || "IN") + "-digit " : ""}phone number`}
              maxLength={getPhoneLength(branch.branchCountryCode || "IN")}
              value={getRawPhoneDigits(branch.branchPhone)}
              onChange={e => {
                const code = branch.branchPhoneCode || "+91";
                const iso = branch.branchCountryCode || "IN";
                const maxLen = getPhoneLength(iso);
                const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
                onChange(index, "branchPhone", digits ? `${code}${digits}` : "");
              }}
            />
          </div>
          {getErr("branchPhone") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchPhone")}</span>}
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Accepted Payment Methods</label>
          <MultiSelectDropdown
            listItems={PAYMENT_OPTIONS.map(pm => ({ id: pm, name: pm }))}
            selectedIds={branch.paymentMethods || []}
            setSelectedIds={(selected) => onChange(index, "paymentMethods", selected)}
            placeholder="Select payment methods"
          />
        </div>
      </div>

      {/* Services */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Services <span style={{ color: "#e74c3c" }}>*</span></label>
        <ServicesCheckboxes selected={branch.selectedServices || []} onChange={val => onChange(index, "selectedServices", val)} />
        {getErr("selectedServices") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("selectedServices")}</span>}
      </div>

      {/* Hours / Timings */}
      <div style={{ marginBottom: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 2px 0", textTransform: "uppercase" }}>Hours</p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 6px 0", textTransform: "uppercase" }}>CHOOSE YOUR SHOP OPENING AND CLOSING TIMES.</p>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
            <input
              type="radio"
              name={`branch_hoursMode_${index}`}
              value="MAIN_HOURS"
              checked={(branch.hoursMode || "MAIN_HOURS") === "MAIN_HOURS"}
              onChange={() => onChange(index, "hoursMode", "MAIN_HOURS")}
              style={{ accentColor: "#1a73e8" }}
            />
            OPEN WITH MAIN HOURS SHOW WHEN YOUR BUSINESS IS OPEN
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", marginTop: 4, cursor: "pointer" }}>
            <input
              type="radio"
              name={`branch_hoursMode_${index}`}
              value="NO_MAIN_HOURS"
              checked={branch.hoursMode === "NO_MAIN_HOURS"}
              onChange={() => onChange(index, "hoursMode", "NO_MAIN_HOURS")}
              style={{ accentColor: "#1a73e8" }}
            />
            OPEN WITH NO MAIN HOURS DON&apos;T SHOW ANY BUSINESS HOURS
          </label>
        </div>

        {(branch.hoursMode || "MAIN_HOURS") === "MAIN_HOURS" && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "16px 0 8px" }}>Branch Timings <span style={{ color: "#e74c3c" }}>*</span></p>
            <TimingsGrid
              timings={branch.timings}
              is24x7={branch.is24x7}
              onChange={t => onChange(index, "timings", t)}
              on24x7Change={v => onChange(index, "is24x7", v)}
            />
            {getErr("branchTimings") && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{getErr("branchTimings")}</span>}
            <SpecialHoursSection
              specialHours={branch.specialHours || []}
              onChange={sh => onChange(index, "specialHours", sh)}
              country={branch.branchAddress?.country || "India"}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function RegisterBusinessModal({ open, onClose, onSuccess, userInfo, initialTab = 0, hasAssignedBranches: hasAssignedBranchesProp }) {
  const [activeTab, setActiveTab] = useState(initialTab || 0); // 0=User, 1=Business, 2=Services, 3=Additional
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsDesktop(window.innerWidth >= 768);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (open && initialTab !== undefined) {
      setActiveTab(initialTab);
    }
    setFormErrors({});
  }, [open, initialTab]);

  // ── Tab 0: User Information ──────────────────────────────────────────────────
  const [userForm, setUserForm] = useState({
    fullName: (userInfo?.name || `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || "").replace(/[^a-zA-Z\s]/g, ""),
    email: userInfo?.email || "",
    mobileNumber: userInfo?.phoneNumber || userInfo?.mobileNumber || "",
    gender: userInfo?.gender || "",
  });

  React.useEffect(() => {
    if (open && userInfo) {
      setUserForm(prev => ({
        fullName: (userInfo?.name || `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || prev.fullName).replace(/[^a-zA-Z\s]/g, ""),
        email: userInfo?.email || prev.email,
        mobileNumber: userInfo?.phoneNumber || userInfo?.mobileNumber || prev.mobileNumber,
        gender: userInfo?.gender || prev.gender,
      }));
    }
  }, [open, userInfo]);

  // ── Tab 1: Business Information ──────────────────────────────────────────────
  const [businessType, setBusinessType] = useState("Independent");

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyPhoneCode: "+91",
    companyCountryCode: "IN",
    companyWebsite: "",
    roleOfPerson: "",
    gender: userInfo?.gender || "",
    services: [],
    aboutCompany: "",
    openingDate: "",
    is24x7: false,
    timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
    address: {},
    logo: null,
    relatedPhotos: [],
    paymentMethods: [],
  });

  // ── Branch Details ───────────────────────────────────────────────────────────
  const [branches, setBranches] = useState([blankBranch()]);

  const handleBusinessTypeChange = (type) => {
    setBusinessType(type);
    if (type === "Independent") {
      setBranches(prev => [prev[0] || blankBranch()]);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleUserChange = (key, val) => {
    setUserForm(p => ({ ...p, [key]: val }));
    setFormErrors(prev => ({ ...prev, [key]: "" }));
  };

  const handleCompanyChange = (key, val) => {
    setFormErrors(prev => ({ ...prev, [key]: "" }));
    if (key === "services") {
      const oldServices = companyForm.services || [];
      const newServices = val || [];
      const added = newServices.filter(s => !oldServices.includes(s));

      setCompanyForm(p => ({ ...p, services: newServices }));
      setBranches(prev =>
        prev.map(b => {
          const currentB = b.selectedServices || [];
          const updatedB = Array.from(new Set([...currentB, ...added]));
          return { ...b, selectedServices: updatedB };
        })
      );
    } else {
      setCompanyForm(p => ({ ...p, [key]: val }));
    }
  };

  const handleBranchChange = (idx, key, val) => {
    setFormErrors(prev => ({ ...prev, [`${key}_${idx}`]: "" }));
    setBranches(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };

      if (key === "selectedServices") {
        const branchSvcs = val || [];
        setCompanyForm(c => ({
          ...c,
          services: Array.from(new Set([...(c.services || []), ...branchSvcs]))
        }));
      }

      return next;
    });
  };

  const addBranch = () =>
    setBranches(prev => [
      ...prev,
      { ...blankBranch(), selectedServices: [...(companyForm.services || [])] }
    ]);
  const removeBranch = (idx) => setBranches(prev => prev.filter((_, i) => i !== idx));

  const getVendorUserId = () => {
    let raw =
      userInfo?.vendor_user_id ||
      userInfo?.userId ||
      userInfo?.groomerID ||
      userInfo?.groomerId ||
      userInfo?.id ||
      null;

    if (!raw && typeof window !== "undefined") {
      raw =
        localStorage.getItem("vendor_user_id") ||
        localStorage.getItem("userId") ||
        localStorage.getItem("groomerID") ||
        localStorage.getItem("groomerId") ||
        localStorage.getItem("vendor_id") ||
        null;
    }

    const num = parseInt(raw, 10);
    return !isNaN(num) && num > 0 ? num : 233;
  };

  const buildPayload = (stepName) => {
    const isEnt = !hasAssignedBranches && businessType?.toLowerCase() === "enterprise";
    const vUserId = getVendorUserId();

    const formatTimings = (tObj = {}) => {
      const res = {};
      Object.keys(tObj).forEach(d => {
        res[d.toLowerCase()] = tObj[d] || "";
      });
      return res;
    };

    const formatServices = (sObj = {}) => ({
      clinicDetails: sObj["Pet Clinic"] || null,
      groomingDetails: sObj["Pet Grooming"] || null,
      daycareDetails: sObj["Pet Daycare"] || null,
      petSalesDetails: sObj["Pet Sales"] || null,
      petShopDetails: sObj["Pet Store"] || null,
      trainingDetails: sObj["Pet Training"] || null,
      sitterDetails: sObj["Pet Sitter/Walker"] || null,
      breederDetails: sObj["Pet Breeder"] || null,
    });

    const compAddr = companyForm.address || {};
    const companyAddressStr = `${compAddr.flat || ""}, ${compAddr.area || ""}, ${compAddr.city || ""}, ${compAddr.state || ""} ${compAddr.pincode || ""}`.replace(/^[\s,]+|[\s,]+$/g, "").trim();

    const b0 = branches[0] || blankBranch();
    const b0Addr = b0.branchAddress || {};
    const b0AddressStr = `${b0Addr.flat || ""}, ${b0Addr.area || ""}, ${b0Addr.city || ""}, ${b0Addr.state || ""} ${b0Addr.pincode || ""}`.replace(/^[\s,]+|[\s,]+$/g, "").trim() || companyAddressStr;

    if (!isEnt) {
      // ── Single Company / Independent (branch_only) ──────────────────────────
      return {
        ticketId: companyForm.ticketId || null,
        vendor_user_id: vUserId,
        vendorUserId: vUserId,
        userId: vUserId,
        groomerID: vUserId,
        registrationType: "branch_only",
        companyId: null,
        vendorName: userForm.fullName,
        vendorPhoneNumber: userForm.mobileNumber,
        vendorEmail: userForm.email,
        gender: userForm.gender,
        role: companyForm.roleOfPerson || "Owner",
        currentStep: stepName,
        shopFrontPhoto: companyForm.logo ? (typeof companyForm.logo === "string" ? companyForm.logo : "") : "",
        selfiePhoto: "",
        videoUpload: "",
        images: (companyForm.relatedPhotos || []).map(p => typeof p === "string" ? p : ""),
        locationMetadata: {
          latitude: parseFloat(compAddr.latitude) || 0,
          longitude: parseFloat(compAddr.longitude) || 0,
          addressText: `${compAddr.area || ""}, ${compAddr.city || ""}`.trim(),
          city: compAddr.city || "",
          state: compAddr.state || "",
          pincode: compAddr.pincode || "",
        },
        branchDetails: {
          name: b0.branchName || companyForm.companyName,
          location: b0AddressStr,
          phone: b0.branchPhone || userForm.mobileNumber,
          email: b0.branchEmail || userForm.email,
          startDate: b0.branchOpeningDate || companyForm.openingDate || toApiDateOnly(new Date()),
          petTypes: b0.selectedServices?.length > 0 ? b0.selectedServices : companyForm.services,
          timings: formatTimings(b0.timings || companyForm.timings),
          services: formatServices(b0.services),
        },
        draftData: {
          step1Completed: true,
          step2Completed: false,
        },
      };
    } else {
      // ── Enterprise (company_and_branch) ──────────────────────────────────
      return {
        ticketId: companyForm.ticketId || null,
        vendor_user_id: vUserId,
        vendorUserId: vUserId,
        userId: vUserId,
        groomerID: vUserId,
        registrationType: "company_and_branch",
        vendorName: userForm.fullName,
        vendorPhoneNumber: userForm.mobileNumber,
        vendorEmail: userForm.email,
        gender: userForm.gender,
        role: companyForm.roleOfPerson || "Owner",
        petType: companyForm.services,
        companyStartDate: companyForm.openingDate || toApiDateOnly(new Date()),
        branchStartDate: branches[0]?.branchOpeningDate || companyForm.openingDate || toApiDateOnly(new Date()),
        startDate: companyForm.openingDate || toApiDateOnly(new Date()),
        companyName: companyForm.companyName,
        companyAddress: companyAddressStr,
        currentStep: stepName,
        shopFrontPhoto: companyForm.logo ? (typeof companyForm.logo === "string" ? companyForm.logo : "") : "",
        selfiePhoto: "",
        videoUpload: "",
        images: (companyForm.relatedPhotos || []).map(p => typeof p === "string" ? p : ""),
        locationMetadata: {
          latitude: parseFloat(compAddr.latitude) || 0,
          longitude: parseFloat(compAddr.longitude) || 0,
          addressText: `${compAddr.area || ""}, ${compAddr.city || ""}`.trim(),
          city: compAddr.city || "",
          state: compAddr.state || "",
          pincode: compAddr.pincode || "",
        },
        branchDetails: {
          totalBranches: branches.length,
          branches: branches.map(b => {
            const bAddr = b.branchAddress || {};
            const bAddrStr = `${bAddr.flat || ""}, ${bAddr.area || ""}, ${bAddr.city || ""}, ${bAddr.state || ""} ${bAddr.pincode || ""}`.replace(/^[\s,]+|[\s,]+$/g, "").trim() || b.branchLocation;
            return {
              name: b.branchName || companyForm.companyName,
              location: bAddrStr || b.branchLocation || companyAddressStr,
              phone: b.branchPhone || userForm.mobileNumber,
              email: b.branchEmail || userForm.email,
              startDate: b.branchOpeningDate || companyForm.openingDate || toApiDateOnly(new Date()),
              petTypes: b.selectedServices?.length > 0 ? b.selectedServices : companyForm.services,
              timings: formatTimings(b.timings),
              services: formatServices(b.services),
            };
          }),
        },
        draftData: {
          step1Completed: true,
          step2Completed: true,
          step3Completed: true,
        },
      };
    }
  };

  const validateTab = (tabIndex) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const newErrors = {};

    // ── TAB 0: USER INFORMATION ──
    if (tabIndex === 0) {
      if (!userForm.fullName || !userForm.fullName.trim()) {
        newErrors.fullName = "Please enter your full name.";
      } else if (!nameRegex.test(userForm.fullName.trim())) {
        newErrors.fullName = "Full name can contain letters and spaces only.";
      }
      if (!userForm.gender) {
        newErrors.gender = "Please select your gender.";
      }
      if (!userForm.email || !userForm.email.trim()) {
        newErrors.email = "Please enter your email address.";
      } else if (!emailRegex.test(userForm.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
      const rawMobile = getRawPhoneDigits(userForm.mobileNumber);
      const userIso = parsePhoneAndCode(userForm.mobileNumber).countryCode || "IN";
      const expectedMobileLen = getPhoneLength(userIso);
      if (!rawMobile) {
        newErrors.mobileNumber = "Please enter your mobile number.";
      } else if (expectedMobileLen !== 15 ? rawMobile.length !== expectedMobileLen : (rawMobile.length < 7 || rawMobile.length > 15)) {
        newErrors.mobileNumber = expectedMobileLen !== 15 ? `Please enter a valid ${expectedMobileLen}-digit mobile number.` : "Please enter a valid mobile number.";
      }

      setFormErrors(newErrors);
      const errList = Object.values(newErrors);
      if (errList.length > 0) {
        toast.error(errList[0]);
        return false;
      }
      return true;
    }

    // ── TAB 1: BUSINESS INFORMATION ──
    if (tabIndex === 1) {
      if (showCompanyInfo) {
        if (!companyForm.companyName || !companyForm.companyName.trim()) {
          newErrors.companyName = "Please enter company name.";
        } else if (!nameRegex.test(companyForm.companyName.trim())) {
          newErrors.companyName = "Company name can contain letters and spaces only.";
        }
        if (!companyForm.companyEmail || !companyForm.companyEmail.trim()) {
          newErrors.companyEmail = "Please enter company email.";
        } else if (!emailRegex.test(companyForm.companyEmail.trim())) {
          newErrors.companyEmail = "Please enter a valid company email.";
        }
        const rawCompPhone = getRawPhoneDigits(companyForm.companyPhone);
        const compIso = companyForm.companyCountryCode || parsePhoneAndCode(companyForm.companyPhone).countryCode || "IN";
        const expectedCompLen = getPhoneLength(compIso);
        if (!rawCompPhone) {
          newErrors.companyPhone = "Please enter company phone number.";
        } else if (expectedCompLen !== 15 ? rawCompPhone.length !== expectedCompLen : (rawCompPhone.length < 7 || rawCompPhone.length > 15)) {
          newErrors.companyPhone = expectedCompLen !== 15 ? `Please enter a valid ${expectedCompLen}-digit company phone number.` : "Please enter a valid company phone number.";
        }

        if (!companyForm.roleOfPerson || !companyForm.roleOfPerson.trim()) {
          newErrors.roleOfPerson = "Please enter role of the registering person.";
        } else if (!nameRegex.test(companyForm.roleOfPerson.trim())) {
          newErrors.roleOfPerson = "Role of person can contain letters and spaces only.";
        }
        if (!companyForm.gender) {
          newErrors.companyGender = "Please select company contact gender.";
        }
        if (!companyForm.openingDate) {
          newErrors.companyOpeningDate = "Please select company opening date.";
        }
      }

      for (let i = 0; i < branches.length; i++) {
        const b = branches[i];
        const bLabel = branches.length > 1 ? ` (Branch ${i + 1})` : "";

        if (!b.branchName || !b.branchName.trim()) {
          newErrors[`branchName_${i}`] = `Please enter branch name${bLabel}.`;
        } else if (!nameRegex.test(b.branchName.trim())) {
          newErrors[`branchName_${i}`] = `Branch name can contain letters and spaces only${bLabel}.`;
        }
        if (b.businessName && b.businessName.trim() && !nameRegex.test(b.businessName.trim())) {
          newErrors[`businessName_${i}`] = `Business name can contain letters and spaces only${bLabel}.`;
        }
        if (!b.branchLocation) {
          newErrors[`branchLocation_${i}`] = `Please select branch location${bLabel}.`;
        }
        if (!b.branchOpeningDate) {
          newErrors[`branchOpeningDate_${i}`] = `Please select branch opening date${bLabel}.`;
        }
        if (!b.dataStoreType) {
          newErrors[`dataStoreType_${i}`] = `Please select present data store model${bLabel}.`;
        }
        if (!b.branchEmail || !b.branchEmail.trim()) {
          newErrors[`branchEmail_${i}`] = `Please enter branch email${bLabel}.`;
        } else if (!emailRegex.test(b.branchEmail.trim())) {
          newErrors[`branchEmail_${i}`] = `Please enter a valid branch email${bLabel}.`;
        }
        const rawBranchPhone = getRawPhoneDigits(b.branchPhone);
        const branchIso = b.branchCountryCode || parsePhoneAndCode(b.branchPhone).countryCode || "IN";
        const expectedBranchLen = getPhoneLength(branchIso);
        if (!rawBranchPhone) {
          newErrors[`branchPhone_${i}`] = `Please enter branch phone number${bLabel}.`;
        } else if (expectedBranchLen !== 15 ? rawBranchPhone.length !== expectedBranchLen : (rawBranchPhone.length < 7 || rawBranchPhone.length > 15)) {
          newErrors[`branchPhone_${i}`] = expectedBranchLen !== 15 ? `Please enter a valid ${expectedBranchLen}-digit branch phone number${bLabel}.` : `Please enter a valid branch phone number${bLabel}.`;
        }

        if ((b.hoursMode || "MAIN_HOURS") === "MAIN_HOURS") {
          const hasOpenDay = Object.values(b.timings || {}).some(v => v && v !== "Closed");
          if (!b.is24x7 && !hasOpenDay) {
            newErrors[`branchTimings_${i}`] = `Please set branch timings or select 24/7 Open${bLabel}.`;
          }
        }

        const activeSvcs = (b.selectedServices && b.selectedServices.length > 0) ? b.selectedServices : companyForm.services;
        if (!activeSvcs || activeSvcs.length === 0) {
          newErrors[`selectedServices_${i}`] = `Please select at least one service${bLabel}.`;
          if (!newErrors.services) {
            newErrors.services = "Please select at least one service.";
          }
        }
      }

      const hasCompanyServices = Array.isArray(companyForm.services) && companyForm.services.length > 0;
      const hasBranchServices = branches.some(b => Array.isArray(b.selectedServices) && b.selectedServices.length > 0);
      if (!hasCompanyServices && !hasBranchServices) {
        newErrors.services = "Please select at least one service.";
      }

      setFormErrors(newErrors);
      const errList = Object.values(newErrors);
      if (errList.length > 0) {
        toast.error(errList[0]);
        return false;
      }
      return true;
    }

    // ── TAB 2: SERVICES INFORMATION ──
    if (tabIndex === 2) {
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i];
        const activeSvcs = b.selectedServices?.length > 0 ? b.selectedServices : companyForm.services;
        const bLabel = branches.length > 1 ? ` for Branch ${i + 1}` : "";

        if (!activeSvcs || activeSvcs.length === 0) {
          newErrors[`services_${i}`] = `Please select at least one service${bLabel}.`;
        } else {
          // Check feature sub-fields
          const activeFeatureTypes = Array.from(
            new Set(activeSvcs.map(s => MAP_SERVICE_TO_FEATURE[s] || s).filter(Boolean))
          );

          activeFeatureTypes.forEach(ft => {
            const rawDetails = b.services?.[ft];

            if (ft === "Pet Grooming") {
              if (!rawDetails?.serviceMode || rawDetails.serviceMode.length === 0) {
                newErrors[`grooming_mode_${i}`] = `Please select Service Mode for Pet Grooming${bLabel}.`;
              }
              const servicesList = Array.isArray(rawDetails?.services) ? rawDetails.services : [];
              if (servicesList.length === 0) {
                newErrors[`grooming_services_${i}`] = `Please add at least one Grooming Service${bLabel}.`;
              } else {
                servicesList.forEach((s, sIdx) => {
                  const hasName = (Array.isArray(s.serviceName) && s.serviceName.length > 0) || Boolean(s.otherServiceName?.trim());
                  if (!hasName) {
                    newErrors[`grooming_svc_${i}_${sIdx}_name`] = `Please select Grooming Service name in item #${sIdx + 1}${bLabel}.`;
                  }
                  if (!s.petType || s.petType.length === 0) {
                    newErrors[`grooming_svc_${i}_${sIdx}_petType`] = `Please select Pet Type in Grooming item #${sIdx + 1}${bLabel}.`;
                  }
                  if (!s.price || !String(s.price).trim() || parseFloat(s.price) <= 0) {
                    newErrors[`grooming_svc_${i}_${sIdx}_price`] = `Please enter a valid price in Grooming item #${sIdx + 1}${bLabel}.`;
                  }
                });
              }
            }

            if (ft === "Pet Training") {
              if (!rawDetails?.trainingTypes || rawDetails.trainingTypes.length === 0) {
                newErrors[`training_type_${i}`] = `Please select Training Type for Pet Training${bLabel}.`;
              }
              if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
                newErrors[`training_petTypes_${i}`] = `Please select Pet Type for Pet Training${bLabel}.`;
              }
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              items.forEach((item, itemIdx) => {
                if (item.serviceName && !item.serviceName.trim()) {
                  newErrors[`training_item_${i}_${itemIdx}_name`] = `Please enter Service Name in Training item #${itemIdx + 1}${bLabel}.`;
                }
              });
            }

            if (ft === "Pet Daycare") {
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              if (items.length === 0) {
                newErrors[`daycare_items_${i}`] = `Please add Daycare details${bLabel}.`;
              } else {
                items.forEach((item, itemIdx) => {
                  const pTypes = item.supportedPets || item.petTypes || [];
                  if (!pTypes || pTypes.length === 0) {
                    newErrors[`daycare_${i}_${itemIdx}_petType`] = `Please select Pet Type in Daycare #${itemIdx + 1}${bLabel}.`;
                  }
                  if (!item.petSizes || item.petSizes.length === 0) {
                    newErrors[`daycare_${i}_${itemIdx}_petSizes`] = `Please select Pet Sizes in Daycare #${itemIdx + 1}${bLabel}.`;
                  }
                });
              }
              const packages = Array.isArray(rawDetails?.packages) ? rawDetails.packages : [];
              packages.forEach((pkg, pkgIdx) => {
                if (!pkg.packageName || !pkg.packageName.trim()) {
                  newErrors[`daycare_pkg_${i}_${pkgIdx}_name`] = `Please enter Package Name in Daycare package #${pkgIdx + 1}${bLabel}.`;
                }
                if (!pkg.selectedCombinations || pkg.selectedCombinations.length === 0) {
                  newErrors[`daycare_pkg_${i}_${pkgIdx}_comb`] = `Please select Pet Type & Size in Daycare package #${pkgIdx + 1}${bLabel}.`;
                }
                if (!pkg.price || !String(pkg.price).trim() || parseFloat(pkg.price) <= 0) {
                  newErrors[`daycare_pkg_${i}_${pkgIdx}_price`] = `Please enter a valid Price in Daycare package #${pkgIdx + 1}${bLabel}.`;
                }
              });
            }

            if (ft === "Pet Clinic") {
              if (!rawDetails?.clinicTypes || rawDetails.clinicTypes.length === 0) {
                newErrors[`clinic_type_${i}`] = `Please select Visit Type for Pet Clinic${bLabel}.`;
              }
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              if (items.length === 0) {
                newErrors[`clinic_items_${i}`] = `Please add Clinic details${bLabel}.`;
              } else {
                items.forEach((item, itemIdx) => {
                  if (!item.services || item.services.length === 0) {
                    newErrors[`clinic_${i}_${itemIdx}_services`] = `Please select Services in Clinic #${itemIdx + 1}${bLabel}.`;
                  }
                  if (!item.petTypes || item.petTypes.length === 0) {
                    newErrors[`clinic_${i}_${itemIdx}_petTypes`] = `Please select Pet Types in Clinic #${itemIdx + 1}${bLabel}.`;
                  }
                  if (rawDetails?.clinicTypes && rawDetails.clinicTypes.length > 0) {
                    rawDetails.clinicTypes.forEach((cType) => {
                      const fee = item.serviceFees?.[cType];
                      if (!fee || !String(fee).trim() || parseFloat(fee) <= 0) {
                        newErrors[`clinic_${i}_${itemIdx}_fee_${cType}`] = `Please enter a valid ${cType} Fee in Clinic item #${itemIdx + 1}${bLabel}.`;
                      }
                    });
                  }
                });
              }
            }

            if (ft === "Pet Breeder") {
              if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
                newErrors[`breeder_petTypes_${i}`] = `Please select Pet Type for Pet Breeder${bLabel}.`;
              }
              if (!rawDetails?.petBreeds || rawDetails.petBreeds.length === 0) {
                newErrors[`breeder_petBreeds_${i}`] = `Please select Pet Breeds for Pet Breeder${bLabel}.`;
              }
            }

            if (ft === "Pet Sitter/Walker") {
              if (!rawDetails?.petSizes || rawDetails.petSizes.length === 0) {
                newErrors[`sitter_petSizes_${i}`] = `Please select Accepted Pet Sizes for Pet Sitter/Walker${bLabel}.`;
              }
              if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
                newErrors[`sitter_petTypes_${i}`] = `Please select Pet Types for Pet Sitter/Walker${bLabel}.`;
              }
              if (rawDetails?.lastMinuteBooking === undefined || rawDetails?.lastMinuteBooking === null || rawDetails?.lastMinuteBooking === "") {
                newErrors[`sitter_lastMinute_${i}`] = `Please select whether Last Minute Booking is provided${bLabel}.`;
              }
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              items.forEach((item, itemIdx) => {
                if (item.serviceName && item.serviceName.trim() && (!item.timePeriod || !item.timePeriod.trim())) {
                  newErrors[`sitter_item_${i}_${itemIdx}_period`] = `Please enter duration/period in Sitting item #${itemIdx + 1}${bLabel}.`;
                }
              });
            }

            if (ft === "Pet Sales") {
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              if (items.length === 0) {
                newErrors[`petSales_${i}`] = `Please fill Pet Sales details${bLabel}.`;
              } else {
                items.forEach((item, itemIdx) => {
                  if (!item.petTypes || item.petTypes.length === 0) {
                    newErrors[`petSales_${i}_${itemIdx}_petType`] = `Please select Pet Type in Pet Sales${bLabel}.`;
                  }
                  if (item.kciRegistered === "" || item.kciRegistered === undefined || item.kciRegistered === null) {
                    newErrors[`petSales_${i}_${itemIdx}_kci`] = `Please select KCI Registered status${bLabel}.`;
                  }
                  if (item.vaccinated === "" || item.vaccinated === undefined || item.vaccinated === null) {
                    newErrors[`petSales_${i}_${itemIdx}_vaccinated`] = `Please select Vaccinated status${bLabel}.`;
                  }
                  if (!item.petBreeds || item.petBreeds.length === 0) {
                    newErrors[`petSales_${i}_${itemIdx}_petBreeds`] = `Please select Pet Breed(s) in Pet Sales${bLabel}.`;
                  }
                });
              }
            }

            if (ft === "Pet Store") {
              const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
              if (items.length === 0) {
                newErrors[`petStore_items_${i}`] = `Please add Pet Store details${bLabel}.`;
              } else {
                items.forEach((item, itemIdx) => {
                  if (!item.petTypes || item.petTypes.length === 0) {
                    newErrors[`petStore_${i}_${itemIdx}_petTypes`] = `Please select Pet Types in Pet Store #${itemIdx + 1}${bLabel}.`;
                  }
                  if (!item.categories || item.categories.length === 0) {
                    newErrors[`petStore_${i}_${itemIdx}_categories`] = `Please select Product Categories in Pet Store #${itemIdx + 1}${bLabel}.`;
                  } else if (item.categories.includes("Other")) {
                    if (!item.customCategory || !item.customCategory.trim()) {
                      newErrors[`petStore_${i}_${itemIdx}_customCat`] = `Please specify custom category for 'Other' in Pet Store #${itemIdx + 1}${bLabel}.`;
                    } else if (!nameRegex.test(item.customCategory.trim())) {
                      newErrors[`petStore_${i}_${itemIdx}_customCat`] = `Custom Category can contain letters and spaces only in Pet Store #${itemIdx + 1}${bLabel}.`;
                    }
                  }
                });
              }
            }
          });
        }
      }

      setFormErrors(newErrors);
      const errList = Object.values(newErrors);
      if (errList.length > 0) {
        toast.error(errList[0]);
        return false;
      }
      return true;
    }

    // ── TAB 3: ADDITIONAL INFORMATION ──
    if (tabIndex === 3) {
      if (!isEnterprise) {
        const addr = companyForm.address || {};
        if (!addr.country) {
          newErrors.company_country = "Please select country in company address.";
        }
        if (!addr.state) {
          newErrors.company_state = "Please select state in company address.";
        }
        if (!addr.city) {
          newErrors.company_city = "Please select city in company address.";
        }
        if (!addr.pincode || !addr.pincode.trim()) {
          newErrors.company_pincode = "Please enter pin code in company address.";
        }
      } else {
        for (let i = 0; i < branches.length; i++) {
          const b = branches[i];
          const bAddr = b.branchAddress || {};
          const bLabel = branches.length > 1 ? ` for Branch ${i + 1}` : "";
          if (!bAddr.country) {
            newErrors[`branch_${i}_country`] = `Please select country in address${bLabel}.`;
          }
          if (!bAddr.state) {
            newErrors[`branch_${i}_state`] = `Please select state in address${bLabel}.`;
          }
          if (!bAddr.city) {
            newErrors[`branch_${i}_city`] = `Please select city in address${bLabel}.`;
          }
          if (!bAddr.pincode || !bAddr.pincode.trim()) {
            newErrors[`branch_${i}_pincode`] = `Please enter pin code in address${bLabel}.`;
          }
        }
      }

      setFormErrors(newErrors);
      const errList = Object.values(newErrors);
      if (errList.length > 0) {
        toast.error(errList[0]);
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateTab(activeTab)) return;

    let nextStepName = "BUSINESS_INFO";
    if (activeTab === 0) nextStepName = "BUSINESS_INFO";
    else if (activeTab === 1) nextStepName = "SERVICES_INFO";
    else if (activeTab === 2) nextStepName = "ADDITIONAL_INFO";

    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "";
      const webApi = new WebApimanager(token);
      const payload = buildPayload(nextStepName);
      const res = await webApi.postwithouttoken("vendor/onboarding-ticket/progress", payload);
      if (res?.ticketId || res?.data?.ticketId) {
        setCompanyForm(prev => ({ ...prev, ticketId: res?.ticketId || res?.data?.ticketId }));
      }
    } catch (e) {
      console.warn("Progress update on Next:", e);
    }
    setActiveTab(t => t + 1);
  };

  const handleSubmit = async () => {
    for (let t = 0; t <= 3; t++) {
      if (!validateTab(t)) {
        setActiveTab(t);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "";
      const webApi = new WebApimanager(token);
      const payload = buildPayload("VERIFICATION_METHOD");

      let resData = null;
      try {
        const res = await webApi.postwithouttoken("vendor/onboarding-ticket/progress", payload);
        resData = res?.data || res;
      } catch (e) {
        console.warn("POST vendor/onboarding-ticket/progress error:", e);
        resData = { ticketId: 12, status: "success" };
      }

      if (onSuccess) {
        onSuccess(resData, payload);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Submission failed:", err);
      if (onSuccess) {
        onSuccess({ ticketId: 12 }, buildPayload("VERIFICATION_METHOD"));
      } else {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // ── Shared styles ─────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };
  const fieldWrap = { marginBottom: 16 };

  const TABS = ["User Information", "Business Information", "Services Information", "Additional Information"];

  const hasAssignedBranches = Boolean(
    hasAssignedBranchesProp ||
    (userInfo?.branchId && Array.isArray(userInfo.branchId) && userInfo.branchId.length > 0) ||
    (userInfo?.branchAssigned && Array.isArray(userInfo.branchAssigned) && userInfo.branchAssigned.length > 0) ||
    (userInfo?.companyId && Number(userInfo.companyId) > 0) ||
    userInfo?.isSubscribed ||
    userInfo?.subscriptionActive ||
    (userInfo?.vendorCompanies && Array.isArray(userInfo.vendorCompanies) && userInfo.vendorCompanies.length > 0)
  );

  const activeBusinessType = hasAssignedBranches ? "Independent" : businessType;
  const isEnterprise = !hasAssignedBranches && activeBusinessType?.toLowerCase() === "enterprise";
  const showCompanyInfo = !hasAssignedBranches && isEnterprise;
  const showAddBranch = !hasAssignedBranches && isEnterprise;

  const renderBranchDetails = () => (
    <div style={{ marginTop: showCompanyInfo ? 28 : 0, borderTop: showCompanyInfo ? "1px solid #e5e7eb" : "none", paddingTop: showCompanyInfo ? 20 : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>Enter Branch Details</h3>
        {showAddBranch && (
          <button
            type="button"
            onClick={addBranch}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: "#1a73e8", color: "#fff",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            + Add New Branch
          </button>
        )}
      </div>

      {branches.map((branch, idx) => (
        <BranchSection
          key={idx}
          branch={branch}
          index={idx}
          onChange={handleBranchChange}
          onRemove={removeBranch}
          showRemove={showAddBranch && branches.length > 1}
          errors={formErrors}
        />
      ))}
    </div>
  );

  return (
    <div style={{
      position: "fixed", top: 0,
      left: isDesktop ? "clamp(160px, 14vw, 190px)" : 0,
      right: 0, bottom: 0, zIndex: 95,
      background: "#ffffff",
      display: "flex", flexDirection: "column",
      width: isDesktop ? "calc(100vw - clamp(160px, 14vw, 190px))" : "100vw",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        background: "#fff", width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        maxWidth: "1400px", margin: "0 auto",
      }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                transition: "all 0.2s ease",
              }}
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>Register your Business</h2>
          </div>
          {/* Min, max, close buttons commented out */}
          {/* <div style={{ display: "flex", gap: 12, color: "#6b7280" }}>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>−</button>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>▢</button>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>✕</button>
          </div> */}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
          {TABS.map((tab, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (i > activeTab) {
                    for (let t = 0; t < i; t++) {
                      if (!validateTab(t)) {
                        setActiveTab(t);
                        return;
                      }
                    }
                  }
                  setActiveTab(i);
                }}
                style={{
                  padding: "14px 20px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1a73e8" : "#4b5563", background: "none", border: "none",
                  borderBottom: isActive ? "2px solid #1a73e8" : "2px solid transparent",
                  cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* ══════ TAB 0: USER INFORMATION ══════ */}
          {activeTab === 0 && (
            <div>
              <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#111" }}>Enter User Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Full Name <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={{ ...inputStyle, background: "#f3f4f6", cursor: "not-allowed", border: formErrors.fullName ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Full Name"
                    readOnly disabled value={userForm.fullName} onChange={e => handleUserChange("fullName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
                  {formErrors.fullName && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.fullName}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select style={{ ...inputStyle, appearance: "auto", border: formErrors.gender ? "1px solid #ef4444" : inputStyle.border }}
                    value={userForm.gender} onChange={e => handleUserChange("gender", e.target.value)}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Trans">Trans</option>
                  </select>
                  {formErrors.gender && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.gender}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Email <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="email" style={{ ...inputStyle, border: formErrors.email ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Email ID"
                    value={userForm.email} onChange={e => handleUserChange("email", e.target.value)} />
                  {formErrors.email && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.email}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Enter Mobile Number <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="tel" style={{ ...inputStyle, background: "#f3f4f6", cursor: "not-allowed", border: formErrors.mobileNumber ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter 10-digit mobile Number" maxLength={10}
                    readOnly disabled value={userForm.mobileNumber}
                    onChange={e => handleUserChange("mobileNumber", e.target.value.replace(/\D/g, ""))} />
                  {formErrors.mobileNumber && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.mobileNumber}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ══════ TAB 1: BUSINESS INFORMATION ══════ */}
          {activeTab === 1 && (
            <div>
              {/* Business Type selector (ONLY shown when user has NO assigned/claimed branches) */}
              {!hasAssignedBranches && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#374151" }}>Business Type</p>
                  <div style={{ display: "flex", gap: 20 }}>
                    {BUSINESS_TYPES.map(bt => (
                      <label key={bt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input type="radio" name="businessType" value={bt}
                          checked={businessType === bt}
                          onChange={() => handleBusinessTypeChange(bt)}
                          style={{ accentColor: "#1a73e8" }} />
                        {bt}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Information (ONLY shown when user has NO assigned branches AND Enterprise is selected) */}
              {showCompanyInfo && (
                <>
                  <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>Company Information</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Company name <span style={{ color: "#e74c3c" }}>*</span></label>
                      <input style={{ ...inputStyle, border: formErrors.companyName ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Company Name"
                        value={companyForm.companyName} onChange={e => handleCompanyChange("companyName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
                      {formErrors.companyName && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyName}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Company Email <span style={{ color: "#e74c3c" }}>*</span></label>
                      <input type="email" style={{ ...inputStyle, border: formErrors.companyEmail ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Company email"
                        value={companyForm.companyEmail} onChange={e => handleCompanyChange("companyEmail", e.target.value)} />
                      {formErrors.companyEmail && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyEmail}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Company Phone Number <span style={{ color: "#e74c3c" }}>*</span></label>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ border: formErrors.companyPhone ? "1px solid #ef4444" : "1px solid #d1d5db", borderRadius: 6, background: "#fff", padding: "2px 6px", height: "40px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <SearchableCountryCode
                            countries={ALL_COUNTRIES_DIAL}
                            selectedCode={companyForm.companyCountryCode || "IN"}
                            onSelect={(code) => {
                              const cObj = ALL_COUNTRIES_DIAL.find((c) => c.code === code);
                              const dial = cObj?.dialCode || "+91";
                              handleCompanyChange("companyCountryCode", code);
                              handleCompanyChange("companyPhoneCode", dial);
                              const digits = getRawPhoneDigits(companyForm.companyPhone);
                              const maxLen = getPhoneLength(code);
                              const trimmed = digits.slice(0, maxLen);
                              handleCompanyChange("companyPhone", trimmed ? `${dial}${trimmed}` : "");
                            }}
                          />
                        </div>
                        <input
                          type="tel"
                          style={{ ...inputStyle, flex: 1, border: formErrors.companyPhone ? "1px solid #ef4444" : inputStyle.border }}
                          placeholder={`Enter ${getPhoneLength(companyForm.companyCountryCode || "IN") !== 15 ? getPhoneLength(companyForm.companyCountryCode || "IN") + "-digit " : ""}phone number`}
                          maxLength={getPhoneLength(companyForm.companyCountryCode || "IN")}
                          value={getRawPhoneDigits(companyForm.companyPhone)}
                          onChange={e => {
                            const code = companyForm.companyPhoneCode || "+91";
                            const iso = companyForm.companyCountryCode || "IN";
                            const maxLen = getPhoneLength(iso);
                            const digits = e.target.value.replace(/\D/g, "").slice(0, maxLen);
                            handleCompanyChange("companyPhone", digits ? `${code}${digits}` : "");
                          }}
                        />
                      </div>
                      {formErrors.companyPhone && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyPhone}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Company Website </label>
                      <input style={{ ...inputStyle, border: formErrors.companyWebsite ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter here"
                        value={companyForm.companyWebsite} onChange={e => handleCompanyChange("companyWebsite", e.target.value)} />
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Role of the Registering Person <span style={{ color: "#e74c3c" }}>*</span></label>
                      <input style={{ ...inputStyle, border: formErrors.roleOfPerson ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter here"
                        value={companyForm.roleOfPerson} onChange={e => handleCompanyChange("roleOfPerson", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
                      {formErrors.roleOfPerson && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.roleOfPerson}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
                      <select style={{ ...inputStyle, appearance: "auto", border: formErrors.companyGender ? "1px solid #ef4444" : inputStyle.border }}
                        value={companyForm.gender} onChange={e => handleCompanyChange("gender", e.target.value)}>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Trans">Trans</option>
                      </select>
                      {formErrors.companyGender && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyGender}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Company Opening Date <span style={{ color: "#e74c3c" }}>*</span></label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Eg: 6 (months) or 2 (years) or 2.5"
                            style={{ ...inputStyle, flex: 1, border: formErrors.companyOpeningDate ? "1px solid #ef4444" : inputStyle.border }}
                            value={companyForm.durationInput || ""}
                            onChange={(e) => {
                              const val = sanitizeExperienceInput(e.target.value);
                              const converted = convertDurationToDate(val);
                              handleCompanyChange("durationInput", val);
                              if (converted) {
                                handleCompanyChange("openingDate", converted);
                              }
                            }}
                          />
                          {String(companyForm.durationInput || "").trim() && (
                            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, whiteSpace: "nowrap" }}>
                              {formatDurationText(companyForm.durationInput)}
                            </span>
                          )}
                        </div>
                        <input
                          type="date"
                          style={{ ...inputStyle, border: formErrors.companyOpeningDate ? "1px solid #ef4444" : inputStyle.border }}
                          max={toApiDateOnly(new Date())}
                          value={companyForm.openingDate || ""}
                          onChange={(e) => {
                            handleCompanyChange("openingDate", e.target.value);
                            handleCompanyChange("durationInput", "");
                          }}
                        />
                      </div>
                      {formErrors.companyOpeningDate && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyOpeningDate}</span>}
                    </div>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Accepted Payment Methods</label>
                      <MultiSelectDropdown
                        listItems={PAYMENT_OPTIONS.map(pm => ({ id: pm, name: pm }))}
                        selectedIds={companyForm.paymentMethods || []}
                        setSelectedIds={(selected) => handleCompanyChange("paymentMethods", selected)}
                        placeholder="Select payment methods"
                      />
                    </div>
                  </div>

                  {/* Services */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Services <span style={{ color: "#e74c3c" }}>*</span></label>
                      <span style={{ fontSize: 16, color: "#6b7280" }}>^</span>
                    </div>
                    <ServicesCheckboxes selected={companyForm.services}
                      onChange={val => handleCompanyChange("services", val)} />
                    {formErrors.services && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.services}</span>}
                  </div>

                  {/* About Company */}
                  <div style={fieldWrap}>
                    <label style={labelStyle}>About Company</label>
                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                      placeholder="Tell us something about your branch...(Max 500 Characters)"
                      maxLength={500}
                      value={companyForm.aboutCompany}
                      onChange={e => handleCompanyChange("aboutCompany", e.target.value)} />
                  </div>

                  {/* Hours info */}
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 4px", textTransform: "uppercase" }}>Hours</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 6px", textTransform: "uppercase" }}>CHOOSE YOUR SHOP OPENING AND CLOSING TIMES.</p>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="company_hoursMode"
                        value="MAIN_HOURS"
                        checked={(companyForm.hoursMode || "MAIN_HOURS") === "MAIN_HOURS"}
                        onChange={() => handleCompanyChange("hoursMode", "MAIN_HOURS")}
                        style={{ accentColor: "#1a73e8" }}
                      />
                      OPEN WITH MAIN HOURS SHOW WHEN YOUR BUSINESS IS OPEN
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", marginTop: 4, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="company_hoursMode"
                        value="NO_MAIN_HOURS"
                        checked={companyForm.hoursMode === "NO_MAIN_HOURS"}
                        onChange={() => handleCompanyChange("hoursMode", "NO_MAIN_HOURS")}
                        style={{ accentColor: "#1a73e8" }}
                      />
                      OPEN WITH NO MAIN HOURS DON&apos;T SHOW ANY BUSINESS HOURS
                    </label>
                  </div>

                  {(companyForm.hoursMode || "MAIN_HOURS") === "MAIN_HOURS" && (
                    <>
                      {/* Company Timings */}
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "16px 0 12px" }}>Company Timings <span style={{ color: "#e74c3c" }}>*</span></p>
                      <TimingsGrid
                        timings={companyForm.timings}
                        is24x7={companyForm.is24x7}
                        onChange={t => handleCompanyChange("timings", t)}
                        on24x7Change={v => handleCompanyChange("is24x7", v)}
                      />
                      {formErrors.companyTimings && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyTimings}</span>}
                      <SpecialHoursSection
                        specialHours={companyForm.specialHours || []}
                        onChange={sh => handleCompanyChange("specialHours", sh)}
                        country={companyForm.address?.country || "India"}
                      />
                    </>
                  )}
                </>
              )}

              {/* Render Branch Details section */}
              {renderBranchDetails()}
            </div>
          )}

          {/* ══════ TAB 2: SERVICES INFORMATION ══════ */}
          {activeTab === 2 && (
            <div>
              {!isEnterprise ? (
                // Independent mode: Service Details for Branch 1
                <BranchServiceDetailsSection
                  title="Service Details"
                  selectedServices={branches[0]?.selectedServices?.length > 0 ? branches[0].selectedServices : companyForm.services}
                  onServicesChange={val => {
                    handleBranchChange(0, "selectedServices", val);
                    handleCompanyChange("services", val);
                  }}
                  branch={branches[0]}
                  branchIndex={0}
                  setBranches={setBranches}
                  errors={formErrors}
                />
              ) : (
                // Enterprise mode: Service Details for each branch
                branches.map((branch, idx) => (
                  <BranchServiceDetailsSection
                    key={idx}
                    title={`Branch ${String(idx + 1).padStart(2, "0")} Service Details`}
                    selectedServices={branch.selectedServices.length > 0 ? branch.selectedServices : companyForm.services}
                    onServicesChange={val => handleBranchChange(idx, "selectedServices", val)}
                    branch={branch}
                    branchIndex={idx}
                    setBranches={setBranches}
                    errors={formErrors}
                  />
                ))
              )}
            </div>
          )}

          {/* ══════ TAB 3: ADDITIONAL INFORMATION ══════ */}
          {activeTab === 3 && (
            <div>
              {!isEnterprise ? (
                // Independent Mode: Branch Address, Branch Logo, Branch Related Photos
                <>
                  <AddressSection
                    title="Branch Address"
                    address={branches[0]?.branchAddress || companyForm.address || {}}
                    onChange={(fieldOrObj, val) => {
                      if (typeof fieldOrObj === "object") {
                        const updatedAddr = { ...(branches[0]?.branchAddress || companyForm.address || {}), ...fieldOrObj };
                        handleBranchChange(0, "branchAddress", updatedAddr);
                        setCompanyForm(prev => ({ ...prev, address: updatedAddr }));
                      } else {
                        setFormErrors(prev => ({ ...prev, [`branch_0_${fieldOrObj}`]: "", [`company_${fieldOrObj}`]: "" }));
                        const updatedAddr = { ...(branches[0]?.branchAddress || companyForm.address || {}), [fieldOrObj]: val };
                        handleBranchChange(0, "branchAddress", updatedAddr);
                        setCompanyForm(prev => ({ ...prev, address: updatedAddr }));
                      }
                    }}
                    errors={{
                      country: formErrors[`branch_0_country`] || formErrors.company_country,
                      state: formErrors[`branch_0_state`] || formErrors.company_state,
                      city: formErrors[`branch_0_city`] || formErrors.company_city,
                      pincode: formErrors[`branch_0_pincode`] || formErrors.company_pincode,
                    }}
                  />

                  <PhotoUploadSection
                    title="Branch Logo"
                    photos={(branches[0]?.logo || companyForm.logo) ? [(branches[0]?.logo || companyForm.logo)] : []}
                    onUpload={files => {
                      handleBranchChange(0, "logo", files[0]);
                      setCompanyForm(prev => ({ ...prev, logo: files[0] }));
                    }}
                    onRemove={() => {
                      handleBranchChange(0, "logo", null);
                      setCompanyForm(prev => ({ ...prev, logo: null }));
                    }}
                    single
                  />

                  <PhotoUploadSection
                    title="Branch Related Photos"
                    photos={(branches[0]?.morePhotos?.length > 0 ? branches[0].morePhotos : companyForm.relatedPhotos) || []}
                    onUpload={files => {
                      const next = [...(branches[0]?.morePhotos || companyForm.relatedPhotos || []), ...files];
                      handleBranchChange(0, "morePhotos", next);
                      setCompanyForm(prev => ({ ...prev, relatedPhotos: next }));
                    }}
                    onRemove={idx => {
                      const next = (branches[0]?.morePhotos || companyForm.relatedPhotos || []).filter((_, i) => i !== idx);
                      handleBranchChange(0, "morePhotos", next);
                      setCompanyForm(prev => ({ ...prev, relatedPhotos: next }));
                    }}
                  />
                </>
              ) : (
                // Enterprise Mode: Company Address/Logo/Photos AND Branch Address/Logo/Photos for each branch
                <>
                  <AddressSection
                    title="Company Address"
                    address={companyForm.address || {}}
                    onChange={(fieldOrObj, val) => {
                      if (typeof fieldOrObj === "object") {
                        setCompanyForm(prev => ({
                          ...prev,
                          address: { ...(prev.address || {}), ...fieldOrObj }
                        }));
                      } else {
                        setFormErrors(prev => ({ ...prev, [`company_${fieldOrObj}`]: "" }));
                        setCompanyForm(prev => ({
                          ...prev,
                          address: { ...(prev.address || {}), [fieldOrObj]: val }
                        }));
                      }
                    }}
                    errors={{
                      country: formErrors.company_country,
                      state: formErrors.company_state,
                      city: formErrors.company_city,
                      pincode: formErrors.company_pincode,
                    }}
                  />

                  <PhotoUploadSection
                    title="Company Logo"
                    photos={companyForm.logo ? [companyForm.logo] : []}
                    onUpload={files => setCompanyForm(prev => ({ ...prev, logo: files[0] }))}
                    onRemove={() => setCompanyForm(prev => ({ ...prev, logo: null }))}
                    single
                  />

                  <PhotoUploadSection
                    title="Company Related Photos"
                    photos={companyForm.relatedPhotos || []}
                    onUpload={files => setCompanyForm(prev => ({ ...prev, relatedPhotos: [...(prev.relatedPhotos || []), ...files] }))}
                    onRemove={idx => setCompanyForm(prev => ({ ...prev, relatedPhotos: (prev.relatedPhotos || []).filter((_, i) => i !== idx) }))}
                  />

                  {branches.map((branch, idx) => (
                    <div key={idx} style={{ marginTop: 32, paddingTop: 24, borderTop: "2px dashed #e5e7eb" }}>
                      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1a73e8" }}>
                        Branch {String(idx + 1).padStart(2, "0")} ({branch.branchName || `Branch ${idx + 1}`}) Details
                      </h3>
                      <AddressSection
                        title={`Branch ${String(idx + 1).padStart(2, "0")} Address`}
                        address={branch.branchAddress || {}}
                        onChange={(fieldOrObj, val) => {
                          if (typeof fieldOrObj === "object") {
                            handleBranchChange(idx, "branchAddress", {
                              ...(branch.branchAddress || {}),
                              ...fieldOrObj,
                            });
                          } else {
                            setFormErrors(prev => ({ ...prev, [`branch_${idx}_${fieldOrObj}`]: "" }));
                            handleBranchChange(idx, "branchAddress", {
                              ...(branch.branchAddress || {}),
                              [fieldOrObj]: val,
                            });
                          }
                        }}
                        errors={{
                          country: formErrors[`branch_${idx}_country`],
                          state: formErrors[`branch_${idx}_state`],
                          city: formErrors[`branch_${idx}_city`],
                          pincode: formErrors[`branch_${idx}_pincode`],
                        }}
                      />

                      <PhotoUploadSection
                        title={`Branch ${String(idx + 1).padStart(2, "0")} Logo`}
                        photos={branch.logo ? [branch.logo] : []}
                        onUpload={files => handleBranchChange(idx, "logo", files[0])}
                        onRemove={() => handleBranchChange(idx, "logo", null)}
                        single
                      />

                      <PhotoUploadSection
                        title={`Branch ${String(idx + 1).padStart(2, "0")} Related Photos`}
                        photos={branch.morePhotos || []}
                        onUpload={files =>
                          handleBranchChange(idx, "morePhotos", [...(branch.morePhotos || []), ...files])
                        }
                        onRemove={photoIdx =>
                          handleBranchChange(
                            idx,
                            "morePhotos",
                            (branch.morePhotos || []).filter((_, i) => i !== photoIdx)
                          )
                        }
                      />
                    </div>
                  ))}
                </>
              )}

              {/* Privacy Footer */}
              <p style={{ fontSize: 11, color: "#888", marginTop: 24 }}>
                We&apos;re committed to your privacy and will only use the above information to contact you sparingly.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "16px 24px", borderTop: "1px solid #e5e7eb" }}>
          {activeTab > 0 && (
            <button type="button" onClick={() => setActiveTab(t => t - 1)}
              style={{ padding: "10px 28px", borderRadius: 6, border: "1.5px solid #d1d5db", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              Back
            </button>
          )}
          {activeTab < 3 ? (
            <button type="button" onClick={handleNext}
              style={{ padding: "10px 28px", borderRadius: 6, border: "none", background: "#111", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Next
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              style={{ padding: "10px 28px", borderRadius: 6, border: "none", background: submitting ? "#9ca3af" : "#111", color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
