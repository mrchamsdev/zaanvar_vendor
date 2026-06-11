import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import useDashboardData from "../../components/dashboard/useDashboardData";
import styles from "../../styles/dashboard/dashboard.module.css";

/* ── helpers ── */
const AVATAR_COLORS = ["#e05c2d", "#2d8ae0", "#2de07a", "#c42de0", "#e0c42d", "#2dc4e0"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const StarIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── SVG Donut ── */
const DonutChart = ({ value = 0, total = 0, size = 72 }) => {
  const displayVal = value ? Number(value).toFixed(1) : "—";
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value ? Math.min((value / 5) * circ, circ) : 0;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9ecef" strokeWidth="10" />
      {fill > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#8b5cf6" strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      <text x="50%" y="46%" textAnchor="middle" dy="0.35em" fontSize="14" fontWeight="700" fill="#111">
        {displayVal}
      </text>
      {total > 0 && (
        <text x="50%" y="68%" textAnchor="middle" fontSize="7" fill="#999">
          {total} Reviews
        </text>
      )}
    </svg>
  );
};

/* ── ordinal helper ── */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ═══════════════════════════════════════════════════════════
 * Dashboard Home
 * ═══════════════════════════════════════════════════════════ */
export default function DashboardHomePage() {
  const router = useRouter();
  const {
    vendor, company, branches, timings,
    reviews, ratings, reviewsLoading,
  } = useDashboardData({ skipReviews: false });

  const topbarButtons = useMemo(() => [
    // { label: "+ Add Rooms",    color: "purple", action: "addRooms" },
    // { label: "+ Add Bookings", color: "red",    action: "addBookings" },
    // { label: "+ Add More",     color: "gray",   action: "addMore" },
  ], []);

  /* ── Rating distribution bars ── */
  const distBars = useMemo(() => {
    if (!ratings?.distribution) return null;
    const dist = ratings.distribution;
    const colours = { 5: "#22c55e", 4: "#84cc16", 3: "#fbbf24", 2: "#fb923c", 1: "#ef4444" };
    return [5, 4, 3, 2, 1].map((s) => ({
      stars: s,
      pct: dist[s] ?? 0,
      color: colours[s],
    }));
  }, [ratings]);

  /* ── Recent reviews (latest 4) ── */
  const recentReviews = reviews.slice(0, 4);

  return (
    <DashboardLayout topbarButtons={topbarButtons}>

      <div className={styles.dashboardPage}>
        {/* ═══ Company / Branch cards ═══ */}
        <div className={styles.branchRow}>
          {/* Main Company card */}
          {company ? (
            <div
              className={`${styles.branchCard} ${styles.branchCardMain}`}
              onClick={() => router.push("/dashboard/profile")}
            >
              <span className={styles.branchLabel}>Main company</span>
              <h3 className={styles.branchName}>{company.name}</h3>
              <div className={styles.branchLogo}>
                {(company.name?.[0] || "C").toUpperCase()}
              </div>
              <span className={styles.branchBadge}>24hr</span>
              <p className={styles.branchLocation}>
                {company.address?.area
                  ? `${company.address.area}, ${company.address.city}`
                  : company.branches?.[0]?.location || "—"}
              </p>
            </div>
          ) : (
            /* No company — only branch */
            vendor?.branchId && (
              <div
                className={`${styles.branchCard} ${styles.branchCardMain}`}
                onClick={() => router.push("/dashboard/profile")}
              >
                <span className={styles.branchLabel}>My Branch</span>
                <h3 className={styles.branchName}>{vendor?.businessName || "Branch"}</h3>
                <div className={styles.branchLogo}>B</div>
                <span className={styles.branchBadge}>24hr</span>
              </div>
            )
          )}

          {/* Branch cards */}
          {branches.map((br, i) => (
            <div
              key={br.id || i}
              className={styles.branchCard}
              onClick={() => router.push("/dashboard/profile")}
            >
              <span className={styles.branchLabel}>{ordinal(i + 1)} Branch</span>
              <h3 className={styles.branchName}>{br.name || "Branch name"}</h3>
              <div
                className={styles.branchLogo}
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {(br.name?.[0] || "B").toUpperCase()}
              </div>
              <span className={styles.branchBadge}>24hr</span>
              <p className={styles.branchLocation}>
                {br.addressDetails?.area
                  ? `${br.addressDetails.area}, ${br.addressDetails.city}`
                  : br.location || "—"}
              </p>
            </div>
          ))}
        </div>

        {/* ═══ Three-column grid ═══ */}
        <div className={styles.dashGrid}>

          {/* ── Timing Slots ── */}
          <div className={styles.dashCard}>
            <h4 className={styles.dashCardTitle}>Timing slots</h4>
            {DAYS.map((day) => {
              const key = day.toLowerCase();
              const slot = timings?.[key];
              const isClosed = !slot || slot.open === "closed";
              return (
                <div key={day} className={styles.timingRow}>
                  <span className={styles.timingDay}>{day}</span>
                  <span className={styles.timingValue}>
                    {isClosed ? (
                      <span style={{ color: "#ef4444" }}>Closed</span>
                    ) : (
                      <>
                        <span>{slot.open}</span>
                        <span className={styles.timingSep}>–</span>
                        <span>{slot.close}</span>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Recent Reviews ── */}
          <div className={styles.dashCard}>
            <h4 className={styles.dashCardTitle}>Recent Reviews</h4>

            {reviewsLoading ? (
              <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                Loading reviews…
              </p>
            ) : recentReviews.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                No reviews yet.
              </p>
            ) : (
              recentReviews.map((r, i) => {
                const name = r.userName || r.name || r.reviewerName || "User";
                const rating = r.rating || r.stars || 0;
                const comment = r.comment || r.text || r.review || "";
                const timeAgo = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-IN")
                  : r.time || "";
                return (
                  <div key={i} className={styles.reviewItem}>
                    <div
                      className={styles.reviewAvatar}
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {name[0].toUpperCase()}
                    </div>
                    <div className={styles.reviewBody}>
                      <div className={styles.reviewName}>
                        {name}
                        <span className={styles.reviewTime}>{timeAgo}</span>
                      </div>
                      <div className={styles.reviewStars}>
                        {Array.from({ length: 5 }).map((_, si) => (
                          <StarIcon key={si} filled={si < Math.round(rating)} />
                        ))}
                      </div>
                      <p className={styles.reviewText}>{comment}</p>
                    </div>
                  </div>
                );
              })
            )}

            <div className={styles.reviewViewAll}>
              <Link href="/reviews">View All</Link>
            </div>
          </div>

          {/* ── Distribution ── */}
          <div className={styles.dashCard}>
            <h4 className={styles.dashCardTitle}>Distribution</h4>
            <p className={styles.distSubTitle}>
              {company?.name || "Your business"} ratings overview
            </p>
            <p className={styles.ratingDistTitle}>Rating Distribution</p>

            <div className={styles.donutWrap}>
              <div className={styles.donutCenter}>
                <DonutChart
                  value={ratings?.averageRating || 0}
                  total={ratings?.totalReviews || reviews.length}
                />
              </div>
              <div className={styles.ratingBars}>
                {distBars ? (
                  distBars.map((b) => (
                    <div key={b.stars} className={styles.ratingBarRow}>
                      <span style={{ minWidth: 10 }}>{b.stars}</span>
                      <div className={styles.ratingBarBg}>
                        <div
                          className={styles.ratingBarFill}
                          style={{ width: `${b.pct}%`, background: b.color }}
                        />
                      </div>
                      <span className={styles.ratingPct}>{b.pct}%</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 12, color: "#aaa" }}>
                    {reviewsLoading ? "Loading…" : "No rating data yet."}
                  </p>
                )}
              </div>
            </div>

            {ratings?.source && (
              <>
                <p className={styles.ratingDistTitle} style={{ marginTop: 12 }}>
                  Review site Distribution
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555" }}>
                  <span>{ratings.source}</span>
                  <span>{ratings.averageRating}</span>
                  <StarIcon filled />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
