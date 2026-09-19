import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import styles from "../../styles/dashboard/change-pin.module.css";
import useStore from "../../components/state/useStore";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import { toast } from "sonner";

export default function ChangePinPage() {
  const { jwtToken, userInfo } = useStore();

  // Mode: "change" | "forgot_send" | "forgot_otp" | "forgot_reset"
  const [mode, setMode] = useState("change");

  // Change PIN States
  const [currentPin, setCurrentPin] = useState(["", "", "", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", "", "", ""]);
  const [reenterPin, setReenterPin] = useState(["", "", "", "", "", ""]);

  // Forgot PIN States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [resetNewPin, setResetNewPin] = useState(["", "", "", "", "", ""]);
  const [resetReenterPin, setResetReenterPin] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [lastChangedDate, setLastChangedDate] = useState("Jul 8, 2026, 5:55 AM");

  // Refs
  const currentRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const newRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const reenterRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const otpRefs = useRef([]);
  const resetNewRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const resetReenterRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const resendIntervalRef = useRef(null);

  // Initialize Phone and Last Changed Date
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedDate = localStorage.getItem("zaanvar_last_pin_changed");
      if (storedDate) {
        try {
          const d = new Date(storedDate);
          if (!isNaN(d.getTime())) {
            const formatted = d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            }) + ", " + d.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true
            });
            setLastChangedDate(formatted);
          }
        } catch { }
      }
    }

    const initialPhone = userInfo?.phoneNumber || userInfo?.phone || (typeof window !== "undefined" ? localStorage.getItem("phoneNumber") || localStorage.getItem("phone") : "") || "";
    if (initialPhone) setPhone(initialPhone);
  }, [userInfo]);

  // Handle Resend Timer
  useEffect(() => {
    if (mode === "forgot_otp" && resendTimer > 0) {
      resendIntervalRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(resendIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resendIntervalRef.current);
  }, [mode, resendTimer]);

  /* ─── Box Input Handlers ─── */
  const handleBoxChange = (index, value, state, setState, refs) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...state];
    updated[index] = digit;
    setState(updated);

    if (digit && index < 5) {
      if (Array.isArray(refs)) {
        refs[index + 1]?.current?.focus();
      } else if (refs.current && refs.current[index + 1]) {
        refs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (index, e, state, setState, refs) => {
    if (e.key === "Backspace") {
      if (state[index]) {
        const updated = [...state];
        updated[index] = "";
        setState(updated);
      } else if (index > 0) {
        const updated = [...state];
        updated[index - 1] = "";
        setState(updated);
        if (Array.isArray(refs)) {
          refs[index - 1]?.current?.focus();
        } else if (refs.current && refs.current[index - 1]) {
          refs.current[index - 1].focus();
        }
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      if (Array.isArray(refs)) refs[index - 1]?.current?.focus();
      else refs.current?.[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      if (Array.isArray(refs)) refs[index + 1]?.current?.focus();
      else refs.current?.[index + 1]?.focus();
    }
  };

  const handlePaste = (e, setState, refs) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const arr = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      arr[i] = pasted[i];
    }
    setState(arr);

    const focusIdx = Math.min(pasted.length - 1, 5);
    if (Array.isArray(refs)) {
      refs[focusIdx]?.current?.focus();
    } else if (refs.current && refs.current[focusIdx]) {
      refs.current[focusIdx].focus();
    }
  };

  /* ─── Mode 1: Change PIN Save ─── */
  const handleSaveChangePin = async () => {
    const currentStr = currentPin.join("");
    const newStr = newPin.join("");
    const reenterStr = reenterPin.join("");

    if (currentStr.length < 6) {
      toast.error("Please enter your complete 6-digit current PIN.");
      return;
    }
    if (newStr.length < 6) {
      toast.error("Please enter a complete 6-digit new PIN.");
      return;
    }
    if (reenterStr.length < 6) {
      toast.error("Please re-enter your complete 6-digit new PIN.");
      return;
    }
    if (newStr !== reenterStr) {
      toast.error("New PIN and Re-entered PIN do not match.");
      return;
    }

    setLoading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const payload = {
        previousPassword: currentStr,
        newPassword: newStr
      };

      let res;
      try {
        res = await webApi.put("vendor-users/changePassword", payload);
      } catch (err) {
        if (err?.response?.status === 405) {
          res = await webApi.post("vendor-users/changePassword", payload);
        } else {
          throw err;
        }
      }

      if (res && (res.status === undefined || (res.status >= 200 && res.status < 300) || res.status === "success")) {
        toast.success("PIN changed successfully!");

        setCurrentPin(["", "", "", "", "", ""]);
        setNewPin(["", "", "", "", "", ""]);
        setReenterPin(["", "", "", "", "", ""]);

        const now = new Date();
        const formatted = now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) + ", " + now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("zaanvar_last_pin_changed", now.toISOString());
        }
        setLastChangedDate(formatted);
      } else {
        toast.error("Failed to change PIN. Please verify your current PIN.");
      }
    } catch (err) {
      console.error("changePassword error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to change PIN. Please check your current PIN.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Mode 2: Forgot PIN - Send OTP ───
     POST /api/vendor/registration/forgot-pin
     Payload: { "identifier": "9876543210" }
  */
  const handleSendOtp = async () => {
    const identifier = phone.trim();
    if (!identifier) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const payload = {
        identifier: identifier
      };

      let res;
      try {
        res = await webApi.postwithouttoken("vendor/registration/forgot-pin", payload);
      } catch {
        res = await webApi.post("vendor/registration/forgot-pin", payload);
      }

      if (res?.status === "success" || (res && res.status >= 200 && res.status < 300)) {
        toast.success(res?.message || "OTP sent successfully!");
        setMode("forgot_otp");
        setResendTimer(30);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("POST vendor/registration/forgot-pin error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to send OTP. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Mode 3: Forgot PIN - Resend OTP ───
     POST /api/vendor/registration/forgot-pin
     Payload: { "identifier": "9876543210" }
  */
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    const identifier = phone.trim();
    if (!identifier) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const payload = {
        identifier: identifier
      };

      let res;
      try {
        res = await webApi.postwithouttoken("vendor/registration/forgot-pin", payload);
      } catch {
        res = await webApi.post("vendor/registration/forgot-pin", payload);
      }

      if (res?.status === "success" || (res && res.status >= 200 && res.status < 300)) {
        toast.success("OTP resent successfully!");
        setResendTimer(30);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error(res?.message || "Failed to resend OTP.");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      toast.error("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Mode 4: Forgot PIN - Verify OTP ───
     POST /api/vendor/registration/verify-forgot-pin
     Payload: { "identifier": "9876543210", "otp": "123456" }
  */
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const payload = {
        identifier: phone.trim(),
        otp: code
      };

      let res;
      try {
        res = await webApi.postwithouttoken("vendor/registration/verify-forgot-pin", payload);
      } catch {
        res = await webApi.post("vendor/registration/verify-forgot-pin", payload);
      }

      if (res?.status === "success" || (res && res.status >= 200 && res.status < 300)) {
        toast.success(res?.message || "OTP verified successfully!");
        setVerifiedOtp(code);
        setMode("forgot_reset");
        setResetNewPin(["", "", "", "", "", ""]);
        setResetReenterPin(["", "", "", "", "", ""]);
      } else {
        toast.error(res?.message || "Invalid OTP code. Please try again.");
      }
    } catch (err) {
      console.error("POST vendor/registration/verify-forgot-pin error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Invalid OTP code. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Mode 5: Forgot PIN - Save New Password/PIN ───
     POST /api/vendor/registration/reset-pin
     Payload: { "identifier": "9876543210", "otp": "123456", "newPin": "1234" }
  */
  const handleSaveResetPin = async () => {
    const newStr = resetNewPin.join("").trim();
    const reenterStr = resetReenterPin.join("").trim();

    if (!newStr) {
      toast.error("Please enter your new PIN.");
      return;
    }
    if (newStr !== reenterStr) {
      toast.error("New PIN and Re-entered PIN do not match.");
      return;
    }

    setLoading(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? localStorage.getItem("jwtToken") || "" : "");
      const webApi = new WebApimanager(token);

      const payload = {
        identifier: phone.trim(),
        otp: verifiedOtp,
        newPin: newStr
      };

      let res;
      try {
        res = await webApi.postwithouttoken("vendor/registration/reset-pin", payload);
      } catch {
        try {
          res = await webApi.post("vendor/registration/reset-pin", payload);
        } catch {
          res = await webApi.put("vendor-users/changePassword", {
            previousPassword: "",
            newPassword: newStr
          });
        }
      }

      if (res && (res.status === undefined || res.status === "success" || (res.status >= 200 && res.status < 300))) {
        toast.success(res?.message || "PIN reset successfully! Please log in or use your new PIN.");

        const now = new Date();
        const formatted = now.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }) + ", " + now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("zaanvar_last_pin_changed", now.toISOString());
        }
        setLastChangedDate(formatted);
        setMode("change");
      } else {
        toast.error(res?.message || "Failed to reset PIN. Please try again.");
      }
    } catch (err) {
      console.error("Save reset PIN error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to reset PIN. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderPinRow = (label, state, setState, refs) => (
    <div className={styles.formGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.pinRow}>
        {state.map((val, idx) => (
          <input
            key={idx}
            ref={Array.isArray(refs) ? refs[idx] : undefined}
            type="numbers"
            maxLength={1}
            value={val}
            onChange={(e) => handleBoxChange(idx, e.target.value, state, setState, refs)}
            onKeyDown={(e) => handleKeyDown(idx, e, state, setState, refs)}
            onPaste={(e) => handlePaste(e, setState, refs)}
            className={styles.pinBox}
            autoComplete="off"
            inputMode="numeric"
          />
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <Head>
        <title>{mode === "change" ? "Change PIN" : "Forgot PIN"} | Zaanvar</title>
      </Head>

      <div className={styles.pageContainer}>
        <div className={styles.card}>
          {/* ─── MODE 1: CHANGE PIN ─── */}
          {mode === "change" && (
            <>
              <h1 className={styles.title}>CHANGE PIN</h1>
              <p className={styles.subtitle}>
                Last Pin Changed: <span className={styles.timestampHighlight}>{lastChangedDate}</span>
              </p>

              <hr className={styles.divider} />

              {renderPinRow("Current Pin", currentPin, setCurrentPin, currentRefs)}
              {renderPinRow("New Pin", newPin, setNewPin, newRefs)}
              {renderPinRow("Re-enter New Pin", reenterPin, setReenterPin, reenterRefs)}

              <div>
                <span
                  className={styles.forgotLink}
                  onClick={() => setMode("forgot_send")}
                >
                  Forgot Pin?
                </span>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSaveChangePin}
                  disabled={loading}
                >
                  {loading ? "SAVING..." : "SAVE"}
                </button>
              </div>
            </>
          )}

          {/* ─── MODE 2: FORGOT PIN - STEP 1 (Send OTP) ─── */}
          {mode === "forgot_send" && (
            <>
              <div
                className={styles.backTitle}
                onClick={() => setMode("change")}
              >
                <span>&lt; FORGOT PIN</span>
              </div>

              <hr className={styles.divider} />

              <div className={styles.formGroup}>
                <label className={styles.label}>Verify Your Phone Number</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.phoneInput}
                    placeholder="+919248176187"
                  />
                  <button
                    type="button"
                    className={styles.sendOtpBtn}
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── MODE 3: FORGOT PIN - STEP 2 (Verify OTP) ─── */}
          {mode === "forgot_otp" && (
            <>
              <div
                className={styles.backTitle}
                onClick={() => setMode("forgot_send")}
              >
                <span>&lt; FORGOT PIN</span>
              </div>

              <hr className={styles.divider} />

              <div className={styles.formGroup}>
                <label className={styles.label}>Verify Your Phone Number</label>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={phone}
                    readOnly
                    className={styles.phoneInputDisabled}
                  />
                  <span
                    className={styles.resendLink}
                    onClick={resendTimer === 0 ? handleResendOtp : undefined}
                    style={{
                      opacity: resendTimer > 0 ? 0.5 : 1,
                      cursor: resendTimer > 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </span>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: "24px" }}>
                <label className={styles.label}>Enter Your 6 digit code</label>
                <div className={styles.pinRow}>
                  {otp.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="password"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleBoxChange(idx, e.target.value, otp, setOtp, otpRefs)}
                      onKeyDown={(e) => handleKeyDown(idx, e, otp, setOtp, otpRefs)}
                      onPaste={(e) => handlePaste(e, setOtp, otpRefs)}
                      className={styles.pinBox}
                      autoComplete="off"
                      inputMode="numeric"
                    />
                  ))}
                </div>
              </div>

              <div className={styles.actionRowCenter}>
                <button
                  type="button"
                  className={styles.verifyOtpBtn}
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </>
          )}

          {/* ─── MODE 4: FORGOT PIN - STEP 3 (Enter New PIN) ─── */}
          {mode === "forgot_reset" && (
            <>
              <div
                className={styles.backTitle}
                onClick={() => setMode("forgot_otp")}
              >
                <span>&lt; RESET PIN</span>
              </div>

              <hr className={styles.divider} />

              {renderPinRow("New Pin", resetNewPin, setResetNewPin, resetNewRefs)}
              {renderPinRow("Re-enter New Pin", resetReenterPin, setResetReenterPin, resetReenterRefs)}

              <div className={styles.actionRowCenter}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSaveResetPin}
                  disabled={loading}
                >
                  {loading ? "SAVING..." : "SAVE"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
