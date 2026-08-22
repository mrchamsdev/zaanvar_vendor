import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useStore from "../state/useStore";
import { WebApimanager } from "../utilities/WebApiManager";
import Axios from "axios";
import { BACKEND_URL } from "../utilities/Constants";

export default function FalseClaimModal() {
  const router = useRouter();
  const { jwtToken, userInfo, _hasHydrated, setUserInfo } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!_hasHydrated || !jwtToken || !userInfo) return;

    const currentUserId = userInfo.userId || userInfo.id || userInfo.groomerID;
    if (!currentUserId) return;
    setUserId(currentUserId);

    // If falseClaimStatus is already true in userInfo state, open modal immediately
    if (userInfo.falseClaimStatus === true) {
      setIsOpen(true);
      return;
    }

    // Fetch vendor-users details to verify falseClaimStatus
    const checkFalseClaimStatus = async () => {
      try {
        const webApi = new WebApimanager(jwtToken);
        const res = await webApi.get(`vendor-users/${currentUserId}`);
        const userData = res?.data?.data || res?.data || res || {};

        if (userData?.falseClaimStatus === true) {
          setIsOpen(true);
          setUserInfo((prev) => (prev ? { ...prev, falseClaimStatus: true } : prev));
        }
      } catch (err) {
        console.error("Error checking false claim status:", err);
      }
    };

    checkFalseClaimStatus();
  }, [_hasHydrated, jwtToken, userInfo?.userId, userInfo?.id, userInfo?.groomerID, userInfo?.falseClaimStatus]);

  const handleOk = async () => {
    const clearClaimLocalStorage = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("zaanvar_claim_ticket_id");
        localStorage.removeItem("zaanvar_claim_scraped_branch_id");
        localStorage.removeItem("zaanvar_claim_backend_branch_id");
        localStorage.removeItem("zaanvar_flow_type");
        localStorage.setItem("zaanvar_force_claim_new", "true");
      }
    };

    if (!userId || !jwtToken) {
      clearClaimLocalStorage();
      setIsOpen(false);
      router.push("/onboarding?newClaim=true");
      return;
    }

    try {
      setLoading(true);
      const webApi = new WebApimanager(jwtToken);
      const payload = { falseClaimStatus: false };

      try {
        await webApi.put(`vendor-users/${userId}/false-claim-status`, payload);
      } catch (err) {
        // Fallback directly to Axios if webApi put method encounters an error
        await Axios.put(`${BACKEND_URL}vendor-users/${userId}/false-claim-status`, payload, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });
      }

      // Clear claim-related localStorage and update userInfo
      clearClaimLocalStorage();
      setUserInfo((prev) => (prev ? { ...prev, falseClaimStatus: false } : prev));
      setIsOpen(false);
      router.push("/onboarding?newClaim=true");
    } catch (error) {
      console.error("Failed to update false claim status:", error);
      clearClaimLocalStorage();
      setIsOpen(false);
      router.push("/onboarding?newClaim=true");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          maxWidth: "460px",
          width: "100%",
          padding: "32px 24px 24px",
          textAlign: "center",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Verification Rejected Alert Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#FEE2E2",
            color: "#EF4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "20px",
            fontWeight: "700",
            color: "#111827",
          }}
        >
          Verification Rejected
        </h3>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#4B5563",
          }}
        >
          Your document verification has been rejected. Please try to claim or register your business.
        </p>

        <button
          onClick={handleOk}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 24px",
            backgroundColor: "#EF4444",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background-color 0.2s ease",
            outline: "none",
          }}
        >
          {loading ? "Processing..." : "OK"}
        </button>
      </div>
    </div>
  );
}
