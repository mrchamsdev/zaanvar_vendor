import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "../../styles/onboarding/onboarding.module.css";
import useStore from "@/components/state/useStore";
import RegisterBusinessModal from "@/components/RegisterBusinessModal";

// ─── SVG Icons from Prompt ──────────────────────────────────────────────────
const ClaimBusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 175 175" fill="none">
    <circle cx="87.5" cy="87.5" r="87.5" fill="#1A73E8" fillOpacity="0.1" />
    <path d="M102.25 133.997H115.929C121.51 133.997 126.051 129.456 126.051 123.875V110.161H102.25V133.997Z" fill="#1A73E8" />
    <path d="M111.507 89.8665C108.868 91.4648 105.819 92.3335 102.663 92.3335C102.525 92.3335 102.387 92.3299 102.25 92.3263V104.656H126.051V91.3551C124.267 91.988 122.348 92.3335 120.35 92.3335C117.194 92.3335 114.145 91.4648 111.507 89.8665Z" fill="#1A73E8" />
    <path d="M84.9736 92.3335C81.8172 92.3335 78.7689 91.4648 76.1299 89.8665C73.4909 91.4648 70.4426 92.3335 67.2861 92.3335C64.1296 92.3335 61.0807 91.4648 58.4424 89.8665C55.8034 91.4648 52.7551 92.3335 49.5979 92.3335C47.6004 92.3335 45.6817 91.988 43.8984 91.3551V123.874C43.8984 129.456 48.4389 133.997 54.0208 133.997H96.7438V91.2749C95.7268 90.8993 94.7463 90.4291 93.8174 89.8665C91.1784 91.4648 88.1301 92.3335 84.9736 92.3335ZM80.9542 102.442C81.466 101.931 82.1762 101.637 82.8994 101.637C83.624 101.637 84.3336 101.931 84.8461 102.442C85.3578 102.954 85.6531 103.664 85.6531 104.389C85.6531 105.112 85.3578 105.822 84.8461 106.334C84.3336 106.846 83.624 107.14 82.8994 107.14C82.1762 107.14 81.466 106.846 80.9542 106.334C80.4425 105.822 80.1486 105.112 80.1486 104.389C80.1486 103.664 80.4425 102.954 80.9542 102.442ZM74.5344 99.035C75.0462 98.5233 75.7543 98.2294 76.4811 98.2294C77.2035 98.2294 77.9138 98.5233 78.4256 99.035C78.938 99.5489 79.2312 100.257 79.2312 100.982C79.2312 101.706 78.938 102.415 78.4256 102.928C77.9117 103.44 77.2035 103.734 76.4811 103.734C75.7557 103.734 75.0462 103.44 74.5344 102.928C74.022 102.414 73.7267 101.706 73.7267 100.982C73.7267 100.257 74.022 99.5468 74.5344 99.035ZM67.7212 99.035C68.2315 98.5233 68.9411 98.2294 69.6664 98.2294C70.391 98.2294 71.1013 98.5233 71.613 99.035C72.1248 99.5468 72.4186 100.257 72.4186 100.982C72.4186 101.706 72.1248 102.415 71.613 102.928C71.0991 103.44 70.391 103.734 69.6664 103.734C68.9439 103.734 68.2329 102.44 67.7212 101.928C67.2094 102.414 66.9141 100.706 66.9141 100.982C66.9141 100.257 67.2094 99.5468 67.7212 99.035ZM61.3014 102.442C61.8132 101.931 62.5213 101.637 63.2459 101.637C63.9705 101.637 64.6808 101.931 65.1926 102.442C65.705 102.954 65.9982 103.664 65.9982 104.389C65.9982 105.112 65.705 105.822 65.1926 106.334C64.6808 106.846 63.9705 107.14 63.2459 107.14C62.5213 107.14 61.8132 106.846 61.3014 106.334C60.7889 105.822 60.4937 105.114 60.4937 104.389C60.4937 103.664 60.7889 102.954 61.3014 102.442ZM84.6497 124.328C83.4248 126.2 81.3584 127.318 79.1237 127.318C77.5555 127.318 76.3141 126.95 75.3164 126.655C74.4936 126.411 73.8435 126.218 73.0737 126.218C72.304 126.218 71.6532 126.411 70.8296 126.655C69.8327 126.95 68.5913 127.318 67.0231 127.318C64.7883 127.318 62.7227 126.2 61.4971 124.327C60.7932 123.252 60.4205 122.003 60.4205 120.716C60.4205 113.739 66.0971 108.063 73.0737 108.063C80.0497 108.063 85.7255 113.739 85.7255 120.716C85.7262 122.004 85.3535 123.253 84.6497 124.328Z" fill="#1A73E8" />
    <path d="M55.6875 85.0941V69.1409H38V75.2317C38 81.6265 43.202 86.8286 49.596 86.8286C51.8293 86.8286 53.9165 86.1929 55.6875 85.0941Z" fill="#1A73E8" />
    <path d="M67.2797 86.8286C69.5123 86.8286 71.5995 86.1929 73.3712 85.0941V69.1409H61.1875V85.0948C62.9593 86.1929 65.0464 86.8286 67.2797 86.8286Z" fill="#1A73E8" />
    <path d="M127.97 52.0833C126.514 46.9894 121.226 43 115.929 43H54.0221C48.7254 43 43.4366 46.9894 41.981 52.0833L38.6797 63.6364H131.271L127.97 52.0833Z" fill="#1A73E8" />
    <path d="M114.258 69.1409V85.0941C116.029 86.1929 118.116 86.8286 120.349 86.8286C126.743 86.8286 131.945 81.6265 131.945 75.2317V69.1409H114.258Z" fill="#1A73E8" />
    <path d="M84.9665 86.8286C87.1998 86.8286 89.2863 86.1929 91.058 85.0948V69.1409H78.875V85.0941C80.646 86.1929 82.7332 86.8286 84.9665 86.8286Z" fill="#1A73E8" />
    <path d="M102.662 86.8286C104.895 86.8286 106.982 86.1929 108.753 85.0948V69.1409H96.5703V85.0941C98.3421 86.1929 100.429 86.8286 102.662 86.8286Z" fill="#1A73E8" />
    <ellipse cx="127.081" cy="121.991" rx="10.9173" ry="10.9174" fill="white" />
    <path d="M132.243 122.15C132.141 122.508 131.936 122.818 131.668 123.023C131.454 123.187 131.21 123.272 130.971 123.272C130.881 123.272 130.793 123.26 130.706 123.236C130.39 123.146 130.133 122.897 130.003 122.552C129.884 122.237 129.876 121.867 129.978 121.51C130.081 121.152 130.285 120.842 130.553 120.637C130.847 120.412 131.197 120.334 131.515 120.424C131.831 120.514 132.089 120.763 132.219 121.108C132.337 121.423 132.346 121.793 132.243 122.15ZM125.549 121.246C125.925 121.246 126.285 121.039 126.535 120.676C126.762 120.347 126.887 119.916 126.887 119.463C126.887 119.009 126.762 118.578 126.535 118.249C125.171 117.679 124.812 117.887 124.561 118.249C124.335 118.578 124.21 119.009 124.21 119.463C124.21 119.916 124.335 120.347 124.561 120.676C124.812 121.039 125.171 121.246 125.549 121.246ZM128.805 121.246C129.182 121.246 129.541 121.039 129.792 120.676C130.018 120.347 130.143 119.916 130.143 119.463C130.143 119.009 130.018 118.578 129.792 118.249C129.541 117.887 129.182 117.679 128.805 117.679C128.428 117.679 128.069 117.887 127.818 118.249C127.591 118.578 127.466 119.009 127.466 119.463C127.466 119.916 127.591 120.347 127.818 120.676C128.069 121.039 128.428 121.246 128.805 121.246ZM124.375 121.51C124.272 121.152 124.068 120.842 123.801 120.637C123.506 120.412 123.156 120.334 122.838 120.424C122.521 120.514 122.265 120.763 122.135 121.108C122.016 121.423 122.007 121.793 122.11 122.15C122.213 122.508 122.417 122.818 122.685 123.023C122.899 123.187 123.143 123.272 123.382 123.272C123.471 123.272 123.56 123.261 123.646 123.236C123.964 123.146 124.22 122.897 124.35 122.552C124.469 122.237 124.477 121.867 124.375 121.51ZM129.141 122.382C128.592 121.81 127.895 121.495 127.177 121.495C126.458 121.495 125.76 121.81 125.213 122.382C124.691 122.928 124.326 123.684 124.186 124.514C124.097 125.043 124.259 125.552 124.633 125.911C125.021 126.284 125.529 126.397 126.025 126.222C126.393 126.092 126.78 126.026 127.177 126.026C127.573 126.026 127.961 126.092 128.328 126.222C128.481 126.276 128.635 126.303 128.787 126.303C129.126 126.303 129.451 126.169 129.72 125.911C130.094 125.552 130.256 125.043 130.167 124.514C130.027 123.684 129.663 122.928 129.141 122.382Z" fill="#1A73E8" />
  </svg>
);

const RegisterBusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 175 175" fill="none">
    <circle cx="87.5" cy="87.5" r="87.5" fill="#FEF1E8" />
    <path d="M102.25 132.997H115.929C121.51 132.997 126.051 128.456 126.051 122.875V109.161H102.25V132.997Z" fill="#FC6811" />
    <path d="M111.507 88.8665C108.868 90.4648 105.819 91.3335 102.663 91.3335C102.525 91.3335 102.387 91.3299 102.25 91.3263V103.656H126.051V90.3551C124.267 90.988 122.348 91.3335 120.35 91.3335C117.194 91.3335 114.145 90.4648 111.507 88.8665Z" fill="#FC6811" />
    <path d="M84.9736 91.3335C81.8172 91.3335 78.7689 90.4648 76.1299 88.8665C73.4909 90.4648 70.4426 91.3335 67.2861 91.3335C64.1296 91.3335 61.0807 90.4648 58.4424 88.8665C55.8034 90.4648 52.7551 91.3335 49.5979 91.3335C47.6004 91.3335 45.6817 90.988 43.8984 90.3551V122.874C43.8984 128.456 48.4389 132.997 54.0208 132.997H96.7438V90.2749C95.7268 89.8993 94.7463 89.4291 93.8174 88.8665C91.1784 90.4648 88.1301 91.3335 84.9736 91.3335ZM80.9542 101.442C81.466 100.931 82.1762 100.637 82.8994 100.637C83.624 100.637 84.3336 100.931 84.8461 101.442C85.3578 101.954 85.6531 102.664 85.6531 103.389C85.6531 104.112 85.3578 104.822 84.8461 105.334C84.3336 105.846 83.624 106.14 82.8994 106.14C82.1762 106.14 81.466 105.846 80.9542 105.334C80.4425 104.822 80.1486 104.112 80.1486 103.389C80.1486 102.664 80.4425 101.954 80.9542 101.442ZM74.5344 98.035C75.0462 97.5233 75.7543 97.2294 76.4811 97.2294C77.2035 97.2294 77.9138 97.5233 78.4256 98.035C78.938 98.5489 79.2312 99.2571 79.2312 99.9817C79.2312 100.706 78.938 101.415 78.4256 101.928C77.9117 102.44 77.2035 102.734 76.4811 102.734C75.7557 102.734 75.0462 102.44 74.5344 101.928C74.022 101.414 73.7267 100.706 73.7267 99.9817C73.7267 99.2571 74.022 98.5468 74.5344 98.035ZM67.7212 98.035C68.2315 97.5233 68.9411 97.2294 69.6664 97.2294C70.391 97.2294 71.1013 97.5233 71.613 98.035C72.1248 98.5468 72.4186 99.2571 72.4186 99.9817C72.4186 100.706 72.1248 101.415 71.613 101.928C71.0991 102.44 70.391 102.734 69.6664 102.734C68.9439 102.734 68.2329 102.44 67.7212 101.928C67.2094 101.414 66.9141 100.706 66.9141 99.9817C66.9141 99.2571 67.2094 98.5468 67.7212 98.035ZM61.3014 101.442C61.8132 100.931 62.5213 100.637 63.2459 100.637C63.9705 100.637 64.6808 100.931 65.1926 101.442C65.705 101.954 65.9982 102.664 65.9982 103.389C65.9982 104.112 65.705 104.822 65.1926 105.334C64.6808 105.846 63.9705 106.14 63.2459 106.14C62.5213 106.14 61.8132 105.846 61.3014 105.334C60.7889 104.822 60.4937 104.114 60.4937 103.389C60.4937 102.664 60.7889 101.954 61.3014 101.442ZM84.6497 123.328C83.4248 125.2 81.3584 126.318 79.1237 126.318C77.5555 126.318 76.3141 125.95 75.3164 125.655C74.4936 125.411 73.8435 125.218 73.0737 125.218C72.304 125.218 71.6532 125.411 70.8296 125.655C69.8327 125.95 68.5913 126.318 67.0231 126.318C64.7883 126.318 62.7227 125.2 61.4971 123.327C60.7932 122.252 60.4205 121.003 60.4205 119.716C60.4205 112.739 66.0971 107.063 73.0737 107.063C80.0497 108.063 85.7255 113.739 85.7255 119.716C85.7262 121.004 85.3535 122.253 84.6497 123.328ZM55.6875 84.0941V68.1409H38V74.2317C38 80.6265 43.202 85.8286 49.596 85.8286C51.8293 85.8286 53.9165 85.1929 55.6875 84.0941Z" fill="#FC6811" />
    <path d="M67.2797 85.8286C69.5123 85.8286 71.5995 85.1929 73.3712 84.0941V68.1409H61.1875V84.0948C62.9593 85.1929 65.0464 85.8286 67.2797 85.8286Z" fill="#FC6811" />
    <path d="M127.97 51.0833C126.514 45.9894 121.226 42 115.929 42H54.0221C48.7254 42 43.4366 45.9894 41.981 51.0833L38.6797 62.6364H131.271L127.97 51.0833Z" fill="#FC6811" />
    <path d="M114.258 68.1409V84.0941C116.029 85.1929 118.116 85.8286 120.349 85.8286C126.743 85.8286 131.945 80.6265 131.945 74.2317V68.1409H114.258Z" fill="#FC6811" />
    <path d="M84.9665 85.8286C87.1998 85.8286 89.2863 85.1929 91.058 84.0948V68.1409H78.875V85.0941C80.646 85.1929 82.7332 85.8286 84.9665 85.8286Z" fill="#FC6811" />
    <path d="M102.662 85.8286C104.895 85.8286 106.982 85.1929 108.753 84.0948V68.1409H96.5703V85.0941C98.3421 85.1929 100.429 85.8286 102.662 85.8286Z" fill="#FC6811" />
    <ellipse cx="127.081" cy="120.991" rx="10.9173" ry="10.9174" fill="white" />
    <path d="M127.175 126.128C126.789 126.128 126.477 125.816 126.477 125.43V116.551C126.477 116.166 126.789 115.853 127.175 115.853C127.56 115.853 127.873 116.166 127.873 116.551V125.43C127.873 125.816 127.56 126.128 127.175 126.128Z" fill="#FC6811" />
    <path d="M131.616 121.689H122.737C122.352 121.689 122.039 121.376 122.039 120.991C122.039 120.605 122.352 120.292 122.737 120.292H131.616C132.002 120.292 132.314 120.605 132.314 120.991C132.314 121.376 132.002 121.689 131.616 121.689Z" fill="#FC6811" />
  </svg>
);

const Onboarding = () => {
  const router = useRouter();
  const { userInfo, clearStore } = useStore();
  const [checkingProgress, setCheckingProgress] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleLogout = () => {
    if (clearStore) clearStore();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    router.replace("/login");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("register=true") || search.includes("register=1") || search.includes("onboarding=true")) {
        setIsRegisterModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    const checkExistingProgress = async () => {
      const isNewClaimQuery = typeof window !== "undefined" && (window.location.search.includes("newClaim=true") || localStorage.getItem("zaanvar_force_claim_new") === "true");
      if (isNewClaimQuery) {
        setCheckingProgress(false);
        return;
      }
      if (!userInfo) {
        setCheckingProgress(false);
        return;
      }
      try {
        const API_URL = window.location.hostname !== "support.zaanvar.com"
          ? "https://dev.zaanvar.com/api/"
          : "https://prod.zaanvar.com/api/";

        const savedBranchId = localStorage.getItem("zaanvar_claim_scraped_branch_id");

        let resData = null;
        try {
          const currentVendorUserId = userInfo?.userId || userInfo?.id;
          const res = await axios.get(`${API_URL}scraped-branches/claim/progress`, {
            params: {
              vendor_user_id: currentVendorUserId,
              vendorUserId: currentVendorUserId,
              scrapedBranchId: savedBranchId || undefined
            }
          });
          resData = res?.data;
        } catch (err) {
          resData = err.response?.data;
        }

        if (resData) {
          const ticket = resData.data?.ticket || resData.ticket || resData.data || resData;
          const step = ticket?.currentStep || ticket?.current_step || resData.currentStep || resData.current_step;
          const isDup = Boolean(
            resData.status === "DUPLICATE_CLAIM" ||
            resData.claimStatus === "DUPLICATE_CLAIM" ||
            resData.isDuplicateClaim ||
            resData.is_duplicate_claim ||
            ticket?.status === "DUPLICATE_CLAIM" ||
            ticket?.claimStatus === "DUPLICATE_CLAIM" ||
            ticket?.isDuplicateClaim ||
            ticket?.is_duplicate_claim
          );

          if (step || isDup) {
            const branchId = ticket?.scrapedBranchId || ticket?.scraped_branch_id || resData.scrapedBranchId;
            if (branchId) {
              localStorage.setItem("zaanvar_claim_scraped_branch_id", branchId);
            }
            router.replace("/claim-business");
            return;
          }
        }
      } catch (err) {
        console.log("No onboarding progress ticket found, stay on onboarding page.");
      }
      setCheckingProgress(false);
    };
    checkExistingProgress();
  }, [userInfo]);

  if (checkingProgress) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fdfdfe' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const handleClaim = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zaanvar_flow_type", "CLAIM");
      localStorage.removeItem("zaanvar_claim_ticket_id");
    }
    const isNew = router.query.newClaim === "true" || (typeof window !== "undefined" && window.location.search.includes("newClaim=true"));
    if (isNew) {
      router.push("/claim-business?newClaim=true");
    } else {
      router.push("/claim-business");
    }
  };

  const handleRegister = () => {
    setIsRegisterModalOpen(true);
  };

  return (
    <>
      <Head>
        <title>Welcome to Zaanvar Business</title>
        <meta
          name="description"
          content="Manage your pet business, reach more customers, and grow your business with Zaanvar."
        />
      </Head>
      <div className={styles.page} style={{ position: "relative" }}>
        {/* Top Right Log Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "24px",
            right: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#dc2626",
            backgroundColor: "#fff",
            border: "1px solid #fee2e2",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
            transition: "all 0.2s ease",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fef2f2";
            e.currentTarget.style.borderColor = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#fff";
            e.currentTarget.style.borderColor = "#fee2e2";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log Out</span>
        </button>

        {/* Welcome titles */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Zaanvar Business</h1>
          <p className={styles.subtitle}>
            Manage your pet business, reach more customers, and grow your business with zaanvar
          </p>
        </div>

        {/* Selection Cards */}
        <div className={styles.cardsRow}>
          {/* Card 1: Claim your Business */}
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <ClaimBusinessIcon />
            </div>
            <div className={styles.contentWrapper}>
              <span className={`${styles.badge} ${styles.badgeBlue}`}>Existing Listing</span>
              <h2 className={styles.cardTitle}>Claim your Business</h2>
              <p className={styles.cardDesc}>
                Already listed on zaanvar? verify ownership and manage your business Profile
              </p>
              <button type="button" className={styles.btnBlue} onClick={handleClaim}>
                Claim This Business →
              </button>
            </div>
          </div>

          {/* OR Divider */}
          <div className={styles.orDivider}>
            <div className={styles.orLine} />
            <div className={styles.orCircle}>OR</div>
            <div className={styles.orLine} />
          </div>

          {/* Card 2: Register your Business */}
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <RegisterBusinessIcon />
            </div>
            <div className={styles.contentWrapper}>
              <span className={`${styles.badge} ${styles.badgeOrange}`}>New Business</span>
              <h2 className={styles.cardTitle}>Register your Business</h2>
              <p className={styles.cardDesc}>
                Already listed on zaanvar? verify ownership and manage your business Profile
              </p>
              <button type="button" className={styles.btnOrange} onClick={handleRegister}>
                Register your Business →
              </button>
            </div>
          </div>
        </div>
      </div>
      <RegisterBusinessModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(data, payload) => {
          setIsRegisterModalOpen(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("zaanvar_flow_type", "REGISTER");
            if (data?.ticketId) localStorage.setItem("zaanvar_claim_ticket_id", String(data.ticketId));
          }
          router.push("/claim-business?view=verify_method&instructions=true");
        }}
        userInfo={userInfo}
      />
    </>
  );
};

export default Onboarding;
