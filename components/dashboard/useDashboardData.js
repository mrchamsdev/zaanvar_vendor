/**
 * useDashboardData
 *
 * Single source-of-truth hook for all vendor dashboard pages.
 * Reads vendor data from the Zustand store (persisted after login)
 * and fetches supplementary data (reviews, ratings) from the API.
 *
 * Usage:
 *   const { vendor, company, branch, timings, reviews, ratings,
 *           isHydrated, isLoading, reviewsLoading } = useDashboardData();
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStore from "../state/useStore";
import { WebApimanager } from "../utilities/WebApiManager";

/* ── helpers ────────────────────────────────────────────── */
const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function normaliseTiming(timings) {
  if (!timings) return null;
  const out = {};
  DAYS.forEach((d) => {
    const slot = timings[d];
    out[d] = {
      open:  slot?.open  || "closed",
      close: slot?.close || "closed",
    };
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════
 * Hook
 * ═══════════════════════════════════════════════════════════ */
export default function useDashboardData(options = {}) {
  const { skipReviews = true } = options;
  const router = useRouter();
  const { userInfo, jwtToken, _hasHydrated } = useStore();

  /* ── supplementary state ── */
  const [reviews,        setReviews]        = useState([]);
  const [ratings,        setRatings]        = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError,   setReviewsError]   = useState(null);

  /* ── redirect to login when not authenticated ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!jwtToken || !userInfo) {
      router.replace("/login");
    }
  }, [_hasHydrated, jwtToken, userInfo]);

  /* ── derive vendor shape from stored userInfo ── */
  const vendor     = userInfo || null;
  const companies  = vendor?.vendorCompanies || [];
  const company    = companies[0] || null;
  const branches   = company?.branches || [];
  const branch     = branches[0] || null;
  const timings    = normaliseTiming(branch?.timings);

  const branchId   = vendor?.branchId || branch?.id || null;
  const companyId  = company?.compId  || null;

  /* ── fetch reviews & ratings when branch is known ── */
  useEffect(() => {
    if (!jwtToken || !branchId || skipReviews) return;

    const webApi = new WebApimanager(jwtToken);
    setReviewsLoading(true);

    webApi
      .get(`vendor-reviews/branch/${branchId}`)
      .then((res) => {
        const data = res?.data || res;
        const list = data?.reviews || data?.data || data || [];
        setReviews(Array.isArray(list) ? list : []);

        /* ratings summary */
        const rat = data?.ratings || data?.ratingsSummary || null;
        setRatings(rat);
      })
      .catch((err) => {
        console.warn("Reviews fetch failed (non-critical):", err?.message);
        setReviewsError(err?.message || "Failed");
      })
      .finally(() => setReviewsLoading(false));
  }, [jwtToken, branchId]);

  return {
    /* ── auth / hydration ── */
    isHydrated:    _hasHydrated,
    isLoading:     !_hasHydrated,

    /* ── vendor data (from Zustand / login response) ── */
    vendor,
    company,
    companies,
    branch,
    branches,
    timings,
    branchId,
    companyId,

    /* ── supplementary (API) ── */
    reviews,
    ratings,
    reviewsLoading,
    reviewsError,
  };
}
