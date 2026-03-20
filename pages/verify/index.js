import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/verify/verify.module.css";
import { useRouter } from "next/router";
import Image from "next/image";
import { WebApimanager } from "../../components/utilities/WebApiManager";
import useStore from "../../components/state/useStore";
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

/* ─────────────────────────────────────────────────────────────────────────── */

const VerifyAccount = () => {
  const router = useRouter();
  const webApi = new WebApimanager();
  const { setJwtToken, setUserInfo } = useStore();

  /* ── URL param state ── */
  const [verifyId,    setVerifyId]    = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");

  /* ── Parse custom URL format:
       /verify/?id=113,email:gorantashreya@gmail.com
       /verify/?id=113,phoneNumber:6281472661
     Next.js reads the entire "id=113,email:..." as the `id` query param,
     so we parse the raw asPath query string manually.
  ── */
  useEffect(() => {
    if (!router.isReady) return;
    try {
      const raw = router.asPath.split("?")[1] || "";
      // raw = "id=113,email:gorantashreya@gmail.com"
      const params = {};
      raw.split(",").forEach((part) => {
        if (part.includes("=")) {
          const idx = part.indexOf("=");
          params[part.substring(0, idx)] = decodeURIComponent(part.substring(idx + 1));
        } else if (part.includes(":")) {
          const idx = part.indexOf(":");
          params[part.substring(0, idx)] = decodeURIComponent(part.substring(idx + 1));
        }
      });
      if (params.id)          setVerifyId(params.id);
      if (params.email)       setVerifyEmail(params.email);
      if (params.phoneNumber) setVerifyPhone(params.phoneNumber);
    } catch (_) {
      // ignore parse errors
    }
  }, [router.isReady, router.asPath]);

  /* ── Slideshow ── */
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrentSlide((p) => (p + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);

  /* ── OTP state (6 boxes) ── */
  const [otp, setOtp]     = useState(Array(6).fill(""));
  const otpRefs           = useRef([]);

  /* ── PIN state (6 boxes) ── */
  const [pin, setPin]     = useState(Array(6).fill(""));
  const pinRefs           = useRef([]);

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  /* ── Box change handler (shared for OTP and PIN) ── */
  const handleBoxChange = (arr, setArr, refs, index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...arr];
    next[index] = digit;
    setArr(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleBoxKeyDown = (arr, refs, index, e) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleBoxPaste = (setArr, refs, e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next   = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setArr(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  /* ── Submit – L3 verification ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    const pinCode = pin.join("");

    if (otpCode.length < 6) { setError("Please enter all 6 OTP digits."); return; }
    if (pinCode.length < 6) { setError("Please enter all 6 PIN digits."); return; }
    if (!verifyId)           { setError("Invalid verification link (missing ID)."); return; }
    setError("");
    setLoading(true);

    try {
      /* POST vendor/registration/verify-l3-verification/{id} */
      const payload = {
        otp:    otpCode,
        setPin: pinCode,
      };

      const response = await webApi.postwithouttoken(
        `vendor/registration/verify-l3-verification/${verifyId}`,
        payload
      );

      /* API returns { status: "success", message: "..." } — no token */
      if (response?.status === "success") {
        toast.success(response.message || "Account verified! Please log in.");
        setTimeout(() => router.push("/login"), 800);
      } else {
        const msg = response?.message || "Verification failed. Please try again.";
        setError(msg);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Verification failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared render helpers ────────────────────────────────────────────── */
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

  /* ── Box row renderer ── */
  const renderBoxRow = (arr, setArr, refs, rowClass, boxClass) =>
    arr.map((digit, i) => (
      <input
        key={i}
        ref={(el) => (refs.current[i] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={digit}
        onChange={(e)   => handleBoxChange(arr, setArr, refs, i, e.target.value)}
        onKeyDown={(e)  => handleBoxKeyDown(arr, refs, i, e)}
        onPaste={i === 0 ? (e) => handleBoxPaste(setArr, refs, e) : undefined}
        className={boxClass}
        aria-label={`digit ${i + 1}`}
      />
    ));

  /* ── Form (shared desktop/mobile) ── */
  const renderForm = (isDesktop) => {
    const P = isDesktop
      ? {
          card:     styles.vCard,
          title:    styles.vTitle,
          label:    styles.vLabel,
          boxRow:   styles.vBoxRow,
          box:      styles.vBox,
          error:    styles.vError,
          btn:      styles.vBtn,
        }
      : {
          card:     styles.vMobCard,
          title:    styles.vMobTitle,
          label:    styles.vMobLabel,
          boxRow:   styles.vMobBoxRow,
          box:      styles.vMobBox,
          error:    styles.vMobError,
          btn:      styles.vMobBtn,
        };

    return (
      <form onSubmit={handleSubmit} className={P.card}>
        <h2 className={P.title}>Verify Account</h2>

        <div>
          <p className={P.label}>Enter OTP</p>
          <div className={P.boxRow}>
            {renderBoxRow(otp, setOtp, otpRefs, P.boxRow, P.box)}
          </div>
        </div>

        <div>
          <p className={P.label}>Enter Password Pin</p>
          <div className={P.boxRow}>
            {renderBoxRow(pin, setPin, pinRefs, P.boxRow, P.box)}
          </div>
        </div>

        {error && <span className={P.error}>{error}</span>}

        <button type="submit" className={P.btn} disabled={loading}>
          {loading ? "Verifying…" : "Submit"}
        </button>
      </form>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ════════════════ DESKTOP (≥ 768px) ════════════════ */}
      <div className={styles.vContainer}>
        {/* Left – Slideshow */}
        <div className={styles.vSlideshow}>
          {renderSlides(styles.vSlide, styles.vSlideActive)}
          <div className={styles.vSlideshowOverlay} />
          <div className={styles.vSlideshowBottom}>
            <p className={styles.vSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.vDots}>
              {renderDots(styles.vDot, styles.vDotActive)}
            </div>
          </div>
        </div>

        {/* Right – Form */}
        <div className={styles.vFormSide}>
          <div className={styles.vLogoArea}>
            <Image
              src={LOGO_URL}
              alt="Zaanvar Business"
              width={180}
              height={65}
              priority
              style={{ width: "clamp(130px,14vw,210px)", height: "auto" }}
            />
          </div>
          {renderForm(true)}
        </div>
      </div>

      {/* ════════════════ MOBILE (< 768px) ════════════════ */}
      <div className={styles.vMobContainer}>
        {/* Top – Slideshow */}
        <div className={styles.vMobSlideshow}>
          {renderSlides(styles.vMobSlide, styles.vMobSlideActive)}
          <div className={styles.vMobSlideshowOverlay} />
          <div className={styles.vMobSlideshowBottom}>
            <p className={styles.vMobSlideLabel}>{SLIDES[currentSlide].title}</p>
            <div className={styles.vMobDots}>
              {renderDots(styles.vMobDot, styles.vMobDotActive)}
            </div>
          </div>
        </div>

        {/* Bottom – Form */}
        <div className={styles.vMobFormWrapper}>
          <div className={styles.vMobLogoArea}>
            <Image
              src={LOGO_URL}
              alt="Zaanvar Business"
              width={150}
              height={55}
              priority
              style={{ width: "clamp(110px,28vw,160px)", height: "auto" }}
            />
          </div>
          {renderForm(false)}
        </div>
      </div>
    </>
  );
};

export default VerifyAccount;
