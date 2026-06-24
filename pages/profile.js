import React, { useState, useMemo } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import styles from "../styles/dashboard/dashboard.module.css";
import { IMAGE_URL } from "../components/utilities/Constants";

/* ── icons ── */
const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

import { parseApiToLocal } from "../utilities/date-time-utils";

/* ─── address string builder ─────────────────────────────── */
function buildAddress(addr) {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  return [addr.flatNo, addr.addressText, addr.area, addr.city, addr.state, addr.country, addr.pincode]
    .filter(Boolean)
    .join(", ");
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

const toStr = (v) => (v && typeof v === 'object' ? (v.name || v.label || String(v.id || '')) : (v ?? '')) || '—';

const formatService = (s) => {
  const str = toStr(s);
  return SERVICE_DISPLAY_NAMES[str] || SERVICE_DISPLAY_NAMES[str.toLowerCase()] || str;
};

/* ═══════════════════════════════════════════════════════════
 * Profile Page
 * ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { vendor, company, branches, selectedBranchId, setSelectedBranchId } = useDashboardData();

  const [slideIdx, setSlideIdx] = useState(0);
  const [heartFilled, setHeartFilled] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);

  const branch = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId) || branches[0] || null;
  }, [branches, selectedBranchId]);

  const address = company?.address || null;
  const branchAddr = branch?.addressDetails || null;

  /* Slider images: from branch → company → placeholder */
  const PLACEHOLDERS = [
    "https://zaanvarprods3.b-cdn.net/media/1773901815100-petsales.png",
    "https://zaanvarprods3.b-cdn.net/media/1773901839732-petdaycare.png",
    "https://zaanvarprods3.b-cdn.net/media/1773901858062-Petgrooming.png",
  ];

  const rawImages = useMemo(() => {
    if (branch?.images?.length) return branch.images;
    if (branch?.branchImages?.length) return branch.branchImages;
    if (branch?.clinicProfileImage) return [branch.clinicProfileImage];
    if (branch?.companyLogo) return [branch.companyLogo];
    if (branch?.companylogo) return [branch.companylogo];
    if (company?.images?.length) return company.images;
    return [];
  }, [branch, company]);

  const images = useMemo(() => {
    if (!rawImages.length) return PLACEHOLDERS;

    return rawImages.map(img => {
      if (!img) return PLACEHOLDERS[0];
      // If it's already a full URL, return it. Otherwise, prepend IMAGE_URL
      if (img.startsWith("http")) return img;
      const baseUrl = IMAGE_URL?.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
      const cleanPath = img.startsWith('/') ? img.slice(1) : img;
      return `${baseUrl}${cleanPath}`;
    });
  }, [rawImages]);

  /* Company creation date */
  const startDate = company?.experienceDateOfCreation || company?.createdAt || branch?.createdAt;
  const parsedDate = startDate ? parseApiToLocal(startDate) : null;
  const dateLabel = parsedDate
    ? parsedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  const detailRows = [
    {
      emoji: "👤",
      label: "Name of owner",
      value: branch?.ownerName || branch?.ownername || branch?.vendorDetails?.name || `${vendor?.firstName || ""} ${vendor?.lastName || ""}`.trim() || "—"
    },
    {
      emoji: "⚥",
      label: "Gender",
      value: toStr(branch?.vendorDetails?.gender || vendor?.gender)
    },
    {
      emoji: "📧",
      label: "Email",
      value: branch?.vendorDetails?.email || vendor?.email || "—"
    },
    {
      emoji: "📱",
      label: "Mobile",
      value: branch?.vendorDetails?.phone || branch?.vendorDetails?.mobile || vendor?.phoneNumber || "—"
    },
    {
      emoji: "📍",
      label: "Company Location",
      value: branch?.address || buildAddress(address) || "—"
    },
    {
      emoji: "🌐",
      label: "Company Website",
      value: company?.socialMediaLinks?.website || "—"
    },
    {
      emoji: "🏢",
      label: "Business Type",
      value: (branch?.featureType?.length ? branch.featureType.map(formatService) : company?.servicesProvided?.map(formatService))?.join(", ") || "—"
    },
    {
      emoji: "📧",
      label: "Company Email",
      value: branch?.contactUs?.email || company?.email || "—"
    },
    {
      emoji: "📱",
      label: "Company Mobile Number",
      value: branch?.contactUs?.mobile ? `+91 ${branch.contactUs.mobile}` : company?.phoneNo ? `+91 ${company.phoneNo}` : "—"
    },
  ];

  /* Feature / categories / pets */
  const featureTypes = useMemo(() => {
    const list = branch?.featureType || branch?.availableServices || [];
    return list.map(formatService);
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
      return branchCats.map(toStr);
    }
    return (company?.servicesProvided || []).map(formatService);
  }, [branch, company]);

  const availablePets = useMemo(() => {
    const pets = new Set();

    if (Array.isArray(branch?.petsSupported)) {
      branch.petsSupported.forEach(p => pets.add(p));
    }
    if (Array.isArray(branch?.availablePets)) {
      branch.availablePets.forEach(p => pets.add(p));
    }
    if (branch?.services) {
      Object.keys(branch.services).forEach(svcKey => {
        const svc = branch.services[svcKey];
        if (svc) {
          if (Array.isArray(svc.supportedPets)) {
            svc.supportedPets.forEach(p => pets.add(p));
          }
          if (Array.isArray(svc.AvailablePets)) {
            svc.AvailablePets.forEach(p => pets.add(p));
          }
          if (Array.isArray(svc.breedsName)) {
            svc.breedsName.forEach(p => pets.add(p));
          }
        }
      });
    }

    if (Array.isArray(branch?.petSales?.[0]?.breedsName)) {
      branch.petSales[0].breedsName.forEach(p => pets.add(p));
    }
    if (Array.isArray(branch?.petShops?.[0]?.AvailablePets)) {
      branch.petShops[0].AvailablePets.forEach(p => pets.add(p));
    }
    if (Array.isArray(branch?.petShops?.[0]?.supportedPets)) {
      branch.petShops[0].supportedPets.forEach(p => pets.add(p));
    }

    return Array.from(pets);
  }, [branch]);

  const topbarButtons = [
    // { label: "+ Add Rooms",    color: "purple", action: "addRooms" },
    // { label: "+ Add Bookings", color: "red",    action: "addBookings" },
    // { label: "+ Add More",     color: "gray",   action: "addMore" },
  ];

  return (
    <DashboardLayout topbarButtons={topbarButtons}>
      <div className={styles.profileWrap}>

        {/* ── Left Column ── */}
        <div className={styles.profileLeft}>

          {/* Image Slider */}
          <div className={styles.profileImgSlider}>
            <img
              src={images[slideIdx] || PLACEHOLDERS[0]}
              alt="Company"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <button className={styles.sliderHeart} onClick={() => setHeartFilled(f => !f)}>
              <HeartIcon filled={heartFilled} />
            </button>
            {images.length > 1 && (
              <div className={styles.sliderDots}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.sliderDot} ${i === slideIdx ? styles.sliderDotActive : ""}`}
                    onClick={() => setSlideIdx(i)}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Company name + date */}
          <div className={styles.profileInfo}>
            <h3 className={styles.profileCompanyName}>
              {company?.name || vendor?.businessName || "Company name"}
            </h3>
            <span className={styles.profileStartDate}>
              Company Starting date : {dateLabel}
            </span>
          </div>

          {/* About */}
          {company?.aboutCompany && (
            <div className={styles.profileAbout}>
              <h4>About {company.name}</h4>
              <p>{company.aboutCompany}</p>
            </div>
          )}

          {/* Branch Details */}
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
        </div>

        {/* ── Right Column ── */}
        <div className={styles.profileRight}>

          {/* Company Address */}
          {(branch?.address || address) && (
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <h4 className={styles.addressTitle}>Company Address :</h4>
                <button className={styles.directionsBtn}>
                  <DirectionsIcon /><span>Directions</span>
                </button>
              </div>
              <p className={styles.addressText}>
                {branch?.address ? buildAddress(branch.address) : buildAddress(address)}
              </p>
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

          {/* Branch Address */}
          {branchAddr && (
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <h4 className={styles.addressTitle}>Branch Address :</h4>
                <button className={styles.directionsBtn}>
                  <DirectionsIcon /><span>Directions</span>
                </button>
              </div>
              <p className={styles.addressText}>{buildAddress(branchAddr)}</p>
            </div>
          )}

          {/* Timings */}
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

          {/* Feature Type / Categories / Available Pets */}
          <div className={styles.featureGrid}>
            <div className={styles.featureCol}>
              <h4>Feature Type</h4>
              {featureTypes.length ? featureTypes.map((item, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureDot}>🐾</div>{toStr(item)}
                </div>
              )) : <span style={{ fontSize: 12, color: "#aaa" }}>—</span>}
            </div>

            <div className={styles.featureCol}>
              <h4>Categories</h4>
              {categories.length ? categories.map((s, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureDot}>🐾</div>{toStr(s)}
                </div>
              )) : <span style={{ fontSize: 12, color: "#aaa" }}>—</span>}
            </div>

            <div className={styles.featureCol}>
              <h4>Available pets</h4>
              {availablePets.length ? availablePets.map((p, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureDot}>🐕</div>{toStr(p)}
                </div>
              )) : <span style={{ fontSize: 12, color: "#aaa" }}>—</span>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
