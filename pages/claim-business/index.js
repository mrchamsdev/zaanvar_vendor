import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/claim-business.module.css";
import reviewsStyles from "../../styles/dashboard/reviews.module.css";
import { toast } from "sonner";
import useStore from "../../components/state/useStore";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import swal from "sweetalert";

// ─── Inline SVGs & Helpers ───────────────────────────────────────────────────
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CategoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const IconVideo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconHelp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconUploadCloud = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5.01 14H5a5 5 0 0 1 5-5h.09A6 6 0 0 1 20 13v1a4 4 0 0 1-4 4H5.01z" />
    <polyline points="16 10 12 6 8 10" />
    <line x1="12" y1="6" x2="12" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconInfoCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// ─── Search Bar inside Header ───
const SearchBar = ({ query, setQuery }) => (
  <div className={styles.topbarSearchWrapper}>
    <span className={styles.searchIconLeft}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>
    <input
      type="text"
      placeholder="Search here"
      className={styles.topbarSearchInput}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  </div>
);

const getCoreName = (name) => {
  if (!name) return "";
  const parts = name.split(/[–\-|(|,]/);
  return parts[0].trim().toLowerCase();
};

function getRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return "JUST NOW";
  if (diffMin < 60) return `${diffMin} MINUTES AGO`;
  if (diffHour < 24) return `${diffHour} HOURS AGO`;
  if (diffDay === 1) return "YESTERDAY";
  if (diffDay < 7) return `${diffDay} DAYS AGO`;
  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return weeks === 1 ? "ONE WEEK AGO" : `${weeks} WEEKS AGO`;
  }
  const months = Math.floor(diffDay / 30);
  return months === 1 ? "ONE MONTH AGO" : `${months} MONTHS AGO`;
}

// ─── Main ClaimBusiness Page ─────────────────────────────────────────────────
const ClaimBusiness = ({ forcedView = null }) => {
  const router = useRouter();
  const { userInfo, jwtToken, _hasHydrated } = useStore();
  const dropdownRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // ── Wizard View state: "search" | "details" | "branches" | "verify_method" | "verify_later" ──
  const [view, setView] = useState(forcedView || "search");

  // ── Ticket and progress state ──
  const [ticketId, setTicketId] = useState(null);
  const [ticketReferenceId, setTicketReferenceId] = useState("ZB21234567890");

  // ── Verification Option state ──
  const [methodOption, setMethodOption] = useState("video"); // "video" | "later"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [shopFrontPhoto, setShopFrontPhoto] = useState("");
  const [selfiePhoto, setSelfiePhoto] = useState("");
  const [videoUpload, setVideoUpload] = useState("");
  const [showOtpView, setShowOtpView] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [hevcSupported, setHevcSupported] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const playerRef = useRef(null);

  const [isVerified, setIsVerified] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [backendBranchId, setBackendBranchId] = useState(null);
  const [scrapedBranchEmail, setScrapedBranchEmail] = useState("");
  const [branchImagesList, setBranchImagesList] = useState([]);
  const [headerBranches, setHeaderBranches] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reply states
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});

  // Check H.265 codec support and inject h265web.js if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      const video = document.createElement("video");
      const canPlayHEVC = video.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"') || 
                          video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"');
      const supported = canPlayHEVC === "probably" || canPlayHEVC === "maybe";
      setHevcSupported(supported);

      if (!supported) {
        if (window.H265webjsPlayer) {
          setSdkReady(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/h265web.js@1.2.9/dist/h265web.js";
        script.async = true;
        script.onload = () => setSdkReady(true);
        script.onerror = () => console.error("Failed to load h265web.js SDK from CDN.");
        document.body.appendChild(script);
      }
    }
  }, []);

  // Initialize h265web.js software player if native H.265 is not supported
  useEffect(() => {
    if (hevcSupported || !sdkReady || !videoUpload || view !== "submitted" || showOtpView) return;

    let playerInstance = null;
    const initPlayer = () => {
      try {
        const config = {
          player_id: "h265-player-container",
          base_url: "https://cdn.jsdelivr.net/npm/h265web.js@1.2.9/dist/",
          wasm_js_uri: "h265web_wasm.js",
          wasm_wasm_uri: "h265web_wasm.wasm",
          ext_src_js_uri: "extjs.js",
          ext_wasm_js_uri: "extwasm.js",
          width: 360,
          height: 202,
          url: videoUpload,
          auto_play: false,
          volume: 1.0,
          show_control: true
        };

        playerInstance = window.H265webjsPlayer();
        playerInstance.build(config);
        playerRef.current = playerInstance;
      } catch (err) {
        console.error("Failed to initialize h265webjs player:", err);
      }
    };

    const timer = setTimeout(initPlayer, 200);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        try {
          playerRef.current.release();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [hevcSupported, sdkReady, videoUpload, view, showOtpView]);

  // ── Company details form state ──
  const [formData, setFormData] = useState({
    businessName: "",
    businessPhone: "",
    businessEmail: "",
    userName: "",
    role: "Owner",
    companyAddress: ""
  });

  // ── Branch selector list state (Verify step) ──
  const [branchesList, setBranchesList] = useState([]);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ── Fetch existing claim progress on mount ──
  useEffect(() => {
    const fetchClaimProgress = async () => {
      try {
        const API_URL = window.location.hostname !== "support.zaanvar.com"
          ? "https://dev.zaanvar.com/api/"
          : "https://prod.zaanvar.com/api/";
        
        const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");

        const res = await axios.get(`${API_URL}scraped-branches/claim/progress`, {
          params: {
            scrapedBranchId: savedBranchId || undefined
          }
        });

        if (res?.data?.data && (res.data.status === "success" || res.data.status === "DUPLICATE_CLAIM" || res.data.isDuplicateClaim)) {
          const ticket = res.data.data.ticket || res.data.data;
          const step = ticket.currentStep || ticket.current_step;
          const stepUpper = step?.toUpperCase();

          const forceClaimNew = localStorage.getItem("zaanvar_force_claim_new") === "true";
          const isNewClaimQuery = typeof window !== "undefined" && window.location.search.includes("newClaim=true");

          // If in new claim flow, ignore previously APPROVED ticket to let them claim a new one
          if (forceClaimNew && isNewClaimQuery && stepUpper === "APPROVED" && router.pathname !== "/home") {
            setView("search");
            setLoadingProgress(false);
            return;
          }

          setTicketId(ticket.ticket_id || ticket.id || null);
          if (ticket.ticket_reference_id) setTicketReferenceId(ticket.ticket_reference_id);
          
          const claimBranchId = ticket.branchId || ticket.branch_id || res.data.data.branchId || res.data.data.branch_id;
          if (claimBranchId) {
            setBackendBranchId(claimBranchId);
          }
          
          const branchId = ticket.scrapedBranchId || ticket.scraped_branch_id;
          if (branchId) {
            localStorage.setItem("zaanvar_claim_scraped_branch_id", branchId);
          }

          const branchEmail = ticket?.scrapedBranch?.branchEmail || ticket?.scrapedBranch?.email || "";
          if (branchEmail) {
            setScrapedBranchEmail(branchEmail);
          }

          const draft = ticket.draftData || ticket.draft_data || {};

          // Prefill values
          setFormData({
            businessName: draft.companyName || "",
            businessPhone: draft.phoneNo || "",
            businessEmail: ticket.email || draft.email || "",
            userName: draft.userName || "",
            role: draft.role || ticket.role || "Owner",
            companyAddress: draft.companyAddress || ""
          });

          // Route to the saved step
          if (stepUpper === "COMPANY_SELECTED") {
            setView("details");
          } else if (stepUpper === "COMPANY_DETAILS") {
            // Reconstruct branches list dynamically from draft company name
            const mainAddr = draft.companyAddress || "";
            const compName = draft.companyName || "";
            
            const fetchDuplicatesOnLoad = async () => {
              try {
                const API_URL = window.location.hostname !== "support.zaanvar.com"
                  ? "https://dev.zaanvar.com/api/"
                  : "https://prod.zaanvar.com/api/";
                
                const searchRes = await axios.get(`${API_URL}scraped-branches/non-duplicates`, {
                  params: { search: compName }
                });
                
                const searchData = searchRes?.data?.data || [];
                const coreSelected = getCoreName(compName);
                const cleanBrand = coreSelected.split(/\s+/).slice(0, 2).join(" ");
                
                const matchedBranches = searchData
                  .filter(r => {
                    const coreItem = getCoreName(r.fullName || r.branchName);
                    return coreItem.startsWith(cleanBrand) || coreItem === coreSelected;
                  })
                  .map(r => ({
                    id: r.id,
                    title: "Is this your business ?",
                    address: r.branchLocation || "Location not provided"
                  }));

                if (matchedBranches.length === 0) {
                  matchedBranches.push({ id: ticket.scraped_branch_id || 61, title: "Is this your business ?", address: mainAddr });
                }
                
                setBranchesList(matchedBranches);
              } catch (err) {
                setBranchesList([
                  { id: ticket.scraped_branch_id || 61, title: "Is this your business ?", address: mainAddr }
                ]);
              }
            };
            fetchDuplicatesOnLoad();
            setView("branches");
          } else if (stepUpper === "VERIFY_BUSINESS") {
            setView("verify_method");
          } else if (stepUpper === "VERIFICATION_INSTRUCTIONS" || stepUpper === "VERIFICATION_PERMISSIONS" || stepUpper === "VERIFICATION_METHOD") {
            setView("verify_method");
            setIsModalOpen(true);
          } else if (stepUpper === "VERIFY_LATER") {
            setView("verify_later");
          } else if (stepUpper === "SUBMITTED") {
            setShopFrontPhoto(ticket.shopFrontPhoto || ticket.selfiePhoto || ticket.selfie_photo || "");
            setSelfiePhoto(ticket.selfiePhoto || ticket.selfie_photo || "");
            setVideoUpload(ticket.videoUpload || ticket.video_upload || "");
            setView("submitted");
          } else if (stepUpper === "BUSINESS_VERIFICATION_OTP") {
            setShopFrontPhoto(ticket.shopFrontPhoto || ticket.selfiePhoto || ticket.selfie_photo || "");
            setSelfiePhoto(ticket.selfiePhoto || ticket.selfie_photo || "");
            setVideoUpload(ticket.videoUpload || ticket.video_upload || "");
            setView("submitted");
            setShowOtpView(true);
          } else if (stepUpper === "APPROVED") {
            setShopFrontPhoto(ticket.shopFrontPhoto || ticket.selfiePhoto || ticket.selfie_photo || "");
            setSelfiePhoto(ticket.selfiePhoto || ticket.selfie_photo || "");
            setVideoUpload(ticket.videoUpload || ticket.video_upload || "");
            if (router.pathname === "/claim-business") {
              router.replace("/home");
            } else {
              setView("home");
              fetchBranchDetailsAndReviews(claimBranchId);
            }
          }
        }
      } catch (err) {
        console.log("No existing claim progress ticket found.");
      } finally {
        setLoadingProgress(false);
      }
    };
    if (typeof window !== "undefined" && !_hasHydrated) return;

    if (userInfo) {
      fetchClaimProgress();
    } else {
      setLoadingProgress(false);
    }
  }, [userInfo, _hasHydrated]);

  // Sync view state to redirect to /home if active inside /claim-business path
  useEffect(() => {
    if (view === "home" && router.pathname === "/claim-business") {
      router.replace("/home");
    }
  }, [view, router.pathname]);

  // Load user's claimed branches list to render in header switcher
  useEffect(() => {
    const fetchHeaderBranches = async () => {
      if (!jwtToken || !userInfo) return;
      const currentUserId = userInfo.userId || userInfo.id;
      if (!currentUserId) return;
      
      try {
        const webApi = new WebApimanager(jwtToken);
        const userRes = await webApi.get(`vendor-users/${currentUserId}`);
        const userData = userRes?.data?.data || userRes?.data || userRes || {};
        const branchIds = userData.branchId || userData.branchAssigned || [];
        
        if (Array.isArray(branchIds) && branchIds.length > 0) {
          const branchesData = await Promise.all(
            branchIds.map(async (bId) => {
              try {
                const detailsRes = await webApi.get(`companies/vendor/details?branchId=${bId}`);
                const detailsData = detailsRes?.data || detailsRes;
                const details = detailsData?.branch || detailsData?.company || detailsData?.data || detailsData || {};
                return {
                  id: bId,
                  name: details.businessName || details.name || `Branch #${bId}`
                };
              } catch (err) {
                console.error("Failed to load details for branch ID:", bId, err);
                return { id: bId, name: `Branch #${bId}` };
              }
            })
          );
          setHeaderBranches(branchesData);
          
          // Auto-select active branch
          if (branchesData.length > 0 && !backendBranchId) {
            const firstId = branchesData[0].id;
            setBackendBranchId(firstId);
            fetchBranchDetailsAndReviews(firstId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch header branches:", err);
      }
    };

    if (typeof window !== "undefined" && _hasHydrated && userInfo) {
      fetchHeaderBranches();
    }
  }, [userInfo, jwtToken, _hasHydrated]);

  // Debounce API calls for search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedBranch(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const API_URL = window.location.hostname !== "support.zaanvar.com"
          ? "https://dev.zaanvar.com/api/"
          : "https://prod.zaanvar.com/api/";
        
        const res = await axios.get(`${API_URL}scraped-branches/non-duplicates`, {
          params: { search: searchQuery }
        });
        
        const data = res?.data?.data || [];
        setResults(data);
        if (data.length > 0) {
          setSelectedBranch(data[0]);
        } else {
          setSelectedBranch(null);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Set company details from selected branch info
  const handleClaimInitiate = async () => {
    if (!selectedBranch) return;
    localStorage.removeItem("zaanvar_force_claim_new");
    localStorage.removeItem("zaanvar_claim_ticket_id");
    setTicketId(null);
    setTicketReferenceId("ZB21234567890");
    const resolvedName = userInfo?.name || `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || "";
    
    const companyName = selectedBranch.fullName || selectedBranch.branchName || "";
    const phoneNo = selectedBranch.branchPhoneNumber || selectedBranch.mobileNumber || "";
    const email = selectedBranch.branchEmail || selectedBranch.email || "";
    const companyAddress = selectedBranch.branchLocation || "";

    localStorage.setItem("zaanvar_claim_scraped_branch_id", selectedBranch.id);
    setScrapedBranchEmail(email);

    setFormData({
      businessName: companyName,
      businessPhone: phoneNo,
      businessEmail: email,
      userName: resolvedName,
      role: formData.role || "Owner",
      companyAddress: companyAddress
    });

    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const vendorUserId = userInfo?.userId || userInfo?.id || 12;

      const payload = {
        currentStep: "COMPANY_SELECTED",
        current_step: "COMPANY_SELECTED",
        ticket_id: ticketId,
        scraped_branch_id: selectedBranch?.id || 45,
        vendor_user_id: vendorUserId,
        companyName: companyName,
        phoneNo: phoneNo,
        email: email,
        userName: resolvedName,
        role: "Owner",
        companyAddress: companyAddress,
        draftData: {
          companyName: companyName,
          phoneNo: phoneNo,
          email: email,
          userName: resolvedName,
          role: "Owner",
          companyAddress: companyAddress
        },
        draft_data: {
          companyName: companyName,
          phoneNo: phoneNo,
          email: email,
          userName: resolvedName,
          role: "Owner",
          companyAddress: companyAddress
        }
      };

      const res = await axios.post(`${API_URL}scraped-branches/claim/progress`, payload);
      
      if (res?.data?.status === "success" && res?.data?.data) {
        const ticket = res.data.data.ticket || res.data.data;
        setTicketId(ticket.ticket_id || ticket.id || null);
        if (ticket.ticket_reference_id) setTicketReferenceId(ticket.ticket_reference_id);
      }
    } catch (err) {
      console.error("Failed to save COMPANY_SELECTED progress:", err);
    }

    setView("details");
  };

  // POST progress for Step 0: COMPANY_DETAILS
  const handleDetailsNext = async () => {
    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const vendorUserId = userInfo?.userId || userInfo?.id || 12;

      const payload = {
        currentStep: "COMPANY_DETAILS",
        current_step: "COMPANY_DETAILS",
        ticket_id: ticketId,
        scraped_branch_id: selectedBranch?.id || 45,
        vendor_user_id: vendorUserId,
        companyName: formData.businessName,
        phoneNo: formData.businessPhone,
        email: formData.businessEmail,
        userName: formData.userName,
        role: formData.role || "Owner",
        companyAddress: formData.companyAddress,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        }
      };

      const res = await axios.post(`${API_URL}scraped-branches/claim/progress`, payload);
      
      if (res?.data?.status === "success" && res?.data?.data) {
        const ticket = res.data.data.ticket || res.data.data;
        setTicketId(ticket.ticket_id || ticket.id || null);
        if (ticket.ticket_reference_id) setTicketReferenceId(ticket.ticket_reference_id);
      }
    } catch (err) {
      console.error("Failed to save COMPANY_DETAILS progress:", err);
    }

    const mainAddr = formData.companyAddress || "Location not provided";
    const coreSelected = getCoreName(formData.businessName || selectedBranch?.fullName || selectedBranch?.branchName);
    const cleanBrand = coreSelected.split(/\s+/).slice(0, 2).join(" ");

    const matchedBranches = results
      .filter(r => {
        const coreItem = getCoreName(r.fullName || r.branchName);
        return coreItem.startsWith(cleanBrand) || coreItem === coreSelected;
      })
      .map(r => ({
        id: r.id,
        title: "Is this your business ?",
        address: r.branchLocation || "Location not provided"
      }));

    if (matchedBranches.length === 0) {
      matchedBranches.push({ id: selectedBranch?.id || 61, title: "Is this your business ?", address: mainAddr });
    }

    setBranchesList(matchedBranches);
    setSelectedBranchIndex(0);
    setView("branches");
  };

  // POST progress for Step 1: VERIFY_BUSINESS
  const handleBranchesNext = async () => {
    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const vendorUserId = userInfo?.userId || userInfo?.id || 12;
      const mainAddr = branchesList[selectedBranchIndex]?.address || formData.companyAddress;

      const chosenBranchId = branchesList[selectedBranchIndex]?.id || selectedBranch?.id || 32;

      const payload = {
        currentStep: "VERIFY_BUSINESS",
        current_step: "VERIFY_BUSINESS",
        ticket_id: ticketId,
        scraped_branch_id: chosenBranchId,
        vendor_user_id: vendorUserId,
        shopNumber: "Shop #4",
        buildingName: "Green Plaza",
        landmark: "Near Metro Station",
        streetArea: "100 Feet Road",
        city: "Bengaluru",
        pincode: "560038",
        businessAddress: mainAddr,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          shopNumber: "Shop #4",
          buildingName: "Green Plaza",
          landmark: "Near Metro Station",
          streetArea: "100 Feet Road",
          city: "Bengaluru",
          pincode: "560038",
          businessAddress: mainAddr
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          shopNumber: "Shop #4",
          buildingName: "Green Plaza",
          landmark: "Near Metro Station",
          streetArea: "100 Feet Road",
          city: "Bengaluru",
          pincode: "560038",
          businessAddress: mainAddr
        }
      };

      const res = await axios.post(`${API_URL}scraped-branches/claim/progress`, payload);
      if (res?.data?.status === "success" && res?.data?.data) {
        const ticket = res.data.data.ticket || res.data.data;
        setTicketId(ticket.ticket_id || ticket.id || null);
        if (ticket.ticket_reference_id) setTicketReferenceId(ticket.ticket_reference_id);
      }
    } catch (err) {
      console.error("Failed to save VERIFY_BUSINESS progress:", err);
    }

    setView("verify_method");
  };

  // POST progress updates on selecting Method and clicking Next
  const handleVerifyMethodNext = async () => {
    const vendorUserId = userInfo?.userId || userInfo?.id || 12;

    const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");
    const activeScrapedBranchId = selectedBranch?.id || (savedBranchId ? parseInt(savedBranchId) : 45);

    if (methodOption === "later") {
      try {
        const API_URL = window.location.hostname !== "support.zaanvar.com"
          ? "https://dev.zaanvar.com/api/"
          : "https://prod.zaanvar.com/api/";
          
        await axios.post(`${API_URL}scraped-branches/claim/progress`, {
          currentStep: "VERIFY_LATER",
          current_step: "VERIFY_LATER",
          ticket_id: ticketId,
          scraped_branch_id: activeScrapedBranchId,
          vendor_user_id: vendorUserId,
          draftData: {
            companyName: formData.businessName,
            phoneNo: formData.businessPhone,
            email: formData.businessEmail,
            userName: formData.userName,
            role: formData.role || "Owner",
            companyAddress: formData.companyAddress
          },
          draft_data: {
            companyName: formData.businessName,
            phoneNo: formData.businessPhone,
            email: formData.businessEmail,
            userName: formData.userName,
            role: formData.role || "Owner",
            companyAddress: formData.companyAddress
          }
        });
      } catch (err) {
        console.error("Failed to save VERIFY_LATER progress:", err);
      }

      setView("verify_later");
      return;
    }

    // Otherwise, POST progress step details and show the instructions popup modal!
    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      // 1. Post VERIFICATION_METHOD
      await axios.post(`${API_URL}scraped-branches/claim/progress`, {
        currentStep: "VERIFICATION_METHOD",
        current_step: "VERIFICATION_METHOD",
        ticket_id: ticketId,
        scraped_branch_id: activeScrapedBranchId,
        vendor_user_id: vendorUserId,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        }
      });

      // 2. Post VERIFICATION_OPTIONS
      await axios.post(`${API_URL}scraped-branches/claim/progress`, {
        currentStep: "VERIFICATION_OPTIONS",
        current_step: "VERIFICATION_OPTIONS",
        ticket_id: ticketId,
        scraped_branch_id: activeScrapedBranchId,
        vendor_user_id: vendorUserId,
        verificationOption: "VIDEO",
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          verificationOption: "VIDEO"
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          verificationOption: "VIDEO"
        }
      });

      // 3. Post VERIFICATION_INSTRUCTIONS
      await axios.post(`${API_URL}scraped-branches/claim/progress`, {
        currentStep: "VERIFICATION_INSTRUCTIONS",
        current_step: "VERIFICATION_INSTRUCTIONS",
        ticket_id: ticketId,
        scraped_branch_id: activeScrapedBranchId,
        vendor_user_id: vendorUserId,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          verificationOption: "VIDEO"
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress,
          verificationOption: "VIDEO"
        }
      });
    } catch (err) {
      console.error("Failed to post verification method/options progress:", err);
    }

    // Toggle Instruction Modal popup!
    setIsModalOpen(true);
  };

  const handleDetailsBack = () => {
    setView("search");
  };

  const handleBranchesBack = () => {
    setView("details");
  };

  const handleVerifyMethodBack = () => {
    setView("branches");
  };

  const handleVerifyLaterBack = () => {
    setView("verify_method");
  };

  const handleFinalSubmit = () => {
    toast.success("Onboarding claim submitted successfully!");
  };

  const handleInitiateOtpClaim = async () => {
    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const vendorUserId = userInfo?.userId || userInfo?.id || 12;

      const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");
      const activeScrapedBranchId = selectedBranch?.id || (savedBranchId ? parseInt(savedBranchId) : 45);

      const payload = {
        currentStep: "BUSINESS_VERIFICATION_OTP",
        current_step: "BUSINESS_VERIFICATION_OTP",
        ticket_id: ticketId,
        scraped_branch_id: activeScrapedBranchId,
        vendor_user_id: vendorUserId,
        companyName: formData.businessName,
        phoneNo: formData.businessPhone,
        email: formData.businessEmail,
        userName: formData.userName,
        role: formData.role || "Owner",
        companyAddress: formData.companyAddress,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        }
      };

      const res = await axios.post(`${API_URL}scraped-branches/claim/progress`, payload);
      if (res?.data?.status === "success" && res?.data?.data) {
        const ticket = res.data.data.ticket || res.data.data;
        setTicketId(ticket.ticket_id || ticket.id || null);
        const claimBranchId = ticket.branchId || ticket.branch_id || res.data.data.branchId || res.data.data.branch_id;
        if (claimBranchId) {
          setBackendBranchId(claimBranchId);
        }
      }
    } catch (err) {
      console.error("Failed to save BUSINESS_VERIFICATION_OTP progress:", err);
    }
    setShowOtpView(true);
  };

  const handleCancelOtpClaim = async () => {
    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");

      const payload = {
        currentStep: "SUBMITTED",
        current_step: "SUBMITTED",
        ticket_id: ticketId,
        scraped_branch_id: savedBranchId ? parseInt(savedBranchId) : null,
        vendor_user_id: userInfo?.userId || userInfo?.id,
        companyName: formData.businessName,
        phoneNo: formData.businessPhone,
        email: formData.businessEmail,
        userName: formData.userName,
        role: formData.role || "Owner",
        companyAddress: formData.companyAddress,
        draftData: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        },
        draft_data: {
          companyName: formData.businessName,
          phoneNo: formData.businessPhone,
          email: formData.businessEmail,
          userName: formData.userName,
          role: formData.role || "Owner",
          companyAddress: formData.companyAddress
        }
      };

      await axios.post(`${API_URL}scraped-branches/claim/progress`, payload);
    } catch (err) {
      console.error("Failed to reset progress to SUBMITTED:", err);
    }
    setShowOtpView(false);
  };

  const handleVerifyOtp = async () => {
    const otpString = otpValues.join("").trim();
    if (otpString.length < 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }

    try {
      const API_URL = window.location.hostname !== "support.zaanvar.com"
        ? "https://dev.zaanvar.com/api/"
        : "https://prod.zaanvar.com/api/";

      const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");
      const branchIdNum = selectedBranch?.id || (savedBranchId ? parseInt(savedBranchId) : 25);

      const isSecondClaim = headerBranches.length > 0;
      
      let res;
      if (isSecondClaim) {
        const payload = {
          scrapedBranchId: branchIdNum,
          otp: otpString,
          email: formData.businessEmail || scrapedBranchEmail || selectedBranch?.branchEmail || selectedBranch?.email || ""
        };
        res = await axios.post(`${API_URL}scraped-branches/claim/verify`, payload);
      } else {
        const payload = {
          type: "branch",
          id: backendBranchId ? parseInt(backendBranchId) : branchIdNum,
          channel: "",
          otp: otpString
        };
        res = await axios.post(`${API_URL}verification/verify-single-otp`, payload);
      }
      
      if (res?.data?.status === "success" || res?.data?.message?.toLowerCase().includes("verified") || res) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error("Failed to verify OTP code:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to verify OTP.";
      toast.error(errMsg);
    }
  };

  const fetchBranchDetailsAndReviews = async (forcedBranchId = null) => {
    if (!jwtToken) return;
    setReviewsLoading(true);
    try {
      const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");
      const bId = forcedBranchId || backendBranchId || selectedBranch?.id || (savedBranchId ? parseInt(savedBranchId) : 25);

      const webApi = new WebApimanager(jwtToken);
      const res = await webApi.get(`companies/vendor/details?branchId=${bId}`);
      
      const data = res?.data || res;
      console.log("companies/vendor/details response data:", data);

      const details = data?.branch || data?.company || data?.data || data || {};
      
      setFormData((prev) => ({
        ...prev,
        businessName: details.companyName || details.branchName || details.name || prev.businessName,
        businessPhone: details.phoneNo || details.phone || prev.businessPhone,
        businessEmail: details.email || prev.businessEmail,
        companyAddress: details.companyAddress || details.branchLocation || details.address || prev.companyAddress
      }));

      const front = details.shopFrontPhoto || details.shop_front_photo;
      if (front) setShopFrontPhoto(front);

      const selfie = details.selfiePhoto || details.selfie_photo;
      if (selfie) setSelfiePhoto(selfie);

      const defaultPlaceholders = [
        "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929626969-d10fb7ad-1623-4651-b8fb-30bcf3eebb614425956424229639542.jpg",
        "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929627134-66075c4f-46dc-4b0f-822a-ffaf79a9d23a4181905482332662380.jpg",
        "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929627134-66075c4f-46dc-4b0f-822a-ffaf79a9d23a4181905482332662380.jpg"
      ];

      const rawImages = details.images || details.branchImages || data.images || data.data?.images || [];
      const imagesArr = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [];
      
      const finalImages = [
        imagesArr[0] || details.shopFrontPhoto || details.shop_front_photo || defaultPlaceholders[0],
        imagesArr[1] || details.selfiePhoto || details.selfie_photo || defaultPlaceholders[1],
        imagesArr[2] || details.selfiePhoto || details.selfie_photo || defaultPlaceholders[2]
      ];
      setBranchImagesList(finalImages);

      const list = details.reviews || data.reviews || data.data?.reviews || [];
      setReviewsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch branch details and reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  /* ── Reviews Actions ── */
  const toggleExpand = (reviewId) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const handleStartReply = (review) => {
    setReplyingReviewId(review.reviewId);
    setReplyCommentText("");
    setIsEditing(false);
    setActiveReplyId(null);
  };

  const handleStartEdit = (review) => {
    setReplyingReviewId(review.reviewId);
    setReplyCommentText(review.replyComment || "");
    setIsEditing(true);
    setActiveReplyId(review.replyId || null);
  };

  const handleCancelReply = () => {
    setReplyingReviewId(null);
    setReplyCommentText("");
    setIsEditing(false);
    setActiveReplyId(null);
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyCommentText.trim()) {
      swal("Warning", "Please write a reply comment before submitting.", "warning");
      return;
    }

    setSubmittingId(reviewId);
    const webApi = new WebApimanager(jwtToken);

    try {
      const payload = {
        replyComment: replyCommentText.trim()
      };

      if (isEditing && activeReplyId) {
        payload.replyId = activeReplyId;
      }

      const res = await webApi.put(`vendor-reviews/${reviewId}/reply`, payload);

      if (res?.status === "success" || res?.data?.status === "success" || res) {
        swal("Success", isEditing ? "Reply updated successfully!" : "Reply submitted successfully!", "success");
        handleCancelReply();
        await fetchBranchDetailsAndReviews();
      } else {
        throw new Error("API reported failure");
      }
    } catch (err) {
      console.error("Failed to submit reply:", err);
      swal("Error", "Failed to submit reply. Please try again.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteReply = async (review) => {
    const confirmDelete = await swal({
      title: "Are you sure?",
      text: "Do you want to delete this reply? This action cannot be undone.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    });

    if (!confirmDelete) return;

    setSubmittingId(review.reviewId);
    const webApi = new WebApimanager(jwtToken);

    try {
      const payload = {
        replyId: review.replyId || `rep_${review.reviewId}`,
        action: "delete"
      };

      const res = await webApi.put(`vendor-reviews/${review.reviewId}/reply`, payload);

      if (res?.status === "success" || res?.data?.status === "success" || res) {
        swal("Deleted", "Reply deleted successfully!", "success");
        await fetchBranchDetailsAndReviews();
      } else {
        throw new Error("API reported failure");
      }
    } catch (err) {
      console.error("Failed to delete reply:", err);
      swal("Error", "Failed to delete reply. Please try again.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleInstallAppClick = () => {
    const isMac = /Mac|Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent || navigator.platform || "");
    const url = isMac 
      ? "https://apps.apple.com/in/app/zaanvar-business/id6754638999"
      : "https://play.google.com/store/apps/details?id=com.zaanvar.vender";
    window.open(url, "_blank");
  };

  return (
    <>
      <Head>
        <title>Claim Your Business - Zaanvar</title>
      </Head>

      <DashboardLayout
        customTopbarLeft={
          view === "home" ? (
            headerBranches.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif' }}>
                <select
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#1f2937',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  value={backendBranchId || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setBackendBranchId(val);
                    fetchBranchDetailsAndReviews(val);
                  }}
                >
                  {headerBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null
          ) : (
            view === "search" ? <SearchBar query={searchQuery} setQuery={setSearchQuery} /> : null
          )
        }
      >
        <div className={styles.container}>
          {loadingProgress ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : view === "home" ? (
            <div style={{ paddingBottom: '40px' }}>
              <div className={styles.homeHeaderRow}>
                <div className={styles.homeHeaderLeft}>
                  <div className={styles.strengthCircle}>100%</div>
                  <div className={styles.strengthTextWrap}>
                    <h3>Profile strength</h3>
                    <p>Looks Good</p>
                  </div>
                </div>
                <div className={styles.homeHeaderActions}>
                  <button 
                    type="button" 
                    className={styles.actionBtn}
                    onClick={() => toast.success("Ask for Reviews request sent!")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Ask for Reviews
                  </button>
                  <button 
                    type="button" 
                    className={styles.actionBtn}
                    onClick={() => toast.info("Opening Timings Editor...")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Edit Timings
                  </button>
                  <button 
                    type="button" 
                    className={styles.actionBtn}
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      color: '#ffffff'
                    }}
                    onClick={async () => {
                      const confirmClaim = await swal({
                        title: "Claim Another Business?",
                        text: "You will be navigated back to start the claim wizard process for your new location.",
                        icon: "info",
                        buttons: ["Cancel", "Yes, Proceed"],
                      });
                      if (confirmClaim) {
                        localStorage.setItem("zaanvar_force_claim_new", "true");
                        setBackendBranchId(null);
                        setSelectedBranch(null);
                        setView("search");
                        router.push("/onboarding?newClaim=true");
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Claim another business
                  </button>
                </div>
              </div>

              <div className={styles.homeMainSplit}>
                <div className={styles.homePhotosCard}>
                  <h3 className={styles.previewSectionTitle} style={{ fontSize: '15px', margin: '0 0 12px 0', fontWeight: '700', color: '#1f2937' }}>Photos</h3>
                  <div style={{ display: 'flex', gap: '12px', width: '100%', position: 'relative' }}>
                    {/* Left main image (large) */}
                    <div style={{ position: 'relative', flex: '1.2', height: '220px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                      <img 
                        src={branchImagesList[0] || shopFrontPhoto || "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929626969-d10fb7ad-1623-4651-b8fb-30bcf3eebb614425956424229639542.jpg"} 
                        alt="Branch Photo 1" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Floating Add Photos Button on bottom-left */}
                      <button 
                        type="button" 
                        style={{ 
                          position: 'absolute', 
                          bottom: '12px', 
                          left: '12px', 
                          background: 'rgba(0, 0, 0, 0.65)', 
                          border: 'none', 
                          color: '#ffffff', 
                          padding: '8px 16px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: '600', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif'
                        }}
                        onClick={() => toast.info("Opening Photo upload selector...")}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        Add Photos
                      </button>
                    </div>

                    {/* Right column (two stacked smaller images) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1', height: '220px' }}>
                      <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden' }}>
                        <img 
                          src={branchImagesList[1] || selfiePhoto || "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929627134-66075c4f-46dc-4b0f-822a-ffaf79a9d23a4181905482332662380.jpg"} 
                          alt="Branch Photo 2" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden' }}>
                        <img 
                          src={branchImagesList[2] || selfiePhoto || "https://zaanvar.s3.ap-south-1.amazonaws.com/uploads/221/scraped-branch-claims/1785929627134-66075c4f-46dc-4b0f-822a-ffaf79a9d23a4181905482332662380.jpg"} 
                          alt="Branch Photo 3" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.homeDetailsCard}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Address</span>
                    <span className={styles.detailVal}>{formData.companyAddress || "Flat-106, Pragathi Enclave, Bhagya Nagar Colony, Hyderabad"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone</span>
                    <span className={styles.detailVal}>{formData.businessPhone || "+91 9347992753"}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Hours</span>
                    <span className={styles.detailVal}>
                      <div className={styles.detailValHours}>
                        Open <span style={{ color: '#4b5563', fontWeight: 500 }}>. Closes 6:30 pm ▼</span>
                      </div>
                    </span>
                  </div>
                  
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); toast.info("Opening Edit Business Information popup..."); }}
                    className={styles.editInfoLink}
                  >
                    Edit your business information
                  </a>
                </div>
              </div>

              <div className={styles.homeReviewsSection}>
                <div className={styles.reviewsHeaderWrap}>
                  <h2 className={styles.reviewsMainTitle}>Reviews</h2>
                  <p className={styles.reviewsSub}>Read trusted reviews from your customers.</p>
                </div>

                <div className={reviewsStyles.reviewsMainCard} style={{ paddingTop: 0 }}>
                  {reviewsLoading && reviewsList.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
                      Loading reviews…
                    </p>
                  )}

                  {!reviewsLoading && reviewsList.length === 0 && (
                    <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "32px 0" }}>
                      No reviews found for this branch.
                    </p>
                  )}

                  {reviewsList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((rev, i) => {
                    const name = rev.vendorCustomerName || 
                                 (rev.vendorCustomer ? `${rev.vendorCustomer.firstName || ""} ${rev.vendorCustomer.lastName || ""}`.trim() : null) ||
                                 (rev.user ? (rev.user.name || `${rev.user.firstName || ""} ${rev.user.lastName || ""}`.trim()) : null) ||
                                 rev.userName || 
                                 rev.reviewerName || 
                                 "Customer";
                    const rating = parseFloat(rev.rating || 0);
                    const comment = rev.reviewComment || "";
                    const dateStr = rev.created_at ? getRelativeTime(rev.created_at) : "";
                    
                    const repliesList = (rev.replies && rev.replies.length > 0)
                      ? rev.replies
                      : (rev.replyComment ? [{
                          replyId: rev.replyId,
                          replyComment: rev.replyComment,
                          replyDate: rev.replyDate,
                          replyDateTimeZone: rev.replyDateTimeZone,
                          repliedBy: rev.repliedBy || "Owner"
                        }] : []);

                    const hasReply = repliesList.length > 0;
                    const isReplyingThis = replyingReviewId === rev.reviewId;
                    const hasReplyOrEditor = hasReply || isReplyingThis;
                    
                    const isExpanded = !!expandedReviews[rev.reviewId];
                    const repliesToShow = isExpanded ? repliesList : repliesList.slice(0, 1);

                    return (
                      <div key={rev.reviewId || i} className={reviewsStyles.reviewCard} style={{ margin: '16px 0', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Branch Title & Address Header above individual reviews */}
                        <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                              {formData.businessName || "MRCHAMS"}
                            </span>
                            {/* Blue Pop-out Link Icon */}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" style={{ cursor: 'pointer' }}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500', marginTop: '4px' }}>
                            {formData.companyAddress || "FLAT-106, PRAGATHI ENCLAVE, BHAGYA NAGAR COLONY, KPHB, HYDERABAD, TELANGANA 500072"}
                          </span>
                        </div>

                        {/* Customer Review Info Row */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {/* Customer Image Avatar */}
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {rev.reviewerPhotoUrl || rev.vendorCustomer?.profilePic ? (
                              <img 
                                src={rev.reviewerPhotoUrl || rev.vendorCustomer?.profilePic} 
                                alt="" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', color: '#ffffff', fontWeight: '600', fontSize: '15px' }}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Review Text Area */}
                          <div style={{ flex: 1 }}>
                            <div className={reviewsStyles.reviewCardTop} style={{ padding: 0, marginBottom: '6px' }}>
                              <div>
                                <h4 className={reviewsStyles.reviewCardName} style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>{name}</h4>
                                <div className={reviewsStyles.reviewCardMeta} style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className={reviewsStyles.reviewCardStars}>
                                    {[...Array(5)].map((_, starIdx) => {
                                      const fill = (rating >= starIdx + 1) ? 1 : (rating >= starIdx + 0.5 ? 0.5 : 0);
                                      return (
                                        <svg key={starIdx} width="11" height="11" viewBox="0 0 24 24" fill={fill === 1 ? "#fbbf24" : "none"} stroke="#fbbf24" strokeWidth="2">
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                      );
                                    })}
                                  </div>
                                  <span className={reviewsStyles.reviewCardDate} style={{ fontSize: '11px', color: '#9ca3af' }}>{dateStr}</span>
                                </div>
                              </div>
                              <div style={{ cursor: "pointer", color: "#64748b" }}>•••</div>
                            </div>

                            <p className={reviewsStyles.reviewCardComment} style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: '#4b5563', lineHeight: '1.5' }}>{comment}</p>

                            {/* Reply Action Button */}
                            {!hasReplyOrEditor && (
                              <button
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  padding: "8px 16px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  color: "#2563eb",
                                  cursor: "pointer",
                                  width: "fit-content",
                                  marginTop: "12px"
                                }}
                                onClick={() => handleStartReply(rev)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9 17 4 12 9 7" />
                                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                                <span>Reply</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Owner Replies List */}
                        {repliesToShow.map((rep, rIdx) => (
                          <div key={rep.replyId || rIdx} style={{ display: 'flex', gap: '12px', paddingLeft: '52px', alignItems: 'flex-start' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className={reviewsStyles.reviewCardTop} style={{ padding: 0 }}>
                                <div>
                                  <h4 className={reviewsStyles.reviewCardName} style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>
                                    {rep.repliedBy || "Owner Reply"}
                                  </h4>
                                  <span className={reviewsStyles.reviewCardDate} style={{ fontSize: '11px', color: '#9ca3af' }}>
                                    {rep.replyDate ? getRelativeTime(rep.replyDate) : ""}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "12px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(rev)}
                                    style={{ background: "none", border: "none", color: "#2563eb", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteReply(rev)}
                                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", fontWeight: "600", cursor: "pointer", padding: 0 }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <p className={reviewsStyles.reviewCardComment} style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#4b5563', lineHeight: '1.5' }}>{rep.replyComment}</p>
                            </div>
                          </div>
                        ))}

                        {repliesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(rev.reviewId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: 0,
                              marginLeft: '52px',
                              marginTop: '2px',
                              textAlign: 'left',
                              width: 'fit-content'
                            }}
                          >
                            {isExpanded ? "Show Less Replies" : `Show More Replies (${repliesList.length - 1})`}
                          </button>
                        )}

                        {/* Reply Form Editor */}
                        {isReplyingThis && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '52px', fontFamily: 'Inter, sans-serif' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4b5563' }}>
                                (OWNER)
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Your Replay</span>
                              <textarea
                                style={{
                                  width: '100%',
                                  minHeight: '40px',
                                  border: 'none',
                                  borderBottom: '1px solid #cbd5e1',
                                  padding: '8px 0',
                                  fontSize: '13.5px',
                                  color: '#1f2937',
                                  outline: 'none',
                                  background: 'transparent',
                                  resize: 'vertical'
                                }}
                                value={replyCommentText}
                                onChange={(e) => setReplyCommentText(e.target.value)}
                                placeholder="Write a public reply..."
                              />
                            </div>

                            <p style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.45', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                              PLEASE NOTE THAT YOUR REPLY WILL BE DISPLAYED <strong style={{ color: '#4b5563' }}>PUBLICLY</strong> ON GOOGLE AND MUST COMPLY WITH GOOGLE&apos;S LOCAL CONTENT POLICIES. <a href="#" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }} onClick={(e) => e.preventDefault()}>TERMS OF SERVICE</a>
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                              <button
                                type="button"
                                style={{
                                  background: '#eff6ff',
                                  border: '1px solid #3b82f6',
                                  padding: '8px 20px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#2563eb',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleSubmitReply(rev.reviewId)}
                                disabled={submittingId === rev.reviewId}
                              >
                                {submittingId === rev.reviewId ? "Posting..." : "Post Reply"}
                              </button>
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                                onClick={handleCancelReply}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {reviewsList.length > rowsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Rows per Page: 
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                        style={{ marginLeft: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px', fontSize: '12px' }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, reviewsList.length)} of {reviewsList.length}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(c => c - 1)}
                        style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#1f2937' }}
                      >
                        ◀
                      </button>
                      <button 
                        type="button" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(c => c + 1)}
                        style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', padding: '4px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#1f2937' }}
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header titles container with 3-dot options menu aligned to top right */}
              <div className={styles.titleContainer}>
                <div>
                  <h1 className={styles.title}>
                    {view === "search"
                      ? searchQuery.trim() ? "Search Result" : "Claim Your Business"
                      : view === "details"
                      ? "Company Details"
                      : view === "submitted"
                      ? "Uploaded Previews"
                      : "Verify"}
                  </h1>
                  {view !== "submitted" && (
                    <p className={styles.subtitle} style={{ margin: 0 }}>
                      {view === "search"
                        ? searchQuery.trim()
                          ? "We have already listed many businesses. Search for your shop, select the matching result, and claim it to take ownership."
                          : "Search for your business on zaanvar and claim it to manage your profile"
                        : "Tell us about your business"}
                    </p>
                  )}
                </div>

                {/* Vertical Three-dot Menu Option Button inside Verify Later or Submitted Screen */}
                {(view === "verify_later" || view === "submitted") && (
                  <div className={styles.threeDotContainer} ref={dropdownRef}>
                    <button
                      type="button"
                  className={styles.threeDotBtn}
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  aria-label="Options"
                >
                  ⋮
                </button>
                {isDropdownOpen && (
                  <div className={styles.threeDotDropdown}>
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        toast.info("Help center instructions loaded.");
                      }}
                    >
                      • Help
                    </button>
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        toast.info("Connecting to live support chat...");
                      }}
                    >
                      • Support
                    </button>
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        toast.success("Verify with code initiated. Verification code sent.");
                      }}
                    >
                      • Verify your business with code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: "24px" }} />

          {/* STEP 1: SEARCH VIEW */}
          {view === "search" && (
            <div className={styles.splitLayout}>
              {/* Left Column */}
              <div className={styles.leftCol}>
                {!searchQuery.trim() ? (
                  <div className={styles.emptyCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://zaanvarprods3.b-cdn.net/media/1786016316488-illustration-set-pet-shop.png"
                      alt="Search illustration"
                      className={styles.emptyIllustration}
                    />
                    <h2 className={styles.emptyTitle}>Search for your business name</h2>
                    <p className={styles.emptyDesc}>
                      Enter your business name to find it on Zaanvar
                    </p>
                  </div>
                ) : loading ? (
                  <div className={styles.resultsList}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`${styles.resultCard} ${styles.shimmer}`} />
                    ))}
                  </div>
                ) : results.length === 0 ? (
                  <div className={styles.emptyCard} style={{ minHeight: "360px" }}>
                    <h2 className={styles.emptyTitle}>No businesses found</h2>
                    <p className={styles.emptyDesc}>
                      We couldn&apos;t find any listed business matching &quot;{searchQuery}&quot;.
                    </p>
                    <div className={styles.addNewRow} style={{ marginTop: "24px" }}>
                      <span className={styles.addNewText}>STILL CAN&apos;T FIND YOUR BUSINESS ?</span>
                      <button
                        type="button"
                        className={styles.addNewBtn}
                        onClick={() => router.push("/register")}
                      >
                        ADD NEW BUSINESS
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.resultsList}>
                      {results.map((item) => {
                        const name = item.fullName || item.branchName || "Unnamed Business";
                        const isSelected = selectedBranch?.id === item.id;
                        const features = item.featureType || [];
                        const presentType = item.presentDataStoreType || "Independent";

                        return (
                          <div
                            key={item.id}
                            className={`${styles.resultCard} ${isSelected ? styles.resultCardSelected : ""}`}
                            onClick={() => setSelectedBranch(item)}
                          >
                            <div className={styles.storeAvatar}>
                              {name.charAt(0).toUpperCase()}
                            </div>

                            <div className={styles.cardInfo}>
                              <div className={styles.cardHeaderRow}>
                                <h3 className={styles.storeName}>{name}</h3>
                                <span
                                  className={`${styles.storeBadge} ${
                                    presentType.toLowerCase().includes("enterprise") || item.status === "claim_pending"
                                      ? styles.badgeEnterprise
                                      : styles.badgeIndependent
                                  }`}
                                >
                                  {presentType.toLowerCase().includes("manual") ? "Independent" : presentType}
                                </span>
                              </div>

                              <div className={styles.ratingRow}>
                                <StarIcon />
                                <span>4.8 (251) •</span>
                                <span className={styles.cardDetails}>
                                  {features.slice(0, 2).join(", ") || "Pet Business"}
                                </span>
                              </div>

                              <div className={styles.cardLocation}>
                                {item.branchLocation || "Location not provided"}
                              </div>
                            </div>

                            <div className={`${styles.radioBtn} ${isSelected ? styles.radioBtnChecked : ""}`}>
                              {isSelected && <div className={styles.radioInner} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.addNewRow}>
                      <span className={styles.addNewText}>STILL CAN&apos;T FIND YOUR BUSINESS ?</span>
                      <button
                        type="button"
                        className={styles.addNewBtn}
                        onClick={() => router.push("/register")}
                      >
                        ADD NEW BUSINESS
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column */}
              <div className={styles.rightCol} style={{ width: "480px" }}>
                {selectedBranch ? (
                  <div className={styles.previewPanel} style={{ width: "480px" }}>
                    <h3 className={styles.previewTitle}>Business Preview</h3>

                    <div className={styles.previewImgBox}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          selectedBranch.photos?.[0]?.startsWith("See website:")
                            ? "https://zaanvarprods3.b-cdn.net/media/1773904947760-petshops.jpeg"
                            : selectedBranch.photos?.[0] || "https://zaanvarprods3.b-cdn.net/media/1773904947760-petshops.jpeg"
                        }
                        alt="Business Preview"
                      />
                    </div>

                    <div className={styles.previewInfo}>
                      <h2 className={styles.previewName}>
                        {selectedBranch.fullName || selectedBranch.branchName || "Unnamed Business"}
                      </h2>
                      <span className={styles.previewSub}>
                        {selectedBranch.featureType?.[0] || selectedBranch.presentDataStoreType || "Pet Store"}
                      </span>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.previewMetaRow}>
                      <span className={styles.previewMetaIcon}><LocationIcon /></span>
                      <span>{selectedBranch.branchLocation || "Address not provided"}</span>
                    </div>

                    <div className={styles.previewMetaRow}>
                      <span className={styles.previewMetaIcon}><PhoneIcon /></span>
                      <span>{selectedBranch.branchPhoneNumber || selectedBranch.mobileNumber || "Phone not provided"}</span>
                    </div>

                    <div className={styles.divider} />

                    <div>
                      <h4 className={styles.previewCategoryHeader}>Business Category</h4>
                      <div className={styles.previewCategoryTag}>
                        <CategoryIcon />
                        <span>{selectedBranch.featureType?.join(", ") || "Pet Store"}</span>
                      </div>
                    </div>

                    <div className={styles.previewActions}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => setSelectedBranch(null)}
                      >
                        This is not my business
                      </button>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={handleClaimInitiate}
                      >
                        Claim This Business
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.sidebarCard}>
                      <h3 className={styles.sidebarTitle}>Why claim your business ?</h3>
                      <ul className={styles.whyList}>
                        {[
                          "Mange your business information",
                          "update photos, hours, and more",
                          "Respond to reviews",
                          "Get insights about your customers",
                          "Build trust and grow your business"
                        ].map((item, idx) => (
                          <li key={idx} className={styles.whyItem}>
                            <span className={styles.whyBullet}>🐾</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.sidebarCard}>
                      <h3 className={styles.sidebarTitle}>Need Help ?</h3>
                      <p className={styles.helpText}>
                        Contact our support team we&apos;re here to help you.
                      </p>
                      <button
                        type="button"
                        className={styles.supportBtn}
                        onClick={() => router.push("/contact-us")}
                      >
                        Contact Support
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: COMPANY DETAILS FORM VIEW */}
          {view === "details" && (
            <div className={styles.splitLayout}>
              {/* Form card left */}
              <div className={styles.leftCol}>
                <div className={styles.formCard}>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Company Name</label>
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Company Phone Number</label>
                      <input
                        type="text"
                        placeholder="Company Phone Number"
                        value={formData.businessPhone}
                        onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Company Email</label>
                      <input
                        type="email"
                        placeholder="Company Email"
                        value={formData.businessEmail}
                        onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>User Name</label>
                      <input
                        type="text"
                        placeholder="Enter Here"
                        value={formData.userName}
                        onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Role</label>
                      <input
                        type="text"
                        placeholder="Enter here"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Company Address</label>
                      <input
                        type="text"
                        placeholder="Enter here..."
                        value={formData.companyAddress}
                        onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.previewActions} style={{ maxWidth: "320px", marginLeft: "auto", marginRight: 0 }}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleDetailsBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleDetailsNext}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips panel right */}
              <div className={styles.rightCol} style={{ width: "480px" }}>
                <div className={styles.tipsCard}>
                  <h3 className={styles.sidebarTitle}>Tips</h3>
                  <ul className={styles.tipsList}>
                    {[
                      "Use your real business name",
                      "Choose the most relevant category",
                      "Add as much detail as possible",
                      "You can edit details later"
                    ].map((item, idx) => (
                      <li key={idx} className={styles.tipsItem}>
                        <span className={styles.tipsBullet}>🐾</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://zaanvarprods3.b-cdn.net/media/1786077374486-cyber-data-security-online-concept-illustration-internet-security-information-privacy-protection%201.png"
                    alt="Tips illustration"
                    className={styles.tipsIllustration}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BRANCH SELECTION VIEW */}
          {view === "branches" && (
            <div>
              {/* Progress bar */}
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar} style={{ width: "40%" }} />
              </div>

              {/* Main Card */}
              <div className={styles.verifyCard}>
                <h2 className={styles.verifyTitle}>Is this your business ?</h2>
                <p className={styles.verifySub}>
                  It looks like your business might already have a business profile on zaanvar business platform. If you see your business below, select it, and we&apos;ll help improve your business profile.
                </p>

                {/* Branches List */}
                <div className={styles.branchList}>
                  {branchesList.map((branch, idx) => {
                    const isSelected = selectedBranchIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`${styles.branchRow} ${isSelected ? styles.branchRowSelected : ""}`}
                        onClick={() => setSelectedBranchIndex(idx)}
                      >
                        <div className={`${styles.radioBtn} ${isSelected ? styles.radioBtnChecked : ""}`}>
                          {isSelected && <div className={styles.radioInner} />}
                        </div>
                        <div className={styles.branchRowContent}>
                          <h4 className={styles.branchRowTitle}>{branch.title}</h4>
                          <p className={styles.branchRowDesc}>{branch.address}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.previewActions} style={{ maxWidth: "320px", marginLeft: "auto", marginRight: 0 }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleBranchesBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleBranchesNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT VERIFICATION METHOD VIEW */}
          {view === "verify_method" && (
            <div>
              {/* Progress bar */}
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar} style={{ width: "65%" }} />
              </div>

              {/* Main Verification Card */}
              <div className={styles.verifyMethodCard}>
                <h2 className={styles.verifyMethodTitle}>Select a way to get verified</h2>
                <p className={styles.verifyMethodSub}>
                  Zaanvar needs to verify that you manage this business.
                </p>
                <a
                  href="#"
                  className={styles.learnMoreLink}
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Opening verification guide...");
                  }}
                >
                  Learn more about verification.
                </a>

                {/* Options Box */}
                <div className={styles.optionsBox}>
                  {/* Option 1: Submit Video */}
                  <div
                    className={`${styles.optionRow} ${methodOption === "video" ? styles.optionRowSelected : ""}`}
                    onClick={() => setMethodOption("video")}
                  >
                    <div className={styles.optionMain}>
                      <div className={`${styles.radioBtn} ${methodOption === "video" ? styles.radioBtnChecked : ""}`}>
                        {methodOption === "video" && <div className={styles.radioInner} />}
                      </div>
                      <span className={styles.optionText}>Submit a business video</span>
                    </div>

                    <div className={styles.optionDetails}>
                      <div className={`${styles.optionIconBox} ${methodOption === "video" ? styles.optionIconActive : ""}`}>
                        <IconVideo />
                      </div>
                      <div className={styles.optionContentText}>
                        <h4 className={styles.optionInnerTitle}>Record a video of your business</h4>
                        <p className={styles.optionDesc}>
                          Show your location, equipment and proof of management. Your video is only used for verification and won&apos;t be shown publicly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Verify Later */}
                  <div
                    className={`${styles.optionRow} ${methodOption === "later" ? styles.optionRowSelected : ""}`}
                    onClick={() => setMethodOption("later")}
                  >
                    <div className={styles.optionMain}>
                      <div className={`${styles.radioBtn} ${methodOption === "later" ? styles.radioBtnChecked : ""}`}>
                        {methodOption === "later" && <div className={styles.radioInner} />}
                      </div>
                      <span className={styles.optionText}>Verify Later</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className={styles.previewActions} style={{ maxWidth: "320px", marginLeft: "auto", marginRight: 0 }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleVerifyMethodBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleVerifyMethodNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: VERIFY LATER WARNING STATE SCREEN */}
          {view === "verify_later" && (
            <div>
              {/* Progress bar */}
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar} style={{ width: "80%" }} />
              </div>

              {/* Main Card */}
              <div className={styles.verifyMethodCard}>
                <div className={styles.verifyLaterContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://zaanvarprods3.b-cdn.net/media/1786077091689-Group%201000017111.png"
                    alt="Business is not verified warning"
                    className={styles.verifyLaterImg}
                  />
                  <p className={styles.verifyLaterText}>
                    Your business is not verified yet. Upload a clear shop front-view video to verify your business and activate your account.
                  </p>
                </div>

                {/* Footer Actions */}
                <div className={styles.previewActions} style={{ maxWidth: "320px", marginLeft: "auto", marginRight: 0 }}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleVerifyLaterBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => setView("verify_method")}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* STEP 6: UPLOADED PREVIEWS (SUBMITTED) VIEW SCREEN */}
          {view === "submitted" && (
            <div className={styles.splitLayout}>
              {/* Left Column - Previews */}
              <div className={styles.leftCol}>
                <div className={styles.formCard} style={{ padding: '16px' }}>
                  {/* Shop Front video */}
                  <h3 className={styles.previewSectionTitle}>Preview of shop front view video</h3>
                  <p className={styles.previewSectionSub}>
                    Sharing a recent photo of your business exterior helps customers identify you in the real world <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Guide loaded."); }} className={styles.learnMoreLinkInline}>Learn More.</a>
                  </p>
                  
                  <div className={styles.videoWrapper}>
                    {videoUpload ? (
                      <>
                        <video 
                          key={hevcSupported && !videoError ? videoUpload : "fallback-h264"} 
                          src={hevcSupported && !videoError ? videoUpload : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} 
                          controls 
                          className={styles.videoPlayer} 
                          playsInline
                          onError={() => setVideoError(true)}
                        >
                          Your browser does not support the video tag.
                        </video>
                        {(!hevcSupported || videoError) && (
                          <div className={styles.hevcWarningOverlay}>
                            <h4 className={styles.hevcWarningTitle}>⚠️ H.265/HEVC Fallback</h4>
                            <p className={styles.hevcWarningText}>
                              Your browser doesn&apos;t natively support H.265 playback. Playing a sample video in the UI (or download your original video file below).
                            </p>
                            <a 
                              href={videoUpload} 
                              download 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={styles.hevcDownloadBtn}
                            >
                              Download Original Video
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={styles.noVideoPlaceholder}>No video uploaded</div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px' }} />

                  {/* Selfie and Shop Front Photos */}
                  <h3 className={styles.previewSectionTitle}>Add a selfie Photo</h3>
                  <p className={styles.previewSectionSub}>
                    Sharing a recent photo of your business exterior helps customers identify you in the real world <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Guide loaded."); }} className={styles.learnMoreLinkInline}>Learn More.</a>
                  </p>

                  <div className={styles.photosRow}>
                    <div className={styles.photoContainer}>
                      {shopFrontPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shopFrontPhoto} alt="Shop front" className={styles.photoImg} />
                      ) : (
                        <div className={styles.noPhotoPlaceholder}>No shop front photo</div>
                      )}
                    </div>
                    <div className={styles.photoContainer}>
                      {selfiePhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selfiePhoto} alt="Selfie" className={styles.photoImg} />
                      ) : (
                        <div className={styles.noPhotoPlaceholder}>No selfie photo</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Status or OTP */}
              <div className={styles.rightCol} style={{ width: '480px' }}>
                <div className={styles.submittedRightCard}>
                  {!showOtpView ? (
                    <div className={styles.statusContent}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://zaanvarprods3.b-cdn.net/media/1786077281636-blocking-internet-icon%201.png"
                        alt="Verification in progress lock illustration"
                        className={styles.statusIllustration}
                      />
                      <h2 className={styles.statusHeading}>Verification in Progress</h2>
                      <p className={styles.statusText}>
                        Your registration has been received and is currently being reviewed. We&apos;ll notify you once verification is complete.
                      </p>
                      
                      <button
                        type="button"
                        className={styles.claimCodeLink}
                        onClick={handleInitiateOtpClaim}
                      >
                        Claim your business with code
                      </button>
                    </div>
                  ) : (
                    <div className={styles.otpContent}>
                      <button
                        type="button"
                        className={styles.otpBackBtn}
                        onClick={handleCancelOtpClaim}
                        aria-label="Back to status"
                      >
                        ←
                      </button>
                      
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://zaanvarprods3.b-cdn.net/media/1786077374486-cyber-data-security-online-concept-illustration-internet-security-information-privacy-protection%201.png"
                        alt="OTP Security shield illustration"
                        className={styles.otpIllustration}
                      />
                      
                      <h3 className={styles.otpHeading}>Enter OTP here</h3>
                      <p className={styles.otpSub}>
                        ENTER THE 6-DIGIT OTP SENT TO YOUR REGISTERED MOBILE NUMBER
                      </p>
                      
                      {/* 6 OTP Inputs */}
                      <div className={styles.otpInputsRow}>
                        {otpValues.map((val, idx) => (
                          <input
                            key={idx}
                            id={`otp-input-${idx}`}
                            type="text"
                            maxLength="1"
                            value={val}
                            className={styles.otpBox}
                            onChange={(e) => {
                              const newVals = [...otpValues];
                              newVals[idx] = e.target.value;
                              setOtpValues(newVals);
                              if (e.target.value && idx < 5) {
                                document.getElementById(`otp-input-${idx + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !otpValues[idx] && idx > 0) {
                                document.getElementById(`otp-input-${idx - 1}`)?.focus();
                              }
                            }}
                          />
                        ))}
                      </div>
                      
                      <p className={styles.resendOtpText}>
                        Didn&apos;t Receive code? <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Resending OTP code..."); }} className={styles.resendLink}>Please contact the support</a>
                      </p>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        style={{ width: '100%', marginTop: '24px' }}
                        onClick={handleVerifyOtp}
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </DashboardLayout>

      {/* ─── INSTRUCTION MODAL POPUP MODAL ─── */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            {/* Close button X */}
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
            >
              <IconClose />
            </button>

            {/* Top Illustration */}
            <div className={styles.modalIllustrationRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://zaanvarprods3.b-cdn.net/media/1786076662802-4aef6b94-7ded-493d-b668-c11064148d46%201.png"
                alt="Laptop"
                className={styles.laptopImg}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://zaanvarprods3.b-cdn.net/media/1786076778891-Group%201000017110.png"
                alt="Connect Line"
                className={styles.transferLineImg}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://zaanvarprods3.b-cdn.net/media/1786076745807-image%20605.png"
                alt="Mobile"
                className={styles.mobileImg}
              />
            </div>

            {/* Modal Headings */}
            <h2 className={styles.modalHeader}>Record video on Mobile App</h2>
            <p className={styles.modalSub}>
              For security and better verification, please record a video of your business using the zaanvar app and upload it. the video will be automatically reflected here.
            </p>

            {/* 3-Column steps row */}
            <div className={styles.modalSteps}>
              <div className={styles.stepCol}>
                <div className={styles.stepIconBox}>
                  <IconDownload />
                </div>
                <h4 className={styles.stepTitle}>1. Install Zaanvar App</h4>
                <p className={styles.stepDesc}>
                  Download and Install the zaanvar app on your mode device
                </p>
              </div>

              <div className={styles.stepCol}>
                <div className={styles.stepIconBox}>
                  <IconVideo />
                </div>
                <h4 className={styles.stepTitle}>2. Record Video</h4>
                <p className={styles.stepDesc}>
                  open the app, go to business verification and Record your business video.
                </p>
              </div>

              <div className={styles.stepCol}>
                <div className={styles.stepIconBox}>
                  <IconUploadCloud />
                </div>
                <h4 className={styles.stepTitle}>3. Auto Upload</h4>
                <p className={styles.stepDesc}>
                  Upload the video in the app. It will be automatically reflected on this page
                </p>
              </div>
            </div>

            {/* Warning Info box banner */}
            <div className={styles.modalBanner}>
              <span className={styles.modalBannerIcon}><IconInfoCircle /></span>
              <span>Make sure to upload a clear video showing your business name, storefront, and inside your business.</span>
            </div>

            {/* Footer actions inside popup */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnOutline}
                onClick={() => toast.info("Opening customer support ticketing system...")}
              >
                <IconHelp />
                <span>Need help ?</span>
              </button>
              <button
                type="button"
                className={styles.btnInstall}
                onClick={handleInstallAppClick}
              >
                <IconDownload />
                <span>Install Zaanvar app</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Verified Success Popup Modal ── */}
      {isVerified && (
        <div className={styles.verifiedModalOverlay}>
          <div className={styles.verifiedModalCard}>
            {/* Scalloped Verified Rosette Badge */}
            <div style={{
              width: "120px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "28px"
            }}>
              <svg width="112" height="112" viewBox="0 0 125 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M123.262 69.7221C124.438 71.5433 125 73.5827 125 75.6016C125 79.2541 123.158 82.834 119.797 84.8839C116.539 86.8715 114.604 90.3992 114.604 94.1456C114.604 94.593 114.635 95.0405 114.687 95.4983C114.75 95.9562 114.771 96.4142 114.771 96.8615C114.771 102.356 110.608 107.091 104.989 107.653C102.866 107.861 100.899 108.694 99.2964 109.974C97.6938 111.254 96.4556 112.981 95.7793 115.01C94.2496 119.558 90.0143 122.409 85.4873 122.409C84.2491 122.409 82.99 122.201 81.7619 121.754C81.1583 121.535 80.5443 121.368 79.9201 121.264C79.2957 121.15 78.6713 121.098 78.047 121.098C75.1748 121.098 72.3548 122.243 70.2736 124.376C68.1508 126.561 65.3202 127.654 62.5 127.654C59.6801 127.654 56.8494 126.561 54.7266 124.376C52.6454 122.243 49.8251 121.098 46.953 121.098C45.7043 121.098 44.4452 121.317 43.2379 121.754C42.0098 122.201 40.7508 122.409 39.5125 122.409C34.9855 122.409 30.7502 119.558 29.2207 115.01C28.5442 112.981 27.306 111.254 25.7034 109.974C24.1008 108.694 22.134 107.861 20.0112 107.653C14.3917 107.091 10.2293 102.356 10.2293 96.8615C10.2293 96.4142 10.2501 95.9562 10.3125 95.4983C10.3645 95.0405 10.3958 94.593 10.3958 94.1456C10.3958 90.3994 8.46015 86.8716 5.20324 84.8839C1.842 82.834 0 79.2541 0 75.6016C0 73.5827 0.562148 71.5431 1.73784 69.7221C2.9034 67.9218 3.4757 65.8822 3.4757 63.8218C3.4757 61.7821 2.9034 59.7217 1.73784 57.932C0.562148 56.1108 0 54.0711 0 52.0525C0 48.3999 1.842 44.8306 5.20324 42.7804C8.46033 40.7927 10.3958 37.2546 10.3958 33.5084C10.3958 33.0611 10.3647 32.6135 10.3125 32.1557C10.2501 31.6977 10.2293 31.2399 10.2293 30.7925C10.2293 25.298 14.3917 20.5631 20.0112 20.0011C22.134 19.7825 24.1008 18.9605 25.7034 17.6804C27.306 16.4107 28.5442 14.6836 29.2207 12.6542C30.7502 8.10664 34.996 5.245 39.5228 5.245C40.7612 5.245 42.0098 5.45312 43.2379 5.90047C44.4451 6.34782 45.7041 6.55612 46.953 6.55612C49.8251 6.55612 52.6454 5.41136 54.7266 3.27806C56.8492 1.09269 59.6799 0 62.5 0C65.3202 0 68.1508 1.09269 70.2736 3.27806C73.26 6.33751 77.7557 7.36782 81.7621 5.90047C82.9902 5.45312 84.2388 5.245 85.4772 5.245C90.004 5.245 94.2498 8.10664 95.7795 12.6542C96.4559 14.6836 97.694 16.4107 99.2966 17.6804C100.899 18.9603 102.866 19.7825 104.989 20.0011C110.608 20.5631 114.771 25.298 114.771 30.7925C114.771 31.2399 114.75 31.6977 114.688 32.1557C114.635 32.6135 114.604 33.0611 114.604 33.5084C114.604 37.2548 116.54 40.7927 119.797 42.7804C123.158 44.8304 125 48.3997 125 52.0525C125 54.0711 124.438 56.1109 123.262 57.932C122.097 59.7217 121.524 61.7823 121.524 63.8218C121.524 64.9561 121.701 66.0903 122.055 67.183C122.336 68.0674 122.742 68.9209 123.262 69.7221Z" fill="#42BE45"/>
                <path d="M124.999 75.6006C124.999 79.2532 123.158 82.833 119.796 84.883C116.539 86.8705 114.604 90.3983 114.604 94.1447C114.604 94.592 114.635 95.0395 114.687 95.4974C114.75 95.9552 114.77 96.4132 114.77 96.8606C114.77 102.355 110.608 107.09 104.988 107.652C102.865 107.86 100.899 108.693 99.296 109.973C97.6935 111.253 96.4552 112.98 95.7789 115.009C94.2492 119.557 90.0139 122.408 85.4869 122.408C84.2487 122.408 82.9896 122.2 81.7615 121.753C81.1579 121.534 80.5439 121.367 79.9197 121.263L28.8145 70.1687C26.1816 67.5254 26.1816 63.2381 28.8145 60.6053C28.9809 60.4388 29.1476 60.2827 29.3244 60.137C31.9781 57.9724 35.9012 58.1182 38.3883 60.6053L51.3131 73.5299L85.071 39.7719C85.2376 39.6159 85.4041 39.4598 85.5809 39.3141C88.2346 37.139 92.1577 37.2953 94.6448 39.7719L122.055 67.1821C122.336 68.0666 122.742 68.9199 123.262 69.7211C124.438 71.5422 124.999 73.5818 124.999 75.6006Z" fill="#42BE45"/>
                <path d="M94.6393 39.7739C91.9977 37.1326 87.7152 37.1326 85.0735 39.7739L51.3149 73.5329L38.383 60.6014C35.7413 57.9603 31.4581 57.9603 28.817 60.6014C26.1756 63.243 26.1756 67.5255 28.817 70.1672L46.5319 87.8817C47.8528 89.2022 49.5837 89.8628 51.3149 89.8628C53.0459 89.8628 54.7769 89.2022 56.0977 87.8817L94.6393 49.3399C97.2808 46.6981 97.2808 42.4157 94.6393 39.7739Z" fill="white"/>
              </svg>
            </div>

            <h2 className={styles.verifiedModalTitle}>
              Your Business was successfully <br />
              <span style={{ color: "#42BE45" }}>Verified!</span>
            </h2>

            <p className={styles.verifiedModalText}>
              Congratulations&apos;s your business has been verified successfully. you can now access all features and manage your business on zaanvar
            </p>

            <button
              type="button"
              className={styles.verifiedModalBtn}
              onClick={() => {
                setIsVerified(false);
                router.replace("/home");
              }}
            >
              Great! Let&apos;s Get Started
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ClaimBusiness;
