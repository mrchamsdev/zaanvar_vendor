import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import styles from "../styles/dashboard/dashboard.module.css";
import { IMAGE_URL } from "../components/utilities/Constants";
import { parseApiToLocal } from "../utilities/date-time-utils";
import EditBusinessModal from "../components/EditBusinessModal";
import EditPhotosModal from "../components/editPhotosModal";
import MediaViewerModal from "../components/mediaViewerModal";
import useStore from "../components/state/useStore";
import { WebApimanager } from "../components/utilities/WebApiManager";

/* ── icons ── */
const DirectionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f5790c" strokeWidth="2">
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);
const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const GalleryIcon = ({ size = 44, color = "#94a3b8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ─── value validator ───────────────────────────────────── */
const isValidVal = (val) => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  return str !== "" && str !== "—" && str !== "-" && str !== "null" && str !== "undefined";
};

/* ─── address string builder ─────────────────────────────── */
function buildAddress(addr) {
  if (!addr) return null;
  if (typeof addr === "string") {
    const s = addr.trim();
    return s && s !== "—" && s !== "-" ? s : null;
  }
  const parts = [addr.flatNo, addr.addressText, addr.area, addr.city, addr.state, addr.country, addr.pincode]
    .map(p => (p ? String(p).trim() : ""))
    .filter(p => p && p !== "—" && p !== "-");
  return parts.length > 0 ? parts.join(", ") : null;
}

/* ─── time formatter ─────────────────────────────────────── */
function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let [_, hh, mm] = match;
  let hour = parseInt(hh, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour === 0 ? 12 : hour;
  const hourStr = String(hour).padStart(2, "0");
  return `${hourStr}:${mm} ${period}`;
}

/* ─── timing slot finder ──────────────────────────────────── */
function getTimingSlot(timings, dayKey, defaultOpen, defaultClose, closedOn) {
  const normalizedDay = dayKey.toLowerCase();

  if (closedOn) {
    const closedDays = String(closedOn).toLowerCase();
    if (closedDays.includes(normalizedDay) || closedDays.includes("all") || (closedDays.includes("weekend") && (normalizedDay === "saturday" || normalizedDay === "sunday"))) {
      return { open: false };
    }
  }

  if (timings && typeof timings === "object" && Object.keys(timings).length > 0) {
    const rawSlot = timings[normalizedDay];

    if (rawSlot === undefined) {
      return { open: false };
    }

    if (typeof rawSlot === "object" && rawSlot !== null) {
      const isOpen = rawSlot.open && rawSlot.open !== "closed";
      return { open: isOpen, close: rawSlot.close, openTime: rawSlot.open };
    }

    if (typeof rawSlot === "string") {
      const trimmed = rawSlot.trim();
      if (trimmed) {
        if (trimmed.toLowerCase() === "closed" || trimmed === "-") {
          return { open: false };
        }
        const parts = trimmed.split("-");
        if (parts.length === 2) {
          return { open: true, openTime: parts[0].trim(), close: parts[1].trim() };
        }
        return { open: true, openTime: trimmed, close: trimmed };
      }
    }
  }

  if (defaultOpen && defaultClose && defaultOpen !== "closed" && defaultClose !== "closed") {
    return { open: true, openTime: defaultOpen, close: defaultClose };
  }

  return { open: false };
}

const SERVICE_DISPLAY_NAMES = {
  petShop: "Pet Shop",
  grooming: "Grooming",
  clinic: "Clinic",
  training: "Training",
  daycare: "Day Care",
  petDayCare: "Day Care",
  petSales: "Pet Sales"
};

const toStr = (v) => (v && typeof v === 'object' ? (v.name || v.label || String(v.id || '')) : (v ?? '')) || '';

const formatService = (s) => {
  const str = toStr(s);
  return SERVICE_DISPLAY_NAMES[str] || SERVICE_DISPLAY_NAMES[str.toLowerCase()] || str;
};

/* ═══════════════════════════════════════════════════════════
 * Profile Page
 * ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { vendor, company, branches, selectedBranchId, setSelectedBranchId } = useDashboardData();
  const { jwtToken, userInfo } = useStore();

  const [slideIdx, setSlideIdx] = useState(0);
  const [branchOpen, setBranchOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditPhotosModalOpen, setIsEditPhotosModalOpen] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [vendorUserData, setVendorUserData] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchVendorUserData = async () => {
      const uId = userInfo?.userId || userInfo?.id || userInfo?.vendor_user_id || (typeof window !== "undefined" ? localStorage.getItem("vendor_user_id") || localStorage.getItem("userId") : null);
      if (!uId) return;
      try {
        const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
        const webApi = new WebApimanager(token);
        const res = await webApi.get(`vendor-users/${uId}`);
        const data = res?.data?.data || res?.data || res?.user || res || null;
        if (data) setVendorUserData(data);
      } catch (err) {
        console.warn("Could not fetch vendor user profile data:", err);
      }
    };
    fetchVendorUserData();
  }, [jwtToken, userInfo]);

  const branch = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId) || branches[0] || null;
  }, [branches, selectedBranchId]);

  const address = company?.address || null;
  const branchAddr = branch?.addressDetails || null;

  /* Raw photos from branch or company */
  const rawImages = useMemo(() => {
    if (branch?.images?.length) return branch.images.filter(isValidVal);
    if (branch?.branchImages?.length) return branch.branchImages.filter(isValidVal);
    if (branch?.clinicProfileImage && isValidVal(branch.clinicProfileImage)) return [branch.clinicProfileImage];
    if (branch?.companyLogo && isValidVal(branch.companyLogo)) return [branch.companyLogo];
    if (branch?.companylogo && isValidVal(branch.companylogo)) return [branch.companylogo];
    if (company?.images?.length) return company.images.filter(isValidVal);
    return [];
  }, [branch, company]);

  useEffect(() => {
    setImgError(false);
    setSlideIdx(0);
  }, [selectedBranchId, rawImages]);

  const images = useMemo(() => {
    if (!rawImages.length) return [];
    return rawImages.map(img => {
      if (!img) return "";
      if (img.startsWith("http")) return img;
      const baseUrl = IMAGE_URL?.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
      const cleanPath = img.startsWith('/') ? img.slice(1) : img;
      return `${baseUrl}${cleanPath}`;
    }).filter(Boolean);
  }, [rawImages]);

  /* Company creation date */
  const startDate = company?.experienceDateOfCreation || company?.createdAt || branch?.createdAt;
  const parsedDate = startDate ? parseApiToLocal(startDate) : null;
  const dateLabel = parsedDate
    ? parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  const rawDetailRows = [
    {
      emoji: "👤",
      label: "Name of owner",
      value: branch?.ownerName || branch?.ownername || branch?.vendorDetails?.name || `${vendor?.firstName || ""} ${vendor?.lastName || ""}`.trim()
    },
    {
      emoji: "⚥",
      label: "Gender",
      value: toStr(branch?.vendorDetails?.gender || vendor?.gender)
    },
    {
      emoji: "📧",
      label: "Email",
      value: branch?.vendorDetails?.email || vendor?.email
    },
    {
      emoji: "📱",
      label: "Mobile",
      value: branch?.vendorDetails?.phone || branch?.vendorDetails?.mobile || vendor?.phoneNumber
    },
    {
      emoji: "📍",
      label: "Company Location",
      value: branch?.address ? buildAddress(branch.address) : buildAddress(address)
    },
    {
      emoji: "🌐",
      label: "Company Website",
      value: company?.socialMediaLinks?.website
    },
    {
      emoji: "🏢",
      label: "Business Type",
      value: (branch?.featureType?.length ? branch.featureType.map(formatService) : company?.servicesProvided?.map(formatService))?.map(toStr)?.filter(isValidVal)?.join(", ")
    },
    {
      emoji: "📧",
      label: "Company Email",
      value: branch?.contactUs?.email || company?.email
    },
    {
      emoji: "📱",
      label: "Company Mobile Number",
      value: branch?.contactUs?.mobile ? `+91 ${branch.contactUs.mobile}` : company?.phoneNo ? `+91 ${company.phoneNo}` : null
    },
  ];

  const detailRows = rawDetailRows.filter(r => isValidVal(r.value));

  /* Feature / categories / pets */
  const featureTypes = useMemo(() => {
    const list = branch?.featureType || branch?.availableServices || [];
    return list.map(formatService).map(toStr).filter(isValidVal);
  }, [branch]);

  const categories = useMemo(() => {
    const branchCats = [];
    if (branch?.services) {
      Object.keys(branch.services).forEach(svcKey => {
        const svc = branch.services[svcKey];
        if (svc && Array.isArray(svc.categoriesAvailable)) {
          branchCats.push(...svc.categoriesAvailable);
        }
      });
    }
    if (branchCats.length > 0) {
      return branchCats.map(toStr).filter(isValidVal);
    }
    return (company?.servicesProvided || []).map(formatService).map(toStr).filter(isValidVal);
  }, [branch, company]);

  const availablePets = useMemo(() => {
    const pets = new Set();
    if (Array.isArray(branch?.petsSupported)) {
      branch.petsSupported.forEach(p => isValidVal(p) && pets.add(toStr(p)));
    }
    if (Array.isArray(branch?.availablePets)) {
      branch.availablePets.forEach(p => isValidVal(p) && pets.add(toStr(p)));
    }
    if (branch?.services) {
      Object.keys(branch.services).forEach(svcKey => {
        const svc = branch.services[svcKey];
        if (svc) {
          if (Array.isArray(svc.supportedPets)) svc.supportedPets.forEach(p => isValidVal(p) && pets.add(toStr(p)));
          if (Array.isArray(svc.AvailablePets)) svc.AvailablePets.forEach(p => isValidVal(p) && pets.add(toStr(p)));
          if (Array.isArray(svc.breedsName)) svc.breedsName.forEach(p => isValidVal(p) && pets.add(toStr(p)));
        }
      });
    }
    if (Array.isArray(branch?.petSales?.[0]?.breedsName)) {
      branch.petSales[0].breedsName.forEach(p => isValidVal(p) && pets.add(toStr(p)));
    }
    if (Array.isArray(branch?.petShops?.[0]?.AvailablePets)) {
      branch.petShops[0].AvailablePets.forEach(p => isValidVal(p) && pets.add(toStr(p)));
    }
    if (Array.isArray(branch?.petShops?.[0]?.supportedPets)) {
      branch.petShops[0].supportedPets.forEach(p => isValidVal(p) && pets.add(toStr(p)));
    }
    return Array.from(pets).filter(isValidVal);
  }, [branch]);

  const companyAddressStr = branch?.address ? buildAddress(branch.address) : buildAddress(address);
  const branchAddressStr = buildAddress(branchAddr);

  const isAssigned = useMemo(() => {
    const hasVerifiedFlag = Boolean(userInfo?.hasVerifiedBusiness || userInfo?.isVerified);
    if (hasVerifiedFlag) return true;

    if (selectedBranchId && String(selectedBranchId) !== "0" && String(selectedBranchId) !== "null" && String(selectedBranchId) !== "undefined") {
      return true;
    }

    if (Array.isArray(branches) && branches.length > 0) return true;

    const hasVerifiedBranchInCompany = Array.isArray(userInfo?.vendorCompanies) && userInfo.vendorCompanies.some(c =>
      Array.isArray(c.branches) && c.branches.length > 0
    );
    if (hasVerifiedBranchInCompany) return true;

    const hasVerifiedBranchDirect = Array.isArray(userInfo?.branches) && userInfo.branches.length > 0;
    if (hasVerifiedBranchDirect) return true;

    return false;
  }, [userInfo, branches, selectedBranchId]);

  const hasTimings = Boolean(
    (branch?.openingTime && branch?.closingTime) ||
    (branch?.timings && Object.keys(branch.timings).length > 0)
  );

  return (
    <DashboardLayout topbarButtons={[]}>
      <div className={styles.profileWrap}>

        {/* ── Left Column ── */}
        <div className={styles.profileLeft}>

          {/* Image Slider or Gallery Icon Fallback */}
          {images.length > 0 && !imgError ? (
            <div className={styles.profileImgSlider}>
              <img
                src={images[slideIdx]}
                alt="Company"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                onClick={() => setMediaViewerOpen(true)}
                onError={() => setImgError(true)}
              />

              {images.length > 1 && (
                <div className={styles.sliderDots}>
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.sliderDot} ${i === slideIdx ? styles.sliderDotActive : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideIdx(i);
                      }}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={styles.profileImgSlider}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                border: "1.5px dashed #cbd5e1",
                borderRadius: "12px",
                minHeight: "220px",
                cursor: "pointer",
                gap: "8px",
                padding: "24px",
                textAlign: "center"
              }}
            >
              <GalleryIcon size={44} color="#94a3b8" />
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
                No photos added
              </span>
            </div>
          )}

          {/* Company name + date + Edit Business */}
          {(isAssigned || isValidVal(dateLabel)) && (
            <div className={styles.profileInfo} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                {isAssigned && (company?.name || vendor?.businessName) && (
                  <h3 className={styles.profileCompanyName}>
                    {company?.name || vendor?.businessName}
                  </h3>
                )}
                {isValidVal(dateLabel) && (
                  <span className={styles.profileStartDate}>
                    Company Starting date : {dateLabel}
                  </span>
                )}
              </div>
              {isAssigned && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #f5790c",
                    background: "#ffffff",
                    color: "#f5790c",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease"
                  }}
                >
                  ✏️ Edit Business
                </button>
              )}
            </div>
          )}

          {/* About */}
          {isValidVal(company?.aboutCompany) && (
            <div className={styles.profileAbout}>
              <h4>About {company.name}</h4>
              <p>{company.aboutCompany}</p>
            </div>
          )}

          {/* Branch Details - Only show if rows exist */}
          {detailRows.length > 0 && (
            <div className={styles.detailsCard}>
              <h4 className={styles.detailsCardTitle}>Branch Details</h4>
              {detailRows.map((row, i) => (
                <div key={i} className={styles.detailRow}>
                  <div className={styles.detailIcon}>{row.emoji}</div>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailValue}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div className={styles.profileRight}>

          {/* Company Address - Only show if valid */}
          {isValidVal(companyAddressStr) && (
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <h4 className={styles.addressTitle}>Company Address :</h4>
                <button className={styles.directionsBtn}>
                  <DirectionsIcon /><span>Directions</span>
                </button>
              </div>
              <p className={styles.addressText}>{companyAddressStr}</p>
            </div>
          )}

          {/* Branch Selection */}
          {branches.length > 1 && (
            <div className={styles.branchSelect}>
              <div className={styles.branchSelectHeader} onClick={() => setBranchOpen(o => !o)}>
                <h4 className={styles.branchSelectTitle}>Branch Selection</h4>
                <ChevronDown />
              </div>
              {branchOpen && (
                <div className={styles.branchSelectInner}>
                  <select
                    value={selectedBranchId || ""}
                    onChange={e => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : "")}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name || b.branchName || `Branch ${b.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Branch Address - Only show if valid */}
          {isValidVal(branchAddressStr) && (
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <h4 className={styles.addressTitle}>Branch Address :</h4>
                <button className={styles.directionsBtn}>
                  <DirectionsIcon /><span>Directions</span>
                </button>
              </div>
              <p className={styles.addressText}>{branchAddressStr}</p>
            </div>
          )}

          {/* Timings - Only show if timings exist */}
          {hasTimings && (
            <div className={styles.timingsCard}>
              <div className={styles.timingsHeader}>
                <h4 className={styles.timingsTitle}>Timings</h4>
                {branch?.openingTime && branch?.closingTime ? (
                  <span className={styles.timingsRange}>
                    {formatTime12h(branch.openingTime)} – {formatTime12h(branch.closingTime)}
                  </span>
                ) : null}
              </div>
              {DAYS.map((day) => {
                const key = day.toLowerCase();
                const slot = getTimingSlot(
                  branch?.timings,
                  key,
                  branch?.openingTime,
                  branch?.closingTime,
                  branch?.closedOn
                );
                return (
                  <div key={day} className={styles.timingProfileRow}>
                    <span className={styles.timingDayName}>{day}</span>
                    <div className={styles.timingStatus}>
                      {slot.open ? (
                        <>
                          <span className={styles.timingOpen}>Open</span>
                          <span className={styles.timingUntil}>Until</span>
                          <span className={styles.timingTime}>{formatTime12h(slot.close)}</span>
                        </>
                      ) : (
                        <span className={styles.timingClosed}>Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Feature Type / Categories / Available Pets - Only show columns & section with values */}
          {(featureTypes.length > 0 || categories.length > 0 || availablePets.length > 0) && (
            <div className={styles.featureGrid}>
              {featureTypes.length > 0 && (
                <div className={styles.featureCol}>
                  <h4>Service Type</h4>
                  {featureTypes.map((item, i) => (
                    <div key={i} className={styles.featureItem}>
                      <div className={styles.featureDot}>🐾</div>{toStr(item)}
                    </div>
                  ))}
                </div>
              )}

              {categories.length > 0 && (
                <div className={styles.featureCol}>
                  <h4>Categories</h4>
                  {categories.map((s, i) => (
                    <div key={i} className={styles.featureItem}>
                      <div className={styles.featureDot}>🐾</div>{toStr(s)}
                    </div>
                  ))}
                </div>
              )}

              {availablePets.length > 0 && (
                <div className={styles.featureCol}>
                  <h4>Available pets</h4>
                  {availablePets.map((p, i) => (
                    <div key={i} className={styles.featureItem}>
                      <div className={styles.featureDot}>🐕</div>{toStr(p)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <EditBusinessModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        branchData={branch}
        vendorData={vendorUserData || vendor}
        branchId={branch?.id || selectedBranchId || 12}
      />
      <EditPhotosModal
        open={isEditPhotosModalOpen}
        onClose={() => setIsEditPhotosModalOpen(false)}
        branchId={branch?.id || selectedBranchId}
        companyId={branch?.companyId || company?.id}
        branchName={branch?.name || company?.name || ""}
        initialPhotos={rawImages}
        onSuccess={async () => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
      />
      <MediaViewerModal
        open={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        images={images}
        rawImages={rawImages}
        initialIndex={slideIdx}
        branchId={branch?.id || selectedBranchId}
        onSuccess={async () => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        onOpenUpload={() => setIsEditPhotosModalOpen(true)}
      />
    </DashboardLayout>
  );
}
