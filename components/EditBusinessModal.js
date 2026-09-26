import React, { useState, useEffect } from "react";
import { WebApimanager } from "./utilities/WebApiManager";
import { toApiDateOnly, dateOnlyWithTimeZone, parseWallClockDate } from "../utilities/date-time-utils";
import useStore from "./state/useStore";
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
  "Photographers", "Pet Shop", "Event", "Pet Sales", "Clinic",
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
  "Pet Sales": "Pet Sales",
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

const BUSINESS_TYPES = ["Independent", "Enterprise"];

const TABS = [
  "User Information",
  "Business Information",
  "Services Information",
  "Additional Information",
];

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

// ─── SpecialHoursSection ──────────────────────────────────────────────────────
function SpecialHoursSection({ specialHours = [], onChange, country = "India" }) {
  const [customDates, setCustomDates] = useState(
    Array.isArray(specialHours) && specialHours.length > 0 ? specialHours : []
  );

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

  return (
    <div style={{ marginTop: 24, padding: 20, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
      <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#111" }}>Special hours</h3>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: "#6b7280", textTransform: "uppercase" }}>
        CONFIRM PUBLIC HOLIDAYS OR ADD HOURS SO CUSTOMERS KNOW WHEN YOU&apos;RE OPEN
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {customDates.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid #f8fafc" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Date</label>
              <input
                type="date"
                value={item.date}
                onChange={e => handleCustomChange(item.id, "date", e.target.value)}
                style={{ width: 175, padding: "7px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, background: "#fff" }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#374151", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={item.isClosed}
                onChange={e => handleCustomChange(item.id, "isClosed", e.target.checked)}
                style={{ accentColor: "#ef4444" }}
              />
              Closed
            </label>

            {!item.isClosed && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Opens at</span>
                  <input
                    type="time"
                    value={item.opensAt || "09:30"}
                    onChange={e => handleCustomChange(item.id, "opensAt", e.target.value)}
                    style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 12 }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>Closes at</span>
                  <input
                    type="time"
                    value={item.closesAt || "18:30"}
                    onChange={e => handleCustomChange(item.id, "closesAt", e.target.value)}
                    style={{ padding: "6px 8px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 12 }}
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => handleRemoveDate(item.id)}
              style={{ background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", padding: "4px" }}
              title="Remove date"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddDate}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#1a73e8", fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 12, padding: 0 }}
      >
        + Add a date
      </button>
    </div>
  );
}

// ─── ServicesCheckboxes sub-component ────────────────────────────────────────
function ServicesCheckboxes({ selected = [], onChange }) {
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

// ─── AddressSection Sub-component ────────────────────────────────────────────
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
  const selectedCountryCode = selectedCountryObj?.isoCode || (address.country === "India" ? "IN" : "");

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
          <label style={labelStyle}>Area/Street <span style={{ color: "#e74c3c" }}>*</span></label>
          <input style={{ ...inputStyle, border: errors.area ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Area/Street" value={address.area || ""} onChange={e => onChange("area", e.target.value)} />
          {errors.area && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.area}</span>}
        </div>
        <div>
          <label style={labelStyle}>Flat/House no. <span style={{ color: "#e74c3c" }}>*</span></label>
          <input style={{ ...inputStyle, border: errors.flat ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Flat/House no." value={address.flat || ""} onChange={e => onChange("flat", e.target.value)} />
          {errors.flat && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errors.flat}</span>}
        </div>
        <div>
          <label style={labelStyle}>Latitude</label>
          <input style={inputStyle} placeholder="Latitude" value={address.latitude || ""} onChange={e => onChange("latitude", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Longitude</label>
          <input style={inputStyle} placeholder="Longitude" value={address.longitude || ""} onChange={e => onChange("longitude", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ─── PhotoUploadSection Sub-component ─────────────────────────────────────────
function PhotoUploadSection({ title, photos = [], onUpload, onRemove, single = false }) {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onUpload(files);
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24, background: "#fff" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{
          width: 90, height: 90, borderRadius: "50%", border: "1.5px dashed #bbb",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", background: "#fafafa"
        }}>
          <span style={{ fontSize: 22 }}>📷</span>
          <span style={{ fontSize: 10, color: "#666" }}>Upload</span>
          <input type="file" accept="image/*" multiple={!single} onChange={handleFileChange} style={{ display: "none" }} />
        </label>
        {photos.map((p, i) => (
          <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
            <img src={typeof p === "string" ? p : URL.createObjectURL(p)} alt="Upload" style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }} />
            <button type="button" onClick={() => onRemove(i)} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── Main EditBusinessModal Component ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function EditBusinessModal({ open, onClose, onSuccess, branchData, vendorData, branchId }) {
  const { jwtToken, userInfo } = useStore();
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormErrors({});
    }
  }, [open]);

  // ── Tab 0: User Form ──
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    gender: "",
  });

  // ── Tab 1: Company Form ──
  const [businessType, setBusinessType] = useState("Independent");
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyPhoneCode: "+91",
    companyCountryCode: "IN",
    roleOfPerson: "Owner",
    gender: "",
    services: [],
    aboutCompany: "",
    openingDate: "",
    durationInput: "",
    timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
    address: {},
    logo: null,
    relatedPhotos: [],
  });

  // ── Branch Details ──
  const [branches, setBranches] = useState([blankBranch()]);

  // Styles matching RegisterBusinessModal
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box", background: "#fff" };
  const fieldWrap = { marginBottom: 16 };

  // ── Fetch user profile via GET /api/vendor-users/:userId ──
  useEffect(() => {
    if (!open) return;

    const token = jwtToken || (typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "");
    const webApi = new WebApimanager(token);

    const getUserId = () => {
      let raw = userInfo?.userId || userInfo?.id || userInfo?.vendor_user_id;
      if (!raw && typeof window !== "undefined") {
        raw = localStorage.getItem("vendor_user_id") || localStorage.getItem("userId") || localStorage.getItem("id");
      }
      return raw || 123;
    };

    const fetchUserDetails = async () => {
      const uId = getUserId();
      setLoadingUser(true);

      try {
        const userRes = await webApi.get(`vendor-users/${uId}`);
        const uData = userRes?.data?.data || userRes?.data || userRes?.user || userRes || {};

        const fullName = (`${uData.firstName || ""} ${uData.lastName || ""}`.trim() || uData.name || "").replace(/[^a-zA-Z\s]/g, "");
        setUserForm({
          fullName,
          email: uData.email || uData.personalEmail || "",
          mobileNumber: uData.phoneNumber || uData.phone || "",
          gender: uData.gender || "",
        });

        // Target branch ID
        const targetBranchId = branchId || uData.branchId?.[0] || uData.branchId || 12;
        let bObj = branchData;

        if (!bObj && targetBranchId) {
          try {
            const bRes = await webApi.get(`companies/vendor/details?branchId=${targetBranchId}`);
            bObj = bRes?.data?.branch || bRes?.data || bRes;
          } catch (err) {
            console.warn("Could not fetch branch details:", err);
          }
        }

        if (bObj) {
          populateModalFields(bObj, uData);
        }
      } catch (err) {
        console.warn("Error fetching /api/vendor-users/:userId:", err);
        if (vendorData || userInfo) {
          const v = vendorData || userInfo;
          setUserForm({
            fullName: (`${v.firstName || ""} ${v.lastName || ""}`.trim() || v.name || "").replace(/[^a-zA-Z\s]/g, ""),
            email: v.email || "",
            mobileNumber: v.phoneNumber || v.phone || "",
            gender: v.gender || "",
          });
        }
        if (branchData) {
          populateModalFields(branchData, vendorData);
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserDetails();
  }, [open, branchData, vendorData, userInfo, branchId, jwtToken]);

  const populateModalFields = (bSource, uData) => {
    const targetBranchId = parseInt(branchId || bSource?.id || uData?.branchId?.[0] || uData?.branchId || 12, 10);
    const matchedAddress = Array.isArray(uData?.addresses)
      ? (uData.addresses.find(a => a.branchId === targetBranchId) || uData.addresses.find(a => a.type === "Branch") || uData.addresses[0])
      : null;

    const bAddress = bSource?.addressDetails || bSource?.address || (matchedAddress ? {
      country: matchedAddress.country || "India",
      countryCode: matchedAddress.countryCode || (matchedAddress.country === "India" ? "IN" : ""),
      state: matchedAddress.state || "",
      stateCode: matchedAddress.stateCode || "",
      city: matchedAddress.city || "",
      pincode: matchedAddress.pincode || matchedAddress.pinCode || "",
      area: matchedAddress.area || "",
      flat: matchedAddress.flatNo || matchedAddress.flat || "",
      flatNo: matchedAddress.flatNo || matchedAddress.flat || "",
      addressText: matchedAddress.addressText || "",
      landmark: matchedAddress.landmark || "",
      latitude: matchedAddress.latitude || "",
      longitude: matchedAddress.longitude || ""
    } : {});

    if (bSource) {
      const parsedCompPhone = parsePhoneAndCode(bSource.phone);
      const cName = (bSource.name || bSource.businessName || bSource.branchName || "").replace(/[^a-zA-Z\s]/g, "");
      setCompanyForm(prev => ({
        ...prev,
        companyName: cName || prev.companyName,
        companyEmail: bSource.email || prev.companyEmail,
        companyPhone: parsedCompPhone.number || prev.companyPhone,
        companyPhoneCode: parsedCompPhone.code || prev.companyPhoneCode || "+91",
        companyCountryCode: parsedCompPhone.countryCode || prev.companyCountryCode || "IN",
        aboutCompany: bSource.about || prev.aboutCompany,
        services: bSource.petTypes || bSource.servicesList || prev.services,
        timings: bSource.timings || prev.timings,
        address: bAddress,
      }));

      setBranches([{
        ...blankBranch(),
        branchName: cName,
        branchEmail: bSource.email || "",
        branchPhone: bSource.phone || "",
        selectedServices: bSource.petTypes || bSource.servicesList || [],
        services: bSource.services || {},
        timings: bSource.timings || { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
        branchAddress: bAddress,
      }]);
    } else if (matchedAddress) {
      setCompanyForm(prev => ({
        ...prev,
        address: bAddress
      }));
      setBranches([{
        ...blankBranch(),
        branchAddress: bAddress
      }]);
    }
  };

  if (!open) return null;

  const handleUserChange = (key, val) => {
    const sanitizedVal = key === "fullName" ? val.replace(/[^a-zA-Z\s]/g, "") : val;
    setUserForm(p => ({ ...p, [key]: sanitizedVal }));
    setFormErrors(prev => ({ ...prev, [key]: "" }));
  };

  const handleCompanyChange = (key, val) => {
    setFormErrors(prev => ({ ...prev, [key]: "" }));
    let sanitizedVal = val;
    if (key === "companyName" || key === "roleOfPerson") {
      sanitizedVal = typeof val === "string" ? val.replace(/[^a-zA-Z\s]/g, "") : val;
    }

    if (key === "services") {
      setCompanyForm(p => ({ ...p, services: val }));
      setBranches(prev => prev.map(b => ({ ...b, selectedServices: val })));
    } else {
      setCompanyForm(p => ({ ...p, [key]: sanitizedVal }));
    }
  };

  const handleBranchChange = (idx, key, val) => {
    setFormErrors(prev => ({ ...prev, [`${key}_${idx}`]: "" }));
    let sanitizedVal = val;
    if (key === "branchName" || key === "businessName") {
      sanitizedVal = typeof val === "string" ? val.replace(/[^a-zA-Z\s]/g, "") : val;
    }
    setBranches(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: sanitizedVal };
      return next;
    });
  };

  // ── Tab Validation ──
  const validateTab = (tabIndex) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const newErrors = {};

    // TAB 0: User Information
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

    // TAB 1: Business Information
    if (tabIndex === 1) {
      if (!companyForm.companyName || !companyForm.companyName.trim()) {
        newErrors.companyName = "Please enter company name.";
      } else if (!nameRegex.test(companyForm.companyName.trim())) {
        newErrors.companyName = "Company name can contain letters and spaces only.";
      }
      if (!companyForm.roleOfPerson || !companyForm.roleOfPerson.trim()) {
        newErrors.roleOfPerson = "Please enter role of person.";
      } else if (!nameRegex.test(companyForm.roleOfPerson.trim())) {
        newErrors.roleOfPerson = "Role of person can contain letters and spaces only.";
      }
      if (!companyForm.companyEmail || !companyForm.companyEmail.trim()) {
        newErrors.companyEmail = "Please enter company email.";
      } else if (!emailRegex.test(companyForm.companyEmail.trim())) {
        newErrors.companyEmail = "Please enter a valid company email address.";
      }
      const rawCompPhone = getRawPhoneDigits(companyForm.companyPhone);
      const compIso = companyForm.companyCountryCode || parsePhoneAndCode(companyForm.companyPhone).countryCode || "IN";
      const expectedCompLen = getPhoneLength(compIso);
      if (!rawCompPhone) {
        newErrors.companyPhone = "Please enter company phone number.";
      } else if (expectedCompLen !== 15 ? rawCompPhone.length !== expectedCompLen : (rawCompPhone.length < 7 || rawCompPhone.length > 15)) {
        newErrors.companyPhone = expectedCompLen !== 15 ? `Please enter a valid ${expectedCompLen}-digit company phone number.` : "Please enter a valid company phone number.";
      }
      if (!companyForm.openingDate) {
        newErrors.companyOpeningDate = "Please select company opening date.";
      }
      if (!companyForm.services || companyForm.services.length === 0) {
        newErrors.companyServices = "Please select at least one service.";
      }
      if ((companyForm.hoursMode || "MAIN_HOURS") === "MAIN_HOURS" && !companyForm.is24x7) {
        const hasOpenDay = Object.values(companyForm.timings || {}).some(v => v && v !== "Closed");
        if (!hasOpenDay) {
          newErrors.companyTimings = "Please set company timings or select 24/7 Open.";
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

    // TAB 2: Services Information
    if (tabIndex === 2) {
      const activeSvcs = (branches[0]?.selectedServices?.length > 0)
        ? branches[0].selectedServices
        : companyForm.services;

      if (!activeSvcs || activeSvcs.length === 0) {
        newErrors.services = "Please select at least one service.";
      } else {
        const activeFeatureTypes = Array.from(
          new Set(activeSvcs.map(s => MAP_SERVICE_TO_FEATURE[s] || s).filter(Boolean))
        );

        activeFeatureTypes.forEach(ft => {
          const rawDetails = branches[0]?.services?.[ft];

          if (ft === "Pet Grooming") {
            if (!rawDetails?.serviceMode || rawDetails.serviceMode.length === 0) {
              newErrors.grooming_mode = "Please select Service Mode for Pet Grooming.";
            }
            const servicesList = Array.isArray(rawDetails?.services) ? rawDetails.services : [];
            if (servicesList.length === 0) {
              newErrors.grooming_services = "Please add at least one Grooming Service.";
            } else {
              servicesList.forEach((s, sIdx) => {
                const hasName = (Array.isArray(s.serviceName) && s.serviceName.length > 0) || Boolean(s.otherServiceName?.trim());
                if (!hasName) {
                  newErrors[`grooming_svc_${sIdx}_name`] = `Please select Grooming Service name in item #${sIdx + 1}.`;
                }
                if (!s.petType || s.petType.length === 0) {
                  newErrors[`grooming_svc_${sIdx}_petType`] = `Please select Pet Type in Grooming item #${sIdx + 1}.`;
                }
                if (!s.price || !String(s.price).trim() || parseFloat(s.price) <= 0) {
                  newErrors[`grooming_svc_${sIdx}_price`] = `Please enter a valid price in Grooming item #${sIdx + 1}.`;
                }
              });
            }
          }

          if (ft === "Pet Training") {
            if (!rawDetails?.trainingTypes || rawDetails.trainingTypes.length === 0) {
              newErrors.training_type = "Please select Training Type for Pet Training.";
            }
            if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
              newErrors.training_petTypes = "Please select Pet Type for Pet Training.";
            }
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            items.forEach((item, itemIdx) => {
              if (item.serviceName && !item.serviceName.trim()) {
                newErrors[`training_item_${itemIdx}_name`] = `Please enter Service Name in Training item #${itemIdx + 1}.`;
              }
            });
          }

          if (ft === "Pet Daycare") {
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            if (items.length === 0) {
              newErrors.daycare_items = "Please add Daycare details.";
            } else {
              items.forEach((item, itemIdx) => {
                const pTypes = item.supportedPets || item.petTypes || [];
                if (!pTypes || pTypes.length === 0) {
                  newErrors[`daycare_${itemIdx}_petType`] = `Please select Pet Type in Daycare #${itemIdx + 1}.`;
                }
                if (!item.petSizes || item.petSizes.length === 0) {
                  newErrors[`daycare_${itemIdx}_petSizes`] = `Please select Pet Sizes in Daycare #${itemIdx + 1}.`;
                }
              });
            }
            const packages = Array.isArray(rawDetails?.packages) ? rawDetails.packages : [];
            packages.forEach((pkg, pkgIdx) => {
              if (!pkg.packageName || !pkg.packageName.trim()) {
                newErrors[`daycare_pkg_${pkgIdx}_name`] = `Please enter Package Name in Daycare package #${pkgIdx + 1}.`;
              }
              if (!pkg.selectedCombinations || pkg.selectedCombinations.length === 0) {
                newErrors[`daycare_pkg_${pkgIdx}_comb`] = `Please select Pet Type & Size in Daycare package #${pkgIdx + 1}.`;
              }
              if (!pkg.price || !String(pkg.price).trim() || parseFloat(pkg.price) <= 0) {
                newErrors[`daycare_pkg_${pkgIdx}_price`] = `Please enter a valid Price in Daycare package #${pkgIdx + 1}.`;
              }
            });
          }

          if (ft === "Pet Clinic") {
            if (!rawDetails?.clinicTypes || rawDetails.clinicTypes.length === 0) {
              newErrors.clinic_type = "Please select Visit Type for Pet Clinic.";
            }
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            if (items.length === 0) {
              newErrors.clinic_items = "Please add Clinic details.";
            } else {
              items.forEach((item, itemIdx) => {
                if (!item.services || item.services.length === 0) {
                  newErrors[`clinic_${itemIdx}_services`] = `Please select Services in Clinic #${itemIdx + 1}.`;
                }
                if (!item.petTypes || item.petTypes.length === 0) {
                  newErrors[`clinic_${itemIdx}_petTypes`] = `Please select Pet Types in Clinic #${itemIdx + 1}.`;
                }
                if (rawDetails?.clinicTypes && rawDetails.clinicTypes.length > 0) {
                  rawDetails.clinicTypes.forEach((cType) => {
                    const fee = item.serviceFees?.[cType];
                    if (!fee || !String(fee).trim() || parseFloat(fee) <= 0) {
                      newErrors[`clinic_${itemIdx}_fee_${cType}`] = `Please enter a valid ${cType} Fee in Clinic item #${itemIdx + 1}.`;
                    }
                  });
                }
              });
            }
          }

          if (ft === "Pet Breeder") {
            if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
              newErrors.breeder_petTypes = "Please select Pet Type for Pet Breeder.";
            }
            if (!rawDetails?.petBreeds || rawDetails.petBreeds.length === 0) {
              newErrors.breeder_petBreeds = "Please select Pet Breeds for Pet Breeder.";
            }
          }

          if (ft === "Pet Sitter/Walker") {
            if (!rawDetails?.petSizes || rawDetails.petSizes.length === 0) {
              newErrors.sitter_petSizes = "Please select Accepted Pet Sizes for Pet Sitter/Walker.";
            }
            if (!rawDetails?.petTypes || rawDetails.petTypes.length === 0) {
              newErrors.sitter_petTypes = "Please select Pet Types for Pet Sitter/Walker.";
            }
            if (rawDetails?.lastMinuteBooking === undefined || rawDetails?.lastMinuteBooking === null || rawDetails?.lastMinuteBooking === "") {
              newErrors.sitter_lastMinute = "Please select whether Last Minute Booking is provided.";
            }
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            items.forEach((item, itemIdx) => {
              if (item.serviceName && item.serviceName.trim() && (!item.timePeriod || !item.timePeriod.trim())) {
                newErrors[`sitter_item_${itemIdx}_period`] = `Please enter duration/period in Sitting item #${itemIdx + 1}.`;
              }
            });
          }

          if (ft === "Pet Sales") {
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            if (items.length === 0) {
              newErrors.petSales = "Please fill Pet Sales details.";
            } else {
              items.forEach((item, itemIdx) => {
                if (!item.petTypes || item.petTypes.length === 0) {
                  newErrors[`petSales_${itemIdx}_petType`] = `Please select Pet Type in Pet Sales #${itemIdx + 1}.`;
                }
                if (item.kciRegistered === "" || item.kciRegistered === undefined || item.kciRegistered === null) {
                  newErrors[`petSales_${itemIdx}_kci`] = `Please select KCI Registered status in Pet Sales #${itemIdx + 1}.`;
                }
                if (item.vaccinated === "" || item.vaccinated === undefined || item.vaccinated === null) {
                  newErrors[`petSales_${itemIdx}_vaccinated`] = `Please select Vaccinated status in Pet Sales #${itemIdx + 1}.`;
                }
                if (!item.petBreeds || item.petBreeds.length === 0) {
                  newErrors[`petSales_${itemIdx}_petBreeds`] = `Please select Pet Breed(s) in Pet Sales #${itemIdx + 1}.`;
                }
              });
            }
          }

          if (ft === "Pet Store") {
            const items = Array.isArray(rawDetails?.items) ? rawDetails.items : [];
            if (items.length === 0) {
              newErrors.petStore_items = "Please add Pet Store details.";
            } else {
              items.forEach((item, itemIdx) => {
                if (!item.petTypes || item.petTypes.length === 0) {
                  newErrors[`petStore_${itemIdx}_petTypes`] = `Please select Available Pets in Pet Store #${itemIdx + 1}.`;
                }
                if (!item.categories || item.categories.length === 0) {
                  newErrors[`petStore_${itemIdx}_categories`] = `Please select Product Categories in Pet Store #${itemIdx + 1}.`;
                } else if (item.categories.includes("Other")) {
                  if (!item.customCategory || !item.customCategory.trim()) {
                    newErrors[`petStore_${itemIdx}_customCategory`] = `Please enter Custom Category in Pet Store #${itemIdx + 1}.`;
                  } else if (!nameRegex.test(item.customCategory.trim())) {
                    newErrors[`petStore_${itemIdx}_customCategory`] = `Custom Category can contain letters and spaces only in Pet Store #${itemIdx + 1}.`;
                  }
                }
              });
            }
          }
        });
      }

      setFormErrors(newErrors);
      const errList = Object.values(newErrors);
      if (errList.length > 0) {
        toast.error(errList[0]);
        return false;
      }
      return true;
    }

    // TAB 3: Additional Information
    if (tabIndex === 3) {
      const addr = companyForm.address || {};
      if (!addr.country) {
        newErrors.country = "Please select country in company address.";
      }
      if (!addr.state) {
        newErrors.state = "Please select state in company address.";
      }
      if (!addr.city) {
        newErrors.city = "Please select city in company address.";
      }
      if (!addr.pincode || !addr.pincode.trim()) {
        newErrors.pincode = "Please enter pin code in company address.";
      }
      if (!addr.area || !addr.area.trim()) {
        newErrors.area = "Please enter area/street in company address.";
      }
      if (!addr.flat || !addr.flat.trim()) {
        newErrors.flat = "Please enter flat/house no. in company address.";
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

  const handleNext = () => {
    if (!validateTab(activeTab)) return;
    setActiveTab(t => t + 1);
  };

  // Submit via PUT /api/companies/vendor/edit-all
  const handleSubmit = async () => {
    for (let t = 0; t <= 3; t++) {
      if (!validateTab(t)) {
        setActiveTab(t);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "");
      const webApi = new WebApimanager(token);

      const nameParts = userForm.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const b0 = branches[0] || blankBranch();
      const b0Addr = b0.branchAddress || companyForm.address || {};

      const rawCompPhone = getRawPhoneDigits(companyForm.companyPhone);
      const fullCompPhone = rawCompPhone ? `${companyForm.companyPhoneCode || "+91"}${rawCompPhone}` : "";

      const payload = {
        branchId: parseInt(branchId || branchData?.id || 12, 10),
        vendor: {
          firstName: firstName,
          lastName: lastName,
          email: userForm.email,
          phoneNumber: userForm.mobileNumber
        },
        branch: {
          name: b0.branchName || companyForm.companyName,
          email: b0.branchEmail || companyForm.companyEmail || userForm.email,
          phone: fullCompPhone || b0.branchPhone || userForm.mobileNumber,
          timings: b0.timings || companyForm.timings,
          addressDetails: {
            addressText: b0Addr.addressText || b0Addr.area || "",
            flatNo: b0Addr.flatNo || b0Addr.flat || "",
            area: b0Addr.area || "",
            city: b0Addr.city || "",
            state: b0Addr.state || "",
            pincode: b0Addr.pincode || b0Addr.pinCode || "",
            landmark: b0Addr.landmark || "",
            latitude: parseFloat(b0Addr.latitude) || 18.9750,
            longitude: parseFloat(b0Addr.longitude) || 72.8258
          },
          services: b0.services || {}
        }
      };

      const res = await webApi.put("companies/vendor/edit-all", payload);
      const responseData = res?.data || res;

      const isFail =
        responseData?.status === "fail" ||
        responseData?.status === "FAIL" ||
        responseData?.status === "error" ||
        responseData?.status === "ERROR" ||
        responseData?.status === false ||
        responseData?.success === false;

      if (isFail) {
        toast.error(responseData?.message || responseData?.error || "Failed to update business.");
        return;
      }

      toast.success(responseData?.message || "Business information updated successfully!");
      if (onSuccess) onSuccess(responseData);
      onClose();
    } catch (err) {
      console.error("PUT companies/vendor/edit-all failed:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to update business.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: "#ffffff",
      display: "flex", flexDirection: "column",
      width: "100vw", height: "100vh",
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
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>Edit your Business</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>
            ✕
          </button>
        </div>

        {/* ── Tabs (Same as Register Business UI) ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 24px", overflowX: "auto" }}>
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
          {loadingUser && (
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 16px" }}>Loading details from /api/vendor-users...</p>
          )}

          {/* ══════ TAB 0: USER INFORMATION ══════ */}
          {activeTab === 0 && (
            <div>
              <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: "#111" }}>Enter User Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Full Name <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={{ ...inputStyle, border: formErrors.fullName ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Full Name"
                    value={userForm.fullName} onChange={e => handleUserChange("fullName", e.target.value)} readOnly disabled />
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
                  <input type="email" style={{ ...inputStyle, cursor: "not-allowed", border: formErrors.email ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Email ID"
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
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>Company Information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company name <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={{ ...inputStyle, border: formErrors.companyName ? "1px solid #ef4444" : inputStyle.border }} placeholder="Enter Company Name"
                    value={companyForm.companyName} onChange={e => handleCompanyChange("companyName", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
                  {formErrors.companyName && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyName}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Role of Person <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={{ ...inputStyle, border: formErrors.roleOfPerson ? "1px solid #ef4444" : inputStyle.border }} placeholder="Owner / Manager"
                    value={companyForm.roleOfPerson} onChange={e => handleCompanyChange("roleOfPerson", e.target.value.replace(/[^a-zA-Z\s]/g, ""))} />
                  {formErrors.roleOfPerson && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.roleOfPerson}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Email <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="email" style={{ ...inputStyle, border: formErrors.companyEmail ? "1px solid #ef4444" : inputStyle.border }} placeholder="company@example.com"
                    value={companyForm.companyEmail} onChange={e => handleCompanyChange("companyEmail", e.target.value)} />
                  {formErrors.companyEmail && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyEmail}</span>}
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Phone <span style={{ color: "#e74c3c" }}>*</span></label>
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
              </div>

              {/* Services Checkboxes */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Services <span style={{ color: "#e74c3c" }}>*</span></label>
                <ServicesCheckboxes selected={companyForm.services} onChange={val => handleCompanyChange("services", val)} />
                {formErrors.companyServices && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>{formErrors.companyServices}</span>}
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

              {/* TimingsGrid */}
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
            </div>
          )}

          {/* ══════ TAB 2: SERVICES INFORMATION ══════ */}
          {activeTab === 2 && (
            <div>
              {formErrors.services && <span style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, display: "block", fontWeight: 600 }}>{formErrors.services}</span>}
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
              />
            </div>
          )}

          {/* ══════ TAB 3: ADDITIONAL INFORMATION ══════ */}
          {activeTab === 3 && (
            <div>
              {businessType !== "Enterprise" ? (
                // Independent Mode: Branch Address, Branch Logo, Branch Related Photos
                <>
                  <AddressSection
                    title="Branch Address"
                    address={branches[0]?.branchAddress || companyForm.address || {}}
                    errors={formErrors}
                    onChange={(fieldOrObj, val) => {
                      if (typeof fieldOrObj === "object") {
                        const updated = { ...(branches[0]?.branchAddress || companyForm.address || {}), ...fieldOrObj };
                        handleBranchChange(0, "branchAddress", updated);
                        setCompanyForm(prev => ({ ...prev, address: updated }));
                      } else {
                        const updated = { ...(branches[0]?.branchAddress || companyForm.address || {}), [fieldOrObj]: val };
                        handleBranchChange(0, "branchAddress", updated);
                        setCompanyForm(prev => ({ ...prev, address: updated }));
                      }
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
                    errors={formErrors}
                    onChange={(fieldOrObj, val) => {
                      if (typeof fieldOrObj === "object") {
                        setCompanyForm(prev => ({
                          ...prev,
                          address: { ...(prev.address || {}), ...fieldOrObj }
                        }));
                      } else {
                        setCompanyForm(prev => ({
                          ...prev,
                          address: { ...(prev.address || {}), [fieldOrObj]: val }
                        }));
                      }
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
                        errors={formErrors}
                        onChange={(fieldOrObj, val) => {
                          if (typeof fieldOrObj === "object") {
                            handleBranchChange(idx, "branchAddress", {
                              ...(branch.branchAddress || {}),
                              ...fieldOrObj,
                            });
                          } else {
                            handleBranchChange(idx, "branchAddress", {
                              ...(branch.branchAddress || {}),
                              [fieldOrObj]: val,
                            });
                          }
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
