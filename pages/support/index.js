import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/support.module.css";
import useStore from "../../components/state/useStore";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

export default function SupportPage() {
  const router = useRouter();
  const { jwtToken, userInfo } = useStore();
  const { selectedBranchId, branches } = useDashboardData();

  const [problemText, setProblemText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!problemText.trim()) {
      toast.error("Please type your problem before submitting.");
      return;
    }

    const rawBId = selectedBranchId ||
      (branches && branches[0]?.id) ||
      (userInfo?.branchId && Array.isArray(userInfo.branchId) ? userInfo.branchId[0] : userInfo?.branchId) ||
      (typeof window !== "undefined" ? localStorage.getItem("zaanvar_claim_backend_branch_id") || localStorage.getItem("branchId") : null);

    const rawCId = userInfo?.companyId || (branches && branches[0]?.companyId);

    setSubmitting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      // Support POST call api/companies/support-ticket
      const payload = {
        branchId: rawBId ? Number(rawBId) : "",
        companyId: rawCId ? Number(rawCId) : "",
        problem: problemText.trim(),
        message: problemText.trim(),
        comment: problemText.trim(),
        description: problemText.trim(),
        ticketDescription: problemText.trim(),
        type: "Vendor Support Ticket",
        userEmail: userInfo?.email || "",
        userPhone: userInfo?.phoneNumber || userInfo?.phone || ""
      };

      const res = await webApi.post("companies/support-ticket", payload);

      if (
        res &&
        (res.status === "success" ||
          res.status === "SUCCESS" ||
          (typeof res.status === "number" && res.status >= 200 && res.status < 300) ||
          res.data?.ticket ||
          res.status === undefined)
      ) {
        toast.success(res?.message || "Support ticket submitted successfully! Our team will get back to you shortly.");
        setProblemText("");
      } else {
        toast.error(res?.message || "Failed to submit support ticket. Please try again.");
      }
    } catch (err) {
      console.error("POST companies/support-ticket error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to submit support ticket.";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Support | Zaanvar Business</title>
      </Head>

      <div className={styles.pageContainer}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            marginBottom: "16px",
            fontSize: "13.5px",
            fontWeight: "500",
            color: "#374151",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            transition: "all 0.2s ease"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back</span>
        </button>

        <div className={styles.card}>
          <h1 className={styles.title}>WRITE YOUR COMMENT HERE</h1>
          <form onSubmit={handleSubmit} className={styles.textareaWrap}>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="TYPE YOUR PROBLEM HERE"
              className={styles.textarea}
              rows={8}
            />
            <div className={styles.actionRow}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
