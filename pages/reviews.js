import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import styles from "../styles/dashboard/dashboard.module.css";

/* ── helpers ── */
const AVATAR_COLORS = ["#e05c2d","#2d8ae0","#2de07a","#c42de0","#e0c42d"];

const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ── Donut chart ── */
const DonutChart = ({ value = 0, total = 0, size = 80 }) => {
  const displayVal = value ? Number(value).toFixed(1) : "—";
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const fill = value ? Math.min((value / 5) * circ, circ) : 0;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e9ecef" strokeWidth="12" />
      {fill > 0 && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#8b5cf6" strokeWidth="12"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      )}
      <text x="50%" y="42%" textAnchor="middle" dy="0.35em" fontSize="16" fontWeight="800" fill="#111">
        {displayVal}
      </text>
      <text x="50%" y="65%" textAnchor="middle" fontSize="8" fill="#999">
        {total > 0 ? `${total} Reviews` : "No reviews"}
      </text>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
 * Reviews & Ratings Page
 * ═══════════════════════════════════════════════════════════ */
export default function ReviewsPage() {
  const {
    company, reviews, ratings,
    reviewsLoading, reviewsError,
  } = useDashboardData();

  const topbarButtons = [
    // { label: "+ Add Rooms",    color: "purple", action: "addRooms" },
    // { label: "+ Add Bookings", color: "red",    action: "addBookings" },
    // { label: "+ Add More",     color: "gray",   action: "addMore" },
  ];

  /* ── Rating distribution bars built from real data ── */
  const distBars = (() => {
    const colours = { 5:"#22c55e", 4:"#84cc16", 3:"#fbbf24", 2:"#fb923c", 1:"#ef4444" };
    if (ratings?.distribution) {
      return [5,4,3,2,1].map((s) => ({
        stars: s, pct: ratings.distribution[s] ?? 0, color: colours[s],
      }));
    }
    // Compute from reviews array if no summary available
    if (reviews.length > 0) {
      const counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
      reviews.forEach((r) => {
        const stars = Math.round(r.rating || r.stars || 0);
        if (stars >= 1 && stars <= 5) counts[stars]++;
      });
      return [5,4,3,2,1].map((s) => ({
        stars: s,
        pct:   Math.round((counts[s] / reviews.length) * 100),
        color: colours[s],
      }));
    }
    return null;
  })();

  const avgRating = ratings?.averageRating
    || (reviews.length
        ? (reviews.reduce((a,r) => a + (r.rating || r.stars || 0), 0) / reviews.length).toFixed(1)
        : 0);

  const totalReviews = ratings?.totalReviews || reviews.length;

  return (
    <DashboardLayout topbarButtons={topbarButtons}>
      <div className={styles.reviewsWrap}>

        {/* ── Main reviews ── */}
        <div className={styles.reviewsMainCard}>
          <h3 className={styles.reviewsTitle}>User Reviews</h3>

          {reviewsLoading && (
            <p style={{ color:"#aaa", fontSize:14, textAlign:"center", padding:"40px 0" }}>
              Loading reviews…
            </p>
          )}

          {!reviewsLoading && reviewsError && (
            <p style={{ color:"#ef4444", fontSize:13, textAlign:"center", padding:"24px 0" }}>
              Could not load reviews. Please try again.
            </p>
          )}

          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <p style={{ color:"#aaa", fontSize:14, textAlign:"center", padding:"40px 0" }}>
              No reviews yet for this branch.
            </p>
          )}

          {!reviewsLoading && reviews.map((rev, i) => {
            const name    = rev.userName || rev.name || rev.reviewerName || "User";
            const rating  = rev.rating   || rev.stars || 0;
            const comment = rev.comment  || rev.text  || rev.review || "";
            const dateStr = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"2-digit", year:"numeric" })
              : rev.date || "";
            const images  = rev.images || rev.reviewImages || [];
            const source  = rev.source || rev.platform || "";

            return (
              <div key={rev.id || i} className={styles.reviewCard}>
                <div className={styles.reviewCardTop}>
                  <div
                    className={styles.reviewCardAvatar}
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className={styles.reviewCardName}>{name}</p>
                    <div className={styles.reviewCardMeta}>
                      <div className={styles.reviewCardStars}>
                        {Array.from({ length: 5 }).map((_, si) => (
                          <StarIcon key={si} filled={si < Math.round(rating)} />
                        ))}
                      </div>
                      <span className={styles.reviewCardDate}>{dateStr}</span>
                    </div>
                  </div>
                </div>

                {comment && (
                  <p className={styles.reviewCardText}>{comment}</p>
                )}

                {images.length > 0 && (
                  <div className={styles.reviewCardImages}>
                    {images.map((img, ii) => (
                      <div key={ii} className={styles.reviewCardImg}>
                        <img src={img} alt={`review-img-${ii}`} />
                      </div>
                    ))}
                  </div>
                )}

                {source && (
                  <p className={styles.reviewFrom}>Review from {source}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Distribution sidebar ── */}
        <div className={styles.distCard}>
          <h3 className={styles.distTitle}>Distribution</h3>
          <p className={styles.distDesc}>
            {company?.name || "Your business"} ratings overview
          </p>

          <p className={styles.distRatingTitle}>Rating Distribution</p>
          <div className={styles.distDonut}>
            <DonutChart value={avgRating} total={totalReviews} />
            <div className={styles.distBars}>
              {distBars ? (
                distBars.map((b) => (
                  <div key={b.stars} className={styles.distBarRow}>
                    <span className={styles.distBarNum}>{b.stars}</span>
                    <div className={styles.distBarBg}>
                      <div
                        className={styles.distBarFill}
                        style={{ width: `${b.pct}%`, background: b.color }}
                      />
                    </div>
                    <span className={styles.distPct}>{b.pct}%</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "#aaa" }}>
                  {reviewsLoading ? "Loading…" : "No data yet."}
                </p>
              )}
            </div>
          </div>

          {ratings?.source && (
            <>
              <p className={styles.distSiteTitle}>Review site Distribution</p>
              <div className={styles.distSiteRow}>
                <span>{ratings.source}</span>
                <span>{avgRating}</span>
                <StarIcon filled />
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
