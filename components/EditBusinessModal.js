import React, { useState, useEffect } from "react";
import { WebApimanager } from "./utilities/WebApiManager";
import { toApiDateOnly, dateOnlyWithTimeZone, parseWallClockDate } from "../utilities/date-time-utils";
import useStore from "./state/useStore";
import { toast } from "sonner";

import ClinicFields from "./BranchFeatures/ClinicFields";
import DaycareFields from "./BranchFeatures/DaycareFields";
import GroomingFields from "./BranchFeatures/GroomingFields";
import PetStoreFields from "./BranchFeatures/PetStoreFields";
import PetSalesFields from "./BranchFeatures/PetSalesFields";
import BreederFields from "./BranchFeatures/BreederFields";
import TrainingFields from "./BranchFeatures/TrainingFields";
import SitterFields from "./BranchFeatures/SitterFields";

// ─── Helpers & Mappings ──────────────────────────────────────────────────────
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
  hoursMode: "MAIN_HOURS",
  timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
  specialHours: [],
  is24x7: false,
  branchAddress: {},
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

// ─── AddressSection Sub-component ────────────────────────────────────────────
function AddressSection({ title, address = {}, onChange }) {
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db",
    fontSize: 13, color: "#1f2937", outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, marginBottom: 24, background: "#fff" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Country <span style={{ color: "#e74c3c" }}>*</span></label>
          <select style={{ ...inputStyle, appearance: "auto" }} value={address.country || "India"} onChange={e => onChange("country", e.target.value)}>
            <option value="India">India</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>State</label>
          <input style={inputStyle} placeholder="Enter State" value={address.state || ""} onChange={e => onChange("state", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input style={inputStyle} placeholder="Enter City" value={address.city || ""} onChange={e => onChange("city", e.target.value)} />
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
    roleOfPerson: "Owner",
    gender: "",
    services: [],
    aboutCompany: "",
    openingDate: "",
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

        const fullName = `${uData.firstName || ""} ${uData.lastName || ""}`.trim() || uData.name || "";
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
            fullName: `${v.firstName || ""} ${v.lastName || ""}`.trim() || v.name || "",
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
      state: matchedAddress.state || "",
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
      setCompanyForm(prev => ({
        ...prev,
        companyName: bSource.name || bSource.businessName || bSource.branchName || prev.companyName,
        companyEmail: bSource.email || prev.companyEmail,
        companyPhone: bSource.phone || prev.companyPhone,
        aboutCompany: bSource.about || prev.aboutCompany,
        services: bSource.petTypes || bSource.servicesList || prev.services,
        timings: bSource.timings || prev.timings,
        address: bAddress,
      }));

      setBranches([{
        ...blankBranch(),
        branchName: bSource.name || bSource.businessName || bSource.branchName || "",
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

  const handleUserChange = (key, val) => setUserForm(p => ({ ...p, [key]: val }));
  const handleCompanyChange = (key, val) => {
    if (key === "services") {
      setCompanyForm(p => ({ ...p, services: val }));
      setBranches(prev => prev.map(b => ({ ...b, selectedServices: val })));
    } else {
      setCompanyForm(p => ({ ...p, [key]: val }));
    }
  };

  const handleBranchChange = (idx, key, val) => {
    setBranches(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  // Submit via PUT /api/companies/vendor/edit-all
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "");
      const webApi = new WebApimanager(token);

      const nameParts = userForm.fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const b0 = branches[0] || blankBranch();
      const b0Addr = b0.branchAddress || companyForm.address || {};

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
          phone: b0.branchPhone || companyForm.companyPhone || userForm.mobileNumber,
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
      toast.success("Business information updated successfully!");
      if (onSuccess) onSuccess(res?.data || res);
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
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111" }}>Company Information</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company name <span style={{ color: "#e74c3c" }}>*</span></label>
                  <input style={inputStyle} placeholder="Enter Company Name"
                    value={companyForm.companyName} onChange={e => handleCompanyChange("companyName", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Role of Person</label>
                  <input style={inputStyle} placeholder="Owner / Manager"
                    value={companyForm.roleOfPerson} onChange={e => handleCompanyChange("roleOfPerson", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Email</label>
                  <input type="email" style={inputStyle} placeholder="company@example.com"
                    value={companyForm.companyEmail} onChange={e => handleCompanyChange("companyEmail", e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Company Phone</label>
                  <input style={inputStyle} placeholder="Company Phone"
                    value={companyForm.companyPhone} onChange={e => handleCompanyChange("companyPhone", e.target.value)} />
                </div>
              </div>

              {/* Services Checkboxes */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Services</label>
                <ServicesCheckboxes selected={companyForm.services} onChange={val => handleCompanyChange("services", val)} />
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
            <button type="button" onClick={() => setActiveTab(t => t + 1)}
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
