import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/credit-points.module.css";
import useStore from "../../components/state/useStore";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import useDashboardData from "../../components/dashboard/useDashboardData";

// Trophy & Target SVG Illustration for Header Banner
const TargetTrophyIllustration = () => (
  <svg width="120" height="85" viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Target Circle */}
    <circle cx="50" cy="65" r="28" fill="#1E293B" />
    <circle cx="50" cy="65" r="22" fill="#FFFFFF" />
    <circle cx="50" cy="65" r="16" fill="#1E293B" />
    <circle cx="50" cy="65" r="10" fill="#EF4444" />
    <circle cx="50" cy="65" r="4" fill="#FFFFFF" />

    {/* Arrow in Target */}
    <path d="M15 85L46 68" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
    <polygon points="12,87 22,82 17,92" fill="#F59E0B" />

    {/* Trophy Cup */}
    <path d="M100 25 H140 V45 C140 58 128 68 120 68 C112 68 100 58 100 45 Z" fill="#FBBF24" />
    <path d="M96 25 H144 V32 H96 Z" fill="#F59E0B" />
    <path d="M117 68 V80 H123 V68 Z" fill="#F59E0B" />
    <path d="M105 80 H135 V86 H105 Z" fill="#D97706" />
    {/* Trophy Handles */}
    <path d="M98 30 C90 30 90 45 98 48" stroke="#FBBF24" strokeWidth="3" fill="none" />
    <path d="M142 30 C150 30 150 45 142 48" stroke="#FBBF24" strokeWidth="3" fill="none" />

    {/* Sparkles */}
    <path d="M80 15 L82 20 L87 22 L82 24 L80 29 L78 24 L73 22 L78 20 Z" fill="#3B82F6" />
    <path d="M150 55 L151.5 58.5 L155 60 L151.5 61.5 L150 65 L148.5 61.5 L145 60 L148.5 58.5 Z" fill="#3B82F6" />
    <path d="M130 10 L131.5 13.5 L135 15 L131.5 16.5 L130 20 L128.5 16.5 L125 15 L128.5 13.5 Z" fill="#60A5FA" />
  </svg>
);

const parseHistoryItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item, idx) => {
    const rawPts = item.points ?? item.amount ?? item.creditPoints ?? item.score;
    let formattedPts = "+0 Pts";
    let isPos = true;

    if (typeof rawPts === "number") {
      isPos = rawPts >= 0;
      formattedPts = `${rawPts >= 0 ? "+" : ""}${rawPts} Pts`;
    } else if (typeof rawPts === "string") {
      isPos = !rawPts.trim().startsWith("-");
      formattedPts = rawPts.includes("Pts") ? rawPts : `${isPos ? "+" : ""}${rawPts} Pts`;
    }

    const dateStr = item.date || item.createdAt || item.timestamp || item.created_at;
    let formattedDate = "Recently";
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
            " • " +
            d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        } else {
          formattedDate = String(dateStr);
        }
      } catch {
        formattedDate = String(dateStr);
      }
    }

    return {
      id: item.id || item._id || idx + 1,
      petName: item.petName || item.title || item.description || item.reason || item.name || "Activity",
      tag: item.tag || (item.type ? `(${item.type})` : ""),
      date: formattedDate,
      points: formattedPts,
      isPositive: isPos,
      avatar: item.avatar || item.image || item.petImage || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"
    };
  });
};

export default function CreditPointsPage() {
  const router = useRouter();
  const { jwtToken, userInfo } = useStore();
  const { selectedBranchId, branches } = useDashboardData();

  const [activeTab, setActiveTab] = useState("achievements"); // 'achievements' | 'history'
  const [totalPoints, setTotalPoints] = useState(0);
  const [inProgressList, setInProgressList] = useState([]);
  const [achievedList, setAchievedList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBranchCreditPoints = async () => {
      const queryBranchId = router.query.branchId;
      const bId = queryBranchId ||
        selectedBranchId ||
        (branches && branches[0]?.id) ||
        (userInfo?.branchId && Array.isArray(userInfo.branchId) ? userInfo.branchId[0] : userInfo?.branchId) ||
        (typeof window !== "undefined" ? localStorage.getItem("zaanvar_claim_backend_branch_id") || localStorage.getItem("branchId") : null) ||
        280;

      if (!bId) return;

      setLoading(true);
      try {
        const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
        const webApi = new WebApimanager(token);

        // GET /api/branches/{branchId}/credit-history
        let creditHistoryRes = null;
        try {
          creditHistoryRes = await webApi.get(`branches/${bId}/credit-history`);
        } catch (historyErr) {
          console.warn(`GET branches/${bId}/credit-history error:`, historyErr);
        }

        // Secondary API: GET branches/getBranchById/{branchId}
        let branchRes = null;
        try {
          branchRes = await webApi.get(`branches/getBranchById/${bId}`);
        } catch (branchErr) {
          console.warn(`GET branches/getBranchById/${bId} error:`, branchErr);
        }

        const historyData = creditHistoryRes?.data?.data || creditHistoryRes?.data || creditHistoryRes;
        const branchData = branchRes?.data?.data || branchRes?.data || branchRes;

        // Parse total credit points (handles currentCreditPoints from API response)
        const pts = historyData?.currentCreditPoints ??
          historyData?.creditPoints ??
          historyData?.totalPoints ??
          historyData?.points ??
          branchData?.currentCreditPoints ??
          branchData?.creditPoints ??
          branchData?.totalPoints ??
          0;
        setTotalPoints(Number(pts) || 0);

        // Parse credit history list
        const rawHistoryArr = Array.isArray(historyData)
          ? historyData
          : (historyData?.history || historyData?.creditHistory || historyData?.records || branchData?.pointsHistory || branchData?.history);

        if (Array.isArray(rawHistoryArr) && rawHistoryArr.length > 0) {
          const parsedHistory = parseHistoryItems(rawHistoryArr);
          setHistoryList(parsedHistory || []);
        } else {
          setHistoryList([]);
        }

        // Parse achievements
        if (branchData && Array.isArray(branchData.achievements) && branchData.achievements.length > 0) {
          const inProg = branchData.achievements.filter(a => !a.completed);
          const ach = branchData.achievements.filter(a => a.completed);
          setInProgressList(inProg);
          setAchievedList(ach);
        } else {
          setInProgressList([]);
          setAchievedList([]);
        }
      } catch (err) {
        console.error("fetchBranchCreditPoints error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchCreditPoints();
  }, [router.query.branchId, selectedBranchId, branches, jwtToken, userInfo]);

  return (
    <DashboardLayout>
      <Head>
        <title>Credit Points | Zaanvar</title>
      </Head>

      <div className={styles.pageContainer}>
        {/* Header Banner */}
        <div className={styles.headerBanner}>
          <div className={styles.bannerText}>
            <h1 className={styles.bannerTitle}>
              Credit Points <span className={styles.bannerTitleSub}>(Achievements)</span>
            </h1>
            <p className={styles.bannerSub}>
              Track your progress and earn credit points as you grow your presence on zaanvar.
            </p>
          </div>
          <div className={styles.bannerGraphic}>
            <TargetTrophyIllustration />
          </div>
        </div>

        {/* Tab Bar */}
        <div className={styles.tabsNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "achievements" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            Achievements
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "history" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Points History
          </button>
        </div>

        {/* Total Points Display */}
        <div className={styles.totalPointsCard}>
          <h2 className={styles.pointsNumber}>{totalPoints}</h2>
          <p className={styles.pointsLabel}>Total Points you have</p>
        </div>

        {/* TAB 1: ACHIEVEMENTS */}
        {activeTab === "achievements" && (
          <>
            {/* In Progress Section */}
            <h3 className={styles.sectionHeading}>In Progress</h3>
            {inProgressList.length > 0 ? (
              inProgressList.map((item) => {
                const pct = Math.min(100, Math.max(0, Math.round((item.current / item.target) * 100)));
                return (
                  <div key={item.id} className={styles.achievementCard}>
                    <div className={styles.badgeWrap}>
                      <div className={styles.hexBadge}>{item.badgePoints}</div>
                    </div>
                    <div className={styles.achievementInfo}>
                      <h4 className={styles.achievementTitle}>{item.title}</h4>
                      <p className={styles.achievementDesc}>{item.desc}</p>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.88rem",
                marginBottom: "16px"
              }}>
                No achievements in progress.
              </div>
            )}

            {/* Achieved Points Section */}
            <h3 className={styles.sectionHeading}>Achieved Points</h3>
            {achievedList.length > 0 ? (
              achievedList.map((item) => (
                <div key={item.id} className={styles.achievementCard}>
                  <div className={styles.badgeWrap}>
                    <div className={styles.hexBadge}>{item.badgePoints}</div>
                    <div className={styles.completedCheck}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </div>
                  <div className={styles.achievementInfo}>
                    <h4 className={styles.achievementTitle}>{item.title}</h4>
                    <p className={styles.achievementDesc}>{item.desc}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.88rem"
              }}>
                No achieved points yet.
              </div>
            )}
          </>
        )}

        {/* TAB 2: POINTS HISTORY */}
        {activeTab === "history" && (
          <>
            <h3 className={styles.sectionHeading}>Achieved Points</h3>
            {historyList.length > 0 ? (
              <div className={styles.historyListWrap}>
                {historyList.map((item) => {
                  const isPos = item.isPositive ?? (typeof item.points === "string" ? !item.points.startsWith("-") : true);
                  return (
                    <div key={item.id} className={styles.historyItem}>
                      <div className={styles.historyLeft}>
                        <img
                          src={item.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"}
                          alt={item.petName || "Pet"}
                          className={styles.petAvatar}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80";
                          }}
                        />
                        <div>
                          <div className={styles.petTitleRow}>
                            <span className={styles.petName}>{item.petName}</span>
                            {item.tag && <span className={styles.petTag}>{item.tag}</span>}
                          </div>
                          <div className={styles.historyDate}>{item.date}</div>
                        </div>
                      </div>
                      <div>
                        <span className={isPos ? styles.ptsBadgePos : styles.ptsBadgeNeg}>
                          {item.points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "36px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.9rem"
              }}>
                No credit points history found for this branch.
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
