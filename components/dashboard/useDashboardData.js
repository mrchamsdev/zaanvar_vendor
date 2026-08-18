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
import { getSettings } from "../../services/settingsService";

/* ── helpers ────────────────────────────────────────────── */
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function normaliseTiming(timings) {
  if (!timings) return null;
  const out = {};
  DAYS.forEach((d) => {
    const slot = timings[d];
    out[d] = {
      open: slot?.open || "closed",
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
  const { userInfo, jwtToken, _hasHydrated, selectedBranchId, setSelectedBranchId, setVendorSettings, vendorSettings, setRoles } = useStore();

  /* ── supplementary state ── */
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  /* ── redirect to login when not authenticated ── */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!jwtToken || !userInfo) {
      router.replace("/login");
    }
  }, [_hasHydrated, jwtToken, userInfo]);

  /* ── derive vendor shape from stored userInfo ── */
  const vendor = userInfo || null;
  const companies = vendor?.vendorCompanies || [];
  const company = companies[0] || null;
  // Robust companyId extraction: try compId, id, and companyId from company or vendor
  const companyId = company?.compId || company?.id || company?._id || vendor?.compId || vendor?.companyId || null;

  // Determine if the user has dashboard access (verified business + subscription)
  const hasDashboardAccess = companies.length > 0 && (
    vendor?.isSubscribed ||
    vendor?.subscriptionActive ||
    vendor?.subscriptionPlan ||
    company?.isSubscribed ||
    company?.subscriptionPlan ||
    false
  );

  const [apiBranches, setApiBranches] = useState(null);

  useEffect(() => {
    if (!jwtToken || !companyId || !hasDashboardAccess) return;
    const webApi = new WebApimanager(jwtToken);
    webApi.get(`branches/getBranchesByCompany/${companyId}`)
      .then((res) => {
        const data = res?.data?.data || res?.data || res;
        if (Array.isArray(data)) {
          // Ensure every branch has an 'id' field for consistency
          const mapped = data.map(b => ({
            ...b,
            id: b.id || b._id || b.branchId
          }));
          setApiBranches(mapped);
        }
      })
      .catch((err) => console.error("Failed to fetch branches by company:", err));
  }, [jwtToken, companyId]);

  // Only use company?.branches fallback when the user has dashboard access.
  // Without access, the API fetch is skipped and company?.branches may contain
  // unverified/in-progress branches that don't exist in the database yet.
  const branches = apiBranches || (hasDashboardAccess ? (company?.branches || []) : []);

  // ── Resolve the correct branchId in a single synchronous pass ──────────
  // Priority: URL query param > persisted store value > first branch
  // Reading the URL param synchronously (during render, not in a useEffect)
  // means we never render with the wrong branch, eliminating the 3-step flicker.
  const queryBranchId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("branchId")
    : (router.isReady && router.query.branchId ? String(router.query.branchId) : null);

  const resolvedBranchId = (() => {
    if (queryBranchId) return queryBranchId;
    if (selectedBranchId) return String(selectedBranchId);
    if (branches.length > 0) return String(branches[0].id || branches[0]._id);
    return null;
  })();

  // Persist resolved value back to store (only when it differs) so navigation
  // without a query param still lands on the right branch.
  useEffect(() => {
    if (!_hasHydrated || !resolvedBranchId) return;
    if (String(selectedBranchId) !== String(resolvedBranchId)) {
      setSelectedBranchId(resolvedBranchId);
    }
  }, [_hasHydrated, resolvedBranchId, selectedBranchId, setSelectedBranchId]);

  const branch = branches.find(b => String(b.id || b._id || b.branchId) === String(resolvedBranchId)) || branches[0] || null;
  const timings = normaliseTiming(branch?.timings);

  const branchId = branch?.id || branch?._id || null;

  /* ── fetch vendor settings (only when dashboard access is available) ── */
  useEffect(() => {
    if (!jwtToken || !branchId || !hasDashboardAccess) return;

    getSettings(jwtToken, branchId)
      .then((res) => {
        const data = res?.data?.settings || res?.settings;
        if (data) {
          setVendorSettings(data);
        }
      })
      .catch((err) => {
        if (err?.response?.status !== 404) {
          console.error("Failed to fetch settings in useDashboardData:", err);
        }
      });
  }, [jwtToken, branchId, setVendorSettings]);

  /* ── fetch roles & poll every 10 mins (only when dashboard access is available) ── */
  useEffect(() => {
    if (!jwtToken || !branchId || !hasDashboardAccess) return;

    const fetchRoles = () => {
      const webApi = new WebApimanager(jwtToken);
      webApi.get(`vendor/roles?branchId=${branchId}`)
        .then((res) => {
          const data = res?.data?.data || res?.data || res;
          if (Array.isArray(data)) {
            setRoles(data);
          }
        })
        .catch((err) => console.error("Failed to fetch roles:", err));
    };

    fetchRoles(); // fetch immediately
    const intervalId = setInterval(fetchRoles, 10 * 60 * 1000); // poll every 10 minutes

    return () => clearInterval(intervalId);
  }, [jwtToken, branchId, setRoles]);

  /* ── fetch reviews & ratings when branch or company is known ── */
  useEffect(() => {
    if (!jwtToken || skipReviews) return;
    if (!companyId && !branchId) return;

    const webApi = new WebApimanager(jwtToken);
    setReviewsLoading(true);

    const url = companyId
      ? `vendor-reviews/get-reviews?companyId=${companyId}`
      : `vendor-reviews/get-reviews?branchId=${branchId}`;

    webApi
      .get(url)
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
  }, [jwtToken, branchId, companyId, skipReviews]);

  return {
    /* ── auth / hydration ── */
    isHydrated: _hasHydrated,
    isLoading: !_hasHydrated,

    /* ── vendor data (from Zustand / login response) ── */
    vendor,
    company,
    companies,
    branch,
    branches,
    timings,
    branchId,
    selectedBranchId: branchId,
    setSelectedBranchId,
    companyId,

    /* ── supplementary (API) ── */
    reviews,
    ratings,
    reviewsLoading,
    reviewsError,

    /* ── currency ── */
    currencySymbol: vendorSettings?.general?.businessCurrency || "₹",
  };
}
