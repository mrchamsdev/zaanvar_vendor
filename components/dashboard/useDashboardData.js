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
  const { userInfo, jwtToken, _hasHydrated, selectedBranchId, setSelectedBranchId, setVendorSettings, vendorSettings } = useStore();

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

  const [apiBranches, setApiBranches] = useState(null);

  useEffect(() => {
    if (!jwtToken || !companyId) return;
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

  const branches = apiBranches || company?.branches || [];

  // Set default branch if none selected or if the selected one is no longer in the fetched branches (e.g., deleted)
  useEffect(() => {
    if (!_hasHydrated) return;
    if (branches.length > 0) {
      const isValidSelected = branches.find(b => String(b.id) === String(selectedBranchId));
      if (!selectedBranchId || !isValidSelected) {
        // Safeguard: Do not overwrite the branch if the URL query explicitly specifies a branchId
        if (!router.query.branchId) {
          setSelectedBranchId(branches[0].id || branches[0]._id);
        }
      }
    }
  }, [branches, selectedBranchId, setSelectedBranchId, _hasHydrated, router.query.branchId]);

  // Centralized query-to-store sync: if URL has a branchId query, make sure it matches store's selectedBranchId
  const queryBranchId = router.query.branchId;
  useEffect(() => {
    if (router.isReady && queryBranchId) {
      const parsed = parseInt(queryBranchId) || queryBranchId;
      if (String(selectedBranchId) !== String(parsed)) {
        setSelectedBranchId(parsed);
      }
    }
  }, [router.isReady, queryBranchId, selectedBranchId, setSelectedBranchId]);

  const currentBranchId = selectedBranchId || vendor?.branchId || null;
  const branch = branches.find(b => String(b.id) === String(currentBranchId)) || branches[0] || null;
  const timings = normaliseTiming(branch?.timings);

  const branchId = branch?.id || branch?._id || null;

  /* ── fetch vendor settings ── */
  useEffect(() => {
    if (!jwtToken || !branchId) return;

    // Guard: wait until active branchId is synced with URL query branchId
    const queryBranchId = router.query.branchId;
    if (queryBranchId && String(branchId) !== String(queryBranchId)) {
      return;
    }
    
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
  }, [jwtToken, branchId, setVendorSettings, router.query.branchId]);

  /* ── fetch reviews & ratings when branch is known ── */
  useEffect(() => {
    if (!jwtToken || !branchId || skipReviews) return;

    // Guard: wait until active branchId is synced with URL query branchId
    const queryBranchId = router.query.branchId;
    if (queryBranchId && String(branchId) !== String(queryBranchId)) {
      return;
    }

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
  }, [jwtToken, branchId, skipReviews]);

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
