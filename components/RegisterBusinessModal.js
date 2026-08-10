import React, { useState } from "react";
import axios from "axios";
import { toApiDateOnly, dateOnlyWithTimeZone, parseWallClockDate } from "../utilities/date-time-utils";

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

const LOCATION_OPTIONS = [
  "Hyderabad", "Warangal", "Karimnagar", "Visakhapatnam",
  "Vijayawada", "Bangalore", "Mysore", "Chennai",
  "Coimbatore", "Mumbai", "Pune",
];

const DATA_STORE_TYPES = ["manual", "semi-automated", "automated"];
const PAYMENT_OPTIONS = ["Cash", "UPI", "NetBanking", "CreditCard", "DebitCard"];
const BUSINESS_TYPES = ["Independent", "Enterprise"];

// ─── Blank branch template ────────────────────────────────────────────────────
const blankBranch = () => ({
  branchName: "",
  branchLocation: "",
  branchEmail: "",
  branchPhone: "",
  branchOpeningDate: "",
  dataStoreType: "",
  businessName: "",
  selectedServices: [],
  services: {},
  paymentMethods: [],
  timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
  is24x7: false,
  branchAddress: {},
  morePhotos: [],
});

// ─── TimingsGrid sub-component ────────────────────────────────────────────────
function TimingsGrid({ timings, is24x7, onChange, on24x7Change }) {
  const parseDay = (val = "") => {
    const [openStr = "", closeStr = ""] = val.split(" - ");
    const [openTime = "09:00", openPeriod = "AM"] = openStr.split(" ");
    const [closeTime = "09:00", closePeriod = "PM"] = closeStr.split(" ");
    const [oH = "09", oM = "00"] = openTime.split(":");
    const [cH = "09", cM = "00"] = closeTime.split(":");
    return { oH, oM, openPeriod, cH, cM, closePeriod };
  };

  const buildStr = (oH, oM, oP, cH, cM, cP) => `${oH}:${oM} ${oP} - ${cH}:${cM} ${cP}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
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
            style={{ width: 16, height: 16 }}
          />
          24/7 Open
        </label>
        <button
          type="button"
          onClick={() => {
            const base = Object.values(timings).find(Boolean);
            if (!base) { alert("Set at least one day first."); return; }
            const newT = {};
            DAYS.forEach(d => { newT[d] = base; });
            onChange(newT);
          }}
          style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          Apply to All days
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
        {DAYS.map(day => {
          const { oH, oM, openPeriod, cH, cM, closePeriod } = parseDay(timings[day]);
          const update = (k, v) => {
            const cur = { oH, oM, openPeriod, cH, cM, closePeriod };
            cur[k] = v;
            onChange({ ...timings, [day]: buildStr(cur.oH, cur.oM, cur.openPeriod, cur.cH, cur.cM, cur.closePeriod) });
          };
          const sel = (style) => ({ ...style, padding: "6px 4px", borderRadius: 4, border: "1px solid #d1d5db", fontSize: 13, background: "#fff" });
          return (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ width: 88, fontWeight: 600, fontSize: 13, color: "#374151" }}>{day}</span>
              <select style={sel({ width: 52 })} value={oH} onChange={e => update("oH", e.target.value)}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ fontSize: 13, color: "#6b7280" }}>:</span>
              <select style={sel({ width: 52 })} value={oM} onChange={e => update("oM", e.target.value)}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
              <select style={sel({})} value={openPeriod} onChange={e => update("openPeriod", e.target.value)}><option>AM</option><option>PM</option></select>
              <span style={{ fontSize: 12, color: "#9ca3af", margin: "0 2px" }}>TO</span>
              <select style={sel({ width: 52 })} value={cH} onChange={e => update("cH", e.target.value)}>{HOURS.map(h => <option key={h}>{h}</option>)}</select>
              <span style={{ fontSize: 13, color: "#6b7280" }}>:</span>
              <select style={sel({ width: 52 })} value={cM} onChange={e => update("cM", e.target.value)}>{MINUTES.map(m => <option key={m}>{m}</option>)}</select>
              <select style={sel({})} value={closePeriod} onChange={e => update("closePeriod", e.target.value)}><option>AM</option><option>PM</option></select>
            </div>
          );
        })}
      </div>
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
function FeatureComponentWrapper({ featureType, branch, branchIndex, setBranches }) {
  if (!branch.services || typeof branch.services !== "object" || Array.isArray(branch.services)) {
    branch.services = {};
  }

  switch (featureType) {
    case "Pet Grooming":
      return <GroomingFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} />;
    case "Pet Training":
      return <TrainingFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} />;
    case "Pet Daycare":
      return <DaycareFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} />;
    case "Pet Clinic":
      return <ClinicFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} serviceOptionsByFeatureType={{ "Pet Clinic": ["General Checkup", "Vaccination", "Deworming", "Dental Care", "Surgery", "Emergency Care", "Consultation"] }} />;
    case "Pet Breeder":
      return <BreederFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} />;
    case "Pet Sitter/Walker":
      return <SitterFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={PET_LIST} />;
    case "Pet Sales":
      return <PetSalesFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} availablePetTypes={PET_LIST} />;
    case "Pet Store":
      return <PetStoreFields branch={branch} branchIndex={branchIndex} type={featureType} setBranches={setBranches} petList={PET_LIST} availablePetTypes={PET_LIST} />;
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
          />
        </div>
      ))}
    </div>
  );
}

// ─── AddressSection Sub-component (Additional Information) ────────────────────
function AddressSection({ title, address = {}, onChange }) {
  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange("latitude", pos.coords.latitude.toFixed(4));
          onChange("longitude", pos.coords.longitude.toFixed(4));
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</h3>
        <button
          type="button"
          onClick={handleGeoLocation}
          style={{ background: "none", border: "none", color: "#1a73e8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Get Geo location
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Country <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={address.country || ""} onChange={e => onChange("country", e.target.value)}>
            <option value="">Select Country</option>
            <option value="India">India</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>State</label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={address.state || ""} onChange={e => onChange("state", e.target.value)}>
            <option value="">Select here</option>
            <option value="Telangana">Telangana</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={address.city || ""} onChange={e => onChange("city", e.target.value)}>
            <option value="">Select City</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Pin Code</label>
          <input style={inputStyle} placeholder="Enter Pin Code" maxLength={6} value={address.pincode || ""} onChange={e => onChange("pincode", e.target.value.replace(/\D/g, ""))} />
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
function BranchSection({ branch, index, onChange, onRemove, showRemove }) {
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
          <input style={inputStyle} placeholder="Enter Branch Name" {...field("branchName")} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Location <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={branch.branchLocation || ""} onChange={e => onChange(index, "branchLocation", e.target.value)}>
            <option value="">Select Branch location</option>
            {LOCATION_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Opening Date <span style={{ color: "#e74c3c" }}>*</span></label>
          <input type="date" style={inputStyle} max={toApiDateOnly(new Date())} {...field("branchOpeningDate")} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Present Data store model <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={branch.dataStoreType || ""} onChange={e => onChange(index, "dataStoreType", e.target.value)}>
            <option value="">Select Data store type</option>
            {DATA_STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Business Name (optional)</label>
          <input style={inputStyle} placeholder="Enter Business name" {...field("businessName")} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Email <span style={{ color: "#e74c3c" }}>*</span></label>
          <input type="email" style={inputStyle} placeholder="Enter branch email" {...field("branchEmail")} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Branch Phone Number <span style={{ color: "#e74c3c" }}>*</span></label>
          <input type="tel" style={inputStyle} placeholder="Enter 10-digit phone number" maxLength={10}
            value={branch.branchPhone || ""}
            onChange={e => onChange(index, "branchPhone", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Accepted Payment Methods</label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={(branch.paymentMethods || [])[0] || ""} onChange={e => onChange(index, "paymentMethods", e.target.value ? [e.target.value] : [])}>
            <option value="">Select options...</option>
            {PAYMENT_OPTIONS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>
        </div>
      </div>

      {/* Services */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, marginBottom: 8 }}>Services</label>
        <ServicesCheckboxes selected={branch.selectedServices || []} onChange={val => onChange(index, "selectedServices", val)} />
      </div>

      {/* Hours / Timings */}
      <div style={{ marginBottom: 0 }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 2px 0", textTransform: "uppercase" }}>Hours</p>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 6px 0", textTransform: "uppercase" }}>CHOOSE YOUR SHOP OPENING AND CLOSING TIMES.</p>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a73e8", display: "inline-block" }} />
            OPEN WITH MAIN HOURS SHOW WHEN YOUR BUSINESS IS OPEN
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />
            OPEN WITH NO MAIN HOURS DON'T SHOW ANY BUSINESS HOURS
          </label>
        </div>

        <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "16px 0 8px" }}>Branch Timings <span style={{ color: "#e74c3c" }}>*</span></p>
        <TimingsGrid
          timings={branch.timings}
          is24x7={branch.is24x7}
          onChange={t => onChange(index, "timings", t)}
          on24x7Change={v => onChange(index, "is24x7", v)}
        />
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function RegisterBusinessModal({ open, onClose, onSuccess, userInfo, initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab || 0); // 0=User, 1=Business, 2=Services, 3=Additional
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open && initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // ── Tab 0: User Information ──────────────────────────────────────────────────
  const [userForm, setUserForm] = useState({
    fullName: userInfo?.name || `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || "",
    email: userInfo?.email || "",
    mobileNumber: userInfo?.phoneNumber || userInfo?.mobileNumber || "",
    gender: userInfo?.gender || "",
  });

  // ── Tab 1: Business Information ──────────────────────────────────────────────
  const [businessType, setBusinessType] = useState("Independent");

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
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
  const handleUserChange = (key, val) => setUserForm(p => ({ ...p, [key]: val }));
  const handleCompanyChange = (key, val) => setCompanyForm(p => ({ ...p, [key]: val }));

  const handleBranchChange = (idx, key, val) => {
    setBranches(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };
  const addBranch = () => setBranches(prev => [...prev, blankBranch()]);
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
    const isEnt = businessType?.toLowerCase() === "enterprise";
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
        petType: companyForm.services,
        branchStartDate: b0.branchOpeningDate || companyForm.openingDate || toApiDateOnly(new Date()),
        startDate: companyForm.openingDate || b0.branchOpeningDate || toApiDateOnly(new Date()),
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

  const handleNext = async () => {
    let nextStepName = "BUSINESS_INFO";
    if (activeTab === 0) nextStepName = "BUSINESS_INFO";
    else if (activeTab === 1) nextStepName = "SERVICES_INFO";
    else if (activeTab === 2) nextStepName = "ADDITIONAL_INFO";

    try {
      const API_BASE = typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";
      const payload = buildPayload(nextStepName);
      const res = await axios.post(`${API_BASE}vendor/onboarding-ticket/progress`, payload);
      if (res?.data?.ticketId) {
        setCompanyForm(prev => ({ ...prev, ticketId: res.data.ticketId }));
      }
    } catch (e) {
      console.warn("Progress update on Next:", e);
    }
    setActiveTab(t => t + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const API_BASE = typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const payload = buildPayload("VERIFICATION_METHOD");

      let resData = null;
      try {
        const res = await axios.post(`${API_BASE}vendor/onboarding-ticket/progress`, payload);
        resData = res?.data;
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
  const isEnterprise = businessType?.toLowerCase() === "enterprise";

  const renderBranchDetails = () => (
    <div style={{ marginTop: 28, borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111" }}>Enter Branch Details</h3>
        {isEnterprise && (
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
          showRemove={isEnterprise && branches.length > 1}
        />
      ))}
    </div>
  );

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
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111" }}>Register your Business</h2>
          <div style={{ display: "flex", gap: 12, color: "#6b7280" }}>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>−</button>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>▢</button>
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "inherit" }}>✕</button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
          {TABS.map((tab, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
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
                  <input style={inputStyle} placeholder="Enter Full Name"
                    value={userForm.fullName} onChange={e => handleUserChange("fullName", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select style={{ ...inputStyle, appearance: "auto" }}
                    value={userForm.gender} onChange={e => handleUserChange("gender", e.target.value)}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Trans">Trans</option>
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Email <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="email" style={inputStyle} placeholder="Enter Email ID"
                    value={userForm.email} onChange={e => handleUserChange("email", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Enter Mobile Number <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="tel" style={inputStyle} placeholder="Enter 10-digit mobile Number" maxLength={10}
                    value={userForm.mobileNumber}
                    onChange={e => handleUserChange("mobileNumber", e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>
            </div>
          )}

          {/* ══════ TAB 1: BUSINESS INFORMATION ══════ */}
          {activeTab === 1 && (
            <div>
              {/* Business Type */}
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

              {/* Company Information */}
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>Company Information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company name <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={inputStyle} placeholder="Enter Company Name"
                    value={companyForm.companyName} onChange={e => handleCompanyChange("companyName", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Email <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="email" style={inputStyle} placeholder="Enter Company email"
                    value={companyForm.companyEmail} onChange={e => handleCompanyChange("companyEmail", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Phone Number <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input type="tel" style={inputStyle} placeholder="Enter 10-digit phone number" maxLength={12}
                    value={companyForm.companyPhone}
                    onChange={e => handleCompanyChange("companyPhone", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Website <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={inputStyle} placeholder="Enter here"
                    value={companyForm.companyWebsite} onChange={e => handleCompanyChange("companyWebsite", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Role of the Registering Person <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={inputStyle} placeholder="Enter here"
                    value={companyForm.roleOfPerson} onChange={e => handleCompanyChange("roleOfPerson", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
                  <select style={{ ...inputStyle, appearance: "auto" }}
                    value={companyForm.gender} onChange={e => handleCompanyChange("gender", e.target.value)}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Trans">Trans</option>
                  </select>
                </div>
              </div>

              {/* Services */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Services</label>
                  <span style={{ fontSize: 16, color: "#6b7280" }}>^</span>
                </div>
                <ServicesCheckboxes selected={companyForm.services}
                  onChange={val => handleCompanyChange("services", val)} />
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
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a73e8", display: "inline-block" }} />
                  OPEN WITH MAIN HOURS SHOW WHEN YOUR BUSINESS IS OPEN
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />
                  OPEN WITH NO MAIN HOURS DON'T SHOW ANY BUSINESS HOURS
                </label>
              </div>

              {/* Company Timings */}
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "16px 0 12px" }}>Company Timings <span style={{ color: "#e74c3c" }}>*</span></p>
              <TimingsGrid
                timings={companyForm.timings}
                is24x7={companyForm.is24x7}
                onChange={t => handleCompanyChange("timings", t)}
                on24x7Change={v => handleCompanyChange("is24x7", v)}
              />

              {/* Render Branch Details section only when Enterprise is selected */}
              {isEnterprise && renderBranchDetails()}
            </div>
          )}

          {/* ══════ TAB 2: SERVICES INFORMATION ══════ */}
          {activeTab === 2 && (
            <div>
              {!isEnterprise ? (
                // Independent mode: Company Service Details
                <BranchServiceDetailsSection
                  title="Company Service Details"
                  selectedServices={companyForm.services}
                  onServicesChange={val => handleCompanyChange("services", val)}
                  branch={branches[0]}
                  branchIndex={0}
                  setBranches={setBranches}
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
                  />
                ))
              )}
            </div>
          )}

          {/* ══════ TAB 3: ADDITIONAL INFORMATION ══════ */}
          {activeTab === 3 && (
            <div>
              {!isEnterprise ? (
                // Independent Mode: Company Address, Company Logo, Related Photos
                <>
                  <AddressSection
                    title="Company Address"
                    address={companyForm.address || {}}
                    onChange={(field, val) =>
                      setCompanyForm(prev => ({
                        ...prev,
                        address: { ...(prev.address || {}), [field]: val }
                      }))
                    }
                  />

                  <PhotoUploadSection
                    title="Company Logo"
                    photos={companyForm.logo ? [companyForm.logo] : []}
                    onUpload={files => setCompanyForm(prev => ({ ...prev, logo: files[0] }))}
                    onRemove={() => setCompanyForm(prev => ({ ...prev, logo: null }))}
                    single
                  />

                  <PhotoUploadSection
                    title="Related Photos"
                    photos={companyForm.relatedPhotos || []}
                    onUpload={files => setCompanyForm(prev => ({ ...prev, relatedPhotos: [...(prev.relatedPhotos || []), ...files] }))}
                    onRemove={idx => setCompanyForm(prev => ({ ...prev, relatedPhotos: (prev.relatedPhotos || []).filter((_, i) => i !== idx) }))}
                  />
                </>
              ) : (
                // Enterprise Mode: Branch Address & Related Photos for each branch
                branches.map((branch, idx) => (
                  <div key={idx} style={{ marginBottom: 32 }}>
                    <AddressSection
                      title={`Branch ${String(idx + 1).padStart(2, "0")} Address`}
                      address={branch.branchAddress || {}}
                      onChange={(field, val) =>
                        handleBranchChange(idx, "branchAddress", {
                          ...(branch.branchAddress || {}),
                          [field]: val,
                        })
                      }
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
                ))
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
