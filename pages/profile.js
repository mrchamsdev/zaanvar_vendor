import React, { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import styles from "../styles/dashboard/dashboard.module.css";

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

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* ─── address string builder ─────────────────────────────── */
function buildAddress(addr) {
  if (!addr) return "—";
  return [addr.flatNo, addr.addressText, addr.area, addr.city, addr.state, addr.country, addr.pincode]
    .filter(Boolean)
    .join(", ");
}

/* ═══════════════════════════════════════════════════════════
 * Profile Page
 * ═══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { vendor, company, branches } = useDashboardData();

  const [slideIdx,        setSlideIdx]        = useState(0);
  const [heartFilled,     setHeartFilled]      = useState(false);
  const [branchOpen,      setBranchOpen]       = useState(false);
  const [selectedBranch,  setSelectedBranch]   = useState(0);

  const branch   = branches[selectedBranch] || null;
  const timings  = branch?.timings || {};
  const address  = company?.address || null;
  const branchAddr = branch?.addressDetails || null;

  /* Slider images: from branch → company → placeholder */
  const PLACEHOLDERS = [
    "https://zaanvarprods3.b-cdn.net/media/1773901815100-petsales.png",
    "https://zaanvarprods3.b-cdn.net/media/1773901839732-petdaycare.png",
    "https://zaanvarprods3.b-cdn.net/media/1773901858062-Petgrooming.png",
  ];
  const images = branch?.images?.length ? branch.images
               : company?.images?.length ? company.images
               : PLACEHOLDERS;

  /* Company creation date */
  const startDate = company?.experienceDateOfCreation || company?.createdAt;
  const dateLabel = startDate
    ? new Date(startDate).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "—";

  /* Detail rows — all from Zustand userInfo */
  const detailRows = [
    { emoji:"👤", label:"Name of owner",        value: `${vendor?.firstName||""} ${vendor?.lastName||""}`.trim()||"—" },
    { emoji:"⚥",  label:"Gender",               value: vendor?.gender||"—" },
    { emoji:"📧", label:"Email",                 value: vendor?.email||"—" },
    { emoji:"📱", label:"Mobile",                value: vendor?.phoneNumber||"—" },
    { emoji:"📍", label:"Company Location",      value: address ? `${address.area||""},${address.city||""}`.replace(/^,|,$/,"").trim()||"—":"—" },
    { emoji:"🌐", label:"Company Website",       value: company?.socialMediaLinks?.website||"—" },
    { emoji:"🏢", label:"Business Type",         value: company?.servicesProvided?.join(", ")||"—" },
    { emoji:"📧", label:"Company Email",         value: company?.email||"—" },
    { emoji:"📱", label:"Company Mobile Number", value: company?.phoneNo ? `+91 ${company.phoneNo}` : "—" },
  ];

  /* Feature / categories / pets */
  const featureTypes  = branch?.petShops?.[0]?.categories || [];
  const categories    = company?.servicesProvided || [];
  const availablePets = [
    ...(branch?.petSales?.[0]?.breedsName || []),
    ...(branch?.petShops?.[0]?.AvailablePets || []),
    ...(branch?.petShops?.[0]?.supportedPets || []),
  ].filter(Boolean);

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
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
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
                    aria-label={`Image ${i+1}`}
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
          {address && (
            <div className={styles.addressCard}>
              <div className={styles.addressHeader}>
                <h4 className={styles.addressTitle}>Company Address :</h4>
                <button className={styles.directionsBtn}>
                  <DirectionsIcon /><span>Directions</span>
                </button>
              </div>
              <p className={styles.addressText}>{buildAddress(address)}</p>
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
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(Number(e.target.value))}
                  >
                    {branches.map((b, i) => (
                      <option key={b.id || i} value={i}>
                        {b.name || `Branch ${i+1}`}
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
              {(() => {
                const first = timings[Object.keys(timings)[0]];
                return first && first.open !== "closed" ? (
                  <span className={styles.timingsRange}>
                    {first.open} – {first.close}
                  </span>
                ) : null;
              })()}
            </div>
            {DAYS.map((day) => {
              const key  = day.toLowerCase();
              const slot = timings[key];
              const open = slot && slot.open !== "closed";
              return (
                <div key={day} className={styles.timingProfileRow}>
                  <span className={styles.timingDayName}>{day}</span>
                  <div className={styles.timingStatus}>
                    {open ? (
                      <>
                        <span className={styles.timingOpen}>Open</span>
                        <span className={styles.timingUntil}>Until</span>
                        <span className={styles.timingTime}>{slot.close}</span>
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
                  <div className={styles.featureDot}>🐾</div>{item}
                </div>
              )) : <span style={{ fontSize:12, color:"#aaa" }}>—</span>}
            </div>

            <div className={styles.featureCol}>
              <h4>Categories</h4>
              {categories.length ? categories.map((s, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureDot}>🐾</div>{s}
                </div>
              )) : <span style={{ fontSize:12, color:"#aaa" }}>—</span>}
            </div>

            <div className={styles.featureCol}>
              <h4>Available pets</h4>
              {availablePets.length ? availablePets.map((p, i) => (
                <div key={i} className={styles.featureItem}>
                  <div className={styles.featureDot}>🐕</div>{p}
                </div>
              )) : <span style={{ fontSize:12, color:"#aaa" }}>—</span>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
