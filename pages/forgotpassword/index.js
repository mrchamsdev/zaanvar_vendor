import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/forgotpassword/forgotpassword.module.css";
import { useRouter } from "next/router";
import Image from "next/image";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import { toast } from "sonner";

/* ─── Brand / Slideshow ──────────────────────────────────────────────────── */
const LOGO_URL =
  "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg";

const SLIDES = [
  { title: "Pet Sales",    img: "https://zaanvarprods3.b-cdn.net/media/1773904975247-petsales.jpeg" },
  { title: "Pet Day Care", img: "https://zaanvarprods3.b-cdn.net/media/1773904967711-daycare.jpeg" },
  { title: "Pet Grooming", img: "https://zaanvarprods3.b-cdn.net/media/1773904959532-grooming.jpeg" },
  { title: "Pet Clinic",   img: "https://zaanvarprods3.b-cdn.net/media/1773904953568-clinic.jpeg" },
  { title: "Pet Shops",    img: "https://zaanvarprods3.b-cdn.net/media/1773904947760-petshops.jpeg" },
  { title: "Pet Training", img: "https://zaanvarprods3.b-cdn.net/media/1773904939833-pettaining.jpeg" },
];

/* ─── Inline SVG Icons ────────────────────────────────────────────────────── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#555"/>
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="#555"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */

const ForgotPassword = () => {
  const router = useRouter();
  const webApi = new WebApimanager();

  /* ── Slideshow ── */
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  /* ── Step state: 1 = enter contact, 2 = verify OTP, 3 = set pin ── */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ── Step 1 state ── */
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState("");

  /* ── Step 2 state ── */
  const [otp, setOtp] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const resendRef = useRef(null);
  const [verifiedOtp, setVerifiedOtp] = useState(""); // saved for reset-pin call

  /* ── Step 3 state ── */
  const [pin, setPin]         = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError]     = useState("");

  /* ── Resend countdown ── */
  useEffect(() => {
    if (step === 2) {
      setResendTimer(30);
      resendRef.current = setInterval(() => {
        setResendTimer((p) => {
          if (p <= 1) { clearInterval(resendRef.current); return 0; }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(resendRef.current);
  }, [step]);

  /* ─── Handlers ────────────────────────────────────────────────────────── */

  /* Step 1 – Send OTP
     POST vendor/registration/forgot-pin  { identifier } */
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!contact.trim()) { setContactError("Please enter your email or phone number."); return; }
    setContactError("");
    setLoading(true);
    try {
      const res = await webApi.postwithouttoken("vendor/registration/forgot-pin", {
        identifier: contact.trim(),
      });
      if (res?.status === "success") {
        toast.success(res.message || "OTP sent successfully!");
        setStep(2);
      } else {
        toast.error(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 – OTP input */
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  /* Step 2 – Verify OTP
     POST vendor/registration/verify-forgot-pin  { identifier, otp } */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpError("");
    setLoading(true);
    try {
      const res = await webApi.postwithouttoken("vendor/registration/verify-forgot-pin", {
        identifier: contact.trim(),
        otp: code,
      });
      if (res?.status === "success") {
        toast.success(res.message || "OTP verified!");
        setVerifiedOtp(code); // save for reset-pin step
        setStep(3);
      } else {
        setOtpError(res?.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Invalid OTP. Please try again.";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Resend – re-calls forgot-pin */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      const res = await webApi.postwithouttoken("vendor/registration/forgot-pin", {
        identifier: contact.trim(),
      });
      if (res?.status === "success") {
        toast.success("OTP resent!");
      } else {
        toast.error(res?.message || "Failed to resend OTP.");
      }
      setResendTimer(30);
      setOtp(Array(6).fill(""));
      resendRef.current = setInterval(() => {
        setResendTimer((p) => {
          if (p <= 1) { clearInterval(resendRef.current); return 0; }
          return p - 1;
        });
      }, 1000);
    } catch {
      toast.error("Failed to resend OTP.");
    }
  };

  /* Step 3 – Reset PIN
     POST vendor/registration/reset-pin  { identifier, otp, newPin } */
  const handleSetPin = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) { setPinError("PIN must be exactly 6 digits."); return; }
    if (pin !== confirmPin)   { setPinError("PINs do not match."); return; }
    setPinError("");
    setLoading(true);
    try {
      const res = await webApi.postwithouttoken("vendor/registration/reset-pin", {
        identifier: contact.trim(),
        otp: verifiedOtp,
        newPin: pin,
      });
      if (res?.status === "success") {
        toast.success(res.message || "PIN updated successfully! Please log in.");
        router.push("/login");
      } else {
        setPinError(res?.message || "Failed to set PIN. Please try again.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to set PIN. Please try again.";
      setPinError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Shared render helpers ────────────────────────────────────────────── */
  const renderDots = (dotClass, dotActiveClass) =>
    SLIDES.map((_, i) => (
      <button
        key={i}
        type="button"
        className={`${dotClass} ${i === currentSlide ? dotActiveClass : ""}`}
        onClick={() => setCurrentSlide(i)}
        aria-label={`Go to slide ${i + 1}`}
      />
    ));

  const renderSlides = (slideClass, activeClass) =>
    SLIDES.map((slide, i) => (
      <div
        key={i}
        className={`${slideClass} ${i === currentSlide ? activeClass : ""}`}
        style={{ backgroundImage: `url(${slide.img})` }}
        aria-hidden={i !== currentSlide}
      />
    ));

  /* ─── OTP boxes (reused in step 2) ────────────────────────────────────── */
  const renderOtpBoxes = (boxClass) =>
    otp.map((digit, i) => (
      <input
        key={i}
        ref={(el) => (otpRefs.current[i] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={(e) => handleOtpChange(i, e.target.value)}
        onKeyDown={(e) => handleOtpKeyDown(i, e)}
        onPaste={i === 0 ? handleOtpPaste : undefined}
        className={boxClass}
        aria-label={`OTP digit ${i + 1}`}
      />
    ));

  /* ─── Form panels per step ─────────────────────────────────────────────── */
  const renderFormContent = (isDesktop) => {
    const P = isDesktop
      ? {
          card:       styles.fpCard,
          title:      styles.fpTitle,
          subtitle:   styles.fpSubtitle,
          inputGroup: styles.fpInputGroup,
          inputIcon:  styles.fpInputIcon,
          input:      styles.fpInput,
          error:      styles.fpError,
          otpRow:     styles.fpOtpRow,
          otpBox:     styles.fpOtpBox,
          resendRow:  styles.fpResendRow,
          resendLink: styles.fpResendLink,
          btn:        styles.fpBtn,
        }
      : {
          card:       styles.fpMobCard,
          title:      styles.fpMobTitle,
          subtitle:   styles.fpMobSubtitle,
          inputGroup: styles.fpMobInputGroup,
          inputIcon:  styles.fpMobInputIcon,
          input:      styles.fpMobInput,
          error:      styles.fpMobError,
          otpRow:     styles.fpMobOtpRow,
          otpBox:     styles.fpMobOtpBox,
          resendRow:  styles.fpMobResendRow,
          resendLink: styles.fpMobResendLink,
          btn:        styles.fpMobBtn,
        };

    /* ── Step 1 ── */
    if (step === 1) return (
      <form onSubmit={handleStep1Submit} className={P.card}>
        <h2 className={P.title}>Forgot Password</h2>
        <p className={P.subtitle}>Enter your registered email or phone number.</p>

        <div className={P.inputGroup}>
          <span className={P.inputIcon}><MailIcon /></span>
          <input
            type="text"
            placeholder="Enter Your Mail or Phone Number"
            value={contact}
            onChange={(e) => { setContact(e.target.value); setContactError(""); }}
            className={P.input}
          />
        </div>
        {contactError && <span className={P.error}>{contactError}</span>}

        <button type="submit" className={P.btn} disabled={loading}>
          {loading ? "Please wait…" : "Continue"}
        </button>
      </form>
    );

    /* ── Step 2 ── */
    if (step === 2) return (
      <form onSubmit={handleVerifyOtp} className={P.card}>
        <h2 className={P.title}>Verify OTP</h2>
        <p className={P.subtitle}>Enter Your 6 digit code</p>

        <div className={P.otpRow}>
          {renderOtpBoxes(P.otpBox)}
        </div>
        {otpError && <span className={P.error}>{otpError}</span>}

        <div className={P.resendRow}>
          Didn&apos;t receive code?&nbsp;
          <button
            type="button"
            className={P.resendLink}
            onClick={handleResend}
            disabled={resendTimer > 0}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
          </button>
        </div>

        <button type="submit" className={P.btn} disabled={loading}>
          {loading ? "Verifying…" : "VERIFY"}
        </button>
      </form>
    );

    /* ── Step 3 ── */
    return (
      <form onSubmit={handleSetPin} className={P.card}>
        <h2 className={P.title}>Set Your New Pin</h2>

        <div className={P.inputGroup}>
          <span className={P.inputIcon}><LockIcon /></span>
          <input
            type="password"
            placeholder="Enter Pin"
            value={pin}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
            className={P.input}
          />
        </div>

        <div className={P.inputGroup} style={{ marginTop: "clamp(10px,1.5vh,18px)" }}>
          <span className={P.inputIcon}><LockIcon /></span>
          <input
            type="password"
            placeholder="Re-enter Pin"
            value={confirmPin}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinError(""); }}
            className={P.input}
          />
        </div>
        {pinError && <span className={P.error}>{pinError}</span>}

        <button type="submit" className={P.btn} disabled={loading}>
          {loading ? "Saving…" : "Submit"}
        </button>
      </form>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ════════════════ DESKTOP (≥ 768px) ════════════════ */}
      <div className={styles.fpContainer}>
        {/* Left – Slideshow */}
        <div className={styles.fpSlideshow}>
          {renderSlides(styles.fpSlide, styles.fpSlideActive)}
          <div className={styles.fpSlideshowOverlay} />
          <div className={styles.fpSlideshowBottom}>
            <p className={styles.fpSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.fpDots}>
              {renderDots(styles.fpDot, styles.fpDotActive)}
            </div>
          </div>
        </div>

        {/* Right – Form */}
        <div className={styles.fpFormSide}>
          <div className={styles.fpLogoArea}>
            <Image src={LOGO_URL} alt="Zaanvar Business" width={180} height={65} priority style={{ width: "clamp(130px,14vw,210px)", height: "auto" }} />
          </div>
          {renderFormContent(true)}
        </div>
      </div>

      {/* ════════════════ MOBILE (< 768px) ════════════════ */}
      <div className={styles.fpMobContainer}>
        {/* Top – Slideshow */}
        <div className={styles.fpMobSlideshow}>
          {renderSlides(styles.fpMobSlide, styles.fpMobSlideActive)}
          <div className={styles.fpMobSlideshowOverlay} />
          <div className={styles.fpMobSlideshowBottom}>
            <p className={styles.fpMobSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.fpMobDots}>
              {renderDots(styles.fpMobDot, styles.fpMobDotActive)}
            </div>
          </div>
        </div>

        {/* Bottom – Form Card */}
        <div className={styles.fpMobFormWrapper}>
          <div className={styles.fpMobLogoArea}>
            <Image src={LOGO_URL} alt="Zaanvar Business" width={150} height={55} priority style={{ width: "clamp(110px,28vw,160px)", height: "auto" }} />
          </div>
          {renderFormContent(false)}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;

/* ═══════════════════════════════════════════════════════════════════════════
 * OLD CODE – COMMENTED OUT
 * ═══════════════════════════════════════════════════════════════════════════

// import React, { useEffect, useState } from "react";
// import styles from "../../styles/forgotpassword/forgotpassword.module.css";
// import { useRouter } from "next/router";
// import Image from "next/image";
//
// const Forgotpassword = () => {
//   const route = useRouter();
//   const [isLoaded, setIsLoaded] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [details, setDetails] = useState({ email: "" });
//   const [errors, setErrors] = useState({ email: "" });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   useEffect(() => { setTimeout(() => setIsLoaded(true), 100); }, []);
//   const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   const handleLoginChange = (e) => { ... };
//   const handleSubmit = (e) => { ... };
//   return ( <div className={...}> ... </div> );
// };
// export default Forgotpassword;

 * ═══════════════════════════════════════════════════════════════════════════ */
