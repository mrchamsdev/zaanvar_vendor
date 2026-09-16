import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import useStore from "../../components/state/useStore";
import styles from "../../styles/dashboard/subscription.module.css";
import { toast } from "sonner";
import { initiateSubscriptionPayment } from "../../utilities/razorpay";

/* ── Feature Label Mapper ── */
const FEATURE_LABELS = {
  grooming: "Grooming Management",
  appointments: "Appointment Scheduling & Calendar",
  notifications: "Automated SMS & Email Notifications",
  groomingHistory: "Complete Pet Grooming History",
  groomerAssignment: "Staff & Groomer Assignment",
  inventory: "Inventory & Stock Tracking",
  sales: "POS Billing & Sales Invoices",
  invoicing: "POS Billing & Sales Invoices",
  purchaseBill: "Purchase Orders & Bills",
  daycare: "Daycare & Boarding Scheduler",
  clinic: "Veterinary Clinic & Health Records",
  petSales: "Pet Sales Management",
  reports: "Advanced Financial & Analytics Reports",
  multiBranch: "Multi-Branch Operations",
  staffManagement: "Staff Roles & Access Permissions"
};

function formatFeatureName(key) {
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  // Format camelCase to Title Case
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function getAuthToken(jwtToken) {
  if (jwtToken) return jwtToken;
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("user-store") || "null");
      if (stored?.state?.jwtToken) return stored.state.jwtToken;
      if (stored?.jwtToken) return stored.jwtToken;
    } catch {}
    return (
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("jwtToken") ||
      sessionStorage.getItem("token") ||
      null
    );
  }
  return null;
}

export default function MySubscriptionPage() {
  const router = useRouter();
  const { jwtToken, userInfo, setUserInfo } = useStore();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState("all");
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [fetchedSubs, setFetchedSubs] = useState([]);

  /* ── Current Active Plans Information (supports multiple active subscriptions) ── */
  let allSubs = [];
  if (Array.isArray(fetchedSubs) && fetchedSubs.length > 0) {
    allSubs.push(...fetchedSubs);
  }
  if (Array.isArray(userInfo?.subscriptions)) {
    allSubs.push(...userInfo.subscriptions);
  } else if (userInfo?.subscription) {
    if (Array.isArray(userInfo.subscription)) allSubs.push(...userInfo.subscription);
    else allSubs.push(userInfo.subscription);
  }

  (userInfo?.vendorCompanies || []).forEach((co) => {
    if (Array.isArray(co.subscriptions)) allSubs.push(...co.subscriptions);
    else if (co.subscription) {
      if (Array.isArray(co.subscription)) allSubs.push(...co.subscription);
      else allSubs.push(co.subscription);
    }
  });

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("zaanvar_subscription") || "null");
      if (Array.isArray(stored)) allSubs.push(...stored);
      else if (stored) allSubs.push(stored);
    } catch {}
  }

  // Deduplicate and filter active subscriptions
  const validActiveSubs = [];
  const seenPlanKeys = new Set();
  allSubs.forEach((s) => {
    if (s?.status === "active" || s?.type === "paid" || s?.status === "ACTIVE") {
      const pid = Number(s?.planId || s?.plan?.planId || s?.id);
      const name = (s?.plan?.name || "").toLowerCase().trim();
      const key = pid || name;
      if (key && !seenPlanKeys.has(key)) {
        seenPlanKeys.add(key);
        validActiveSubs.push(s);
      }
    }
  });

  const activePlanIds = new Set(
    validActiveSubs
      .map((s) => Number(s?.planId || s?.plan?.planId))
      .filter(Boolean)
  );

  const activePlanNames = new Set(
    validActiveSubs
      .map((s) => (s?.plan?.name || "").toLowerCase().trim())
      .filter(Boolean)
  );

  const activeModules = new Set(
    validActiveSubs
      .map((s) => (s?.plan?.features?.module || "").toLowerCase().trim())
      .filter(Boolean)
  );

  const activePlanList = validActiveSubs
    .map((s) => s?.plan?.name || (s?.planId === 1 ? "Grooming Management - Monthly" : s?.planId === 11 ? "Daycare Management - Monthly" : `Plan #${s?.planId}`))
    .filter(Boolean);

  const currentPlanName =
    activePlanList.length > 0
      ? activePlanList.join(" + ")
      : userInfo?.subscriptionPlan || (userInfo?.vendorCompanies && userInfo.vendorCompanies[0]?.subscriptionPlan) || null;

  const isSubscribed = Boolean(
    activePlanIds.size > 0 ||
    validActiveSubs.length > 0 ||
    userInfo?.isSubscribed ||
    userInfo?.subscriptionActive ||
    currentPlanName
  );

  /* ── Fetch Plans and Active Subscriptions from API ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const API_URL = typeof window !== "undefined" && window.location.hostname === "business.zaanvar.com"
          ? "https://prod.zaanvar.com/api/"
          : "https://dev.zaanvar.com/api/";

        const token = getAuthToken(jwtToken);
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch available plans
        const res = await axios.get(`${API_URL}subscriptions/plans`, { headers: authHeaders });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setPlans(res.data.data);
        } else if (Array.isArray(res.data)) {
          setPlans(res.data);
        }

        // 2. Fetch latest active subscriptions via companies/vendor/details
        const uId = userInfo?.userId || userInfo?.id || userInfo?._id;
        const bId =
          (typeof window !== "undefined" && localStorage.getItem("zaanvar_claim_backend_branch_id")) ||
          (typeof window !== "undefined" && localStorage.getItem("selectedBranchId")) ||
          (typeof window !== "undefined" && localStorage.getItem("zaanvar_claim_scraped_branch_id")) ||
          userInfo?.vendorCompanies?.[0]?.branches?.[0]?.id ||
          userInfo?.branchId ||
          280;

        const scrapedId = typeof window !== "undefined" && localStorage.getItem("zaanvar_claim_scraped_branch_id");

        let subs = null;

        // 2a. Primary Call: GET companies/vendor/details?branchId=${bId}
        try {
          const detailsRes = await axios.get(`${API_URL}companies/vendor/details`, {
            params: { branchId: bId },
            headers: authHeaders
          });
          if (detailsRes?.data?.subscriptions && detailsRes.data.subscriptions.length > 0) {
            subs = detailsRes.data.subscriptions;
          } else if (detailsRes?.data?.data?.subscriptions && detailsRes.data.data.subscriptions.length > 0) {
            subs = detailsRes.data.data.subscriptions;
          }
        } catch (e) {
          console.warn("companies/vendor/details fetch error:", e);
        }

        // 2b. Fallback Call: GET scraped-branches/claim/progress
        if (!subs || subs.length === 0) {
          try {
            const params = {};
            if (uId) {
              params.vendor_user_id = uId;
              params.vendorUserId = uId;
            }
            if (bId) params.branchId = bId;
            if (scrapedId) params.scrapedBranchId = scrapedId;

            const progressRes = await axios.get(`${API_URL}scraped-branches/claim/progress`, {
              params,
              headers: authHeaders
            });
            subs =
              progressRes?.data?.subscriptions ||
              progressRes?.data?.data?.subscriptions ||
              (progressRes?.data?.subscription ? [progressRes.data.subscription] : null) ||
              (progressRes?.data?.data?.subscription ? [progressRes.data.data.subscription] : null);
          } catch (e) {
            console.warn("scraped-branches/claim/progress fetch error:", e);
          }
        }

        if (subs && subs.length > 0) {
          setFetchedSubs(subs);
          if (typeof window !== "undefined") {
            localStorage.setItem("zaanvar_subscription", JSON.stringify(subs));
          }
          const active = subs.filter(s => s.status === "active" || s.type === "paid" || s.status === "ACTIVE");
          const names = active.map(s => s.plan?.name || (s.planId === 1 ? "Grooming Management - Monthly" : s.planId === 11 ? "Daycare Management - Monthly" : `Plan #${s.planId}`)).filter(Boolean);
          if (active.length > 0 && setUserInfo) {
            setUserInfo((prev) => ({
              ...(prev || {}),
              isSubscribed: true,
              subscriptionActive: true,
              subscriptions: subs,
              subscription: active[0] || subs[0],
              subscriptionPlan: names.join(" + ")
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscription data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jwtToken]);

  /* ── Filtered Plans by Billing Cycle ── */
  const cyclesAvailable = Array.from(new Set(plans.map(p => p.billingCycle?.toLowerCase()).filter(Boolean)));
  
  const filteredPlans = plans.filter(p => {
    if (selectedCycle === "all") return true;
    return p.billingCycle?.toLowerCase() === selectedCycle.toLowerCase();
  });

  /* ── Subscribe / Upgrade Handler with Razorpay ── */
  const handleSubscribe = async (plan) => {
    setProcessingPlanId(plan.planId || plan.id);
    try {
      const compId =
        userInfo?.vendorCompanies?.[0]?.compId ||
        userInfo?.vendorCompanies?.[0]?.id ||
        userInfo?.compId ||
        1;
      const branchId =
        userInfo?.vendorCompanies?.[0]?.branches?.[0]?.id ||
        userInfo?.branchId ||
        1;
      const durationMonths = plan.billingCycle?.toLowerCase() === "yearly" ? 12 : 1;

      toast.info(`Opening Razorpay for ${plan.name}…`);

      await initiateSubscriptionPayment({
        plan,
        durationMonths,
        compId,
        branchId,
        userInfo,
        jwtToken,
        onSuccess: (verifyRes) => {
          setProcessingPlanId(null);
          toast.success(`🎉 Subscription to ${plan.name} is now active!`);
          if (userInfo) {
            const newSub = {
              planId: plan.planId || plan.id,
              status: "active",
              type: "paid",
              plan: plan
            };
            const currentSubs = Array.isArray(userInfo.subscriptions)
              ? userInfo.subscriptions
              : (userInfo.subscription ? [userInfo.subscription] : []);

            const updatedSubs = [...currentSubs.filter(s => Number(s.planId || s.plan?.planId) !== Number(newSub.planId)), newSub];
            userInfo.isSubscribed = true;
            userInfo.subscriptionActive = true;
            userInfo.subscriptions = updatedSubs;
            userInfo.subscription = newSub;
            userInfo.subscriptionPlan = updatedSubs.map(s => s.plan?.name).filter(Boolean).join(" + ");

            if (typeof window !== "undefined") {
              localStorage.setItem("zaanvar_subscription", JSON.stringify(updatedSubs));
            }
          }
          setTimeout(() => {
            router.replace("/claim-business");
          }, 1000);
        },
        onFailure: (errMsg) => {
          setProcessingPlanId(null);
          toast.error(errMsg || "Payment was not completed.");
        }
      });
    } catch (err) {
      console.error("Subscription initiate error:", err);
      toast.error(err?.message || "Failed to launch payment gateway.");
      setProcessingPlanId(null);
    }
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const scrollTrackRef = React.useRef(null);

  const scrollLeft = () => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: -305, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollTrackRef.current) {
      scrollTrackRef.current.scrollBy({ left: 305, behavior: "smooth" });
    }
  };

  return (
    <>
      <Head>
        <title>My Subscription &amp; Plans - Zaanvar</title>
      </Head>

      <DashboardLayout>
        <div className={styles.pageWrapper}>
          <div className={styles.container}>

          {/* ── Hero Header ── */}
          <div className={styles.heroHeader}>
            <div className={styles.heroBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Pricing &amp; Plans
            </div>
            <h1 className={styles.heroTitle}>
              Simple, transparent pricing for <span className={styles.heroTitleGradient}>your business</span>
            </h1>
            <p className={styles.heroSub}>
              Unlock comprehensive billing, automated appointments, inventory management, and customer analytics tailored for pet businesses.
            </p>

            {/* Trust Badges */}
            <div className={styles.trustRow}>
              <div className={styles.trustItem}>
                <span className={styles.trustDot}></span>
                Instant Activation
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustDot}></span>
                Cancel Anytime
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustDot}></span>
                Secure Razorpay Payments
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustDot}></span>
                Dedicated 24/7 Support
              </div>
            </div>
          </div>

          {/* ── Active Subscription Notification Banner ── */}
          {isSubscribed && (
            <div className={styles.activeBanner}>
              <div className={styles.activeBannerLeft}>
                <div className={styles.activeBannerIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h3 className={styles.activeBannerTitle}>
                      {validActiveSubs.length > 1
                        ? `Active Plans (${validActiveSubs.length}):`
                        : `Current Active Plan:`}
                    </h3>
                    <span className={styles.activeBadge}>Active</span>
                  </div>
                  {validActiveSubs.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                      {validActiveSubs.map((sub, sIdx) => {
                        const sName = sub.plan?.name || (sub.planId === 1 ? "Grooming Management - Monthly" : sub.planId === 11 ? "Daycare Management - Monthly" : `Plan #${sub.planId}`);
                        return (
                          <div
                            key={sIdx}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#059669",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "20px",
                              padding: "4px 12px",
                              fontSize: "13px",
                              fontWeight: "600"
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {sName}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.activeBannerSub} style={{ marginTop: "4px" }}>
                      {currentPlanName || "Business Suite Plan"}
                    </p>
                  )}
                  <p className={styles.activeBannerSub} style={{ marginTop: "6px" }}>
                    Your business has full access to billing, appointments, daycare attendance, grooming scheduler, and records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.subscribeBtnOutline}
                style={{ padding: "8px 18px", fontSize: "13px", whiteSpace: "nowrap" }}
                onClick={() => toast.info("Your subscriptions are currently active and in good standing.")}
              >
                Manage Billing
              </button>
            </div>
          )}

          {/* ── Billing Cycle Filter (if multiple cycles exist) ── */}
          {cyclesAvailable.length > 1 && (
            <div className={styles.toggleWrap}>
              <div className={styles.toggleContainer}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${selectedCycle === "all" ? styles.toggleBtnActive : ""}`}
                  onClick={() => setSelectedCycle("all")}
                >
                  All Plans
                </button>
                {cyclesAvailable.map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    className={`${styles.toggleBtn} ${selectedCycle === cycle ? styles.toggleBtnActive : ""}`}
                    onClick={() => setSelectedCycle(cycle)}
                  >
                    {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    {cycle === "yearly" && <span className={styles.saveBadge}>Save 20%</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Horizontal Scroll Plans Track ── */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Loading subscription plans…</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className={styles.loadingState}>
              <span>No active plans available at the moment.</span>
            </div>
          ) : (
            <div className={styles.horizontalScrollWrapper}>
              {filteredPlans.length > 2 && (
                <>
                  <button
                    type="button"
                    className={`${styles.scrollNavBtn} ${styles.scrollNavBtnLeft}`}
                    onClick={scrollLeft}
                    aria-label="Scroll left"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`${styles.scrollNavBtn} ${styles.scrollNavBtnRight}`}
                    onClick={scrollRight}
                    aria-label="Scroll right"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}

              <div
                ref={scrollTrackRef}
                className={`${styles.plansHorizontalTrack} ${filteredPlans.length <= 2 ? styles.singlePlanCenter : ""}`}
              >
                {filteredPlans.map((plan, idx) => {
                  const priceNum = parseFloat(plan.price || 0);
                  const formattedPrice = priceNum.toLocaleString("en-IN", {
                    maximumFractionDigits: 0
                  });

                  const planIdNum = Number(plan.planId || plan.id);
                  const planNameStr = (plan.name || "").toLowerCase().trim();
                  const planModuleStr = (plan.features?.module || "").toLowerCase().trim();

                  const isPlanActive = isSubscribed && validActiveSubs.some(s => {
                    const sPid = Number(s?.planId || s?.plan?.planId);
                    if (sPid && planIdNum && sPid === planIdNum) return true;

                    const sName = (s.plan?.name || (s.planId === 1 ? "Grooming Management - Monthly" : s.planId === 11 ? "Daycare Management - Monthly" : "")).toLowerCase().trim();
                    if (sName && planNameStr && sName === planNameStr) return true;

                    const sCycle = (s?.plan?.billingCycle || (sName.includes("yearly") ? "yearly" : "monthly")).toLowerCase().trim();
                    const curCycle = (plan?.billingCycle || (planNameStr.includes("yearly") ? "yearly" : "monthly")).toLowerCase().trim();
                    if (sCycle === curCycle) {
                      const sMod = (s?.plan?.features?.module || (sName.includes("grooming") ? "grooming" : sName.includes("daycare") ? "daycare" : "")).toLowerCase().trim();
                      const curMod = (planModuleStr || (planNameStr.includes("grooming") ? "grooming" : planNameStr.includes("daycare") ? "daycare" : "")).toLowerCase().trim();
                      if (sMod && curMod && sMod === curMod) return true;
                    }
                    return false;
                  });

                  // Extract features from includes array or key-value object
                  let featureList = [];
                  if (Array.isArray(plan.features?.includes) && plan.features.includes.length > 0) {
                    featureList = plan.features.includes.map(item => ({ name: item, enabled: true }));
                  } else if (plan.features && typeof plan.features === "object") {
                    featureList = Object.entries(plan.features)
                      .filter(([k]) => !["module", "category", "target", "tier", "includes"].includes(k.toLowerCase()))
                      .map(([k, v]) => ({ name: formatFeatureName(k), enabled: Boolean(v) }));
                  }

                  const isPopular = idx === 0 || plan.name?.toLowerCase().includes("popular") || plan.name?.toLowerCase().includes("monthly");

                  return (
                    <div
                      key={plan.planId || idx}
                      className={`${styles.planCard} ${isPopular ? styles.planCardPopular : ""}`}
                    >
                      {isPopular && (
                        <div className={styles.popularPill}>
                          ⭐ Most Popular
                        </div>
                      )}

                      {/* Card Header */}
                      <div className={styles.cardHeader}>
                        <div className={styles.cardTopRow}>
                          <div className={styles.planIconBadge}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                          </div>
                          <span className={styles.cycleBadge}>
                            {plan.billingCycle || "Monthly"}
                          </span>
                        </div>

                        <h3 className={styles.planName}>{plan.name}</h3>
                        <p className={styles.planDesc}>
                          {plan.features?.target || (plan.features?.category ? `${plan.features.category} for pet businesses` : "Designed for pet stores, clinics, grooming, and daycare.")}
                        </p>
                      </div>

                      {/* Price Row */}
                      <div className={styles.priceRow}>
                        <span className={styles.currency}>₹</span>
                        <span className={styles.priceAmount}>{formattedPrice}</span>
                        <span className={styles.priceCycle}>
                          / {plan.billingCycle || "mo"}
                        </span>
                      </div>

                      {/* Limits / Specifications Box */}
                      <div className={styles.limitsBox}>
                        <div className={styles.limitItem}>
                          <span className={styles.limitLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Branches
                          </span>
                          <span className={styles.limitVal}>
                            {plan.maxBranches ? `${plan.maxBranches} Branch` : "1 Branch"}
                          </span>
                        </div>

                        <div className={styles.limitItem}>
                          <span className={styles.limitLabel}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Invoices / Mo
                          </span>
                          <span className={styles.limitVal}>
                            {plan.maxInvoicesPerMonth && plan.maxInvoicesPerMonth !== -1 ? `${plan.maxInvoicesPerMonth.toLocaleString()}` : "Unlimited"}
                          </span>
                        </div>
                      </div>

                      {/* Included Features List */}
                      <div className={styles.featuresHeader}>Included Features</div>
                      <ul className={styles.featuresList}>
                        {featureList.length > 0 ? (
                          featureList.map((feat, fIdx) => (
                            <li key={fIdx} className={styles.featureItem}>
                              <div className={feat.enabled ? styles.checkIcon : styles.crossIcon}>
                                {feat.enabled ? (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                )}
                              </div>
                              <span style={{ color: feat.enabled ? "#334155" : "#94a3b8" }}>
                                {feat.name}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className={styles.featureItem}>
                            <div className={styles.checkIcon}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <span>Complete Management Features</span>
                          </li>
                        )}
                      </ul>

                      {/* Action Button */}
                      {isPlanActive ? (
                        <button type="button" className={`${styles.subscribeBtn} ${styles.subscribeBtnActive}`}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Current Plan
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.subscribeBtn}
                          onClick={() => handleSubscribe(plan)}
                          disabled={processingPlanId === plan.planId}
                        >
                          {processingPlanId === plan.planId ? (
                            "Processing…"
                          ) : (
                            <>
                              Subscribe
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Why Choose Zaanvar Software Features Section ── */}
          <div className={styles.highlightsSection}>
            <h2 className={styles.sectionHeading}>Everything you need to run your business</h2>
            <p className={styles.sectionSubtitle}>
              Built specifically for modern pet stores, veterinary clinics, grooming salons, and daycare facilities.
            </p>

            <div className={styles.highlightsGrid}>
              <div className={styles.highlightCard}>
                <div className={styles.highlightIconWrap}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <line x1="6" y1="8" x2="6" y2="8" />
                    <line x1="10" y1="8" x2="18" y2="8" />
                    <line x1="6" y1="12" x2="6" y2="12" />
                    <line x1="10" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="16" x2="6" y2="16" />
                    <line x1="10" y1="16" x2="18" y2="16" />
                  </svg>
                </div>
                <h4 className={styles.highlightTitle}>Fast POS &amp; GST Invoicing</h4>
                <p className={styles.highlightText}>
                  Generate professional tax invoices in seconds. Support multiple payment modes, returns, and automatic customer receipts.
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.highlightIconWrap} style={{ background: "#fef3c7", color: "#d97706" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <h4 className={styles.highlightTitle}>Live Inventory &amp; Stock Control</h4>
                <p className={styles.highlightText}>
                  Track stock levels across branches, receive low-stock alerts, manage barcodes, and streamline supplier purchase bills.
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.highlightIconWrap} style={{ background: "#f3e8ff", color: "#9333ea" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h4 className={styles.highlightTitle}>Smart Booking Scheduler</h4>
                <p className={styles.highlightText}>
                  Manage grooming, daycare, and clinic appointments effortlessly. Auto-assign staff and send instant reminder notifications.
                </p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.highlightIconWrap} style={{ background: "#dcfce7", color: "#16a34a" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h4 className={styles.highlightTitle}>Financial &amp; Growth Insights</h4>
                <p className={styles.highlightText}>
                  Gain deep visibility into sales trends, top performing services, customer repeat rates, and branch revenue breakdowns.
                </p>
              </div>
            </div>
          </div>

          {/* ── FAQ Section ── */}
          <div className={styles.faqSection}>
            <h2 className={styles.sectionHeading}>Frequently Asked Questions</h2>
            <p className={styles.sectionSubtitle}>Have questions about plans or billing? We&apos;re here to help.</p>

            <div className={styles.faqItem}>
              <button type="button" className={styles.faqQuestion} onClick={() => toggleFaq(0)}>
                <span>Can I upgrade or change my plan later?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openFaq === 0 ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === 0 && (
                <div className={styles.faqAnswer}>
                  Yes! You can upgrade your plan at any time directly from the My Subscription tab. Your billing will be adjusted seamlessly.
                </div>
              )}
            </div>

            <div className={styles.faqItem}>
              <button type="button" className={styles.faqQuestion} onClick={() => toggleFaq(1)}>
                <span>What happens when I reach the monthly invoice limit?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openFaq === 1 ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === 1 && (
                <div className={styles.faqAnswer}>
                  You will receive a notification as you approach your monthly limit. You can easily upgrade to a higher tier plan with increased or unlimited invoice capacity with no interruption to your sales.
                </div>
              )}
            </div>

            <div className={styles.faqItem}>
              <button type="button" className={styles.faqQuestion} onClick={() => toggleFaq(2)}>
                <span>Is my business data safe and backed up?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openFaq === 2 ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === 2 && (
                <div className={styles.faqAnswer}>
                  Yes, your data is securely encrypted in transit and at rest with automated daily cloud backups, ensuring 99.9% uptime and zero data loss.
                </div>
              )}
            </div>
          </div>

          {/* ── Enterprise / Contact Support Card ── */}
          <div className={styles.supportCard}>
            <div>
              <h3 className={styles.supportTitle}>Need a custom enterprise setup or multi-chain plan?</h3>
              <p className={styles.supportSub}>
                Talk to our dedicated account specialists for custom volume discounts and tailored onboarding.
              </p>
            </div>
            <button
              type="button"
              className={styles.supportBtn}
              onClick={() => router.push("/contact-us")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact Support
            </button>
          </div>

          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
